// src/service-orders/schemas/service-order.schema.ts
// ============================================================
// SCHEMA DE ÓRDENES DE SERVICIO
// Compatible con flujo simplificado de 4 estados:
// PENDIENTE → EN_PROCESO → COMPLETADA
//      ↓           ↓
//   CANCELADA ←─┘
// ============================================================
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { ServiceOrderStatus } from '../enums/service-order-status.enum';
import { CustomerDevice, CustomerDeviceSchema } from './customer-device.schema';
import { ServiceItem, ServiceItemSchema } from './service-item.schema';

export interface StatusHistoryEntry {
  status: ServiceOrderStatus;
  changedBy: Types.ObjectId;
  changedAt: Date;
  notes?: string;
}

@Schema({ collection: 'service_orders', timestamps: true })
export class ServiceOrder {
  @Prop({ required: true, unique: true })
  orderNumber: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Customer', required: true })
  customerId: MongooseSchema.Types.ObjectId;

  @Prop({ type: CustomerDeviceSchema, required: true })
  device: CustomerDevice;

  @Prop({ required: true })
  symptom: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: [String], default: [] })
  photos: string[];

  @Prop({ type: [ServiceItemSchema], default: [] })
  items: ServiceItem[];

  @Prop({ default: 0 })
  laborCost: number;

  @Prop({ default: 0 })
  totalCost: number;

  @Prop({
    enum: ServiceOrderStatus,
    required: true,
    default: ServiceOrderStatus.PENDIENTE,
  })
  status: ServiceOrderStatus;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  technicianId: MongooseSchema.Types.ObjectId;

  @Prop({ default: '' })
  diagnosisNotes: string;

  @Prop({ default: '' })
  repairNotes: string;

  @Prop({ default: '' })
  testNotes: string;

  @Prop({ default: '' })
  deliveryNotes: string;

  @Prop({ default: 3 })
  warrantyMonths: number;

  @Prop({ default: false })
  isWarranty: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Sale' })
  saleId?: MongooseSchema.Types.ObjectId;

  /* ---------- historial de cambios de estado ---------- */
  @Prop({
    type: [
      {
        status: { type: String, enum: ServiceOrderStatus, required: true },
        changedBy: {
          type: MongooseSchema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        changedAt: { type: Date, default: Date.now, required: true },
        notes: { type: String, default: '' },
      },
    ],
    default: [],
  })
  statusHistory: StatusHistoryEntry[];

  createdAt: Date;
  updatedAt: Date;
}

export const ServiceOrderSchema = SchemaFactory.createForClass(ServiceOrder);
export type ServiceOrderDocument = ServiceOrder & Document;

/* ---------- índices ---------- */
ServiceOrderSchema.index({ orderNumber: 1 }, { unique: true });
ServiceOrderSchema.index({ customerId: 1, status: 1 });
ServiceOrderSchema.index({ technicianId: 1, status: 1 });
ServiceOrderSchema.index({ createdAt: -1 });
ServiceOrderSchema.index({ status: 1, createdAt: -1 });
ServiceOrderSchema.index({ 'device.model': 'text', symptom: 'text', orderNumber: 'text' });