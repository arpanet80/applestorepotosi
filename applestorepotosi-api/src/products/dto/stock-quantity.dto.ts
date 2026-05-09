// src/products/dto/stock-quantity.dto.ts
import { IsNumber, Min } from 'class-validator';

/**
 * DTO para operaciones de stock que reciben únicamente una cantidad.
 * Utilizado en endpoints PUT de increment, decrement, reserve y release.
 */
export class StockQuantityDto {
  @IsNumber()
  @Min(1, { message: 'La cantidad debe ser mayor o igual a 1' })
  quantity: number;
}