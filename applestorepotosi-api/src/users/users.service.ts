// src/users/users.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * Buscar usuario por UID de Firebase
   */
  async findOneByUid(uid: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ uid }).exec();
  }

  /**
   * Buscar usuario por email
   */
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  /**
   * Crear o actualizar usuario (para login con Firebase)
   */
  async createOrUpdateUser(userData: Partial<User>): Promise<UserDocument> {
    const { uid, ...updateData } = userData;

    const user = await this.userModel.findOneAndUpdate(
      { uid },
      {
        ...updateData,
        lastLogin: new Date(),
        'roleInfo.name': updateData.role || UserRole.CUSTOMER,
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).exec();

    if (!user) {
      throw new NotFoundException(`Error creando/actualizando usuario con UID: ${uid}`);
    }

    return user;
  }

  /**
   * Obtener perfil completo del usuario
   */
  async getUserProfile(uid: string): Promise<any> {
    const user = await this.userModel.findOne({ uid }).exec();
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user.toObject();
  }

  /**
   * Actualizar perfil completo de usuario (solo ADMIN).
   *
   * FIX #7: Se separan los campos de rol para que solo se actualicen cuando
   * vienen explícitamente en updateData. Antes, si `updateData.role` era
   * undefined, se escribía undefined en `roleInfo.name`, corrompiendo el rol.
   */
  async updateUserProfile(uid: string, updateData: Partial<User>): Promise<UserDocument> {
    const update: Record<string, any> = { ...updateData, updatedAt: new Date() };

    // Solo sincronizar roleInfo si el rol viene explícitamente
    if (updateData.role !== undefined) {
      update['roleInfo.name'] = updateData.role;
      update['role'] = updateData.role;
    } else {
      // Evitar que el spread de updateData sobreescriba el rol con undefined
      delete update.role;
      delete update.roleInfo;
    }

    // Sincronizar phoneNumber desde profile.phone si viene en el update
    if (updateData.profile?.phone !== undefined) {
      update['phoneNumber'] = updateData.profile.phone;
    }

    const user = await this.userModel.findOneAndUpdate(
      { uid },
      update,
      { new: true, runValidators: true },
    ).exec();

    if (!user) {
      throw new NotFoundException(`Usuario con UID ${uid} no encontrado`);
    }

    return user;
  }

  /**
   * Actualizar solo el perfil básico del usuario autenticado.
   *
   * FIX #10: Se usa $set con campos explícitos en lugar de pasar el objeto
   * completo, para evitar que el frontend pueda colar campos sensibles
   * como `role` o `isActive` en el body.
   */
  async updateBasicProfile(uid: string, updateData: {
    displayName?: string;
    phoneNumber?: string;
    profile?: User['profile'];
  }): Promise<UserDocument> {
    // Solo se permiten estos tres campos — cualquier otro se ignora
    const safeUpdate: Record<string, any> = { updatedAt: new Date() };
    if (updateData.displayName !== undefined) safeUpdate.displayName = updateData.displayName;
    if (updateData.phoneNumber !== undefined) safeUpdate.phoneNumber = updateData.phoneNumber;
    if (updateData.profile !== undefined) safeUpdate.profile = updateData.profile;

    const user = await this.userModel.findOneAndUpdate(
      { uid },
      { $set: safeUpdate },
      { new: true, runValidators: true },
    ).exec();

    if (!user) {
      throw new NotFoundException(`Usuario con UID ${uid} no encontrado`);
    }

    return user;
  }

  /**
   * Actualizar preferencias de usuario.
   *
   * FIX #8: Se reemplazaba todo el objeto `preferences` con lo que enviara
   * el cliente. Si enviaba solo `{ language: 'en' }`, se perdían
   * `notifications`, `newsletter` y `smsAlerts`.
   * Ahora se usa dot-notation en $set para actualizar solo los campos enviados.
   */
  async updateUserPreferences(uid: string, preferences: Partial<User['preferences']>): Promise<UserDocument> {
    // Construir update con dot-notation para no pisar campos no enviados
    const prefUpdate: Record<string, any> = { updatedAt: new Date() };
    if (preferences.notifications !== undefined) prefUpdate['preferences.notifications'] = preferences.notifications;
    if (preferences.newsletter !== undefined) prefUpdate['preferences.newsletter'] = preferences.newsletter;
    if (preferences.smsAlerts !== undefined) prefUpdate['preferences.smsAlerts'] = preferences.smsAlerts;
    if (preferences.language !== undefined) prefUpdate['preferences.language'] = preferences.language;

    const user = await this.userModel.findOneAndUpdate(
      { uid },
      { $set: prefUpdate },
      { new: true },
    ).exec();

    if (!user) {
      throw new NotFoundException(`Usuario con UID ${uid} no encontrado`);
    }

    return user;
  }

  /**
   * Actualizar especializaciones
   */
  async updateSpecializations(uid: string, specializations: string[]): Promise<UserDocument> {
    const user = await this.userModel.findOneAndUpdate(
      { uid },
      {
        specialization: specializations,
        updatedAt: new Date(),
      },
      { new: true },
    ).exec();

    if (!user) {
      throw new NotFoundException(`Usuario con UID ${uid} no encontrado`);
    }

    return user;
  }

  /**
   * Verificar email
   */
  async verifyEmail(uid: string): Promise<UserDocument> {
    const user = await this.userModel.findOneAndUpdate(
      { uid },
      {
        emailVerified: true,
        updatedAt: new Date(),
      },
      { new: true },
    ).exec();

    if (!user) {
      throw new NotFoundException(`Usuario con UID ${uid} no encontrado`);
    }

    return user;
  }

  /**
   * Actualizar rol de usuario
   */
  async updateUserRole(uid: string, role: UserRole): Promise<UserDocument> {
    const user = await this.userModel.findOneAndUpdate(
      { uid },
      {
        role,
        'roleInfo.name': role,
        updatedAt: new Date(),
      },
      { new: true },
    ).exec();

    if (!user) {
      throw new NotFoundException(`Usuario con UID ${uid} no encontrado`);
    }

    return user;
  }

  /**
   * Desactivar usuario
   */
  async deactivateUser(uid: string): Promise<UserDocument> {
    const user = await this.userModel.findOneAndUpdate(
      { uid },
      {
        isActive: false,
        updatedAt: new Date(),
      },
      { new: true },
    ).exec();

    if (!user) {
      throw new NotFoundException(`Usuario con UID ${uid} no encontrado`);
    }

    return user;
  }

  /**
   * Activar usuario
   */
  async activateUser(uid: string): Promise<UserDocument> {
    const user = await this.userModel.findOneAndUpdate(
      { uid },
      {
        isActive: true,
        updatedAt: new Date(),
      },
      { new: true },
    ).exec();

    if (!user) {
      throw new NotFoundException(`Usuario con UID ${uid} no encontrado`);
    }

    return user;
  }

  /**
   * Obtener todos los usuarios
   */
  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().sort({ createdAt: -1 }).exec();
  }

  /**
   * Buscar usuarios por rol
   */
  async findByRole(role: UserRole): Promise<UserDocument[]> {
    return this.userModel.find({ role }).exec();
  }

  /**
   * Buscar usuarios activos
   */
  async findActiveUsers(): Promise<UserDocument[]> {
    return this.userModel.find({ isActive: true }).exec();
  }

  /**
   * Eliminar usuario
   */
  async deleteUser(uid: string): Promise<void> {
    const result = await this.userModel.deleteOne({ uid }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Usuario con UID ${uid} no encontrado`);
    }
  }

  /**
   * Obtener estadísticas de usuarios
   */
  async getUsersStats(): Promise<{
    total: number;
    active: number;
    byRole: Record<UserRole, number>;
  }> {
    const total = await this.userModel.countDocuments();
    const active = await this.userModel.countDocuments({ isActive: true });

    const byRole = await this.userModel.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]);

    const statsByRole: Record<UserRole, number> = {
      [UserRole.ADMIN]: 0,
      [UserRole.TECHNICIAN]: 0,
      [UserRole.SALES]: 0,
      [UserRole.CUSTOMER]: 0,
    };

    byRole.forEach(roleGroup => {
      statsByRole[roleGroup._id as UserRole] = roleGroup.count;
    });

    return { total, active, byRole: statsByRole };
  }

  /**
   * Buscar usuario por ID de MongoDB
   */
  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  /**
   * Verificar si un usuario existe
   */
  async userExists(uid: string): Promise<boolean> {
    const count = await this.userModel.countDocuments({ uid }).exec();
    return count > 0;
  }

  /**
   * Actualizar último login
   */
  async updateLastLogin(uid: string): Promise<void> {
    const result = await this.userModel.findOneAndUpdate(
      { uid },
      { lastLogin: new Date() },
    ).exec();

    if (!result) {
      throw new NotFoundException(`Usuario con UID ${uid} no encontrado`);
    }
  }

  /**
   * Buscar usuarios con paginación
   */
  async findWithPagination(
    page = 1,
    limit = 10,
    role?: UserRole,
    search?: string,
  ) {
    const skip = (page - 1) * limit;
    const filter: Record<string, any> = {};
    if (role) filter.role = role;
    if (search?.trim()) {
      const rx = new RegExp(search.trim(), 'i');
      filter.$or = [
        { displayName: rx },
        { email: rx },
        { 'profile.firstName': rx },
        { 'profile.lastName': rx },
      ];
    }

    const [users, total] = await Promise.all([
      this.userModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return { users, total, page, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Crear usuario.
   *
   * FIX #9: Se reemplaza `throw new Error(...)` (que NestJS convierte en HTTP 500)
   * por `ConflictException` que devuelve correctamente HTTP 409.
   */
  async createUser(userData: Partial<User>): Promise<UserDocument> {
    const existingUser = await this.userModel.findOne({
      $or: [
        { uid: userData.uid },
        { email: userData.email },
      ],
    }).exec();

    if (existingUser) {
      throw new ConflictException('El usuario ya existe');
    }

    const userToCreate = {
      ...userData,
      roleInfo: {
        name: userData.role || UserRole.CUSTOMER,
        permissions: [],
      },
    };

    const user = new this.userModel(userToCreate);
    return user.save();
  }
}