// src/settings/dto/bulk-update.dto.ts
import { IsArray, ValidateNested, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class SettingUpdate {
  @IsString()
  @IsNotEmpty({ message: 'La clave es requerida' })
  key: string;

  @IsNotEmpty({ message: 'El valor es requerido' })
  value: any;
}

export class BulkUpdateDto {
  @IsArray({ message: 'Los ajustes deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => SettingUpdate)
  settings: SettingUpdate[];
}