import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../schemas/user.schema';

export class CreateUserDto {
  @IsString()
  uid: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsEnum(UserRole)
  role: UserRole;
}