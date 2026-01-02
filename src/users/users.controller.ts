// src/users/users.controller.ts
import { Controller, Get, Put, Param, Body, UseGuards,   Query, Delete, ParseEnumPipe, DefaultValuePipe, ParseIntPipe, Req,Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './schemas/user.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
    getProfile(@Req() req: any) {
    const user = req.user;
    
    if (!user) {
      return {
        error: 'Usuario no autenticado'
      };
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
      lastLogin: user.lastLogin
    };
  }

  @Put('profile/update')
  async updateOwnProfile(
    @Req() req: any,
    @Body() updateData: any
  ) {
    const uid = req.user.uid;
    return this.usersService.updateBasicProfile(uid, updateData);
  }

  @Put('preferences/update')
  async updateOwnPreferences(
    @Req() req: any,
    @Body() preferences: any
  ) {
    const uid = req.user.uid;
    return this.usersService.updateUserPreferences(uid, preferences);
  }

  @Put('specializations/update')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  async updateOwnSpecializations(
    @Req() req: any,
    @Body('specializations') specializations: string[]
  ) {
    const uid = req.user.uid;
    return this.usersService.updateSpecializations(uid, specializations);
  }

  @Put('email/verify')
  async verifyOwnEmail(@Req() req: any) {
    const uid = req.user.uid;
    return this.usersService.verifyEmail(uid);
  }

  // @Get()
  // @Roles(UserRole.ADMIN)
  // findAll() {
  //   return this.usersService.findAll();
  // }
  @Get()
  @Roles(UserRole.ADMIN)
  findAll(
    @Query('search') search?: string,
    @Query('role') role?: UserRole,   // ← ya puede ser undefined
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.usersService.findWithPagination(page, limit, role, search);
  }

  @Get('paginated')
  @Roles(UserRole.ADMIN)
  findPaginated(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('role') role?: UserRole
  ) {
    return this.usersService.findWithPagination(page, limit, role);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  getStats() {
    return this.usersService.getUsersStats();
  }

  @Get('role/:role')
  @Roles(UserRole.ADMIN)
  findByRole(@Param('role', new ParseEnumPipe(UserRole)) role: UserRole) {
    return this.usersService.findByRole(role);
  }

  @Get('role/technician/active')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  getActiveTechnicians() {
    return this.usersService.findByRole(UserRole.TECHNICIAN);
  }

  @Get('active')
  @Roles(UserRole.ADMIN)
  findActive() {
    return this.usersService.findActiveUsers();
  }

  @Get(':uid')
  @Roles(UserRole.ADMIN)
  findOne(@Param('uid') uid: string) {
    return this.usersService.findOneByUid(uid);
  }

  @Put(':uid/role')
  @Roles(UserRole.ADMIN)
  updateRole(
    @Param('uid') uid: string, 
    @Body('role', new ParseEnumPipe(UserRole)) role: UserRole
  ) {
    return this.usersService.updateUserRole(uid, role);
  }

  @Put(':uid/profile')
  @Roles(UserRole.ADMIN)
  updateUserProfile(
    @Param('uid') uid: string,
    @Body() updateData: UpdateProfileDto // ✅ Ahora incluye `profile`
  ) {
    return this.usersService.updateUserProfile(uid, updateData);
  }

  @Put(':uid/preferences')
  @Roles(UserRole.ADMIN)
  updateUserPreferences(
    @Param('uid') uid: string,
    @Body() preferences: any
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

  @Get('debug/auth')
  @UseGuards(FirebaseAuthGuard)
  debugAuth(@Req() req: any) {
    return {
      user: req.user,
      headers: {
        authorization: req.headers.authorization
      },
      message: 'Debug endpoint'
    };
  }

  @Get('exists/:uid')
  async exists(@Param('uid') uid: string) {
    const user = await this.usersService.findOneByUid(uid);
    // console.log('User exists check for UID:', uid, 'Exists:', !!user);
    // console.log(!!user);
    return !!user; // ← true si existe, false si no
  }

  @Put(':uid/google-profile')
  @UseGuards(FirebaseAuthGuard)
  async updateGoogleProfile(
    @Param('uid') uid: string,
    @Body() data: { displayName?: string; phoneNumber?: string; photoURL?: string; provider?: string }
  ) {
    // 🔥 Actualiza solo los campos que traes
    return this.usersService.updateUserProfile(uid, {
      displayName: data.displayName,
      phoneNumber: data.phoneNumber,
      photoURL: data.photoURL,
      provider: data.provider
    });
  }
}