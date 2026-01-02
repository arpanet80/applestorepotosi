// src/modules/cash-sessions/dto/close-cash-session.dto.ts
import { IsEnum, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

class MediosDto {
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) efectivo: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) tarjeta: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) transfer: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) deposito: number;
}

export class CloseCashSessionDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  actualCash: number;

  @IsEnum(['X', 'Z'])
  closeType: 'X' | 'Z';

  @IsObject()
  medios: MediosDto;

  @IsString() @IsOptional()
  notes?: string;
}