// src/settings/dto/update-value.dto.ts
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateValueDto {
  @IsNotEmpty({ message: 'El valor es requerido' })
  value: any;

  @IsString()
  @IsOptional()
  description?: string;
}