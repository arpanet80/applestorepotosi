// src/purchase-orders/schemas/purchase-order.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PurchaseOrderDocument = PurchaseOrder & Document;

@Schema({ _id: false })
export class PurchaseOrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  unitCost: number;

  @Prop({ default: 0 })
  subtotal: number;
}

@Schema({
  collection: 'purchase_orders',
  timestamps: true,
})
export class PurchaseOrder {
  @Prop({ type: Types.ObjectId, ref: 'Supplier', required: true })
  supplierId: Types.ObjectId;

  @Prop({ required: true, default: Date.now })
  orderDate: Date;

  @Prop({
    required: true,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Prop({ type: [PurchaseOrderItem], required: true, validate: {
    validator: (items: PurchaseOrderItem[]) => items.length > 0,
    message: 'La orden de compra debe tener al menos un item',
  }})
  items: PurchaseOrderItem[];

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({
    type: String,
    unique: true,
    required: true,
    index: true,
  })
  orderNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ default: '' })
  notes: string;

  createdAt: Date;
  updatedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const PurchaseOrderSchema = SchemaFactory.createForClass(PurchaseOrder);

// Calcula subtotales y total antes de guardar
PurchaseOrderSchema.pre('save', function (next) {
  this.items.forEach(item => {
    item.subtotal = item.quantity * item.unitCost;
  });
  this.totalAmount = this.items.reduce((sum, item) => sum + item.subtotal, 0);
  next();
}); 