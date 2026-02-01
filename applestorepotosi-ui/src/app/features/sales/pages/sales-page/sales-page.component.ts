import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { SaleService } from '../../services/sale.service';
import { SaleListComponent } from '../../components/sale-list/sale-list.component';
import { Sale, SaleQuery } from '../../models/sale.model';
import { AuthService } from '../../../../auth/services/auth.service';
import { UserRole } from '../../../../auth/models/user.model';
import { SaleStatus } from '../../models/sale.model';

@Component({
  selector: 'app-sales-page',
  standalone: true,
  imports: [CommonModule, RouterModule, SaleListComponent, NgIf],
  templateUrl: './sales-page.component.html',
  styleUrls: ['./sales-page.component.css']
})
export class SalesPageComponent implements OnInit, OnDestroy {
  private saleService = inject(SaleService);
  private authService = inject(AuthService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();
  public SaleStatus = SaleStatus;

  sales: Sale[] = [];
  loading = true;
  error = '';

  searchTerm = '';
  activeFilter: 'all' | 'confirmed' | 'pending' | 'cancelled' = 'all';

  canCreate = false;
  canManage = false;

  ngOnInit() {
    this.checkPermissions();
    this.loadSales();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkPermissions() {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.canCreate = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
    this.canManage = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
  }

  loadSales() {
    this.loading = true;
    this.error = '';
    const query: SaleQuery = {
      search: this.searchTerm || undefined,
      status: this.activeFilter === 'all' ? undefined : this.activeFilter as any
    };
    this.saleService.findAll(query).subscribe({
      next: res => {
        this.sales = res.sales;
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar ventas';
        this.loading = false;
      }
    });
  }

  onSearch(term: string) {
    this.searchTerm = term;
    this.loadSales();
  }

  onFilterChange(filter: 'all' | 'confirmed' | 'pending' | 'cancelled') {
    this.activeFilter = filter;
    this.loadSales();
  }

  onSelectSale(sale: Sale) {
    this.router.navigate(['/dashboard', 'sales', 'detail', sale._id]);
  }

  onEditSale(sale: Sale) {
    this.router.navigate(['/dashboard', 'sales', 'edit', sale._id]);
  }

  onDeleteSale(sale: Sale) {
    if (!confirm(`¿Eliminar venta ${sale.saleNumber}?`)) return;
    this.saleService.delete(sale._id).subscribe(() => this.loadSales());
  }

  onCreateSale() {
    this.router.navigate(['/dashboard', 'sales', 'create']);
  }

  onManageSales() {
    this.router.navigate(['/dashboard', 'sales', 'management']);
  }

  onRefresh() {
    this.loadSales();
  }

  getFilterClass(filter: string): string {
    return this.activeFilter === filter ? 'btn-filter active' : 'btn-filter';
  }

  getSaleFilters(): Partial<SaleQuery> {
    return {
        search: this.searchTerm || undefined,
        status: this.activeFilter === 'all' ? undefined : this.activeFilter as SaleStatus
    };
  }
}