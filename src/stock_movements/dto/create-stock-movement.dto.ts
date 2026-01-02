// src/stock-movements/dto/create-stock-movement.dto.ts
import {IsString,IsOptional,IsNumber,Min,IsMongoId,IsEnum,IsDate,IsNotEmpty,} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStockMovementDto {
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @IsEnum(['in', 'out', 'adjustment'])
  @IsNotEmpty()
  type: string;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @IsEnum(['sale', 'purchase', 'manual', 'return', 'damaged', 'expired'])
  @IsNotEmpty()
  reason: string;

  // @IsMongoId()
  @IsOptional()
  reference?: string | null;

  @IsOptional()
  @IsEnum(['Sale', 'PurchaseOrder', 'StockAdjustment'])
  referenceModel?: string  | null;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  previousStock: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  newStock: number;

  @IsString()
  @IsNotEmpty()
  @IsOptional() 
  userId: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  timestamp?: Date;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  reservedAtMovement?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  unitCostAtMovement?: number;
}