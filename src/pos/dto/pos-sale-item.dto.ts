// src/pos/dto/pos-sale-item.dto.ts
import { IsMongoId, IsNumber, Min } from 'class-validator';

export class PosSaleItemDto {
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
  discount?: number = 0;
}