// src/app/auth/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

// FIX #1 - INTERCEPTOR CON REFRESCO AUTOMÁTICO DE TOKEN:
//
// El interceptor original solo leía localStorage y añadía el token estáticamente.
// Si el token en localStorage ya había expirado (Firebase tokens duran 1h),
// el backend devolvía 401 y el usuario veía un error en lugar de un refresco
// transparente.
//
// Firebase SDK mantiene el token fresco automáticamente en memoria, pero
// localStorage puede quedar desactualizado si la pestaña estuvo inactiva.
//
// SOLUCIÓN: ante un 401, forzar getIdToken(true) para obtener un token nuevo
// directamente de Firebase (ignora caché), actualizar localStorage y reintentar
// la request original UNA sola vez. Si el segundo intento también devuelve 401
// (sesión realmente inválida), dejar pasar el error para que AuthService lo
// maneje con cleanupExpiredSession().

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const afAuth = inject(AngularFireAuth);

  // Añadir token actual al header
  const token = localStorage.getItem('firebaseToken');
  const authReq = token ? addToken(req, token) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Solo intentar refresh en errores 401 y si no es la propia URL de auth
      if (error.status === 401 && !req.url.includes('/auth/')) {
        return from(refreshToken(afAuth)).pipe(
          switchMap(newToken => {
            if (newToken) {
              localStorage.setItem('firebaseToken', newToken);
              return next(addToken(req, newToken));
            }
            return throwError(() => error);
          }),
          catchError(() => throwError(() => error))
        );
      }
      return throwError(() => error);
    })
  );
};

function addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

async function refreshToken(afAuth: AngularFireAuth): Promise<string | null> {
  try {
    const user = await afAuth.currentUser;
    if (!user) return null;
    // force=true ignora el caché de Firebase y solicita un token nuevo
    return await user.getIdToken(true);
  } catch {
    return null;
  }
}