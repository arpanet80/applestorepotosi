// src/audit-logs/dto/audit-log-query.dto.ts
import { IsOptional, IsString, IsNumber, Min, IsEnum, IsDate, IsMongoId, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class AuditLogQueryDto {
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsOptional()
  @IsEnum(['users', 'products', 'customers', 'sales', 'purchase_orders', 'stock_movements', 'categories', 'brands', 'suppliers', 'settings'])
  collectionName?: string;

  @IsOptional()
  @IsEnum(['create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'import', 'backup', 'restore'])
  action?: string;

  @IsOptional()
  @IsMongoId()
  documentId?: string;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsBoolean()
  isSensitive?: boolean;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  severity?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 50;
}