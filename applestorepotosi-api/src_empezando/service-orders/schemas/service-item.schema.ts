import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class ServiceItem {
  @Prop({ required: true })
  partName: string; // e.g. "Pantalla iPhone 13 Original"

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  unitCost: number;

  @Prop({ required: true })
  unitPrice: number;

  @Prop({ default: '' })
  notes: string;
}

export const ServiceItemSchema = SchemaFactory.createForClass(ServiceItem);