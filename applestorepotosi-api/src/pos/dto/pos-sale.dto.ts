// src/pos/dto/pos-sale.dto.ts
import { IsMongoId, IsEnum, IsOptional, IsString, ValidateNested, IsArray, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { PosSaleItemDto } from './pos-sale-item.dto';
import { PaymentMethod } from '../../sales/schemas/sale.schema';

export class PosSaleDto {
  @IsMongoId()
  @IsOptional()
  customerId?: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsString()
  @IsOptional()
  paymentReference?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PosSaleItemDto)
  items: PosSaleItemDto[];

  @IsString()
  @IsOptional()
  notes?: string;
}