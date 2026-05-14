export enum StockMovementType {
  IN = 'in',
  OUT = 'out',
  ADJUSTMENT = 'adjustment'
}

export enum StockMovementReason {
  SALE = 'sale',
  PURCHASE = 'purchase',
  MANUAL = 'manual',
  RETURN = 'return',
  DAMAGED = 'damaged',
  EXPIRED = 'expired'
}

export enum StockMovementReferenceModel {
  SALE = 'Sale',
  PURCHASE_ORDER = 'PurchaseOrder',
  STOCK_ADJUSTMENT = 'StockAdjustment'
}

export interface StockMovement {
  _id: string;
  productId: ProductId;
  type: StockMovementType;
  quantity: number;
  reason: StockMovementReason;
  reference?: string;
  referenceModel?: StockMovementReferenceModel;
  previousStock: number;
  newStock: number;
  userId: string;
  timestamp: Date;
  notes?: string;
  reservedAtMovement?: number;
  unitCostAtMovement?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovementQuery {
  productId?: string;
  type?: StockMovementType;
  reason?: StockMovementReason;
  reference?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface StockMovementResponse {
  stockMovements: StockMovement[];
  total: number;
  page: number;
  totalPages: number;
}

export interface StockAdjustmentDto {
  productId: string;
  newQuantity: number;
  reason: 'manual' | 'damaged' | 'expired' | 'correction';
  notes?: string;
  userId: string;
}

export interface ProductId {
  _id: string
  sku: string
  barcode: string
  name: string
  costPrice: number
  salePrice: number
  availableQuantity: any
  profitMargin: number
  stockStatus: string
  id: string
}
