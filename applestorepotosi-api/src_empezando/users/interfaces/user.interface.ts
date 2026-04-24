import { Document } from 'mongoose';
import { UserRole } from '../schemas/user.schema';

export interface IUser extends Document {
  uid: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  photoURL?: string;
  provider?: string;
}

export interface UserResponse {
  id: string;
  uid: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  permissions?: string[];
}