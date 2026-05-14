// src/app/features/users/interfaces/update-profile.interface.ts

export interface UpdateProfile {
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other';
  };
  role?: 'admin' | 'technician' | 'sales' | 'customer';
}