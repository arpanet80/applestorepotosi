import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer',
  DIGITAL_WALLET = 'digital_wallet'
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum SaleStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

@Schema({
  collection: 'sales',
  timestamps: true,
})
export class Sale {
  @Prop({ required: true, unique: true })
  saleNumber: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Customer', required: true })
  customerId: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, required: true })   // << string
  salesPersonId: string;

  @Prop({ required: true })
  saleDate: Date;

  @Prop({
    type: {
      method: {
        type: String,
        enum: Object.values(PaymentMethod),
        required: true
      },
      status: {
        type: String,
        enum: Object.values(PaymentStatus),
        default: PaymentStatus.PENDING
      },
      reference: String
    },
    required: true
  })
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    reference?: string;
  };

  @Prop({
    type: {
      subtotal: { type: Number, required: true, min: 0 },
      taxAmount: { type: Number, required: true, min: 0 },
      discountAmount: { type: Number, required: true, min: 0 },
      totalAmount: { type: Number, required: true, min: 0 }
    },
    required: true
  })
  totals: {
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
  };

  @Prop({
    type: String,
    enum: Object.values(SaleStatus),
    default: SaleStatus.PENDING
  })
  status: SaleStatus;

  @Prop({ default: false })
  isReturn: boolean;

  @Prop()
  notes: string;

  // @Prop({ type: MongooseSchema.Types.ObjectId })
  // cancelledBy?: MongooseSchema.Types.ObjectId;
  @Prop({ type: String }) // ← cambia de ObjectId a String
  cancelledBy?: string;

  @Prop()
  cancelledAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const SaleSchema = SchemaFactory.createForClass(Sale);

/* ----------  índices  ---------- */
// SaleSchema.index({ saleNumber: 1 }, { unique: true });
SaleSchema.index({ saleDate: 1, isReturn: 1 });
SaleSchema.index({ status: 1, isReturn: 1 });
SaleSchema.index({ 'payment.method': 1, isReturn: 1 });
SaleSchema.index({ salesPersonId: 1 });

/* ----------  virtuals  ---------- */
SaleSchema.virtual('items', {
  ref: 'SaleItem',
  localField: '_id',
  foreignField: 'saleId',
});

SaleSchema.virtual('itemsCount', {
  ref: 'SaleItem',
  localField: '_id',
  foreignField: 'saleId',
  count: true
});

SaleSchema.virtual('profit').get(function () {
  return (this as any).__profit || 0;
});

SaleSchema.set('toJSON', { virtuals: true });
SaleSchema.set('toObject', { virtuals: true });

export type SaleDocument = Sale & Document;