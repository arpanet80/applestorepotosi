// src/stock-movements/dto/update-stock-movement.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateStockMovementDto } from './create-stock-movement.dto';

export class UpdateStockMovementDto extends PartialType(CreateStockMovementDto) {}