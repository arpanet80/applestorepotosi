// src/service-orders/dto/add-service-item.dto.ts
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
// ✅ FIX #13: usar ServiceItemDto (DTO con decoradores de class-validator)
// NO ServiceItem (schema de Mongoose — class-validator no puede validarlo)
import { ServiceItemDto } from './create-service-order.dto';

export class AddServiceItemDto {
  @ValidateNested()
  @Type(() => ServiceItemDto)
  item: ServiceItemDto;
}