// src/app/categories/models/categories.model.ts
export interface Category {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  parentId?: string | null;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryStats {
  total: number;
  active: number;
  withParent: number;
  withoutParent: number;
}

export interface CategoryQuery {
  isActive?: boolean;
  parentId?: string | null;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CategoryResponse {
  categories: Category[];
  total: number;
  page: number;
  totalPages: number;
}