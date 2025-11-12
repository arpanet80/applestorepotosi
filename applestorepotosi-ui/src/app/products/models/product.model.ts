// src/app/products/models/product.model.ts
export interface Product {
  _id: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId: any;              // Category reference
  brandId: any;                 // Brand reference
  supplierId: any;              // Supplier reference
  createdBy: any;               // User reference
  specifications?: Record<string, any>;
  costPrice: number;
  salePrice: number;
  warrantyMonths: number;
  stockQuantity: number;
  minStock: number;
  maxStock: number;
  reservedQuantity: number;
  location?: string;
  isActive: boolean;
  isFeatured: boolean;
  
  // Virtual fields
  availableQuantity?: number;
  profitMargin?: number;
  stockStatus?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  _id: string;
  productId: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductStats {
  total: number;
  active: number;
  featured: number;
  outOfStock: number;
  lowStock: number;
  totalStockValue: number;
  averageProfitMargin: number;
}

export interface ProductQuery {
  isActive?: boolean;
  isFeatured?: boolean;
  categoryId?: string;
  brandId?: string;
  supplierId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  stockStatus?: string;
  ids?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface ProductResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}
