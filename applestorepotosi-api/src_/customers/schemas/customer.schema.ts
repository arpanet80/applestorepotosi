// src/customers/schemas/customer.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CustomerDocument = Customer & Document;

@Schema({
  collection: 'customers',
  timestamps: true,
})
export class Customer {

  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'User'
  })
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

  @Prop({ type: Boolean, default: false, index: true })
  isPublicGeneral?: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

// ✅ CORRECTO: Índice único sparse (ignora nulls)
CustomerSchema.index({ userId: 1 }, { unique: true, sparse: true });


/*
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CustomerDocument = Customer & Document;

@Schema({
  collection: 'customers',
  timestamps: true,
})
export class Customer {

  @Prop({ 
  type: MongooseSchema.Types.ObjectId, 
    ref: 'User', 
    sparse: true,
    unique: true 
  })
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

  @Prop({ type: Boolean, default: false, index: true })
  isPublicGeneral?: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
*/