// src/stock-movements/dto/stock-movement-query.dto.ts
import { IsOptional, IsString, IsNumber, Min, IsEnum, IsDate, IsMongoId } from 'class-validator';
import { Transform } from 'class-transformer';

export class StockMovementQueryDto {
  @IsOptional()
  @IsMongoId()
  productId?: string;

  @IsOptional()
  @IsEnum(['in', 'out', 'adjustment'])
  type?: string;

  @IsOptional()
  @IsEnum(['sale', 'purchase', 'manual', 'return', 'damaged', 'expired'])
  reason?: string;

  @IsOptional()
  @IsMongoId()
  reference?: string;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}