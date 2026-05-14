// src/products/dto/stock-update.dto.ts
import { IsNumber, Min, IsString, IsOptional, IsMongoId } from 'class-validator';

export class StockUpdateDto {
  // CORRECCIÓN: Min(0) permite stock = 0 (producto agotado), que es un estado válido
  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  @IsOptional()
  reason?: string;

  // Para relacionar con ventas, compras, etc.
  @IsMongoId()
  @IsOptional()
  referenceId?: string;
}