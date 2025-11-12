// src/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  /**
   * Registro de nuevos usuarios - controlado por tu API
   */
  @Post('register')
  @UseGuards(FirebaseAuthGuard)
  @Roles(UserRole.ADMIN)
  async register(@Body() registerDto: RegisterDto) {
    // 1. Verificar si el email ya existe
    const emailExists = await this.authService.checkEmailExists(registerDto.email);
    if (emailExists) {
      return {
        error: 'El email ya está registrado',
        email: registerDto.email
      };
    }

    // 2. Crear usuario en Firebase Auth
    const firebaseUser = await this.authService.createFirebaseUser(
      registerDto.email,
      registerDto.password,
      registerDto.displayName
    );

    // 3. Crear usuario en MongoDB con el rol especificado
    const user = await this.usersService.createUser({
      uid: firebaseUser.uid,
      email: registerDto.email,
      displayName: registerDto.displayName,
      phoneNumber: registerDto.phoneNumber,
      role: registerDto.role,
      roleInfo: {
        name: registerDto.role,
        permissions: []
      },
      profile: {
        firstName: registerDto.displayName?.split(' ')[0] || '',
        lastName: registerDto.displayName?.split(' ').slice(1).join(' ') || '',
        phone: registerDto.phoneNumber
      }
    });

    return {
      message: 'Usuario registrado exitosamente',
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        profile: user.profile
      }
    };
  }

  /**
   * Registro público para clientes
   */
  @Post('register/customer')
  async registerCustomer(@Body() registerDto: Omit<RegisterDto, 'role'>) {
    // 1. Verificar si el email ya existe
    const emailExists = await this.authService.checkEmailExists(registerDto.email);
    if (emailExists) {
      return {
        error: 'El email ya está registrado',
        email: registerDto.email
      };
    }

    // 2. Crear usuario en Firebase Auth
    const firebaseUser = await this.authService.createFirebaseUser(
      registerDto.email,
      registerDto.password,
      registerDto.displayName
    );

    // 3. Crear usuario en MongoDB con rol CUSTOMER por defecto
    const user = await this.usersService.createUser({
      uid: firebaseUser.uid,
      email: registerDto.email,
      displayName: registerDto.displayName,
      phoneNumber: registerDto.phoneNumber,
      role: UserRole.CUSTOMER,
      roleInfo: {
        name: UserRole.CUSTOMER,
        permissions: []
      },
      profile: {
        firstName: registerDto.displayName?.split(' ')[0] || '',
        lastName: registerDto.displayName?.split(' ').slice(1).join(' ') || '',
        phone: registerDto.phoneNumber
      }
    });

    return {
      message: 'Cliente registrado exitosamente',
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        profile: user.profile
      }
    };
  }

  /**
   * Login - verifica credenciales y retorna usuario completo
   */
  @Post('login')
  @UseGuards(FirebaseAuthGuard)
  async login(@Req() req: any) {
    const user = req.user;
    
    // Actualizar último login
    await this.usersService.updateLastLogin(user.uid);
    
    // Obtener perfil completo con permisos
    const userProfile = await this.authService.getUserProfile(user.uid);
    
    return {
      message: 'Login exitoso',
      user: userProfile
    };
  }

  /**
   * Obtener perfil completo del usuario autenticado
   */
  @Post('profile')
  @UseGuards(FirebaseAuthGuard)
  async getProfile(@Req() req: any) {
    const user = req.user;
    return this.authService.getUserProfile(user.uid);
  }
}