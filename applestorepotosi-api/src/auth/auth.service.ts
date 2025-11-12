// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/schemas/user.schema';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  /**
   * Valida si un usuario existe por su UID de Firebase
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
   * Crear usuario en Firebase Auth
   */
  async createFirebaseUser(email: string, password: string, displayName?: string): Promise<admin.auth.UserRecord> {
    try {
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName,
        emailVerified: false,
      });

      return userRecord;
    } catch (error) {
      throw new Error(`Error creando usuario en Firebase: ${error.message}`);
    }
  }

  /**
   * Verificar si email ya existe en Firebase
   */
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      await admin.auth().getUserByEmail(email);
      return true;
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Verifica si un usuario tiene un rol específico
   */
  async hasRole(uid: string, requiredRole: UserRole): Promise<boolean> {
    try {
      const user = await this.validateUser(uid);
      return user.role === requiredRole;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verifica si un usuario tiene al menos uno de los roles requeridos
   */
  async hasAnyRole(uid: string, requiredRoles: UserRole[]): Promise<boolean> {
    try {
      const user = await this.validateUser(uid);
      return requiredRoles.includes(user.role);
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene los permisos específicos del usuario
   */
  async getUserPermissions(uid: string): Promise<string[]> {
    try {
      const user = await this.validateUser(uid);
      
      // Si el usuario tiene permisos específicos en roleInfo, usarlos
      if (user.roleInfo && user.roleInfo.permissions && user.roleInfo.permissions.length > 0) {
        return user.roleInfo.permissions;
      }
      
      // Si no, usar los permisos por defecto del rol
      const rolePermissions = {
        [UserRole.ADMIN]: [
          'users:read', 'users:write', 'users:delete',
          'products:read', 'products:write', 'products:delete',
          'services:read', 'services:write', 'services:delete',
          'reports:read', 'reports:write',
          'inventory:read', 'inventory:write', 'inventory:delete',
          'settings:read', 'settings:write',
          'sales:read', 'sales:write', 'sales:delete',
          'customers:read', 'customers:write', 'customers:delete',
          'suppliers:read', 'suppliers:write', 'suppliers:delete'
        ],
        [UserRole.TECHNICIAN]: [
          'services:read', 'services:write', 'services:update',
          'products:read',
          'reports:read',
          'inventory:read',
          'customers:read'
        ],
        [UserRole.SALES]: [
          'products:read', 'products:write', 'products:update',
          'services:read',
          'reports:read',
          'inventory:read',
          'sales:read', 'sales:write', 'sales:update',
          'customers:read', 'customers:write', 'customers:update'
        ],
        [UserRole.CUSTOMER]: [
          'products:read',
          'services:read:own',
          'profile:read', 'profile:update'
        ]
      };

      return rolePermissions[user.role] || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Obtiene el perfil completo del usuario con sus permisos
   */
  async getUserProfile(uid: string): Promise<any> {
    const user = await this.validateUser(uid);
    const permissions = await this.getUserPermissions(uid);
    
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
      updatedAt: userObject.updatedAt
    };
  }

  /**
   * Actualiza el último login del usuario
   */
  async updateLastLogin(uid: string): Promise<void> {
    try {
      await this.usersService.updateLastLogin(uid);
    } catch (error) {
      console.error('Error actualizando último login:', error);
    }
  }
}