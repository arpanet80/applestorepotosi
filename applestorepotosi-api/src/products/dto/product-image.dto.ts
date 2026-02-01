// src/products/dto/product-image.dto.ts
import { IsUrl, IsString, IsOptional, IsBoolean, IsNumber, Min, IsMongoId } from 'class-validator';

export class ProductImageDto {
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

export class CreateProductImageDto extends ProductImageDto {
  @IsMongoId()
  productId: string;
}

export class UpdateProductImageDto extends ProductImageDto {}