// src/sales/dto/update-sale-status.dto.ts
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SaleStatus, PaymentStatus } from '../schemas/sale.schema';

export class UpdateSaleStatusDto {
  @IsEnum(SaleStatus)
  @IsOptional()
  status?: SaleStatus;

  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}