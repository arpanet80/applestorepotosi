// service-orders/models/income-report.interface.ts

/* interfaz sincronizada con la respuesta del backend corregido */
export interface IncomeReport {
  orderCount: number;
  totalLabor: number;
  totalPartsRevenue: number;   // ← antes era totalParts (ingreso por partes)
  totalPartsCost: number;      // ← NUEVO: costo real de partes
  totalInvoiced: number;
  grossMargin: number;
  grossMarginPercent: number;  // ← NUEVO
}