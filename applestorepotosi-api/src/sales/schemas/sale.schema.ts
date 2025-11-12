// src/sales/schemas/sale.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SaleDocument = Sale & Document;

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

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  salesPersonId: MongooseSchema.Types.ObjectId;

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

  // Campos calculados virtuales
  itemsCount?: number;
  profit?: number;

  // Campos automáticos de timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const SaleSchema = SchemaFactory.createForClass(Sale);

// Virtual para contar items
SaleSchema.virtual('itemsCount', {
  ref: 'SaleItem',
  localField: '_id',
  foreignField: 'saleId',
  count: true
});

// Virtual para calcular ganancia (requeriría populate de items)
SaleSchema.virtual('profit').get(function() {
  // Esta implementación requeriría calcular basado en los items
  return 0; // Placeholder
});

// Asegurar que los virtuals se incluyan en JSON
SaleSchema.set('toJSON', { virtuals: true });
SaleSchema.set('toObject', { virtuals: true });