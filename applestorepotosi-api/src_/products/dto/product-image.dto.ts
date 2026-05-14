// src/products/dto/product-image.dto.ts
import {
  IsUrl,
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  IsMongoId,
  MaxLength,
} from 'class-validator';

export class ProductImageDto {
  @IsUrl()
  url: string;

  // CORRECCIÓN: fileId de ImageKit para gestión de archivos en el CDN
  @IsString()
  @IsOptional()
  fileId?: string;

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

export class CreateProductImageDto extends ProductImageDto {
  @IsMongoId()
  productId: string;
}

export class UpdateProductImageDto extends ProductImageDto {}