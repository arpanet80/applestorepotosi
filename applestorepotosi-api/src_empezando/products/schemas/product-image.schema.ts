// src/products/schemas/product-image.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ProductImageDocument = ProductImage & Document;

@Schema({ 
  collection: 'product_images',
  timestamps: true,
})
export class ProductImage {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  productId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  url: string;

  @Prop()
  altText: string;

  @Prop({ default: false })
  isPrimary: boolean;

  @Prop({ default: 0 })
  sortOrder: number;
}

export const ProductImageSchema = SchemaFactory.createForClass(ProductImage);