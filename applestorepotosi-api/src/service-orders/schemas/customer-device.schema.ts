import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class CustomerDevice {
  @Prop({ required: true })
  type: string; // iPhone, iPad, Mac, etc.

  @Prop({ required: true })
  model: string;

  @Prop()
  imei?: string;

  @Prop()
  serial?: string;

  @Prop({ default: '' })
  aestheticCondition?: string; // scratches, dents, etc.

  @Prop({ type: [String], default: [] })
  accessoriesLeft: string[];
}

export const CustomerDeviceSchema = SchemaFactory.createForClass(CustomerDevice);