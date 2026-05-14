// src/customers/dto/create-customer.dto.ts
import { 
  IsString, 
  IsOptional, 
  IsBoolean, 
  IsEmail, 
  IsPhoneNumber, 
  ValidateNested,
  IsObject,
  IsNumber,
  Min,
  IsMongoId
} from 'class-validator';
import { Type } from 'class-transformer';

class AddressDto {
  @IsString()
  @IsOptional()
  street?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  zipCode?: string;

  @IsString()
  @IsOptional()
  country?: string;
}

export class CreateCustomerDto {
  @IsMongoId()
  @IsOptional()
  userId?: string;

  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  @IsOptional()
  taxId?: string;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsNumber()
  @Min(0)
  @IsOptional()
  loyaltyPoints?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}