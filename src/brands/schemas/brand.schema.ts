// src/brands/schemas/brand.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BrandDocument = Brand & Document;

@Schema({ 
  collection: 'brands',
  timestamps: true,
})
export class Brand {
  @Prop({ required: true }) 
  name: string;

  @Prop()
  description: string;

  @Prop()
  logoUrl: string;

  @Prop()
  website: string;

  @Prop({ index: true }) 
  country: string;

  @Prop()
  supportUrl: string;

  @Prop()
  warrantyInfo: string;

  @Prop({ index: true, default: true }) 
  isActive: boolean;

  // Campos automáticos de timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const BrandSchema = SchemaFactory.createForClass(Brand);