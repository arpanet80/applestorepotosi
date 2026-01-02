// src/sales/dto/sale-query.dto.ts
import { IsOptional, IsString, IsNumber, Min, IsMongoId, IsEnum, IsDate, IsBoolean } from 'class-validator';
import { PaymentMethod, PaymentStatus, SaleStatus } from '../schemas/sale.schema';
import { Type } from 'class-transformer';

export class SaleQueryDto {
  @IsOptional()
  @IsEnum(SaleStatus)
  status?: SaleStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsMongoId()
  customerId?: string;

  @IsOptional()
  @IsString()   
  salesPersonId?: string;

  @IsOptional()
  @IsBoolean()
  isReturn?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}