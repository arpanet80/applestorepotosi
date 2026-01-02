import { IsOptional, IsMongoId, IsEnum, IsDate, IsObject, ValidateNested, IsString, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, PaymentStatus, SaleStatus } from '../schemas/sale.schema';
import { SaleItemDto } from './sale-item.dto';

class PaymentInfoDto {
  @IsEnum(PaymentMethod)
  @IsOptional()
  method?: PaymentMethod;

  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @IsString()
  @IsOptional()
  reference?: string;
}

export class UpdateSaleDto {
  @IsMongoId()
  @IsOptional()
  customerId?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  saleDate?: Date;

  @IsObject()
  @ValidateNested()
  @IsOptional()
  @Type(() => PaymentInfoDto)
  payment?: PaymentInfoDto;

  @IsEnum(SaleStatus)
  @IsOptional()
  status?: SaleStatus;

  @IsBoolean()
  @IsOptional()
  isReturn?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;

  /* NO permitimos editar items ni saleNumber */
}