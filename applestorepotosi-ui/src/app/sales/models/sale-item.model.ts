export interface SaleItem {
  _id?: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discount?: number;
  subtotal: number;
}

export interface SaleItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discount?: number;
}