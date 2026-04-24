import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceOrderDto } from './create-service-order.dto';
import { OmitType } from '@nestjs/mapped-types';

export class UpdateServiceOrderDto extends PartialType(
  OmitType(CreateServiceOrderDto, ['customerId', 'device'] as const),
) {}