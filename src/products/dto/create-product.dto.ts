// src/products/dto/create-product.dto.ts
import { IsString, IsOptional, IsBoolean, IsNumber, Min, IsMongoId, IsObject,IsArray,ValidateNested,IsUrl} from 'class-validator';
import { Type } from 'class-transformer';

class ProductImageDto {
  @IsUrl()
  url: string;

  @IsString()
  @IsOptional()
  altText?: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}

export class CreateProductDto {
  @IsString()
  sku: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId()
  @Type(() => String)
  categoryId: string;

  @IsMongoId()
  @Type(() => String)
  brandId: string;

  @IsMongoId()
  @Type(() => String)
  supplierId: string;

  @IsObject()
  @IsOptional()
  specifications?: Record<string, any>;

  @IsNumber()
  @Min(0)
  costPrice: number;

  @IsNumber()
  @Min(0)
  salePrice: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  warrantyMonths?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stockQuantity?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minStock?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxStock?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];
}