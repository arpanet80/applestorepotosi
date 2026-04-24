// src/stock-movements/dto/stock-adjustment.dto.ts
import {IsMongoId,IsNumber,Min,  IsEnum,IsString,  IsOptional,  IsNotEmpty,} from 'class-validator';

export class StockAdjustmentDto {
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  newQuantity: number;

  @IsEnum(['manual', 'damaged', 'expired', 'correction'])
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsMongoId()
  @IsNotEmpty()
  @IsOptional()
  userId: string;
}