// service-orders/models/service-order.model.ts
export interface ServiceOrder {
  _id?: string;
  orderNumber: string;
  customerId: string;
  device: CustomerDevice;
  symptom: string;
  description?: string;
  photos?: string[];
  items: ServiceItem[];
  laborCost: number;
  totalCost: number;
  status: ServiceOrderStatus;
  technicianId?: string;
  warrantyMonths: number;
  isWarranty: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerDevice {
  type: string;
  model: string;
  imei?: string;
  serial?: string;
  aestheticCondition?: string;
  accessoriesLeft: string[];
}

export interface ServiceItem {
  partName: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  notes?: string;
}

export type ServiceOrderStatus =
  | 'ingresado'
  | 'diagnosticado'
  | 'aprobado'
  | 'reparado'
  | 'entregado'
  | 'finalizado'
  | 'cancelado';