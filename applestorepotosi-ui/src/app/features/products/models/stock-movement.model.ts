export interface StockMovement {
  _id: string;
  productId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  reference?: string;
  referenceModel?: string;
  userId: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
    };
    email: string;
  };
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}