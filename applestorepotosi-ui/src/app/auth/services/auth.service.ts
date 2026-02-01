import { Injectable, inject } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { GoogleAuthProvider } from 'firebase/auth';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, throwError } from 'rxjs';
import { catchError, distinctUntilChanged, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User, UserResponse, UserRole } from '../models/user.model';
import { clearAuthGuardCache } from '../guards/auth.guard';


export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private afAuth = inject(AngularFireAuth);
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(true);
  private errorSubject = new BehaviorSubject<AuthError | null>(null);
  
  public currentUser$ = this.currentUserSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor() {
    this.initializeAuthState();
  }

  private async initializeAuthState(): Promise<void> {
    try {
      // Verificar si hay un token en localStorage al iniciar
      const token = localStorage.getItem('firebaseToken');
      
      if (token) {
        console.log('🔄 Token encontrado, verificando validez...');
        
        // Intentar obtener el usuario actual de Firebase
        const firebaseUser = await this.afAuth.currentUser;
        
        if (firebaseUser) {
          console.log('✅ Usuario de Firebase encontrado:', firebaseUser.email);
          // El usuario está autenticado en Firebase, cargar perfil
          await this.loadUserProfile();
        } else {
          console.log('🔐 Token almacenado pero no hay usuario Firebase, intentando recuperar sesión...');
          // Intentar recuperar la sesión usando el token
          await this.recoverSessionFromToken(token);
        }
      } else {
        console.log('🔐 No hay token almacenado');
        this.setLoading(false);
      }
      
    } catch (error) {
      console.error('❌ Error inicializando estado de autenticación:', error);
      this.handleError('INIT_ERROR', 'Error inicializando sesión', error);
      this.setLoading(false);
    }

    /*
    // Escuchar cambios futuros en el estado de autenticación
    this.afAuth.authState.subscribe(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('firebaseToken', token);
          console.log('🔄 Cambio en estado de autenticación, cargando perfil...');
          await this.loadUserProfile();
        } catch (error) {
          console.error('❌ Error en cambio de estado auth:', error);
          this.handleError('AUTH_STATE_ERROR', 'Error en cambio de autenticación', error);
        }
      } else {
        console.log('👤 Usuario cerró sesión');
        this.currentUserSubject.next(null);
        localStorage.removeItem('firebaseToken');
        this.clearError();
        this.setLoading(false);
      }
    });
    */
    // Escuchar cambios pero solo si el usuario es DISTINTO
    this.afAuth.authState
      .pipe(distinctUntilChanged((prev, curr) => prev?.uid === curr?.uid))
      .subscribe(async user => {
        if (user) {
          const token = await user.getIdToken();
          localStorage.setItem('firebaseToken', token);
          await this.loadUserProfile();
        } else {
          this.currentUserSubject.next(null);
          localStorage.removeItem('firebaseToken');
          this.clearError();
          this.setLoading(false);
        }
      });
  }

  /**
   * Intentar recuperar sesión desde el token almacenado
   */
  private async recoverSessionFromToken(token: string): Promise<void> {
    try {
      console.log('🔄 Intentando recuperar sesión desde token...');
      
      // Verificar token con Firebase
      const firebaseUser = await this.afAuth.currentUser;
      
      if (firebaseUser) {
        // Si hay usuario de Firebase, cargar perfil
        await this.loadUserProfile();
      } else {
        // Si no hay usuario de Firebase pero tenemos token, intentar cargar perfil directamente
        console.log('🔐 Intentando cargar perfil con token almacenado...');
        await this.loadUserProfile();
      }
      
    } catch (error) {
      console.error('❌ Error recuperando sesión:', error);
      // Si hay error, limpiar token inválido
      localStorage.removeItem('firebaseToken');
      this.handleError('SESSION_RECOVERY_ERROR', 'Error recuperando sesión', error);
      this.setLoading(false);
    }
  }

  /**
   * Cargar perfil de usuario desde el backend
   */
  private async loadUserProfile(): Promise<void> {
    try {
      this.setLoading(true);
      
      const user = await this.http.get<UserResponse>(`${environment.apiUrl}/users/profile`).pipe(
        timeout(10000),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401) {
            this.handleTokenExpiration();
            throw { code: 'TOKEN_EXPIRED', message: 'Token expirado o inválido' };
          }
          if (error.status === 404) {
            console.log('👤 Usuario no encontrado en backend, creando automáticamente...');
            throw { code: 'USER_NOT_FOUND', message: 'Usuario no encontrado' };
          }
          throw this.mapBackendError(error);
        })
      ).toPromise();

      // Enriquecer datos del usuario
      const firebaseUser = await this.afAuth.currentUser;
      const enrichedUser: User = {
        ...user!,
        permissions: user!.permissions || user!.roleInfo?.permissions || [],
        photoURL: firebaseUser?.photoURL || user!.profile?.avatar || '',
        provider: firebaseUser?.providerData[0]?.providerId || 'password'
      };
      
      // console.log('✅ Usuario enriquecido recibido del backend:', enrichedUser);
      console.log(`🎯 Rol detectado: ${enrichedUser.role}`);
      
      this.currentUserSubject.next(enrichedUser);
      this.clearError();
      
    } catch (error: any) {
      console.error('❌ Error cargando perfil:', error);
      
      if (error.code === 'TOKEN_EXPIRED') {
        await this.cleanupExpiredSession();
      } else if (error.code === 'USER_NOT_FOUND') {
        await this.handleUserNotFound();
      } else {
        this.handleError(error.code, error.message, error);
      }
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Manejar expiración del token
   */
  private handleTokenExpiration(): void {
    console.log('🔐 Token expirado o inválido');
    this.cleanupExpiredSession();
  }

  /**
   * Limpiar sesión expirada
   */
  private async cleanupExpiredSession(): Promise<void> {
    localStorage.removeItem('firebaseToken');
    this.currentUserSubject.next(null);
    
    try {
      await this.afAuth.signOut();
    } catch (error) {
      console.log('⚠️ Error durante signOut cleanup:', error);
    }
    
    this.router.navigate(['/login']);
  }

  // 🔐 LOGIN CON GOOGLE - MEJORADO
  async loginWithGoogle(): Promise<any> {
    this.clearError();
    this.setLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      console.log('🔐 Iniciando login con Google...');
      const result = await this.afAuth.signInWithPopup(provider);
      console.log('✅ Login con Google exitoso:', result.user?.email);
      
      if (result.user) {
        const token = await result.user.getIdToken();
        localStorage.setItem('firebaseToken', token);
        console.log('🔑 Token almacenado, cargando perfil...');
        
        // 🔥 1. Verifica si existe en Mongo
        const exists = await this.http
          .get<boolean>(`${environment.apiUrl}/users/exists/${result.user.uid}`)
          .toPromise();

        // if (!exists) {
          // 🔥 2. Crea en Mongo con los datos de Google
          // await this.registerGoogleUser(result.user); // ← pasas el usuario
          await this.updateGoogleProfile(result.user);
        // }
        // 🔥 2. Carga su perfil (ya enriquecido por AuthService)
        await this.loadUserProfile();
        
        // REDIRECCIÓN POR ROL - NUEVO
        this.redirectToRoleDashboard();
      }
      
      return result;
      
    } catch (error: any) {
      console.error('❌ Error en login con Google:', error);
      const authError = this.mapFirebaseError(error);
      this.handleError(authError.code, authError.message, error);
      throw authError;
    } finally {
      this.setLoading(false);
    }
  }

  private async registerGoogleUser(firebaseUser: any): Promise<any> {
    const payload = {
      email: firebaseUser.email!,
      password: '', // obligatorio en tu DTO
      displayName: firebaseUser.displayName || '',
      phoneNumber: firebaseUser.phoneNumber || '',
      photoURL: firebaseUser.photoURL || '',        // ← foto real
      provider: firebaseUser.providerData[0]?.providerId || 'password' // ← google.com
    };

    return this.http
      .post(`${environment.apiUrl}/auth/register/customer`, payload)
      .toPromise();
  }

  private async updateGoogleProfile(firebaseUser: any): Promise<any> {
    const payload = {
      displayName: firebaseUser.displayName || '',
      phoneNumber: firebaseUser.phoneNumber || '',
      photoURL: firebaseUser.photoURL || '',
      provider: firebaseUser.providerData[0]?.providerId || 'password'
    };

    return this.http
      .put(`${environment.apiUrl}/users/${firebaseUser.uid}/google-profile`, payload)
      .toPromise();
  }

  // 📧 LOGIN CON EMAIL/PASSWORD - MEJORADO
  async login(email: string, password: string): Promise<any> {
    this.clearError();
    this.setLoading(true);
    
    try {
      console.log('🔐 Iniciando login con email...');
      const result = await this.afAuth.signInWithEmailAndPassword(email, password);
      console.log('✅ Login con email exitoso:', result.user?.email);
      
      if (result.user) {
        const token = await result.user.getIdToken();
        localStorage.setItem('firebaseToken', token);
        console.log('🔑 Token almacenado, cargando perfil...');
        
        // Cargar perfil y luego redirigir según rol
        await this.loadUserProfile();
        
        // REDIRECCIÓN POR ROL - NUEVO
        this.redirectToRoleDashboard();
      }
      
      return result;
      
    } catch (error: any) {
      const authError = this.mapFirebaseError(error);
      this.handleError(authError.code, authError.message, error);
      throw authError;
    } finally {
      this.setLoading(false);
    }
  }

  // 📝 REGISTRO CON EMAIL/PASSWORD - MEJORADO CON MANEJO DE ERRORES
  async register(email: string, password: string, displayName: string, phoneNumber?: string): Promise<any> {
    this.clearError();
    this.setLoading(true);
    
    try {
      console.log('📝 Iniciando registro...', { email, displayName, phoneNumber });
      
      // 1. Verificar si el email ya existe en Firebase
      const signInMethods = await this.afAuth.fetchSignInMethodsForEmail(email);
      if (signInMethods.length > 0) {
        throw { code: 'auth/email-already-in-use' };
      }

      // 2. Crear usuario en Firebase Auth
      console.log('🔥 Creando usuario en Firebase Auth...');
      const result = await this.afAuth.createUserWithEmailAndPassword(email, password);
      
      if (result.user) {
        // 3. Actualizar perfil en Firebase
        await result.user.updateProfile({ displayName });
        console.log('✅ Usuario creado en Firebase:', result.user.uid);

        // 4. Crear usuario en MongoDB (backend)
        console.log('🗄️ Creando usuario en backend...');
        await this.createUserInBackend({
          uid: result.user.uid,
          email: email,
          displayName: displayName,
          phoneNumber: phoneNumber,
          role: UserRole.CUSTOMER
        });

        // 5. Forzar obtención del token y carga del perfil
        const token = await result.user.getIdToken(true);
        localStorage.setItem('firebaseToken', token);
        console.log('🔑 Token almacenado, cargando perfil...');
        
        // 6. Cargar perfil inmediatamente
        await this.loadUserProfile();
        
        console.log('✅ Registro completo, redirigiendo a dashboard...');
        this.router.navigate(['/dashboard']);
      }
      
      return result;
      
    } catch (error: any) {
      console.error('❌ Error en registro completo:', error);
      const authError = this.mapFirebaseError(error);
      this.handleError(authError.code, authError.message, error);
      throw authError;
    } finally {
      this.setLoading(false);
    }
  }

  // 🗄️ CREAR USUARIO EN BACKEND CON MANEJO DE ERRORES MEJORADO
  private async createUserInBackend(userData: any): Promise<void> {
    try {
      const backendUserData = {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        phoneNumber: userData.phoneNumber,
        role: userData.role,
        profile: {
          firstName: userData.displayName?.split(' ')[0] || '',
          lastName: userData.displayName?.split(' ').slice(1).join(' ') || '',
          phone: userData.phoneNumber
        },
        roleInfo: {
          name: userData.role,
          permissions: []
        },
        preferences: {
          notifications: true,
          newsletter: false,
          smsAlerts: false,
          language: 'es'
        }
      };

      const response = await this.http.post(
        `${environment.apiUrl}/auth/register/customer`, 
        backendUserData
      ).pipe(
        timeout(10000),
        catchError((error: HttpErrorResponse) => {
          throw this.mapBackendError(error);
        })
      ).toPromise();
      
      console.log('✅ Usuario creado en backend con nuevo esquema:', response);
    } catch (error: any) {
      console.error('❌ Error creando usuario en backend:', error);
      throw error;
    }
  }

  // 🗺️ MAPEAR ERRORES DE FIREBASE A MENSAJES AMIGABLES
  private mapFirebaseError(error: any): AuthError {
    const errorMap: { [key: string]: { code: string; message: string } } = {
      'auth/invalid-email': { 
        code: 'auth/invalid-email', 
        message: 'El formato del email es inválido' 
      },
      'auth/user-disabled': { 
        code: 'auth/user-disabled', 
        message: 'Esta cuenta ha sido deshabilitada' 
      },
      'auth/user-not-found': { 
        code: 'auth/user-not-found', 
        message: 'No existe una cuenta con este email' 
      },
      'auth/wrong-password': { 
        code: 'auth/wrong-password', 
        message: 'La contraseña es incorrecta' 
      },
      'auth/email-already-in-use': { 
        code: 'auth/email-already-in-use', 
        message: 'Ya existe una cuenta con este email' 
      },
      'auth/weak-password': { 
        code: 'auth/weak-password', 
        message: 'La contraseña es muy débil. Use al menos 6 caracteres' 
      },
      'auth/operation-not-allowed': { 
        code: 'auth/operation-not-allowed', 
        message: 'Esta operación no está permitida' 
      },
      'auth/too-many-requests': { 
        code: 'auth/too-many-requests', 
        message: 'Demasiados intentos. Intente más tarde' 
      },
      'auth/popup-closed-by-user': { 
        code: 'auth/popup-closed-by-user', 
        message: 'El popup de autenticación fue cerrado' 
      },
      'auth/popup-blocked': { 
        code: 'auth/popup-blocked', 
        message: 'El popup fue bloqueado. Permita popups para este sitio' 
      },
      'auth/network-request-failed': { 
        code: 'auth/network-request-failed', 
        message: 'Error de conexión. Verifique su internet' 
      }
    };

    const errorCode = error?.code || 'auth/unknown-error';
    return errorMap[errorCode] || { 
      code: 'auth/unknown-error', 
      message: 'Ocurrió un error inesperado. Intente nuevamente.' 
    };
  }

  // 🗺️ MAPEAR ERRORES DEL BACKEND
  private mapBackendError(error: HttpErrorResponse): AuthError {
    const status = error.status;
    
    const backendErrorMap: { [key: number]: AuthError } = {
      400: { code: 'BACKEND_BAD_REQUEST', message: 'Solicitud inválida al servidor' },
      401: { code: 'BACKEND_UNAUTHORIZED', message: 'No autorizado. Por favor, inicie sesión nuevamente' },
      403: { code: 'BACKEND_FORBIDDEN', message: 'No tiene permisos para realizar esta acción' },
      404: { code: 'BACKEND_NOT_FOUND', message: 'Recurso no encontrado en el servidor' },
      409: { code: 'BACKEND_CONFLICT', message: 'El usuario ya existe en el sistema' },
      500: { code: 'BACKEND_SERVER_ERROR', message: 'Error interno del servidor. Intente más tarde' },
      502: { code: 'BACKEND_BAD_GATEWAY', message: 'Servicio temporalmente no disponible' },
      503: { code: 'BACKEND_SERVICE_UNAVAILABLE', message: 'Servicio no disponible. Intente más tarde' },
      504: { code: 'BACKEND_GATEWAY_TIMEOUT', message: 'Tiempo de espera agotado. Verifique su conexión' }
    };

    return backendErrorMap[status] || { 
      code: 'BACKEND_UNKNOWN_ERROR', 
      message: 'Error de comunicación con el servidor' 
    };
  }

  // 🎯 MANEJO CENTRALIZADO DE ERRORES
  private handleError(code: string, message: string, details?: any): void {
    const error: AuthError = { code, message, details };
    this.errorSubject.next(error);
    console.error('🔴 Error de autenticación:', error);
  }

  // 🧹 LIMPIAR ERRORES
  clearError(): void {
    this.errorSubject.next(null);
  }

  // ⏳ MANEJO DE LOADING STATES
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  // 🚪 LOGOUT MEJORADO
  async logout(): Promise<void> {
  this.clearError();
  this.setLoading(true);
  
  try {
    console.log('👋 AuthService: Cerrando sesión...');
    
    // 1. Limpiar el cache del guard
    clearAuthGuardCache();
    
    // 2. Limpiar el flag de redirección
    sessionStorage.removeItem('dashboard_redirected');
    
    // 3. Cerrar sesión en Firebase
    await this.afAuth.signOut();
    
    // 4. Limpiar datos locales
    this.currentUserSubject.next(null);
    localStorage.removeItem('firebaseToken');
    localStorage.removeItem('currentUser');
    
    console.log('✅ AuthService: Sesión cerrada correctamente');
    
    // 5. Redirigir al login
    this.router.navigate(['/login']);
    
  } catch (error) {
    console.error('❌ Error al cerrar sesión:', error);
    this.handleError('LOGOUT_ERROR', 'Error al cerrar sesión', error);
    throw error;
  } finally {
    this.setLoading(false);
  }
}

  // 👤 OBTENER USUARIO ACTUAL
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // 🔒 VERIFICAR AUTENTICACIÓN
  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  // 🎯 VERIFICAR ROL
  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === role : false;
  }

  // 🎯 VERIFICAR MÚLTIPLES ROLES
  hasAnyRole(roles: UserRole[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  // 🔄 FORZAR ACTUALIZACIÓN DEL PERFIL
  refreshUserProfile(): void {
    this.setLoading(true);
    this.http.get<User>(`${environment.apiUrl}/users/profile`).pipe(
      timeout(10000),
      catchError((error: HttpErrorResponse) => {
        this.handleError('REFRESH_ERROR', 'Error actualizando perfil', error);
        return throwError(error);
      })
    ).subscribe({
      next: (user: User) => {
        this.currentUserSubject.next(user);
        this.setLoading(false);
      },
      error: () => {
        this.setLoading(false);
      }
    });
  }

  // 🎯 OBTENER ESTADO ACTUAL DE LOADING
  isLoading(): boolean {
    return this.loadingSubject.value;
  }

  // 🎯 OBTENER ERROR ACTUAL
  getCurrentError(): AuthError | null {
    return this.errorSubject.value;
  }

  /**
   * Obtener perfil completo del usuario con datos extendidos
   */
  async getCompleteUserProfile(): Promise<any> {
    try {
      console.log('🔄 Solicitando perfil completo...');
      const response = await this.http.get<any>(`${environment.apiUrl}/users/profile`).toPromise();
      
      console.log('📦 Respuesta completa del backend:', response); // DEBUG
      
      // VERIFICACIÓN más robusta
      const completeProfile = {
        ...response,
        profile: response.profile || {},
        roleInfo: response.roleInfo || { 
          name: response.role, 
          permissions: response.permissions || [] 
        },
        preferences: response.preferences || {
          notifications: true,
          newsletter: false,
          smsAlerts: false,
          language: 'es'
        },
        specialization: response.specialization || []
      };
      
      console.log('✅ Perfil completo procesado:', completeProfile);
      return completeProfile;
      
    } catch (error) {
      console.error('❌ Error obteniendo perfil completo:', error);
      throw error;
    }
  }

  /**
   * Actualizar perfil extendido del usuario
   */
  async updateExtendedProfile(profileData: any): Promise<any> {
    try {
      const response = await this.http.put(
        `${environment.apiUrl}/users/profile/update`,
        profileData
      ).toPromise();
      
      // Actualizar el usuario localmente
      this.refreshUserProfile();
      return response;
    } catch (error) {
      console.error('Error actualizando perfil extendido:', error);
      throw error;
    }
  }

  /**
   * Actualizar preferencias del usuario - NUEVO MÉTODO
   */
  async updateUserPreferences(preferences: any): Promise<any> {
    try {
      const response = await this.http.put(
        `${environment.apiUrl}/users/preferences/update`,
        preferences
      ).toPromise();
      
      // Actualizar el usuario localmente
      this.refreshUserProfile();
      return response;
    } catch (error) {
      console.error('Error actualizando preferencias:', error);
      throw error;
    }
  }

  /**
   * Verificar permisos específicos del usuario
   */
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user || !user.permissions) return false;
    
    return user.permissions.includes(permission);
  }

  /**
   * Obtener datos del perfil extendido
   */
  getExtendedProfile(): any {
    const user = this.getCurrentUser();
    return user?.profile || null;
  }

  /**
   * Verificar si hay una sesión activa al cargar la app
   */
  async checkExistingSession(): Promise<boolean> {
    const token = localStorage.getItem('firebaseToken');
    if (!token) {
      return false;
    }

    try {
      await this.loadUserProfile();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Esperar a que el perfil del usuario se cargue
   */
  private waitForUserProfile(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('⏳ Esperando carga del perfil...');
      
      // Si ya tenemos el usuario, resolvemos inmediatamente
      if (this.currentUserSubject.value) {
        console.log('✅ Usuario ya está cargado');
        resolve();
        return;
      }
      
      // Timeout máximo de 10 segundos
      const timeout = setTimeout(() => {
        subscription.unsubscribe();
        console.log('❌ Timeout esperando perfil');
        reject(new Error('Timeout waiting for user profile'));
      }, 10000);
      
      // Suscribirse a cambios en el usuario
      const subscription = this.currentUser$.subscribe({
        next: (user) => {
          if (user) {
            console.log('✅ Perfil cargado exitosamente:', user.email);
            clearTimeout(timeout);
            subscription.unsubscribe();
            resolve();
          }
        },
        error: (error) => {
          clearTimeout(timeout);
          subscription.unsubscribe();
          reject(error);
        }
      });
    });
  }

  private async handleUserNotFound(): Promise<void> {
  try {
    const firebaseUser = await this.afAuth.currentUser;
    if (!firebaseUser) {
      throw new Error('No hay usuario de Firebase');
    }

    console.log('🔄 Creando usuario en backend automáticamente...');
    
    // Crear usuario en el backend con los datos de Firebase
    await this.createUserInBackend({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || firebaseUser.email,
      phoneNumber: firebaseUser.phoneNumber || '',
      role: UserRole.CUSTOMER
    });

    // Reintentar cargar el perfil después de crear el usuario
    console.log('✅ Usuario creado, recargando perfil...');
    await this.loadUserProfile();
    
  } catch (error) {
    console.error('❌ Error creando usuario automáticamente:', error);
    this.handleError('AUTO_CREATE_ERROR', 'Error creando usuario automáticamente', error);
    // Forzar logout si no se puede crear el usuario
    await this.cleanupExpiredSession();
  }
  }

  /**
 * Obtener la ruta del dashboard según el rol del usuario
 */
  getDashboardRouteByRole(role: UserRole): string {
    const roleRoutes = {
      [UserRole.ADMIN]: '/dashboard/admin',
      [UserRole.SALES]: '/dashboard/sales', 
      [UserRole.TECHNICIAN]: '/dashboard/technician',
      [UserRole.CUSTOMER]: '/dashboard/customer'
    };
    
    return roleRoutes[role] || '/dashboard/overview';
  }

  /**
   * Redirigir al dashboard correspondiente según el rol
   */
  redirectToRoleDashboard(): void {
    const user = this.getCurrentUser();
    if (user) {
      const dashboardRoute = this.getDashboardRouteByRole(user.role);
      console.log(`🔄 Redirigiendo a dashboard de ${user.role}: ${dashboardRoute}`);
      this.router.navigate([dashboardRoute]);
    } else {
      console.log('⚠️ No hay usuario para redirigir');
      this.router.navigate(['/dashboard']);
    }
  }
}