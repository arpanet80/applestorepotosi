// src/category-characteristics/dto/update-category-characteristic.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryCharacteristicDto } from './create-category-characteristic.dto';

export class UpdateCategoryCharacteristicDto extends PartialType(CreateCategoryCharacteristicDto) {}