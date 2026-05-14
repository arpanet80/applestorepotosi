import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SaleItemDocument = SaleItem & Document;

@Schema({
  collection: 'sale_items',
  timestamps: true,
})
export class SaleItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Sale', required: true })
  saleId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  productId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  unitPrice: number;

  @Prop({ required: true, min: 0 })
  unitCost: number;

  @Prop({ default: 0, min: 0 })
  discount: number;

  @Prop({ required: true, min: 0 })
  subtotal: number;

  createdAt: Date;
  updatedAt: Date;
}

export const SaleItemSchema = SchemaFactory.createForClass(SaleItem);