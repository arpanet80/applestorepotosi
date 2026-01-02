// src/categories/schemas/category.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ 
  collection: 'categories',
  timestamps: true,
})

export class Category {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category', default: null })
  parentId: MongooseSchema.Types.ObjectId;

  @Prop()
  imageUrl: string;

  @Prop({ default: true })
  isActive: boolean;

  // Campos automáticos de timestamps
  createdAt: Date;
  updatedAt: Date;

  @Prop({ type: String })  
  updatedBy?: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);