// src/customers/schemas/customer.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CustomerDocument = Customer & Document;

@Schema({
  collection: 'customers',
  timestamps: true,
})
export class Customer {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null, unique: true, sparse: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ unique: true, sparse: true })
  taxId: string;

  @Prop({
    type: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
  })
  address: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };

  @Prop({ default: 0, min: 0 })
  loyaltyPoints: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: String })
  updatedBy?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

// Índices únicos
// CustomerSchema.index({ email: 1 }, { unique: true });
// CustomerSchema.index({ taxId: 1 }, { unique: true, sparse: true });
// CustomerSchema.index({ userId: 1 }, { unique: true, sparse: true });