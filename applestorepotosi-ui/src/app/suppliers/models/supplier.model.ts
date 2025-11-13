// src/app/suppliers/models/supplier.model.ts
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface BankInfo {
  accountNumber?: string;
  bankName?: string;
}

export interface Supplier {
  _id: string;
  name: string;
  representative?: string;
  contactEmail: string;
  contactPhone: string;
  address?: Address;
  taxId?: string;
  rfc?: string;
  paymentTerms?: string;
  bankInfo?: BankInfo;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierQuery {
  isActive?: boolean;
  country?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SupplierResponse {
  suppliers: Supplier[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SupplierStats {
  total: number;
  active: number;
  byCountry: Record<string, number>;
}