// src/settings/dto/update-setting.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateSettingDto } from './create-setting.dto';
import { 
  IsString, 
  IsOptional, 
  IsEnum,
  IsBoolean
} from 'class-validator';

export class UpdateSettingDto extends PartialType(CreateSettingDto) {
  @IsString()
  @IsOptional()
  key?: string;

  @IsOptional()
  value?: any;

  @IsEnum(['general', 'inventory', 'sales', 'system', 'notifications', 'security', 'appearance'])
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['string', 'number', 'boolean', 'object', 'array'])
  @IsOptional()
  type?: string;

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