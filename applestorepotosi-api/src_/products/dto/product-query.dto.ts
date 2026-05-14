// src/products/dto/product-query.dto.ts
import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsBoolean,
  IsString,
  IsNumber,
  Min,
  IsMongoId,
  IsArray,
  IsIn,
} from 'class-validator';

export class ProductQueryDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
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
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  // CORRECCIÓN: incluir 'over-stock' en los valores permitidos
  @IsOptional()
  @IsString()
  @IsIn(['in-stock', 'low-stock', 'out-of-stock', 'over-stock'])
  stockStatus?: string;

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
  @IsIn(['name', 'sku', 'salePrice', 'costPrice', 'stockQuantity', 'createdAt'])
  sortBy?: string = 'name';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: string = 'asc';
}