// src/audit-logs/dto/create-audit-log.dto.ts
import { IsString, IsOptional,   IsNotEmpty, IsEnum,IsMongoId,IsBoolean,IsObject,IsIP,IsDate} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAuditLogDto {
  @IsMongoId()
  @IsNotEmpty({ message: 'El ID de usuario es requerido' })
  userId: string;

  @IsEnum(['users', 'products', 'customers', 'sales', 'purchase_orders', 'stock_movements', 'categories', 'brands', 'suppliers', 'settings'], {
    message: 'Colección inválida'
  })
  @IsNotEmpty({ message: 'La colección es requerida' })
  collectionName: string;

  @IsMongoId()
  @IsOptional()
  documentId?: string;

  @IsEnum(['create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'import', 'backup', 'restore'], {
    message: 'Acción inválida'
  })
  @IsNotEmpty({ message: 'La acción es requerida' })
  action: string;

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