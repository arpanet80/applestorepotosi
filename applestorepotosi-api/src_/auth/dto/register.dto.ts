import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../../users/schemas/user.schema';

// FIX #3: El DTO original tenía `role` como campo libre enviado por el cliente,
// lo que permitiría que cualquier usuario autenticado se autoasignara el rol ADMIN
// si el guard fallara o se relajara en el futuro.
//
// Solución: Se separan en dos DTOs:
//   - CustomerRegisterDto → endpoint público, sin campo `role` (el servidor lo fija a CUSTOMER)
//   - AdminRegisterDto    → endpoint privado (solo ADMIN), acepta `role` con validación
//
// El controlador ya usa RegisterDto con Omit<RegisterDto, 'role'> para el endpoint
// de clientes, pero esto lo hace explícito y type-safe sin depender de Omit en runtime.

export class CustomerRegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  displayName?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;
  // ⛔ Sin campo `role`: el servidor asigna CUSTOMER directamente en el controlador.
}

export class AdminRegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  displayName?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  // Solo los roles permitidos que un ADMIN puede asignar
  @IsEnum([UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN, UserRole.CUSTOMER], {
    message: `El rol debe ser uno de: ${[UserRole.ADMIN, UserRole.SALES, UserRole.TECHNICIAN, UserRole.CUSTOMER].join(', ')}`,
  })
  role: UserRole;
}