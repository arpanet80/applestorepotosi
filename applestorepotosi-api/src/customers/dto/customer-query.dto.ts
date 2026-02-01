// src/customers/dto/customer-query.dto.ts
import { IsOptional, IsBoolean, IsString, IsNumber, Min } from 'class-validator';

export class CustomerQueryDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  hasLoyaltyPoints?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}