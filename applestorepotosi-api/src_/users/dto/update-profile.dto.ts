import { IsOptional, IsString, IsDate, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../schemas/user.schema';

class ProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsDate()
  dateOfBirth?: Date;

  @IsOptional()
  @IsEnum(['male', 'female', 'other'])
  gender?: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ProfileDto)
  profile?: ProfileDto;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
  
}