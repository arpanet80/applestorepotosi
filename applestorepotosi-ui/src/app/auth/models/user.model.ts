// user.model.ts - ACTUALIZADO CON NUEVO ESQUEMA
export enum UserRole {
  ADMIN = 'admin',
  TECHNICIAN = 'technician',
  SALES = 'sales',
  CUSTOMER = 'customer'
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  dateOfBirth?: Date;
  gender?: string;
}

export interface RoleInfo {
  name: UserRole;
  permissions: string[];
}

export interface UserPreferences {
  notifications: boolean;
  newsletter: boolean;
  smsAlerts: boolean;
  language: string;
}

export interface User {
  // Campos básicos
  uid: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  role: UserRole;
  
  // Nuevos campos del esquema actualizado
  profile?: UserProfile;
  roleInfo?: RoleInfo;
  preferences?: UserPreferences;
  specialization?: string[];
  
  // Campos de estado
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: Date;
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  
  // Campos de Firebase (para UI)
  photoURL?: string;
  provider?: string;
  
  // Permisos calculados (para compatibilidad)
  permissions?: string[];
}

export interface UserResponse {
  uid: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  role: UserRole;
  profile?: UserProfile;
  roleInfo?: RoleInfo;
  preferences?: UserPreferences;
  specialization?: string[];
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  permissions: string[];
  photoURL?: string;
  provider?: string;
}