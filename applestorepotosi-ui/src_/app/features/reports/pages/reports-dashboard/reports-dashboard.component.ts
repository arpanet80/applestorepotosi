// src/app/features/reports/pages/reports-dashboard/reports-dashboard.component.ts
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, forkJoin, finalize } from 'rxjs';
import { ReportsService } from '../../services/reports.service';
import {
  DailyIncomeReport,
  MonthlyIncomeReport,
  TopProduct,
  StockAlert,
  CashSessionSummary,
  DashboardStats
} from '../../models/reports.model';
import { ToastrAlertService } from '../../../../shared/services/toastr-alert.service';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reports-dashboard.component.html',
  styleUrls: ['./reports-dashboard.component.css']
})
export class ReportsDashboardComponent implements OnInit, OnDestroy {
  private reportsService = inject(ReportsService);
  private toastr = inject(ToastrAlertService);
  private sweetAlert = inject(SweetAlertService);

  private destroy$ = new Subject<void>();

  loadingDaily = false;
  loadingMonthly = false;
  loadingStock = false;
  loadingTopProducts = false;
  loadingCash = false;
  loadingStats = false;

  dailyReport: DailyIncomeReport | null = null;
  monthlyReport: MonthlyIncomeReport | null = null;
  outOfStockProducts: StockAlert[] = [];
  lowStockProducts: StockAlert[] = [];
  topProducts: TopProduct[] = [];
  cashSession: CashSessionSummary | null = null;
  dashboardStats: DashboardStats | null = null;

  selectedDate: string = new Date().toISOString().split('T')[0];
  selectedMonth: string = new Date().toISOString().slice(0, 7);
  stockFilter: 'all' | 'out' | 'low' = 'all';
  topProductsPeriod: string = '30';

  activeTab: 'income' | 'stock' | 'products' | 'cash' = 'income';

  ngOnInit(): void {
    this.loadAllReports();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAllReports(): void {
    this.loadDailyIncome();
    this.loadMonthlyIncome();
    this.loadStockAlerts();
    this.loadTopProducts();
    this.loadCashSession();
    this.loadDashboardStats();
  }

  loadDailyIncome(): void {
    this.loadingDaily = true;
    const date = new Date(this.selectedDate + 'T00:00:00');

    this.reportsService.getDailyIncome(date)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingDaily = false)
      )
      .subscribe({
        next: (report) => { this.dailyReport = report; },
        error: (err) => {
          this.toastr.error('Error al cargar ingresos del día');
          console.error(err);
        }
      });
  }

  loadMonthlyIncome(): void {
    this.loadingMonthly = true;
    const [year, month] = this.selectedMonth.split('-').map(Number);

    this.reportsService.getMonthlyIncome(year, month)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingMonthly = false)
      )
      .subscribe({
        next: (report) => { this.monthlyReport = report; },
        error: (err) => {
          this.toastr.error('Error al cargar ingresos del mes');
          console.error(err);
        }
      });
  }

  loadStockAlerts(): void {
    this.loadingStock = true;

    const loadOut = this.stockFilter === 'all' || this.stockFilter === 'out';
    const loadLow = this.stockFilter === 'all' || this.stockFilter === 'low';

    const requests: { outOfStock?: any; lowStock?: any } = {};

    if (loadOut) requests.outOfStock = this.reportsService.getOutOfStockProducts();
    if (loadLow) requests.lowStock = this.reportsService.getLowStockProducts();

    if (Object.keys(requests).length === 0) {
      this.loadingStock = false;
      return;
    }

    forkJoin(requests)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingStock = false)
      )
      .subscribe({
        next: (results: any) => {
          if (results.outOfStock) this.outOfStockProducts = results.outOfStock;
          else if (!loadOut) this.outOfStockProducts = [];
          if (results.lowStock) this.lowStockProducts = results.lowStock;
          else if (!loadLow) this.lowStockProducts = [];
        },
        error: (err) => {
          this.toastr.error('Error al cargar alertas de stock');
          console.error(err);
        }
      });
  }

  loadTopProducts(): void {
    this.loadingTopProducts = true;
    const periodDays = parseInt(this.topProductsPeriod, 10);
    const endDate = new Date();
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    this.reportsService.getTopProducts(startDate, endDate, 10)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingTopProducts = false)
      )
      .subscribe({
        next: (products) => { this.topProducts = products; },
        error: (err) => {
          this.toastr.error('Error al cargar productos más vendidos');
          console.error(err);
        }
      });
  }

  loadCashSession(): void {
    this.loadingCash = true;
    this.reportsService.getCurrentCashSession()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingCash = false)
      )
      .subscribe({
        next: (session) => { this.cashSession = session; },
        error: (err) => {
          this.toastr.error('Error al cargar sesión de caja');
          console.error(err);
        }
      });
  }

  loadDashboardStats(): void {
    this.loadingStats = true;
    this.reportsService.getDashboardStats()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingStats = false)
      )
      .subscribe({
        next: (stats) => { this.dashboardStats = stats; },
        error: (err) => {
          this.toastr.error('Error al cargar estadísticas del dashboard');
          console.error(err);
        }
      });
  }

  getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      'cash': 'Efectivo',
      'card': 'Tarjeta',
      'transfer': 'Transferencia',
      'digital_wallet': 'Billetera Digital',
      'unknown': 'Desconocido'
    };
    return labels[method] || method;
  }

  getStockStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'out-of-stock': 'Sin Stock',
      'low-stock': 'Stock Bajo',
      'in-stock': 'En Stock',
      'over-stock': 'Sobre Stock'
    };
    return labels[status] || status;
  }

  getStockStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'out-of-stock': 'badge-light-danger',
      'low-stock': 'badge-light-warning',
      'in-stock': 'badge-light-success',
      'over-stock': 'badge-light-info'
    };
    return classes[status] || 'badge-light-secondary';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(value || 0);
  }

  formatPercent(value: number): string {
    return new Intl.NumberFormat('es-BO', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format((value || 0) / 100);
  }

  onDateChange(): void { this.loadDailyIncome(); }
  onMonthChange(): void { this.loadMonthlyIncome(); }
  onStockFilterChange(): void { this.loadStockAlerts(); }
  onTopProductsPeriodChange(): void { this.loadTopProducts(); }

  refreshAll(): void {
    this.loadAllReports();
    this.toastr.success('Reportes actualizados');
  }

  printReport(): void { window.print(); }

  exportToCSV(): void {
    this.sweetAlert.info('Exportación a CSV en desarrollo', 'Próximamente');
  }

  get maxTopProductQuantity(): number {
    return this.topProducts[0]?.totalQuantity ?? 1;
  }
}