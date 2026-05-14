// src/app/auth/guards/auth.guard.ts - OPTIMIZADO
import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Cache para evitar verificaciones repetidas innecesarias
let lastAuthCheck = 0;
let lastAuthResult = false;
const AUTH_CHECK_CACHE_DURATION = 1000; // 1 segundo

export const authGuard: CanActivateFn = async (route, state): Promise<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🛡️ AuthGuard: Verificando autenticación para:', state.url);

  // Si la verificación es muy reciente y fue exitosa, usar cache
  const now = Date.now();
  if (now - lastAuthCheck < AUTH_CHECK_CACHE_DURATION && lastAuthResult) {
    console.log('✅ AuthGuard: Usando resultado en cache (autenticado)');
    return true;
  }

  // Verificación rápida primero
  if (authService.isAuthenticated()) {
    console.log('✅ AuthGuard: Usuario autenticado (verificación rápida)');
    lastAuthCheck = now;
    lastAuthResult = true;
    return true;
  }

  // Si está cargando, esperar un máximo de 2 segundos
  if (authService.isLoading()) {
    console.log('⏳ AuthGuard: Esperando inicialización (max 2s)...');
    
    const waitStart = Date.now();
    const maxWait = 2000;

    await new Promise<void>((resolve) => {
      const subscription = authService.loading$.subscribe(loading => {
        if (!loading || (Date.now() - waitStart) > maxWait) {
          subscription.unsubscribe();
          resolve();
        }
      });
    });
  }

  // Verificación final
  const isAuthenticated = authService.isAuthenticated();
  
  if (!isAuthenticated) {
    console.log('🔐 AuthGuard: Usuario no autenticado, redirigiendo a login');
    lastAuthCheck = now;
    lastAuthResult = false;
    
    // Guardar la URL intentada para redirigir después del login
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  console.log('✅ AuthGuard: Usuario autenticado, acceso permitido');
  lastAuthCheck = now;
  lastAuthResult = true;
  return true;
};

// Función para limpiar el cache (útil en logout)
export function clearAuthGuardCache(): void {
  lastAuthCheck = 0;
  lastAuthResult = false;
  console.log('🧹 AuthGuard: Cache limpiado');
}