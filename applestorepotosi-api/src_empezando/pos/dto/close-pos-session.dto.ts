// src/pos/dto/close-pos-session.dto.ts
import { IsNumber, Min, IsEnum, IsOptional, IsString } from 'class-validator';

export class ClosePosSessionDto {
  @IsNumber()
  @Min(0)
  actualCash: number;

  @IsEnum(['X', 'Z'])
  closeType: 'X' | 'Z';

  @IsNumber()
  @Min(0)
  cardTotal: number;

  @IsNumber()
  @Min(0)
  transferTotal: number;

  @IsString()
  @IsOptional()
  notes?: string;
}