import { IsOptional, IsString, IsNumber, Min, IsEnum, IsBoolean } from 'class-validator';

export class SettingQueryDto {
  @IsOptional()
  @IsEnum(['general', 'inventory', 'sales', 'system', 'notifications', 'security', 'appearance'])
  category?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  isEditable?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 50;
}