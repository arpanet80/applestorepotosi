// src/app/auth/guards/auth.guard.ts - MEJORADO
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🛡️ AuthGuard: Verificando autenticación...');

  // Esperar a que termine la carga inicial de autenticación
  if (authService.isLoading()) {
    console.log('⏳ AuthGuard: Esperando inicialización...');
    
    await new Promise<void>((resolve) => {
      const subscription = authService.loading$.subscribe(loading => {
        if (!loading) {
          subscription.unsubscribe();
          resolve();
        }
      });
      
      setTimeout(() => {
        subscription.unsubscribe();
        resolve();
      }, 3000);
    });
  }

  // Verificar si el usuario está autenticado
  if (!authService.isAuthenticated()) {
    console.log('🔐 AuthGuard: Usuario no autenticado, redirigiendo a login');
    router.navigate(['/login']);
    return false;
  }

  console.log('✅ AuthGuard: Usuario autenticado, acceso permitido');
  return true;
};