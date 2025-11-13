// src/app/purchase-orders/models/purchase-order.model.ts
export interface PurchaseOrderItem {
  productId: {
    _id: string;
    name: string;
    sku?: string;
    barcode?: string;
  };
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export interface PurchaseOrder {
  _id: string;
  supplierId: string;
  supplierName?: string;
  userId: string;
  userName?: string;
  orderDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  items: PurchaseOrderItem[];
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  isActive: boolean; // ← agrega esta línea
  isDeleted?: boolean;
}

export interface PurchaseOrderQuery {
  status?: string;
  supplierId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PurchaseOrderResponse {
  purchaseOrders: PurchaseOrder[];
  total: number;
  page: number;
  totalPages: number;
}

export interface PurchaseOrderStats {
  total: number;
  byStatus: Record<string, number>;
  totalAmount: number;
  averageOrderValue: number;
  pendingAmount: number;
  completedAmount: number;
}