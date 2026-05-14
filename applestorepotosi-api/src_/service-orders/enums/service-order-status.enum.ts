// src/service-orders/enums/service-order-status.enum.ts
// ============================================================
// FLUJO SIMPLIFICADO DE ESTADOS (Migración desde 7 estados → 4 estados)
// ============================================================
//
// ┌─────────────────────────────────────────────────────────────┐
// │                    FLUJO DE TRABAJO SIMPLIFICADO            │
// ├─────────────────────────────────────────────────────────────┤
// │                                                             │
// │   PENDIENTE ──► EN_PROCESO ──► COMPLETADA                 │
// │       │              │              │                         │
// │       └────────────► CANCELADA ◄──┘                       │
// │                                                             │
// └─────────────────────────────────────────────────────────────┘
//
// PENDIENTE    → Orden recién ingresada, aún no se trabaja.
//                (Equivalente anterior: INGRESADO + DIAGNOSTICADO)
//
// EN_PROCESO   → Técnico ya está trabajando en la reparación.
//                (Equivalente anterior: APROBADO + REPARADO)
//
// COMPLETADA   → Cliente recibió el equipo y pagó. Genera ingreso.
//                (Equivalente anterior: ENTREGADO + FINALIZADO)
//
// CANCELADA    → Orden anulada. No genera ingreso.
//                (Equivalente anterior: CANCELADO)
//
// ============================================================

export enum ServiceOrderStatus {
  PENDIENTE = 'pendiente',
  EN_PROCESO = 'en_proceso',
  COMPLETADA = 'completada',
  CANCELADA = 'cancelada',
}

/**
 * Estados que representan ingresos reales (para reportes).
 * Solo COMPLETADA genera ingreso facturable.
 */
export const BILLED_STATUSES: ServiceOrderStatus[] = [
  ServiceOrderStatus.COMPLETADA,
];

/**
 * Estados finales — no permiten más cambios de estado.
 */
export const TERMINAL_STATUSES: ServiceOrderStatus[] = [
  ServiceOrderStatus.COMPLETADA,
  ServiceOrderStatus.CANCELADA,
];

/**
 * Define las transiciones de estado válidas para el flujo de trabajo
 * de órdenes de servicio simplificado.
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<
  ServiceOrderStatus,
  ServiceOrderStatus[]
> = {
  [ServiceOrderStatus.PENDIENTE]: [
    ServiceOrderStatus.EN_PROCESO,
    ServiceOrderStatus.CANCELADA,
  ],
  [ServiceOrderStatus.EN_PROCESO]: [
    ServiceOrderStatus.COMPLETADA,
    ServiceOrderStatus.CANCELADA,
  ],
  [ServiceOrderStatus.COMPLETADA]: [],
  [ServiceOrderStatus.CANCELADA]: [],
};

/**
 * Verifica si una transición de estado es válida.
 */
export function isValidStatusTransition(
  from: ServiceOrderStatus,
  to: ServiceOrderStatus,
): boolean {
  if (from === to) return true; // mismo estado siempre permitido
  const allowed = ALLOWED_STATUS_TRANSITIONS[from] ?? [];
  return allowed.includes(to);
}

/**
 * Etiquetas legibles para mostrar en UI.
 */
export const STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  [ServiceOrderStatus.PENDIENTE]: 'Pendiente',
  [ServiceOrderStatus.EN_PROCESO]: 'En Proceso',
  [ServiceOrderStatus.COMPLETADA]: 'Completada',
  [ServiceOrderStatus.CANCELADA]: 'Cancelada',
};

/**
 * Clases CSS/Color para badges según estado.
 */
export const STATUS_BADGE_CLASSES: Record<ServiceOrderStatus, string> = {
  [ServiceOrderStatus.PENDIENTE]: 'badge-light-warning',
  [ServiceOrderStatus.EN_PROCESO]: 'badge-light-info',
  [ServiceOrderStatus.COMPLETADA]: 'badge-light-success',
  [ServiceOrderStatus.CANCELADA]: 'badge-light-danger',
};