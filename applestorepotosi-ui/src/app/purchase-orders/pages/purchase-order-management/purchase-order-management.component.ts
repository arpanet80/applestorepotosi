// src/app/purchase-orders/pages/purchase-order-management/purchase-order-management.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { PurchaseOrder, PurchaseOrderQuery } from '../../models/purchase-order.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-purchase-order-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './purchase-order-management.component.html',
  styleUrls: ['./purchase-order-management.component.css'],
})
export class PurchaseOrderManagementComponent implements OnInit {
  private purchaseOrderService = inject(PurchaseOrderService);
  private router = inject(Router);

  orders: PurchaseOrder[] = [];
  loading = true;

  // Paginación
  page = 1;
  pageSize = 10;
  total = 0;

  // Filtros
  searchTerm = '';
  statusFilter: string | null = null;

  ngOnInit() {
    this.loadPage();
  }

  loadPage() {
    this.loading = true;
    const query: PurchaseOrderQuery = {
      search: this.searchTerm || undefined,
      status: this.statusFilter || undefined,
      page: this.page,
      limit: this.pageSize,
    };

    this.purchaseOrderService.findAll(query).subscribe({
      next: (res) => {
        this.orders = res.purchaseOrders;
        this.total = res.total;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  onEdit(order: PurchaseOrder) {
    this.router.navigate(['/dashboard', 'purchase-orders', 'edit', order._id]);
  }

  onDelete(order: PurchaseOrder) {
    if (!confirm(`¿Eliminar orden "${order._id}"?`)) return;
    this.purchaseOrderService.delete(order._id).subscribe(() => this.loadPage());
  }

  onPageChange(newPage: number) {
    this.page = newPage;
    this.loadPage();
  }

  onSearch() {
    this.page = 1;
    this.loadPage();
  }

  onFilterChange() {
    this.page = 1;
    this.loadPage();
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.pageSize);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}