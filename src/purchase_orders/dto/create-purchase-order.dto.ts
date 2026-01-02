// src/purchase-orders/dto/create-purchase-order.dto.ts
import { IsString, IsOptional, IsArray, IsNumber, Min, IsMongoId, IsDate, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseOrderItemDto {
  @IsMongoId()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitCost: number;
}

export class CreatePurchaseOrderDto {
  @IsMongoId()
  supplierId: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  orderDate?: Date;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items: PurchaseOrderItemDto[];

  // @IsMongoId()
  // userId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}