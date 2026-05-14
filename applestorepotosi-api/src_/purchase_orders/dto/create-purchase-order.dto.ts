// src/purchase-orders/dto/create-purchase-order.dto.ts
import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  IsMongoId,
  IsDate,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseOrderItemDto {
  @IsMongoId({ message: 'productId debe ser un ObjectId válido' })
  productId: string;

  @IsNumber({}, { message: 'quantity debe ser un número' })
  @Min(1, { message: 'quantity debe ser al menos 1' })
  quantity: number;

  @IsNumber({}, { message: 'unitCost debe ser un número' })
  @Min(0, { message: 'unitCost no puede ser negativo' })
  unitCost: number;
}

export class CreatePurchaseOrderDto {
  @IsMongoId({ message: 'supplierId debe ser un ObjectId válido' })
  supplierId: string;

  @IsDate({ message: 'orderDate debe ser una fecha válida' })
  @IsOptional()
  @Type(() => Date)
  orderDate?: Date;

  @IsArray({ message: 'items debe ser un arreglo' })
  @ArrayMinSize(1, { message: 'La orden debe contener al menos un item' })
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items: PurchaseOrderItemDto[];

  @IsString()
  @IsOptional()
  notes?: string;
}