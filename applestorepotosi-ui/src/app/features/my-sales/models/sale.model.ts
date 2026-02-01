export interface Sale {
  _id: string;
  saleNumber: string;
  customerId: {
    fullName: string;
    email: string;
    phone: string;
  };
  saleDate: string;
  payment: {
    method: 'cash' | 'card' | 'transfer' | 'digital_wallet';
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    reference?: string;
  };
  totals: {
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
  };
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  isReturn: boolean;
  notes?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  items?: SaleItem[];
}

export interface SaleItem {
  productId: {
    name: string;
    sku: string;
  };
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discount: number;
  subtotal: number;
}