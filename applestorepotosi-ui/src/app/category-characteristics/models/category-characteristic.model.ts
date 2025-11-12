export type CharacteristicType = 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date';

export interface CategoryCharacteristic {
  _id: string;
  categoryId: string;
  name: string;
  type: CharacteristicType;
  possibleValues?: string[];
  isRequired: boolean;
  isActive: boolean;
  description?: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryCharacteristicQuery {
  categoryId?: string;
  isActive?: boolean;
  isRequired?: boolean;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CategoryCharacteristicResponse {
  characteristics: CategoryCharacteristic[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CategoryCharacteristicStats {
  total: number;
  active: number;
  required: number;
  byType: Record<CharacteristicType, number>;
}