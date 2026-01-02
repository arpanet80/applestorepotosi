// src/categories/dto/create-category.dto.ts
import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsBoolean, IsUrl, IsMongoId } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  slug: string;

  @IsMongoId()
  @IsOptional()
  parentId?: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true') // ← debe estar presente
  @IsBoolean()
  isActive?: boolean;
}