import { IsString, IsOptional, IsNotEmpty, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

class ValueDto {
  value: any;
}

export class CreateSettingDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsNotEmpty()
  @Type(() => ValueDto)
  value: any;

  @IsEnum(['general', 'inventory', 'sales', 'system', 'notifications', 'security', 'appearance'])
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['string', 'number', 'boolean', 'object', 'array'])
  @IsNotEmpty()
  type: string;

  @IsOptional()
  defaultValue?: any;

  @IsOptional()
  options?: any;

  @IsBoolean()
  @IsOptional()
  isEditable?: boolean;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}