// src/app/core/services/role.service.ts

import { inject, Injectable } from '@angular/core';
import { AuthService } from '../../../../../auth/services/auth.service';
import { UserRole } from '../../../../../auth/models/user.model';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private authService = inject(AuthService);

  /**
   * Devuelve TRUE si el usuario autenticado tiene AL MENOS uno de los roles indicados
   * @param requiredRoles array de UserRole (string enum)
   */
  hasAnyRole(requiredRoles: UserRole[]): boolean {
    if (!requiredRoles || requiredRoles.length === 0) return true; // sin restricción
    return this.authService.hasAnyRole(requiredRoles);
  }
}