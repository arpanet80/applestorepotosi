// src/suppliers/schemas/supplier.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SupplierDocument = Supplier & Document;

@Schema({
  collection: 'suppliers',
  timestamps: true,
})
export class Supplier {
  @Prop({ required: true })
  name: string;

  @Prop()
  representative: string;

  @Prop({ required: true })
  contactEmail: string;

  @Prop({ required: true })
  contactPhone: string;

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

  @Prop()
  taxId: string;

  @Prop()
  rfc: string;

  @Prop()
  paymentTerms: string;

  @Prop({
    type: {
      accountNumber: String,
      bankName: String,
    },
  })
  bankInfo: {
    accountNumber?: string;
    bankName?: string;
  };

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);