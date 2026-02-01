import { SaleItem } from "./sale-item.model"

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer',
  DIGITAL_WALLET = 'digital_wallet'
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum SaleStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export interface CustomerId {
  _id: string
  fullName: string
  email: string
  phone: string
}

export interface SalesPersonId {
  _id: string
  email: string
  displayName: string
}

export interface Sale {
  _id: string;
  saleNumber: string;
  customerId: CustomerId;
  salesPersonId: SalesPersonId;
  saleDate: Date;
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    reference?: string;
  };
  totals: {
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
  };
  status: SaleStatus;
  isReturn: boolean;
  notes?: string;
  cancelledBy?: string;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  items?: Array<{
    productId: { _id: string; name: string; sku?: string };
    quantity: number;
    unitPrice: number;
    unitCost: number;
    discount: number;
    subtotal: number;
  }>;
}

export interface SaleQuery {
  status?: SaleStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  customerId?: string;
  salesPersonId?: string;
  isReturn?: boolean;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SaleResponse {
  sales: Sale[];
  total: number;
  page: number;
  totalPages: number;
}