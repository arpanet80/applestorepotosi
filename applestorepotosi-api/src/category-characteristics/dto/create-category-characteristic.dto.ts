// src/category-characteristics/dto/create-category-characteristic.dto.ts
import { IsString, IsOptional, IsBoolean, IsArray, IsEnum, IsMongoId, IsNumber, Min } from 'class-validator';

export class CreateCategoryCharacteristicDto {
  @IsMongoId()
  categoryId: string;

  @IsString()
  name: string;

  @IsEnum(['text', 'number', 'boolean', 'select', 'multiselect', 'date'])
  type: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  possibleValues?: string[];

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}