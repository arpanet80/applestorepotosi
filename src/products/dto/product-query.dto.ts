// src/products/dto/product-query.dto.ts
import { Transform, Type } from 'class-transformer';
import { IsOptional, IsBoolean, IsString, IsNumber, Min, IsMongoId, IsArray } from 'class-validator';

export class ProductQueryDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isActive?: boolean;

  
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isFeatured?: boolean;

  @IsOptional()
  @IsMongoId()
  categoryId?: string;

  @IsOptional()
  @IsMongoId()
  brandId?: string;

  @IsOptional()
  @IsMongoId()
  supplierId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  stockStatus?: string; // 'in-stock', 'low-stock', 'out-of-stock'

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  ids?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'name';

  @IsOptional()
  @IsString()
  sortOrder?: string = 'asc';
}