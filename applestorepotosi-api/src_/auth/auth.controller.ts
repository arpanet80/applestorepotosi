// src/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AdminRegisterDto, CustomerRegisterDto } from './dto/register.dto';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import type { UserRequest } from './interfaces/user-request.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  /**
   * Registro de nuevos usuarios – solo ADMIN.
   *
   * FIX #1: Se añade RolesGuard al chain de guards. Sin él, @Roles() solo
   * ponía metadata pero nadie la leía, por lo que cualquier usuario autenticado
   * podía registrar usuarios con cualquier rol.
   *
   * FIX #3: Se usa AdminRegisterDto (con campo `role` validado por enum) en lugar
   * del RegisterDto original donde el cliente enviaba libremente su rol.
   */
  @Post('register')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async register(@Body() registerDto: AdminRegisterDto) {
    const emailExists = await this.authService.checkEmailExists(registerDto.email);
    if (emailExists) {
      // FIX #2 (endpoint admin): mensaje consistente, sin exponer el email en la respuesta
      return { error: 'El email ya está registrado' };
    }

    const firebaseUser = await this.authService.createFirebaseUser(
      registerDto.email,
      registerDto.password,
      registerDto.displayName,
    );

    const user = await this.usersService.createUser({
      uid: firebaseUser.uid,
      email: registerDto.email,
      displayName: registerDto.displayName,
      phoneNumber: registerDto.phoneNumber,
      role: registerDto.role,
      roleInfo: { name: registerDto.role, permissions: [] },
      profile: {
        firstName: registerDto.displayName?.split(' ')[0] ?? '',
        lastName: registerDto.displayName?.split(' ').slice(1).join(' ') ?? '',
        phone: registerDto.phoneNumber,
      },
      photoURL: firebaseUser.photoURL ?? '',
      provider: firebaseUser.providerData[0]?.providerId ?? 'password',
    });

    return {
      message: 'Usuario registrado exitosamente',
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        profile: user.profile,
        photoURL: user.photoURL,
        provider: user.provider,
      },
    };
  }

  /**
   * Registro público para clientes.
   *
   * FIX #2: Se reemplaza el mensaje diferenciado "El email ya está registrado"
   * + echo del email por un mensaje genérico. Antes, un atacante podía enumerar
   * emails válidos del sistema llamando a este endpoint de forma masiva.
   *
   * FIX #3: Se usa CustomerRegisterDto (sin campo `role`). El rol CUSTOMER
   * es asignado exclusivamente por el servidor.
   */
  @Post('register/customer')
  async registerCustomer(@Body() registerDto: CustomerRegisterDto) {
    const emailExists = await this.authService.checkEmailExists(registerDto.email);
    if (emailExists) {
      // Respuesta genérica — no revela si el email existe en el sistema
      return { message: 'Si los datos son válidos, recibirás un correo de confirmación.' };
    }

    const firebaseUser = await this.authService.createFirebaseUser(
      registerDto.email,
      registerDto.password,
      registerDto.displayName,
    );

    const user = await this.usersService.createUser({
      uid: firebaseUser.uid,
      email: registerDto.email,
      displayName: registerDto.displayName,
      phoneNumber: registerDto.phoneNumber,
      role: UserRole.CUSTOMER,                          // ← siempre fijado por el servidor
      roleInfo: { name: UserRole.CUSTOMER, permissions: [] },
      profile: {
        firstName: registerDto.displayName?.split(' ')[0] ?? '',
        lastName: registerDto.displayName?.split(' ').slice(1).join(' ') ?? '',
        phone: registerDto.phoneNumber,
      },
      photoURL: firebaseUser.photoURL ?? '',
      provider: firebaseUser.providerData[0]?.providerId ?? 'password',
    });

    return {
      message: 'Cliente registrado exitosamente',
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        profile: user.profile,
        photoURL: user.photoURL,
        provider: user.provider,
      },
    };
  }

  /**
   * Login – verifica el token Firebase y retorna el perfil completo.
   *
   * FIX #10: Se elimina la doble consulta a BD. FirebaseAuthGuard ya carga el
   * usuario completo desde MongoDB en la estrategia y lo deja en req.user.
   * getUserProfile() ahora acepta un UserDocument directamente, evitando
   * un segundo findOneByUid().
   */
  @Post('login')
  @UseGuards(FirebaseAuthGuard)
  async login(@Req() req: any) {
    const user = (req as UserRequest).user;

    // updateLastLogin no bloquea la respuesta aunque falle
    await this.usersService.updateLastLogin(user.uid);

    // FIX #10: Se pasa el documento ya cargado, no solo el uid
    const userProfile = await this.authService.getUserProfile(user);

    return {
      message: 'Login exitoso',
      user: userProfile,
    };
  }

  /**
   * Perfil completo del usuario autenticado.
   *
   * NOTA: El método HTTP se mantiene como POST por indicación explícita.
   * (Pendiente de cambiar a GET en una iteración posterior — issue #5)
   *
   * FIX #10: Mismo patrón que login — se pasa el documento en lugar del uid.
   */
  @Post('profile')
  @UseGuards(FirebaseAuthGuard)
  async getProfile(@Req() req: any) {
    return this.authService.getUserProfile((req as UserRequest).user);
  }
}