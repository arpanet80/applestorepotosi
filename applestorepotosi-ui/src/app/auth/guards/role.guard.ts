// src/app/auth/guards/role.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

// FIX: El roleGuard original tenía dos problemas:
//
// 1. No esperaba a que AuthService terminara de cargar el usuario.
//    Si roleGuard se ejecutaba antes de que loadUserProfile() completara,
//    getCurrentUser() devolvía null y redirigía a /unauthorized aunque el
//    usuario tuviera el rol correcto.
//
// 2. Si no se especificaban roles en route.data, permitía acceso sin verificar
//    autenticación, lo que podría exponer rutas no intencionalmente.
//
// SOLUCIÓN: usar waitForAuthReady() (igual que authGuard) para garantizar que
// el usuario esté cargado antes de evaluar roles.

export const roleGuard: CanActivateFn = async (route) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  const expectedRoles = route.data?.['roles'] as UserRole[] | undefined;

  // Esperar a que la autenticación esté resuelta
  const user = await authService.waitForAuthReady();

  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  // Si la ruta no requiere roles específicos, solo verificar autenticación
  if (!expectedRoles || expectedRoles.length === 0) {
    return true;
  }

  const hasRequiredRole = expectedRoles.includes(user.role);

  if (!hasRequiredRole) {
    console.warn(`RoleGuard: rol insuficiente. Tiene: ${user.role}, requiere: ${expectedRoles.join(', ')}`);
    router.navigate(['/unauthorized']);
    return false;
  }

  return true;
};