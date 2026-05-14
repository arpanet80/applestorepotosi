// service-orders/models/service-order.model.ts
// ============================================================
// MODELO SINCRONIZADO CON BACKEND (Flujo simplificado 4 estados)
// ============================================================
//
// FLUJO DE TRABAJO:
//   PENDIENTE → EN_PROCESO → COMPLETADA
//        ↓           ↓
//     CANCELADA ←─┘
//
// Estados:
//   • PENDIENTE    = Orden recibida, aún no se trabaja
//   • EN_PROCESO   = Técnico reparando
//   • COMPLETADA   = Cliente recibió y pagó (genera ingreso)
//   • CANCELADA    = Anulada
//
// ============================================================

/* ---------- sub-interfaces ---------- */
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
  unitCost: number;   // costo real (para margen)
  unitPrice: number;  // precio de venta
  notes?: string;
}

export interface StatusHistoryEntry {
  status: ServiceOrderStatus;
  changedBy: string | { _id: string; displayName: string; email: string };
  changedAt: string;
  notes?: string;
}

/* ---------- tipos ---------- */
export type ServiceOrderStatus =
  | 'pendiente'
  | 'en_proceso'
  | 'completada'
  | 'cancelada';

/* ---------- modelo principal sincronizado con backend ---------- */
export interface ServiceOrder {
  _id?: string;
  orderNumber: string;

  /* customerId: string cuando no está populado, objeto cuando sí */
  customerId: string | { _id: string; fullName: string; phone: string; email: string };

  device: CustomerDevice;
  symptom: string;
  description?: string;
  photos?: string[];
  items: ServiceItem[];
  laborCost: number;
  totalCost: number;
  status: ServiceOrderStatus;

  /* technicianId: string cuando no está populado, objeto cuando sí */
  technicianId: string | { _id: string; displayName: string; email: string };

  /* notas específicas por estado */
  diagnosisNotes?: string;
  repairNotes?: string;
  testNotes?: string;
  deliveryNotes?: string;

  warrantyMonths: number;
  isWarranty: boolean;
  saleId?: string;

  /* historial de cambios de estado */
  statusHistory?: StatusHistoryEntry[];

  createdAt?: string;
  updatedAt?: string;
}

/* ---------- helpers de transiciones de estado ---------- */

/**
 * Define las transiciones válidas para el flujo simplificado.
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<ServiceOrderStatus, ServiceOrderStatus[]> = {
  pendiente: ['en_proceso', 'cancelada'],
  en_proceso: ['completada', 'cancelada'],
  completada: [],
  cancelada: [],
};

/**
 * Estados finales — no permiten más cambios.
 */
export const TERMINAL_STATUSES: ServiceOrderStatus[] = ['completada', 'cancelada'];

/**
 * Estados que generan ingreso (para reportes).
 */
export const BILLED_STATUSES: ServiceOrderStatus[] = ['completada'];

/**
 * Etiquetas legibles para mostrar en UI.
 */
export const STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En Proceso',
  completada: 'Completada',
  cancelada: 'Cancelada',
};

/**
 * Clases CSS/Color para badges según estado.
 */
export const STATUS_BADGE_CLASSES: Record<ServiceOrderStatus, string> = {
  pendiente: 'warning',
  en_proceso: 'info',
  completada: 'success',
  cancelada: 'danger',
};

/**
 * Devuelve los estados a los que se puede transicionar desde el estado actual.
 * Incluye el estado actual para permitir "no cambiar".
 */
export function getAllowedNextStatuses(current: ServiceOrderStatus): ServiceOrderStatus[] {
  return ALLOWED_STATUS_TRANSITIONS[current] ?? [];
}

/**
 * Verifica si una transición es válida.
 */
export function isValidTransition(
  from: ServiceOrderStatus,
  to: ServiceOrderStatus,
): boolean {
  if (from === to) return true;
  return (ALLOWED_STATUS_TRANSITIONS[from] ?? []).includes(to);
}

/**
 * Verifica si un estado es terminal (no editable).
 */
export function isTerminalStatus(status: ServiceOrderStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}