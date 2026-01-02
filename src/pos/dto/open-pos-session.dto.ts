// src/pos/dto/open-pos-session.dto.ts
import { IsNumber, Min } from 'class-validator';

export class OpenPosSessionDto {
  @IsNumber()
  @Min(0)
  openingBalance: number;
}