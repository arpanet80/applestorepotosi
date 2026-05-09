// src/service-orders/dto/customer-device.dto.ts
import { IsString, IsOptional, IsArray, IsNotEmpty } from 'class-validator';

export class CustomerDeviceDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsOptional()
  @IsString()
  imei?: string;

  @IsOptional()
  @IsString()
  serial?: string;

  @IsOptional()
  @IsString()
  aestheticCondition?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  accessoriesLeft?: string[];
}