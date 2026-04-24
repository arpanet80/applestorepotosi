import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ServiceOrderStatus } from '../enums/service-order-status.enum';
import { CustomerDevice, CustomerDeviceSchema } from './customer-device.schema';
import { ServiceItem, ServiceItemSchema } from './service-item.schema';

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

  @Prop({ enum: ServiceOrderStatus, required: true })
  status: ServiceOrderStatus;
  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  technicianId?: MongooseSchema.Types.ObjectId;

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

  createdAt: Date;
  updatedAt: Date;
}

export const ServiceOrderSchema = SchemaFactory.createForClass(ServiceOrder);
export type ServiceOrderDocument = ServiceOrder & Document;

// ServiceOrderSchema.index({ orderNumber: 1 }, { unique: true });
ServiceOrderSchema.index({ customerId: 1, status: 1 });
ServiceOrderSchema.index({ technicianId: 1, status: 1 });
ServiceOrderSchema.index({ createdAt: -1 });