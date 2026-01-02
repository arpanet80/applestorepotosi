// src/suppliers/dto/create-supplier.dto.ts
import { IsString, IsOptional, IsBoolean, IsEmail, IsPhoneNumber, ValidateNested,IsObject} from 'class-validator';
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

class BankInfoDto {
  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsString()
  @IsOptional()
  bankName?: string;
}

export class CreateSupplierDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  representative?: string;

  @IsEmail()
  contactEmail: string;

  @IsString()
  contactPhone: string;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsString()
  @IsOptional()
  taxId?: string;

  @IsString()
  @IsOptional()
  rfc?: string;

  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => BankInfoDto)
  bankInfo?: BankInfoDto;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}