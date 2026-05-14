// src/app/auth/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

// FIX #1 - CACHÉ DEL GUARD (el bug principal del "botón atrás"):
//
// El caché anterior de 1 segundo era el responsable del comportamiento donde
// el usuario podía hacer "atrás + refresh" y seguir dentro del sistema con
// un token expirado:
//
//   1. Token expira → Firebase emite null → cleanupExpiredSession() → /login
//   2. Usuario pulsa "atrás" → Angular navega a la ruta protegida
//   3. AuthGuard se ejecuta → lastAuthResult=false (ya limpiado) → redirect /login ✓
//
// PERO si el refresh ocurría dentro de la ventana de 1s del caché:
//   3. AuthGuard lee caché → lastAuthResult=true → ¡deja pasar! ✗
//
// Adicionalmente, el caché era a nivel de módulo (variable global), lo que
// significa que persistía entre navegaciones y podía devolver "autenticado"
// incluso después del logout si el usuario navegaba rápido.
//
// SOLUCIÓN: Eliminar el caché de 1 segundo. En su lugar, el guard espera a que
// AuthService termine su inicialización usando waitForAuthReady(), que resuelve
// en cuanto loading$ emite false. Esto es eficiente porque:
//   - Si el usuario ya está cargado: resuelve inmediatamente (filter + take(1))
//   - Si está cargando: espera el observable, sin setTimeout ni polling

export const authGuard: CanActivateFn = async (route, state): Promise<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  // Esperar a que la inicialización de Firebase/AuthService termine.
  // waitForAuthReady() filtra el BehaviorSubject de loading$ y resuelve cuando
  // loading es false, devolviendo el usuario actual (o null).
  const user = await authService.waitForAuthReady();

  if (user) {
    return true;
  }

  // Guardar la URL intentada para redirigir después del login
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

// Se mantiene la función de limpieza de caché por compatibilidad con el logout,
// pero ahora no hay caché real que limpiar (no-op).
export function clearAuthGuardCache(): void {
  // no-op: el guard ya no usa caché
}