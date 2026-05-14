// src/stock-movements/schemas/stock-movement.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StockMovementDocument = StockMovement & Document;

@Schema({
  collection: 'stock_movements',
  timestamps: true,
})
export class StockMovement {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true, enum: ['in', 'out', 'adjustment'] })
  type: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({
    required: true,
    enum: ['sale', 'purchase', 'manual', 'return', 'damaged', 'expired'],
  })
  reason: string;

  @Prop({ type: Types.ObjectId, refPath: 'referenceModel', default: null })
  reference: Types.ObjectId;

  @Prop({ enum: ['Sale', 'PurchaseOrder', 'StockAdjustment'], default: null })
  referenceModel: string;

  @Prop({ required: true, min: 0 })
  previousStock: number;

  @Prop({ required: true })
  newStock: number;

  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ default: Date.now })
  timestamp: Date;

  @Prop({ default: '' })
  notes: string;

  @Prop({ default: 0, min: 0 })
  reservedAtMovement: number;

  @Prop({ min: 0 })
  unitCostAtMovement: number;

  createdAt: Date;
  updatedAt: Date;
}

export const StockMovementSchema = SchemaFactory.createForClass(StockMovement);

StockMovementSchema.index({ productId: 1, timestamp: -1 });
StockMovementSchema.index({ type: 1 });
StockMovementSchema.index({ reason: 1 });
StockMovementSchema.index({ productId: 1, type: 1, timestamp: -1 }, { unique: true });