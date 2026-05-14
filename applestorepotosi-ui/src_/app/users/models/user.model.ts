import { UserRole } from "../../auth/models/user.model";

export interface User {
  _id: string;
  uid: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  role: UserRole;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other';
  };
  preferences?: {
    notifications?: boolean;
    newsletter?: boolean;
    smsAlerts?: boolean;
    language?: string;
  };
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  photoURL?: string;
  provider?: string;
}

export interface UserQuery {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface UserResponse {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}