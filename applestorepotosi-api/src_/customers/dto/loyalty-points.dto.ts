// src/customers/dto/loyalty-points.dto.ts
import { IsNumber, Min, IsString, IsOptional } from 'class-validator';

export class LoyaltyPointsDto {
  @IsNumber()
  @Min(0)
  points: number;

  @IsString()
  @IsOptional()
  reason?: string;
}