// src/products/dto/create-product.dto.ts
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  IsMongoId,
  IsObject,
  IsArray,
  ValidateNested,
  IsUrl,
  MaxLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

// CORRECCIÓN: clase interna renombrada para no colisionar con el export
// del mismo nombre en product-image.dto.ts al importarse ambos juntos.
class EmbeddedImageDto {
  @IsUrl()
  url: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
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
  // CORRECCIÓN: el SKU no debe tener espacios ni caracteres especiales;
  // se agrega un patrón básico para forzar formato consistente.
  @IsString()
  @MaxLength(100)
  @Matches(/^[A-Za-z0-9_\-]+$/, {
    message: 'El SKU solo puede contener letras, números, guiones y guiones bajos',
  })
  sku: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  barcode?: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
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
  @MaxLength(255)
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
  @Type(() => EmbeddedImageDto)
  images?: EmbeddedImageDto[];
}