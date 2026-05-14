// src/purchase-orders/dto/purchase-order-query.dto.ts
import { IsOptional, IsString, IsNumber, Min, IsEnum, IsDate } from 'class-validator';
import { Transform } from 'class-transformer';

export class PurchaseOrderQueryDto {
  @IsOptional()
  @IsEnum(['pending', 'approved', 'rejected', 'completed', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsString()
  search?: string;

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