// src/app/features/cash-sessions/cash-session.model.ts
export interface CashSession {
  _id?: string;
  sessionId: string;
  openedBy: { _id: string; name: string };
  closedBy?: { _id: string; name: string };
  openedAt: string;
  closedAt?: string;
  isClosed: boolean;
  closeType?: 'X' | 'Z';
  openingBalance: number;
  cashSales: number;
  cashRefunds: number;
  cashInOut: number;
  expectedCash: number;
  actualCash?: number;
  medios: {
    efectivo: number;
    tarjeta: number;
    transfer: number;
    deposito: number;
  };
  sales: any[];
  notes?: string;
  discrepancy?: { amount: number; reason?: string };
}