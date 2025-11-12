// src/settings/dto/create-setting.dto.ts
import { 
  IsString, 
  IsOptional, 
  IsNotEmpty, 
  IsEnum,
  IsBoolean
} from 'class-validator';

export class CreateSettingDto {
  @IsString()
  @IsNotEmpty({ message: 'La clave es requerida' })
  key: string;

  @IsNotEmpty({ message: 'El valor es requerido' })
  value: any;

  @IsEnum(['general', 'inventory', 'sales', 'system', 'notifications', 'security', 'appearance'], {
    message: 'La categoría debe ser: general, inventory, sales, system, notifications, security o appearance'
  })
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['string', 'number', 'boolean', 'object', 'array'], {
    message: 'El tipo debe ser: string, number, boolean, object o array'
  })
  @IsNotEmpty({ message: 'El tipo es requerido' })
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