// src/app/features/reports/models/reports.model.ts

export interface DailyIncomeReport {
  date: string;
  totalSales: number;
  totalServices: number;
  totalIncome: number;
  saleCount: number;
  serviceCount: number;
  salesByPaymentMethod: Record<string, number>;
  serviceMetrics?: ServiceOrderIncomeReport;
}

export interface MonthlyIncomeReport {
  month: string;
  year: number;
  totalSales: number;
  totalServices: number;
  totalIncome: number;
  dailyBreakdown: DailyIncomeReport[];
  // ✅ FIX: Agregado serviceMetrics para compatibilidad con getDashboardStats()
  serviceMetrics?: ServiceOrderIncomeReport;
}

export interface TopProduct {
  productId: string;
  productName: string;
  sku: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface StockAlert {
  _id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  minStock: number;
  maxStock: number;
  availableQuantity: number;
  stockStatus: 'out-of-stock' | 'low-stock' | 'in-stock' | 'over-stock';
  categoryName?: string;
  brandName?: string;
  imageUrl?: string;
}

export interface CashSessionSummary {
  sessionId: string;
  openingBalance: number;
  cashSales: number;
  cardSales: number;
  transferSales: number;
  totalSales: number;
  cashRefunds: number;
  cashInOut: number;
  expectedCash: number;
  openedAt: Date;
  closedAt?: Date;
  openedBy: string;
}

export interface DashboardStats {
  todayIncome: number;
  monthIncome: number;
  pendingSales: number;
  lowStockCount: number;
  outOfStockCount: number;
  activeCashSessions: number;
  todayServiceMetrics?: ServiceOrderIncomeReport;
  monthServiceMetrics?: ServiceOrderIncomeReport;
}

export interface ServiceOrderIncomeReport {
  orderCount: number;
  totalLabor: number;
  totalPartsRevenue: number;
  totalPartsCost: number;
  totalInvoiced: number;
  grossMargin: number;
  grossMarginPercent: number;
}