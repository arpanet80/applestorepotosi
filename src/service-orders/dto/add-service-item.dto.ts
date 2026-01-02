import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceItem } from '../schemas/service-item.schema';

export class AddServiceItemDto {
  @ValidateNested()
  @Type(() => ServiceItem)
  item: ServiceItem;
}