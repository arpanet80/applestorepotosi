// src/stock-movements/dto/create-stock-movement.dto.ts
import { 
  IsString, 
  IsOptional, 
  IsNumber, 
  Min, 
  IsMongoId, 
  IsEnum,
  IsDate,
  IsNotEmpty
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStockMovementDto {
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @IsEnum(['in', 'out', 'adjustment'], {
    message: 'El tipo debe ser: in, out o adjustment'
  })
  @IsNotEmpty()
  type: string;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @IsEnum(['sale', 'purchase', 'manual', 'return', 'damaged', 'expired'], {
    message: 'La razón debe ser: sale, purchase, manual, return, damaged o expired'
  })
  @IsNotEmpty()
  reason: string;

  @IsMongoId()
  @IsOptional()
  reference?: string;

  @IsEnum(['Sale', 'PurchaseOrder', 'StockAdjustment'])
  @IsOptional()
  referenceModel?: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  previousStock: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  newStock: number;

  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  timestamp?: Date;

  @IsString()
  @IsOptional()
  notes?: string;
}