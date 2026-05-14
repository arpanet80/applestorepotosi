import { IsMongoId, IsNumber, Min, IsOptional } from 'class-validator';

export class SaleItemDto {
  @IsMongoId()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;
}

export class CreateSaleItemDto extends SaleItemDto {
  @IsMongoId()
  saleId: string;
}

export class UpdateSaleItemDto extends SaleItemDto {}