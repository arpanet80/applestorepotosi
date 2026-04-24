// src/audit-logs/dto/audit-stats-query.dto.ts
import { IsOptional, IsEnum, IsDate } from 'class-validator';
import { Transform } from 'class-transformer';

export class AuditStatsQueryDto {
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsEnum(['users', 'products', 'customers', 'sales', 'purchase_orders', 'stock_movements', 'categories', 'brands', 'suppliers', 'settings'])
  collectionName?: string;

  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  groupBy?: string = 'day';
}