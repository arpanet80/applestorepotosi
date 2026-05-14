// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { UsersService } from '../users/users.service';
import { UserRole, UserDocument } from '../users/schemas/user.schema';

// FIX #6: El mapa de permisos se define como constante estática a nivel de módulo.
// En el código original se recreaba este objeto en cada llamada a getUserPermissions(),
// lo que generaba presión innecesaria en el GC en aplicaciones de alto tráfico.
const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: [
    'users:read', 'users:write', 'users:delete',
    'products:read', 'products:write', 'products:delete',
    'services:read', 'services:write', 'services:delete',
    'reports:read', 'reports:write',
    'inventory:read', 'inventory:write', 'inventory:delete',
    'settings:read', 'settings:write',
    'sales:read', 'sales:write', 'sales:delete',
    'customers:read', 'customers:write', 'customers:delete',
    'suppliers:read', 'suppliers:write', 'suppliers:delete',
  ],
  [UserRole.TECHNICIAN]: [
    'services:read', 'services:write', 'services:update',
    'products:read',
    'reports:read',
    'inventory:read',
    'customers:read',
  ],
  [UserRole.SALES]: [
    'products:read', 'products:write', 'products:update',
    'services:read',
    'reports:read',
    'inventory:read',
    'sales:read', 'sales:write', 'sales:update',
    'customers:read', 'customers:write', 'customers:update',
  ],
  [UserRole.CUSTOMER]: [
    'products:read',
    'services:read:own',
    'profile:read', 'profile:update',
  ],
};

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  /**
   * Valida si un usuario existe por su UID de Firebase y está activo.
   */
  async validateUser(uid: string): Promise<UserDocument> {
    const user = await this.usersService.findOneByUid(uid);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Usuario desactivado');
    }
    return user;
  }

  /**
   * FIX #9: Resuelve los permisos directamente a partir del documento ya cargado,
   * sin hacer una nueva consulta a la base de datos.
   * Método privado — para uso interno del servicio.
   */
  private resolvePermissions(user: UserDocument): string[] {
    if (user.roleInfo?.permissions?.length > 0) {
      return user.roleInfo.permissions;
    }
    return DEFAULT_ROLE_PERMISSIONS[user.role] ?? [];
  }

  /**
   * FIX #9: getUserProfile ahora hace UNA sola consulta a BD.
   * Antes: validateUser() + getUserPermissions() → validateUser() internamente = 2 queries.
   * Ahora: validateUser() → resolvePermissions(user) = 1 query.
   */
  async getUserProfile(uid: string): Promise<any>;
  async getUserProfile(user: UserDocument): Promise<any>;
  async getUserProfile(uidOrUser: string | UserDocument): Promise<any> {
    const user =
      typeof uidOrUser === 'string'
        ? await this.validateUser(uidOrUser)
        : uidOrUser;

    const permissions = this.resolvePermissions(user);
    const userObject = user.toObject ? user.toObject() : user;

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      phoneNumber: user.phoneNumber,
      profile: user.profile,
      role: user.role,
      roleInfo: user.roleInfo,
      preferences: user.preferences,
      specialization: user.specialization,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      lastLogin: user.lastLogin,
      permissions,
      createdAt: userObject.createdAt,
      updatedAt: userObject.updatedAt,
    };
  }

  /**
   * Crear usuario en Firebase Auth.
   */
  async createFirebaseUser(
    email: string,
    password: string,
    displayName?: string,
  ): Promise<admin.auth.UserRecord> {
    try {
      return await admin.auth().createUser({
        email,
        password,
        displayName,
        emailVerified: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Error creando usuario en Firebase: ${message}`);
    }
  }

  /**
   * Verificar si un email ya existe en Firebase Auth.
   */
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      await admin.auth().getUserByEmail(email);
      return true;
    } catch (error) {
      // Los errores de Firebase Admin tienen una propiedad `code` que no existe
      // en el tipo `Error` estándar. Se hace type narrowing con una type guard
      // para acceder a ella de forma segura sin perder el tipado estricto.
      if (
        error !== null &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: unknown }).code === 'auth/user-not-found'
      ) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Verifica si un usuario tiene un rol específico.
   */
  async hasRole(uid: string, requiredRole: UserRole): Promise<boolean> {
    try {
      const user = await this.validateUser(uid);
      return user.role === requiredRole;
    } catch {
      return false;
    }
  }

  /**
   * Verifica si un usuario tiene al menos uno de los roles requeridos.
   */
  async hasAnyRole(uid: string, requiredRoles: UserRole[]): Promise<boolean> {
    try {
      const user = await this.validateUser(uid);
      return requiredRoles.includes(user.role);
    } catch {
      return false;
    }
  }

  /**
   * Actualiza el último login del usuario.
   */
  async updateLastLogin(uid: string): Promise<void> {
    try {
      await this.usersService.updateLastLogin(uid);
    } catch (error) {
      console.error('Error actualizando último login:', error);
    }
  }
}