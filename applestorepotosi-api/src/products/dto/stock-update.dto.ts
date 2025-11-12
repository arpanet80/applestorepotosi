// src/products/dto/stock-update.dto.ts
import { IsNumber, Min, IsString, IsOptional, IsMongoId } from 'class-validator';

export class StockUpdateDto {
  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsMongoId()
  @IsOptional()
  referenceId?: string; // Para relacionar con ventas, compras, etc.
}