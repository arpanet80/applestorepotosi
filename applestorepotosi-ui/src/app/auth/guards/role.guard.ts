// src/app/auth/guards/role.guard.ts - MEJORADO
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRoles = route.data?.['roles'] as UserRole[];
  
  console.log('🎭 RoleGuard: Verificando roles...', { expectedRoles });

  // Si no se especifican roles, permitir acceso
  if (!expectedRoles || expectedRoles.length === 0) {
    console.log('✅ RoleGuard: Sin roles específicos, acceso permitido');
    return true;
  }

  // Verificar si el usuario está autenticado (debería estar por authGuard)
  if (!authService.isAuthenticated()) {
    console.log('🔐 RoleGuard: Usuario no autenticado');
    router.navigate(['/login']);
    return false;
  }

  // Verificar roles
  const user = authService.getCurrentUser();
  if (!user) {
    console.log('❌ RoleGuard: No se pudo obtener información del usuario');
    router.navigate(['/unauthorized']);
    return false;
  }

  const hasRequiredRole = authService.hasAnyRole(expectedRoles);
  
  if (!hasRequiredRole) {
    console.log('🚫 RoleGuard: Rol insuficiente', {
      usuario: user.role,
      requeridos: expectedRoles
    });
    router.navigate(['/unauthorized']);
    return false;
  }

  console.log('✅ RoleGuard: Rol verificado correctamente', user.role);
  return true;
};