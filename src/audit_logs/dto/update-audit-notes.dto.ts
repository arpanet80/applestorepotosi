// src/audit-logs/dto/update-audit-notes.dto.ts
import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';

export class UpdateAuditNotesDto {
  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  isSensitive?: boolean;

  @IsEnum(['low', 'medium', 'high'])
  @IsOptional()
  severity?: string;
}