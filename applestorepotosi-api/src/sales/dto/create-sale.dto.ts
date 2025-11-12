// src/sales/dto/create-sale.dto.ts
import { IsString, IsOptional, IsBoolean, IsNumber, Min, IsMongoId, IsArray,ValidateNested,IsEnum,IsDate,IsObject} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, PaymentStatus, SaleStatus } from '../schemas/sale.schema';

class SaleItemDto {
  @IsMongoId()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;
}

class PaymentInfoDto {
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @IsString()
  @IsOptional()
  reference?: string;
}

class TotalsDto {
  @IsNumber()
  @Min(0)
  subtotal: number;

  @IsNumber()
  @Min(0)
  taxAmount: number;

  @IsNumber()
  @Min(0)
  discountAmount: number;

  @IsNumber()
  @Min(0)
  totalAmount: number;
}

export class CreateSaleDto {
  @IsString()
  saleNumber: string;

  @IsMongoId()
  customerId: string;

  @IsDate()
  @Type(() => Date)
  saleDate: Date;

  @IsObject()
  @ValidateNested()
  @Type(() => PaymentInfoDto)
  payment: PaymentInfoDto;

  @IsObject()
  @ValidateNested()
  @Type(() => TotalsDto)
  totals: TotalsDto;

  @IsEnum(SaleStatus)
  @IsOptional()
  status?: SaleStatus;

  @IsBoolean()
  @IsOptional()
  isReturn?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];
}