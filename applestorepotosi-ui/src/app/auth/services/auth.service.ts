// src/app/auth/services/auth.service.ts
import { Injectable, inject, OnDestroy } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { GoogleAuthProvider } from 'firebase/auth';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Subscription, throwError } from 'rxjs';
import { catchError, filter, take, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User, UserResponse, UserRole } from '../models/user.model';
import { clearAuthGuardCache } from '../guards/auth.guard';

export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  private afAuth   = inject(AngularFireAuth);
  private http     = inject(HttpClient);
  private router   = inject(Router);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private loadingSubject     = new BehaviorSubject<boolean>(true);
  private errorSubject       = new BehaviorSubject<AuthError | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();
  public loading$     = this.loadingSubject.asObservable();
  public error$       = this.errorSubject.asObservable();

  // FIX #1 - TOKEN EXPIRADO + BOTÓN ATRÁS:
  // El problema raíz era que initializeAuthState() leía localStorage para
  // decidir si había sesión, ignorando completamente el estado real de Firebase.
  // Con un token caducado en localStorage el usuario pasaba el guard porque
  // isAuthenticated() solo comprueba currentUserSubject (en memoria), y al
  // hacer atrás + refresh el sujeto en memoria era null → guard pedía login →
  // pero initializeAuthState volvía a "recuperar" el token viejo y lo enviaba
  // al backend, que devolvía 401 → cleanupExpiredSession() → redirect login.
  // El flujo era correcto en el fondo, PERO ocurría una carrera: el guard
  // chequeaba isAuthenticated() antes de que el observable authState emitiera,
  // por lo que el caché de 1s del guard devolvía true con usuario null.
  //
  // SOLUCIÓN: usar afAuth.authState como fuente única de verdad.
  // Firebase SDK refresca el token automáticamente y emite null cuando caduca.
  // Eliminamos la doble lógica basada en localStorage para la inicialización.

  private authStateSub!: Subscription;
  // Flag que pausa el subscriber de authState durante register() y login().
  // Sin este flag, authState se dispara al crear el usuario en Firebase y llama
  // a loadUserProfile() antes de que createUserInBackend() termine, causando 401/404.
  private suppressAuthState = false;

  constructor() {
    this.initializeAuthState();
  }

  ngOnDestroy(): void {
    this.authStateSub?.unsubscribe();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // INICIALIZACIÓN
  // ─────────────────────────────────────────────────────────────────────────────

  private initializeAuthState(): void {
    // FIX #1: authState es la única fuente de verdad.
    // Firebase emite null cuando el token expira (no renueva), y emite el
    // usuario cuando la sesión es válida (con auto-refresh del ID token).
    this.authStateSub = this.afAuth.authState.subscribe(async firebaseUser => {
      if (firebaseUser) {
        // Si register() o login() están en curso, ellos mismos llaman a
        // loadUserProfile() en el momento correcto. Evitar la doble llamada.
        if (this.suppressAuthState) return;
        try {
          const token = await firebaseUser.getIdToken(false);
          localStorage.setItem('firebaseToken', token);
          await this.loadUserProfile();
        } catch (err) {
          console.error('Error al obtener token de Firebase:', err);
          await this.cleanupExpiredSession();
        }
      } else {
        // Firebase dice que no hay usuario → limpiar todo
        this.currentUserSubject.next(null);
        localStorage.removeItem('firebaseToken');
        this.clearError();
        this.setLoading(false);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CARGA DE PERFIL
  // ─────────────────────────────────────────────────────────────────────────────

  private async loadUserProfile(): Promise<void> {
    try {
      this.setLoading(true);

      // FIX #2 - RENDIMIENTO: el interceptor ya añade el token; no es necesario
      // pasarlo manualmente aquí. Se eliminó la segunda llamada a afAuth.currentUser
      // que se hacía DESPUÉS del HTTP para "enriquecer" el usuario, causando un
      // segundo round-trip a Firebase. Ahora se lee del token del authState.
      const firebaseUser = await this.afAuth.currentUser;

      // POST /auth/profile es el endpoint correcto — ver auth.controller.ts backend:
      // @Post('profile') @UseGuards(FirebaseAuthGuard) getProfile()
      // GET /users/profile puede no existir o no aplicar el FirebaseAuthGuard.
      const user = await this.http
        .post<UserResponse>(`${environment.apiUrl}/auth/profile`, {})
        .pipe(
          timeout(8000),
          catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
              this.handleTokenExpiration();
              throw { code: 'TOKEN_EXPIRED', message: 'Token expirado o inválido' };
            }
            if (error.status === 404) {
              throw { code: 'USER_NOT_FOUND', message: 'Usuario no encontrado' };
            }
            throw this.mapBackendError(error);
          })
        )
        .toPromise();

      const enrichedUser: User = {
        ...user!,
        permissions: user!.permissions?.length
          ? user!.permissions
          : user!.roleInfo?.permissions ?? [],
        photoURL:  firebaseUser?.photoURL  || user!.profile?.avatar || '',
        provider:  firebaseUser?.providerData[0]?.providerId || 'password',
      };

      this.currentUserSubject.next(enrichedUser);
      this.clearError();

      // FIX #3 - TOKEN REFRESH PROACTIVO:
      // Guardamos el token fresco que Firebase ya ha renovado (si correspondía).
      // Así el interceptor siempre tiene el token más reciente en localStorage.
      if (firebaseUser) {
        const freshToken = await firebaseUser.getIdToken(false);
        localStorage.setItem('firebaseToken', freshToken);
      }

    } catch (error: any) {
      if (error.code === 'TOKEN_EXPIRED') {
        await this.cleanupExpiredSession();
      } else if (error.code === 'USER_NOT_FOUND') {
        await this.handleUserNotFound();
      } else {
        this.handleError(error.code ?? 'LOAD_PROFILE_ERROR', error.message ?? 'Error cargando perfil', error);
        this.setLoading(false);
      }
    } finally {
      this.setLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TOKEN / SESIÓN
  // ─────────────────────────────────────────────────────────────────────────────

  private handleTokenExpiration(): void {
    console.warn('Token expirado o inválido detectado por el backend');
    // FIX #1: forzar signOut en Firebase para que authState emita null,
    // lo que dispara la limpieza automáticamente en el subscriber de arriba.
    this.afAuth.signOut().catch(() => {});
  }

  private async cleanupExpiredSession(): Promise<void> {
    clearAuthGuardCache();
    localStorage.removeItem('firebaseToken');
    sessionStorage.removeItem('dashboard_redirected');
    this.currentUserSubject.next(null);

    try {
      await this.afAuth.signOut();
    } catch { /* ignorar */ }

    this.router.navigate(['/login']);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GOOGLE LOGIN
  // ─────────────────────────────────────────────────────────────────────────────

  async loginWithGoogle(): Promise<any> {
    this.clearError();
    this.setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      this.suppressAuthState = true;

      const result = await this.afAuth.signInWithPopup(provider);

      if (result.user) {
        const token = await result.user.getIdToken(true);
        localStorage.setItem('firebaseToken', token);

        const exists = await this.http
          .get<boolean>(`${environment.apiUrl}/users/exists/${result.user.uid}`)
          .toPromise();

        if (exists) {
          await this.updateGoogleProfile(result.user);
        } else {
          await this.registerGoogleUser(result.user);
        }

        this.suppressAuthState = false;
        await this.loadUserProfile();
        this.redirectToRoleDashboard();
      }

      return result;
    } catch (error: any) {
      this.suppressAuthState = false;
      const authError = this.mapFirebaseError(error);
      this.handleError(authError.code, authError.message, error);
      throw authError;
    } finally {
      this.setLoading(false);
    }
  }

  private async registerGoogleUser(firebaseUser: any): Promise<any> {
    // CustomerRegisterDto acepta solo: email, password, displayName, phoneNumber.
    // photoURL y provider NO están en el DTO — el backend los rechazaría con 400.
    const payload: Record<string, any> = {
      email:       firebaseUser.email!,
      password:    '',   // Google no tiene password; el backend lo ignora para OAuth
      displayName: firebaseUser.displayName || firebaseUser.email || '',
    };
    if (firebaseUser.phoneNumber) payload['phoneNumber'] = firebaseUser.phoneNumber;

    return this.http
      .post(`${environment.apiUrl}/auth/register/customer`, payload)
      .pipe(catchError((err: HttpErrorResponse) => throwError(() => this.mapBackendError(err))))
      .toPromise();
  }

  private async updateGoogleProfile(firebaseUser: any): Promise<any> {
    const payload = {
      displayName: firebaseUser.displayName || '',
      phoneNumber: firebaseUser.phoneNumber || '',
      photoURL:    firebaseUser.photoURL    || '',
      provider:    firebaseUser.providerData[0]?.providerId || 'google.com',
    };
    return this.http
      .put(`${environment.apiUrl}/users/${firebaseUser.uid}/google-profile`, payload)
      .toPromise();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // EMAIL/PASSWORD LOGIN
  // ─────────────────────────────────────────────────────────────────────────────

  async login(email: string, password: string): Promise<any> {
    this.clearError();
    this.setLoading(true);

    try {
      this.suppressAuthState = true;

      const result = await this.afAuth.signInWithEmailAndPassword(email, password);

      if (result.user) {
        const token = await result.user.getIdToken(true);
        localStorage.setItem('firebaseToken', token);

        this.suppressAuthState = false;
        await this.loadUserProfile();
        this.redirectToRoleDashboard();
      }

      return result;
    } catch (error: any) {
      this.suppressAuthState = false;
      const authError = this.mapFirebaseError(error);
      this.handleError(authError.code, authError.message, error);
      throw authError;
    } finally {
      this.setLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REGISTRO
  // ─────────────────────────────────────────────────────────────────────────────

  async register(email: string, password: string, displayName: string, phoneNumber?: string): Promise<any> {
    this.clearError();
    this.setLoading(true);

    // FLUJO CORRECTO DE REGISTRO:
    // El backend POST /auth/register/customer es la única fuente de verdad.
    // Él crea el usuario en Firebase Admin SDK y en MongoDB en una sola operación.
    // El frontend NO llama a afAuth.createUserWithEmailAndPassword() — eso
    // crearía en Firebase sin MongoDB, dejando el sistema en estado inconsistente.
    //
    //   1. POST /auth/register/customer  → backend crea Firebase + MongoDB
    //   2. signInWithEmailAndPassword()  → frontend obtiene ID token
    //   3. loadUserProfile()             → carga perfil con token válido

    try {
      this.suppressAuthState = true;

      // PASO 1: Backend crea en Firebase Admin + MongoDB
      const payload: Record<string, any> = { email, password, displayName };
      if (phoneNumber) payload['phoneNumber'] = phoneNumber;

      const backendResponse = await this.http
        .post<any>(`${environment.apiUrl}/auth/register/customer`, payload)
        .pipe(
          timeout(10000),
          catchError((err: HttpErrorResponse) => {
            if (err.status === 400) {
              const msg = err.error?.message;
              // ValidationPipe error → email ya existe u otro campo
              const isEmailDup = Array.isArray(msg)
                ? msg.some((m: string) => m.includes('email'))
                : typeof msg === 'string' && msg.includes('email');
              throw {
                code: isEmailDup ? 'auth/email-already-in-use' : 'VALIDATION_ERROR',
                message: isEmailDup
                  ? 'Ya existe una cuenta con este email'
                  : 'Datos de registro inválidos',
              };
            }
            throw this.mapBackendError(err);
          })
        )
        .toPromise();

      // El backend devuelve mensaje genérico si el email ya existe en Firebase
      // (no lanza 400 sino 200 con mensaje), detectarlo aquí
      if (backendResponse?.message?.includes('correo de confirmación')) {
        throw { code: 'auth/email-already-in-use', message: 'Ya existe una cuenta con este email' };
      }

      // PASO 2: Login en Firebase para obtener ID token
      const result = await this.afAuth.signInWithEmailAndPassword(email, password);

      if (result.user) {
        const token = await result.user.getIdToken(true);
        localStorage.setItem('firebaseToken', token);

        // PASO 3: Cargar perfil — usuario existe en Firebase y MongoDB
        this.suppressAuthState = false;
        await this.loadUserProfile();
        this.router.navigate(['/dashboard']);
      }

      return backendResponse;

    } catch (error: any) {
      this.suppressAuthState = false;
      const authError = this.mapFirebaseError(error);
      this.handleError(authError.code, authError.message, error);
      throw authError;
    } finally {
      this.setLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────────────────────────────────────

  async logout(): Promise<void> {
    this.clearError();
    this.setLoading(true);

    try {
      clearAuthGuardCache();
      sessionStorage.removeItem('dashboard_redirected');

      // FIX #6: signOut primero, LUEGO limpiar localStorage.
      // Antes se limpiaba localStorage antes del signOut, lo que causaba
      // que el interceptor enviara requests sin token durante el signOut.
      await this.afAuth.signOut();

      this.currentUserSubject.next(null);
      localStorage.removeItem('firebaseToken');
      localStorage.removeItem('currentUser');

      this.router.navigate(['/login']);
    } catch (error) {
      this.handleError('LOGOUT_ERROR', 'Error al cerrar sesión', error);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // AUTO-CREACIÓN DE USUARIO (flujo OAuth sin registro previo)
  // ─────────────────────────────────────────────────────────────────────────────

  private async handleUserNotFound(): Promise<void> {
    // Este método se llama cuando el token Firebase es válido pero el usuario
    // no existe en MongoDB. Ocurre en el flujo Google OAuth: el popup crea el
    // usuario en Firebase, pero aún no hay registro en MongoDB.
    //
    // El backend POST /auth/register/customer llama a checkEmailExists() antes
    // de crear en MongoDB. Para usuarios Google el email YA existe en Firebase
    // (lo creó el popup), por lo que checkEmailExists devuelve true y el backend
    // retorna el mensaje genérico sin crear en MongoDB.
    //
    // Este caso es manejado directamente en loginWithGoogle() con registerGoogleUser()
    // ANTES de que ocurra el 404. handleUserNotFound() es un fallback de seguridad
    // para sesiones donde el estado quedó inconsistente.
    try {
      const firebaseUser = await this.afAuth.currentUser;
      if (!firebaseUser) throw new Error('No hay usuario Firebase');

      // Usar registerGoogleUser que llama POST /auth/register/customer.
      // Si el backend rechaza por email existente, intentar loadUserProfile
      // de todas formas — el usuario podría haberse creado en otro momento.
      try {
        await this.registerGoogleUser(firebaseUser);
      } catch {
        // Ignorar error de registro — puede que ya exista en MongoDB
      }

      await this.loadUserProfile();
    } catch (error) {
      this.handleError('AUTO_CREATE_ERROR', 'Error creando usuario automáticamente', error);
      await this.cleanupExpiredSession();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPERS PÚBLICOS
  // ─────────────────────────────────────────────────────────────────────────────

  getCurrentUser(): User | null   { return this.currentUserSubject.value; }
  isAuthenticated(): boolean      { return !!this.currentUserSubject.value; }
  isLoading(): boolean            { return this.loadingSubject.value; }
  getCurrentError(): AuthError | null { return this.errorSubject.value; }

  hasRole(role: UserRole): boolean {
    return this.getCurrentUser()?.role === role;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  hasPermission(permission: string): boolean {
    return !!this.getCurrentUser()?.permissions?.includes(permission);
  }

  clearError(): void { this.errorSubject.next(null); }

  getDashboardRouteByRole(role: UserRole): string {
    const routes: Record<UserRole, string> = {
      [UserRole.ADMIN]:      '/dashboard/admin',
      [UserRole.SALES]:      '/dashboard/sales',
      [UserRole.TECHNICIAN]: '/dashboard/technician',
      [UserRole.CUSTOMER]:   '/dashboard/customer',
    };
    return routes[role] ?? '/dashboard';
  }

  redirectToRoleDashboard(): void {
    const user = this.getCurrentUser();
    const route = user ? this.getDashboardRouteByRole(user.role) : '/dashboard';
    this.router.navigate([route]);
  }

  // FIX #7 - MÉTODO waitForUser PÚBLICO:
  // El guard necesita esperar a que la autenticación se resuelva antes de
  // tomar decisiones. Se expone como observable para que el guard lo consuma
  // correctamente (ver auth.guard.ts).
  waitForAuthReady(): Promise<User | null> {
    return this.loading$.pipe(
      filter(loading => !loading),
      take(1),
    ).toPromise().then(() => this.getCurrentUser());
  }

  // Verifica si hay sesión activa (compatible con llamadas externas existentes).
  // Adaptado al nuevo flujo: en lugar de llamar loadUserProfile() directamente
  // (que podría colisionar con el subscriber de authState), simplemente espera
  // a que la inicialización termine y devuelve si hay usuario.
  async checkExistingSession(): Promise<boolean> {
    const token = localStorage.getItem('firebaseToken');
    if (!token) return false;
    try {
      const user = await this.waitForAuthReady();
      return !!user;
    } catch {
      return false;
    }
  }

  // Perfil extendido (sin round-trip extra — usa el estado en memoria)
  getExtendedProfile(): any {
    return this.getCurrentUser()?.profile ?? null;
  }

  refreshUserProfile(): void {
    this.loadUserProfile().catch(err => console.error('Error refresh:', err));
  }

  async getCompleteUserProfile(): Promise<any> {
    const response = await this.http
      .get<any>(`${environment.apiUrl}/users/profile`)
      .toPromise();

    return {
      ...response,
      profile:     response.profile     || {},
      roleInfo:    response.roleInfo     || { name: response.role, permissions: response.permissions || [] },
      preferences: response.preferences || { notifications: true, newsletter: false, smsAlerts: false, language: 'es' },
      specialization: response.specialization || [],
    };
  }

  async updateExtendedProfile(profileData: any): Promise<any> {
    const response = await this.http
      .put(`${environment.apiUrl}/users/profile/update`, profileData)
      .toPromise();
    this.refreshUserProfile();
    return response;
  }

  async updateUserPreferences(preferences: any): Promise<any> {
    const response = await this.http
      .put(`${environment.apiUrl}/users/preferences/update`, preferences)
      .toPromise();
    this.refreshUserProfile();
    return response;
  }

  async updateLastLogin(uid: string): Promise<void> {
    try {
      await this.http.patch(`${environment.apiUrl}/users/${uid}/last-login`, {}).toPromise();
    } catch (err) {
      console.error('Error actualizando último login:', err);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ERROR MAPPING
  // ─────────────────────────────────────────────────────────────────────────────

  private mapFirebaseError(error: any): AuthError {
    const map: Record<string, AuthError> = {
      'auth/invalid-email':        { code: 'auth/invalid-email',        message: 'El formato del email es inválido' },
      'auth/user-disabled':        { code: 'auth/user-disabled',        message: 'Esta cuenta ha sido deshabilitada' },
      'auth/user-not-found':       { code: 'auth/user-not-found',       message: 'No existe una cuenta con este email' },
      'auth/wrong-password':       { code: 'auth/wrong-password',       message: 'La contraseña es incorrecta' },
      'auth/email-already-in-use': { code: 'auth/email-already-in-use', message: 'Ya existe una cuenta con este email' },
      'auth/weak-password':        { code: 'auth/weak-password',        message: 'La contraseña es muy débil. Use al menos 6 caracteres' },
      'auth/operation-not-allowed':{ code: 'auth/operation-not-allowed',message: 'Esta operación no está permitida' },
      'auth/too-many-requests':    { code: 'auth/too-many-requests',    message: 'Demasiados intentos. Intente más tarde' },
      'auth/popup-closed-by-user': { code: 'auth/popup-closed-by-user', message: 'El popup de autenticación fue cerrado' },
      'auth/popup-blocked':        { code: 'auth/popup-blocked',        message: 'El popup fue bloqueado. Permita popups para este sitio' },
      'auth/network-request-failed':{ code: 'auth/network-request-failed', message: 'Error de conexión. Verifique su internet' },
      'auth/invalid-credential':   { code: 'auth/invalid-credential',   message: 'Credenciales incorrectas. Verifique su email y contraseña' },
    };
    return map[error?.code] ?? { code: 'auth/unknown-error', message: 'Ocurrió un error inesperado. Intente nuevamente.' };
  }

  private mapBackendError(error: HttpErrorResponse): AuthError {
    const map: Record<number, AuthError> = {
      400: { code: 'BACKEND_BAD_REQUEST',          message: 'Solicitud inválida al servidor' },
      401: { code: 'BACKEND_UNAUTHORIZED',          message: 'No autorizado. Por favor, inicie sesión nuevamente' },
      403: { code: 'BACKEND_FORBIDDEN',             message: 'No tiene permisos para realizar esta acción' },
      404: { code: 'BACKEND_NOT_FOUND',             message: 'Recurso no encontrado' },
      409: { code: 'BACKEND_CONFLICT',              message: 'El usuario ya existe en el sistema' },
      500: { code: 'BACKEND_SERVER_ERROR',          message: 'Error interno del servidor. Intente más tarde' },
      502: { code: 'BACKEND_BAD_GATEWAY',           message: 'Servicio temporalmente no disponible' },
      503: { code: 'BACKEND_SERVICE_UNAVAILABLE',   message: 'Servicio no disponible. Intente más tarde' },
      504: { code: 'BACKEND_GATEWAY_TIMEOUT',       message: 'Tiempo de espera agotado. Verifique su conexión' },
    };
    return map[error.status] ?? { code: 'BACKEND_UNKNOWN_ERROR', message: 'Error de comunicación con el servidor' };
  }

  private handleError(code: string, message: string, details?: any): void {
    this.errorSubject.next({ code, message, details });
  }

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }
}