// src/brands/dto/create-brand.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsBoolean, IsUrl } from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({ example: 'Apple' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @IsUrl()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsUrl({}, { message: 'supportUrl must be a URL address' })
  @IsOptional()
  supportUrl?: string;

  @IsString()
  @IsOptional()
  warrantyInfo?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}