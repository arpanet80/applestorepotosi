// src/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum UserRole {
  ADMIN = 'admin',
  TECHNICIAN = 'technician', 
  SALES = 'sales',
  CUSTOMER = 'customer'
}

export type UserDocument = User & Document;

@Schema({ 
  collection: 'users',
  timestamps: true,
})
export class User {
  @Prop({ required: true, unique: true })
  uid: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  displayName: string;

  @Prop()
  phoneNumber: string;

  @Prop({ 
    type: String, 
    enum: UserRole, 
    default: UserRole.CUSTOMER 
  })
  role: UserRole;

  @Prop({
    type: {
      firstName: String,
      lastName: String,
      phone: String,
      avatar: String,
      dateOfBirth: Date,
      gender: { type: String, enum: ['male', 'female', 'other'] }
    }
  })
  profile: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
    dateOfBirth?: Date;
    gender?: string;
  };

  @Prop({
    type: {
      name: { type: String, enum: UserRole, required: true },
      permissions: { type: [String], default: [] }
    },
    default: () => ({ name: UserRole.CUSTOMER, permissions: [] })
  })
  roleInfo: {
    name: UserRole;
    permissions: string[];
  };

  @Prop([String])
  specialization: string[];

  @Prop({
    type: {
      notifications: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: false },
      smsAlerts: { type: Boolean, default: false },
      language: { type: String, default: 'es' }
    },
    default: () => ({})
  })
  preferences: {
    notifications: boolean;
    newsletter: boolean;
    smsAlerts: boolean;
    language: string;
  };

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop()
  lastLogin: Date;

  @Prop()
  photoURL?: string;

  @Prop()
  provider?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);