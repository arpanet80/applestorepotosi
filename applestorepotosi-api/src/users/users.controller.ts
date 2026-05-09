// src/users/users.controller.ts
import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Query,
  Delete,
  ParseEnumPipe,
  DefaultValuePipe,
  ParseIntPipe,
  Req,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './schemas/user.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Controller('users')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /* ================================================================
   *  RUTAS DE PERFIL PROPIO (usuario autenticado sobre sí mismo)
   * ================================================================ */

  @Get('profile')
  getProfile(@Req() req: any) {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      profile: user.profile,
      role: user.role,
      roleInfo: user.roleInfo,
      preferences: user.preferences,
      specialization: user.specialization,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      lastLogin: user.lastLogin,
    };
  }

  @Put('profile/update')
  async updateOwnProfile(
    @Req() req: any,
    // FIX #5: Tipado explícito en lugar de `any` para evitar que el cliente
    // envíe campos sensibles como `role` o `isActive`. El servicio también
    // filtra, pero la defensa en profundidad empieza aquí.
    @Body() updateData: { displayName?: string; phoneNumber?: string; profile?: any },
  ) {
    const uid = req.user.uid;
    return this.usersService.updateBasicProfile(uid, updateData);
  }

  @Put('preferences/update')
  async updateOwnPreferences(
    @Req() req: any,
    // FIX #5: Tipado con DTO validado en lugar de `any`
    @Body() preferences: UpdatePreferencesDto,
  ) {
    const uid = req.user.uid;
    return this.usersService.updateUserPreferences(uid, preferences);
  }

  @Put('specializations/update')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  async updateOwnSpecializations(
    @Req() req: any,
    @Body('specializations') specializations: string[],
  ) {
    const uid = req.user.uid;
    return this.usersService.updateSpecializations(uid, specializations);
  }

  @Put('email/verify')
  async verifyOwnEmail(@Req() req: any) {
    const uid = req.user.uid;
    return this.usersService.verifyEmail(uid);
  }

  /* ================================================================
   *  RUTAS ADMIN — listados y estadísticas
   * ================================================================ */

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.usersService.findWithPagination(page, limit, role, search);
  }

  // FIX #6: GET paginated eliminado — GET / ya cubre la misma funcionalidad
  // con los mismos query params. Mantenerlo duplicado confunde al equipo de
  // frontend y duplica superficie de mantenimiento.

  @Get('stats')
  @Roles(UserRole.ADMIN)
  getStats() {
    return this.usersService.getUsersStats();
  }

  @Get('active')
  @Roles(UserRole.ADMIN)
  findActive() {
    return this.usersService.findActiveUsers();
  }

  // FIX #1: getActiveTechnicians se mueve ANTES de findByRole(:role) para que
  // NestJS no interprete "technician/active" como role=technician e index=active.
  // Las rutas estáticas siempre deben declararse antes que las dinámicas.
  @Get('role/technician/active')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  getActiveTechnicians() {
    return this.usersService.findByRole(UserRole.TECHNICIAN);
  }

  @Get('role/:role')
  @Roles(UserRole.ADMIN)
  findByRole(@Param('role', new ParseEnumPipe(UserRole)) role: UserRole) {
    return this.usersService.findByRole(role);
  }

  /* ================================================================
   *  RUTAS ADMIN — operaciones sobre un usuario específico por UID
   * ================================================================ */

  @Get(':uid')
  @Roles(UserRole.ADMIN)
  findOne(@Param('uid') uid: string) {
    return this.usersService.findOneByUid(uid);
  }

  @Put(':uid/role')
  @Roles(UserRole.ADMIN)
  updateRole(
    @Param('uid') uid: string,
    @Body('role', new ParseEnumPipe(UserRole)) role: UserRole,
  ) {
    return this.usersService.updateUserRole(uid, role);
  }

  @Put(':uid/profile')
  @Roles(UserRole.ADMIN)
  updateUserProfile(
    @Param('uid') uid: string,
    @Body() updateData: UpdateProfileDto,
  ) {
    return this.usersService.updateUserProfile(uid, updateData);
  }

  @Put(':uid/preferences')
  @Roles(UserRole.ADMIN)
  updateUserPreferences(
    @Param('uid') uid: string,
    @Body() preferences: UpdatePreferencesDto,
  ) {
    return this.usersService.updateUserPreferences(uid, preferences);
  }

  @Put(':uid/deactivate')
  @Roles(UserRole.ADMIN)
  deactivateUser(@Param('uid') uid: string) {
    return this.usersService.deactivateUser(uid);
  }

  @Put(':uid/activate')
  @Roles(UserRole.ADMIN)
  activateUser(@Param('uid') uid: string) {
    return this.usersService.activateUser(uid);
  }

  @Put(':uid/last-login')
  @Roles(UserRole.ADMIN)
  updateLastLogin(@Param('uid') uid: string) {
    return this.usersService.updateLastLogin(uid);
  }

  @Delete(':uid')
  @Roles(UserRole.ADMIN)
  deleteUser(@Param('uid') uid: string) {
    return this.usersService.deleteUser(uid);
  }

  // FIX #4: updateGoogleProfile ahora verifica que el uid del token coincida
  // con el uid del parámetro. Antes, cualquier usuario autenticado podía
  // actualizar el perfil de otro usuario pasando su uid en la URL.
  @Put(':uid/google-profile')
  async updateGoogleProfile(
    @Param('uid') uid: string,
    @Req() req: any,
    @Body() data: { displayName?: string; phoneNumber?: string; photoURL?: string; provider?: string },
  ) {
    if (req.user?.uid !== uid) {
      throw new ForbiddenException('No puedes modificar el perfil de otro usuario');
    }
    return this.usersService.updateUserProfile(uid, {
      displayName: data.displayName,
      phoneNumber: data.phoneNumber,
      photoURL: data.photoURL,
      provider: data.provider,
    });
  }

  // FIX #2: exists ahora requiere rol ADMIN. Antes era accesible por cualquier
  // usuario autenticado, permitiendo enumerar UIDs del sistema.
  @Get('exists/:uid')
  @Roles(UserRole.ADMIN)
  async exists(@Param('uid') uid: string) {
    const user = await this.usersService.findOneByUid(uid);
    return !!user;
  }

  // FIX #3: debug/auth eliminado. Exponía el header Authorization completo
  // (el token Firebase) en la respuesta, lo que es un riesgo en producción.
  // Si necesitas volver a depurar autenticación, añade una variable de entorno:
  //   if (process.env.NODE_ENV !== 'production') { ... }
}