// src/app/purchase-orders/pages/purchase-order-page/purchase-order-page.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { PurchaseOrderListComponent } from '../../components/purchase-order-list/purchase-order-list.component';
import { PurchaseOrder, PurchaseOrderQuery, PurchaseOrderStats } from '../../models/purchase-order.model';
import { AuthService } from '../../../auth/services/auth.service';
import { UserRole } from '../../../auth/models/user.model';

@Component({
  selector: 'app-purchase-order-page',
  standalone: true,
  imports: [CommonModule, RouterModule, PurchaseOrderListComponent],
  templateUrl: './purchase-order-page.component.html',
  styleUrls: ['./purchase-order-page.component.css'],
})
export class PurchaseOrderPageComponent implements OnInit {
  private purchaseOrderService = inject(PurchaseOrderService);
  private authService = inject(AuthService);
  private router = inject(Router);

  orders: PurchaseOrder[] = [];
  stats: PurchaseOrderStats | null = null;
  loading = true;
  error = '';

  searchTerm = '';
  statusFilter: string | null = null;

  canCreate = false;

  ngOnInit() {
    this.canCreate = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
    this.loadOrders();
    this.loadStats();
  }

  loadOrders() {
    this.loading = true;
    this.error = '';
    this.purchaseOrderService.findAll({
      search: this.searchTerm || undefined,
      status: this.statusFilter || undefined,
    }).subscribe({
      next: (res) => {
        this.orders = res.purchaseOrders;
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar órdenes de compra';
        this.loading = false;
      },
    });
  }

  loadStats() {
    this.purchaseOrderService.getStats().subscribe({
      next: (s) => (this.stats = s),
      error: () => {},
    });
  }

  onSearch(term: string) {
    this.searchTerm = term;
    this.loadOrders();
  }

  onFilterChange(status: string | null) {
    this.statusFilter = status;
    this.loadOrders();
  }

  onSelectOrder(order: PurchaseOrder) {
    this.router.navigate(['/dashboard', 'purchase-orders', 'detail', order._id]);
  }

  onEditOrder(order: PurchaseOrder) {
    this.router.navigate(['/dashboard', 'purchase-orders', 'edit', order._id]);
  }

  onDeleteOrder(order: PurchaseOrder) {
    if (!confirm(`¿Eliminar orden ${order._id}?`)) return;
    this.purchaseOrderService.delete(order._id).subscribe({
      next: () => {
        this.loadOrders();
        this.loadStats();
      },
    });
  }

  onCreateOrder() {
    this.router.navigate(['/dashboard', 'purchase-orders', 'create']);
  }

  getFilterClass(status: string | null): string {
    return this.statusFilter === status ? 'btn-filter active' : 'btn-filter';
  }

  get queryFilters(): PurchaseOrderQuery {
    return {
        search: this.searchTerm || undefined,
        status: this.statusFilter || undefined,
    };
  }
}