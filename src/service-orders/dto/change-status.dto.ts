import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ServiceOrderStatus } from '../enums/service-order-status.enum';

export class ChangeStatusDto {
  @IsEnum(ServiceOrderStatus)
  status: ServiceOrderStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}