import { Expose } from 'class-transformer';

export class SettingResponseDto {
  @Expose()
  key: string;

  @Expose()
  value: any;

  @Expose()
  category: string;

  @Expose()
  type: string;

  @Expose()
  description: string;

  @Expose()
  isEditable: boolean;

  @Expose()
  isPublic: boolean;

  @Expose()
  options?: any;

  @Expose()
  version: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}