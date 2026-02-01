// src/audit-logs/dto/update-audit-log.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateAuditLogDto } from './create-audit-log.dto';
import { IsString, IsOptional, IsEnum,IsMongoId,IsBoolean,IsObject,IsIP,IsDate} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAuditLogDto extends PartialType(CreateAuditLogDto) {
  @IsMongoId()
  @IsOptional()
  userId?: string;

  @IsEnum(['users', 'products', 'customers', 'sales', 'purchase_orders', 'stock_movements', 'categories', 'brands', 'suppliers', 'settings'], {
    message: 'Colección inválida'
  })
  @IsOptional()
  collectionName?: string;

  @IsMongoId()
  @IsOptional()
  documentId?: string;

  @IsEnum(['create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'import', 'backup', 'restore'], {
    message: 'Acción inválida'
  })
  @IsOptional()
  action?: string;

  @IsObject()
  @IsOptional()
  before?: any;

  @IsObject()
  @IsOptional()
  after?: any;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsIP()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  timestamp?: Date;

  @IsBoolean()
  @IsOptional()
  isSensitive?: boolean;

  @IsEnum(['low', 'medium', 'high'])
  @IsOptional()
  severity?: string;
}