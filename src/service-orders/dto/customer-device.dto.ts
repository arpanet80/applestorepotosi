import { IsString, IsOptional, IsArray } from 'class-validator';

export class CustomerDeviceDto {
  @IsString()
  type: string;

  @IsString()
  model: string;

  @IsOptional()
  @IsString()
  imei?: string;

  @IsOptional()
  @IsString()
  serial?: string;

  @IsOptional()
  @IsString()
  aestheticCondition?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  accessoriesLeft?: string[];
}