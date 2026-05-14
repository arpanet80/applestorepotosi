// src/app/purchase-orders/models/purchase-order.model.ts

export type PurchaseOrderStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled';

export interface PurchaseOrderItem {
  productId: {
    _id: string;
    name: string;
    sku?: string;
    barcode?: string;
    costPrice?: number;
    salePrice?: number;
  };
  quantity: number;
  unitCost: number;
  subtotal: number;
}

/** Entrada del historial de transiciones de estado (viene del backend). */
export interface StatusHistoryEntry {
  status: PurchaseOrderStatus;
  changedBy?: { _id: string; email?: string };
  changedAt: string;
  reason?: string;
}

export interface PurchaseOrder {
  _id: string;
  orderNumber: string;
  supplierId: {
    _id: string;
    name: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  orderDate: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  totalAmount: number;
  notes?: string;
  statusHistory?: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
  /** Usuario que creó la orden (puede venir populado o como string). */
  createdBy?: { _id: string; email?: string } | string;
  updatedBy?: string;
  /** Soft-delete: true = eliminada. La lista solo devuelve isDeleted:false. */
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