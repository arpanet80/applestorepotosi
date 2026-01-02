import { ValidateNested, IsString, IsNotEmpty, IsOptional, IsArray, IsNumber, Min, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { CustomerDeviceDto } from './customer-device.dto';

/* ---------- sub-DTO para cada repuesto ---------- */
export class ServiceItemDto {
  @IsString()  @IsNotEmpty()
  partName: string;

  @IsNumber()  @Min(1)
  quantity: number;

  @IsNumber()  @Min(0)
  unitCost: number;

  @IsNumber()  @Min(0)
  unitPrice: number;

  @IsOptional()  @IsString()
  notes?: string;
}

export class CreateServiceOrderDto {
  @IsString()  @IsNotEmpty()
  customerId: string;

  @ValidateNested()  @Type(() => CustomerDeviceDto)
  device: CustomerDeviceDto;

  @IsString()  @IsNotEmpty()
  symptom: string;

  @IsOptional()  @IsString()
  description?: string;

  @IsOptional()  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @IsOptional()  @IsNumber({ maxDecimalPlaces: 2 })  @Min(0)
  laborCost?: number;

  @IsOptional()  @IsNumber({ maxDecimalPlaces: 2 })  @Min(0)
  warrantyMonths?: number;

  /* ---------- nueva propiedad ---------- */
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ServiceItemDto)
  items!: ServiceItemDto[];
}