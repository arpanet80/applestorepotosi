import { IsArray, ValidateNested, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class SettingUpdate {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsNotEmpty()
  value: any;
}

export class BulkUpdateDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SettingUpdate)
  settings: SettingUpdate[];
}