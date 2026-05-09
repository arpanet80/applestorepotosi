// src/app/features/reports/services/reports.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, catchError, shareReplay } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  DailyIncomeReport,
  MonthlyIncomeReport,
  TopProduct,
  StockAlert,
  CashSessionSummary,
  DashboardStats,
  ServiceOrderIncomeReport
} from '../models/reports.model';
import { SaleService } from '../../sales/services/sale.service';
import { ServiceOrdersService } from '../../service-orders/services/service-orders.service';
import { ProductService } from '../../products/services/product.service';
import { PosService } from '../../pos/services/pos.service';
import { SaleStatus } from '../../sales/models/sale.model';
import { Product } from '../../products/models/product.model';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private http = inject(HttpClient);
  private saleService = inject(SaleService);
  private serviceOrdersService = inject(ServiceOrdersService);
  private productService = inject(ProductService);
  private posService = inject(PosService);

  private apiUrl = `${environment.apiUrl}/reports`;

  private toStartOfDayUTC(date: Date): string {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d.toISOString();
  }

  private toEndOfDayUTC(date: Date): string {
    const d = new Date(date);
    d.setUTCHours(23, 59, 59, 999);
    return d.toISOString();
  }

  private getMonthRange(year: number, month: number): { start: string; end: string } {
    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    return { start: start.toISOString(), end: end.toISOString() };
  }

  getDailyIncome(date?: Date): Observable<DailyIncomeReport> {
    const targetDate = date || new Date();
    const startOfDay = this.toStartOfDayUTC(targetDate);
    const endOfDay = this.toEndOfDayUTC(targetDate);

    return forkJoin({
      sales: this.saleService.findAll({
        startDate: new Date(startOfDay),
        endDate: new Date(endOfDay),
        status: SaleStatus.CONFIRMED,
        limit: 1000
      }),
      services: this.serviceOrdersService.incomeReport({
        startDate: startOfDay,
        endDate: endOfDay
      }).pipe(
        catchError(err => {
          console.warn('Error cargando income report de servicios:', err);
          return of({
            orderCount: 0,
            totalLabor: 0,
            totalPartsRevenue: 0,
            totalPartsCost: 0,
            totalInvoiced: 0,
            grossMargin: 0,
            grossMarginPercent: 0
          } as ServiceOrderIncomeReport);
        })
      )
    }).pipe(
      map(({ sales, services }) => {
        const totalSales = sales.sales.reduce((sum, s) => sum + (s.totals?.totalAmount || 0), 0);
        const totalServices = services.totalInvoiced;

        const salesByPaymentMethod: Record<string, number> = {};
        sales.sales.forEach(s => {
          const method = s.payment?.method || 'unknown';
          salesByPaymentMethod[method] = (salesByPaymentMethod[method] || 0) + (s.totals?.totalAmount || 0);
        });

        return {
          date: targetDate.toISOString().split('T')[0],
          totalSales,
          totalServices,
          totalIncome: totalSales + totalServices,
          saleCount: sales.sales.length,
          serviceCount: services.orderCount,
          salesByPaymentMethod,
          serviceMetrics: services
        };
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  getMonthlyIncome(year?: number, month?: number): Observable<MonthlyIncomeReport> {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    const { start, end } = this.getMonthRange(targetYear, targetMonth);

    return forkJoin({
      sales: this.saleService.findAll({
        startDate: new Date(start),
        endDate: new Date(end),
        status: SaleStatus.CONFIRMED,
        limit: 1000
      }),
      services: this.serviceOrdersService.incomeReport({
        startDate: start,
        endDate: end
      }).pipe(
        catchError(err => {
          console.warn('Error cargando income report mensual:', err);
          return of({
            orderCount: 0,
            totalLabor: 0,
            totalPartsRevenue: 0,
            totalPartsCost: 0,
            totalInvoiced: 0,
            grossMargin: 0,
            grossMarginPercent: 0
          } as ServiceOrderIncomeReport);
        })
      )
    }).pipe(
      map(({ sales, services }) => {
        const totalSales = sales.sales.reduce((sum, s) => sum + (s.totals?.totalAmount || 0), 0);
        const totalServices = services.totalInvoiced;

        const dailyMap = new Map<string, {
          sales: number;
          services: number;
          saleCount: number;
          serviceCount: number;
          salesByPaymentMethod: Record<string, number>;
        }>();

        sales.sales.forEach(s => {
          const day = new Date(s.saleDate).toISOString().split('T')[0];
          const current = dailyMap.get(day) || {
            sales: 0, services: 0, saleCount: 0, serviceCount: 0,
            salesByPaymentMethod: {}
          };
          current.sales += (s.totals?.totalAmount || 0);
          current.saleCount++;
          const method = s.payment?.method || 'unknown';
          current.salesByPaymentMethod[method] = (current.salesByPaymentMethod[method] || 0) + (s.totals?.totalAmount || 0);
          dailyMap.set(day, current);
        });

        const dailyBreakdown: DailyIncomeReport[] = Array.from(dailyMap.entries())
          .map(([date, data]) => ({
            date,
            totalSales: data.sales,
            totalServices: 0,
            totalIncome: data.sales,
            saleCount: data.saleCount,
            serviceCount: 0,
            salesByPaymentMethod: data.salesByPaymentMethod
          }))
          .sort((a, b) => a.date.localeCompare(b.date));

        return {
          month: `${targetYear}-${String(targetMonth).padStart(2, '0')}`,
          year: targetYear,
          totalSales,
          totalServices,
          totalIncome: totalSales + totalServices,
          dailyBreakdown,
          serviceMetrics: services
        };
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  getOutOfStockProducts(): Observable<StockAlert[]> {
    return this.productService.findAll({
      stockStatus: 'out-of-stock',
      limit: 100,
      page: 1
    }).pipe(
      map(res => res.products.map(p => this.mapToStockAlert(p))),
      catchError(err => {
        console.warn('Error cargando productos sin stock:', err);
        return of([]);
      })
    );
  }

  getLowStockProducts(): Observable<StockAlert[]> {
    return this.productService.findAll({
      stockStatus: 'low-stock',
      limit: 100,
      page: 1
    }).pipe(
      map(res => res.products.map(p => this.mapToStockAlert(p))),
      catchError(err => {
        console.warn('Error cargando productos con stock bajo:', err);
        return of([]);
      })
    );
  }

  private mapToStockAlert(product: Product): StockAlert {
    return {
      _id: product._id,
      name: product.name,
      sku: product.sku,
      stockQuantity: product.stockQuantity || 0,
      minStock: product.minStock || 0,
      maxStock: product.maxStock || 0,
      availableQuantity: product.availableQuantity || 0,
      stockStatus: (product.stockStatus as any) || 'in-stock',
      categoryName: (product.categoryId as any)?.name,
      brandName: (product.brandId as any)?.name,
      imageUrl: (product as any).imageUrl
    };
  }

  getTopProducts(startDate?: Date, endDate?: Date, limit: number = 10): Observable<TopProduct[]> {
    if (!startDate && !endDate) {
      return this.saleService.getStats().pipe(
        map(stats => {
          const topProducts = stats.topProducts || [];
          return topProducts
            .map((p: any) => ({
              productId: p.product?._id || p._id,
              productName: p.product?.name || 'Producto',
              sku: p.product?.sku || '',
              totalQuantity: p.unitsSold || 0,
              totalRevenue: p.revenue || 0
            }))
            .slice(0, limit);
        }),
        catchError(err => {
          console.warn('Error cargando top products desde stats:', err);
          return of([]);
        })
      );
    }

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    return this.saleService.findAll({
      startDate: start,
      endDate: end,
      status: SaleStatus.CONFIRMED,
      limit: 1000
    }).pipe(
      map(response => {
        const productMap = new Map<string, { name: string; sku: string; quantity: number; revenue: number }>();

        response.sales.forEach(sale => {
          sale.items?.forEach(item => {
            const productId = typeof item.productId === 'string' ? item.productId : item.productId._id;
            const productName = typeof item.productId === 'string' ? 'Producto' : item.productId.name;
            const sku = typeof item.productId === 'string' ? '' : (item.productId.sku || '');

            const current = productMap.get(productId) || { name: productName, sku, quantity: 0, revenue: 0 };
            current.quantity += item.quantity;
            current.revenue += item.subtotal;
            productMap.set(productId, current);
          });
        });

        return Array.from(productMap.entries())
          .map(([productId, data]) => ({
            productId,
            productName: data.name,
            sku: data.sku,
            totalQuantity: data.quantity,
            totalRevenue: data.revenue
          }))
          .sort((a, b) => b.totalQuantity - a.totalQuantity)
          .slice(0, limit);
      }),
      catchError(err => {
        console.warn('Error cargando top products:', err);
        return of([]);
      })
    );
  }

  getCurrentCashSession(): Observable<CashSessionSummary | null> {
    return this.posService.getCurrentSession().pipe(
      map(session => {
        if (!session) return null;
        return {
          sessionId: session.sessionId || session._id,
          openingBalance: session.openingBalance || 0,
          cashSales: session.cashSales || 0,
          cardSales: session.cardSales || 0,
          transferSales: session.transferSales || 0,
          totalSales: (session.cashSales || 0) + (session.cardSales || 0) + (session.transferSales || 0),
          cashRefunds: session.cashRefunds || 0,
          cashInOut: session.cashInOut || 0,
          expectedCash: (session.openingBalance || 0) + (session.cashSales || 0) - (session.cashRefunds || 0) + (session.cashInOut || 0),
          openedAt: new Date(session.openedAt),
          closedAt: session.closedAt ? new Date(session.closedAt) : undefined,
          openedBy: session.openedBy || 'Desconocido'
        };
      }),
      catchError(err => {
        console.warn('Error cargando sesión de caja:', err);
        return of(null);
      })
    );
  }

  getDashboardStats(): Observable<DashboardStats> {
    const today = new Date();
    const startOfDay = this.toStartOfDayUTC(today);

    return forkJoin({
      todayIncome: this.getDailyIncome(today),
      monthIncome: this.getMonthlyIncome(),
      stockAlerts: forkJoin({
        lowStock: this.getLowStockProducts(),
        outOfStock: this.getOutOfStockProducts()
      }),
      pendingSales: this.saleService.findAll({
        status: SaleStatus.PENDING,
        startDate: new Date(startOfDay),
        limit: 1000
      }).pipe(catchError(() => of({ sales: [], total: 0, page: 1, totalPages: 0 })))
    }).pipe(
      map(({ todayIncome, monthIncome, stockAlerts, pendingSales }) => ({
        todayIncome: todayIncome.totalIncome,
        monthIncome: monthIncome.totalIncome,
        pendingSales: pendingSales.sales.length,
        lowStockCount: stockAlerts.lowStock.length,
        outOfStockCount: stockAlerts.outOfStock.length,
        activeCashSessions: 0,
        todayServiceMetrics: todayIncome.serviceMetrics,
        monthServiceMetrics: monthIncome.serviceMetrics
      })),
      catchError(err => {
        console.error('Error cargando dashboard stats:', err);
        return of({
          todayIncome: 0,
          monthIncome: 0,
          pendingSales: 0,
          lowStockCount: 0,
          outOfStockCount: 0,
          activeCashSessions: 0
        });
      })
    );
  }
}