// src/pos/dto/pos-sale-item.dto.ts
import { IsMongoId, IsNumber, IsOptional, Min } from 'class-validator';

export class PosSaleItemDto {
  @IsMongoId()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  // ✅ FIX #6: @IsOptional() necesario para que class-validator no rechace
  //    requests donde no se envía discount
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number = 0;
}