export interface CashSession {
  _id: string;
  sessionId: string;
  openedBy: string;
  openedAt: string;
  isClosed: boolean;
  openingBalance: number;
  cashSales: number;
  cashRefunds: number;
  cashInOut: number;
  expectedCash: number;
  actualCash?: number;
  medios: { efectivo: number; tarjeta: number; transfer: number; deposito: number };
  sales?: any[];          // ventas de la sesión (opcional)
  discrepancy?: { amount: number; reason?: string };
  closedAt?: string;
  closedBy?: string;
  closeType?: 'X' | 'Z';
  notes?: string;
}