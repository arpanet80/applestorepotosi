import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateValueDto {
  @IsNotEmpty()
  value: any;

  @IsString()
  @IsOptional()
  description?: string;
}