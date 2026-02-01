export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface Customer {
  _id: string;
  userId?: string;               // string de ObjectId
  fullName: string;
  email: string;
  phone: string;
  taxId?: string;
  address?: Address;
  loyaltyPoints: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerQuery {
  isActive?: boolean;
  country?: string;
  search?: string;
  hasLoyaltyPoints?: boolean;
  page?: number;
  limit?: number;
}

export interface CustomerResponse {
  customers: Customer[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CustomerStats {
  total: number;
  active: number;
  withLoyaltyPoints: number;
  byCountry: Record<string, number>;
  totalLoyaltyPoints: number;
}