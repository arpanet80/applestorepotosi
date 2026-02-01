// src/modules/cash-sessions/dto/create-cash-session.dto.ts
import { IsNumber, IsString, Min } from 'class-validator';

export class CreateCashSessionDto {
  @IsString()
  sessionId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  openingBalance: number;
}