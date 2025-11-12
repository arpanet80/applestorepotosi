// src/category-characteristics/schemas/category-characteristic.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CharacteristicType = 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date';
export type CategoryCharacteristicDocument = CategoryCharacteristic & Document;

@Schema({
  collection: 'category_characteristics',
  timestamps: true,
})
export class CategoryCharacteristic {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category', required: true })
  categoryId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({
    type: String,
    enum: ['text', 'number', 'boolean', 'select', 'multiselect', 'date'],
    required: true,
  })
  type: CharacteristicType;

  @Prop([String])
  possibleValues: string[];

  @Prop({ default: false })
  isRequired: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  description: string;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ type: String })
  updatedBy?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const CategoryCharacteristicSchema = SchemaFactory.createForClass(CategoryCharacteristic);

// Índices
CategoryCharacteristicSchema.index({ categoryId: 1, name: 1 }, { unique: true });
CategoryCharacteristicSchema.index({ isActive: 1, sortOrder: 1 });