// src/app/brands/models/brand.model.ts
export interface Brand {
  _id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  country?: string;
  supportUrl?: string;
  warrantyInfo?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandStats {
  total: number;
  active: number;
  byCountry: Record<string, number>;
  productCountByBrand?: Record<string, number>;
}

export interface BrandQuery {
  isActive?: boolean;
  country?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface BrandResponse {
  brands: Brand[];
  total: number;
  page: number;
  totalPages: number;
}