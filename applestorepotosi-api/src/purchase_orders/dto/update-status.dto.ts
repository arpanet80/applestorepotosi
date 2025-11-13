// src/purchase-orders/dto/update-status.dto.ts
import { IsEnum, IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateStatusDto {
  @IsEnum(['pending', 'approved', 'rejected', 'completed', 'cancelled'], {
    message: 'El estado debe ser: pending, approved, rejected, completed o cancelled',
  })
  @IsNotEmpty({ message: 'El estado es requerido' })
  status: string;

  @IsString()
  @IsOptional()
  reason?: string;
}