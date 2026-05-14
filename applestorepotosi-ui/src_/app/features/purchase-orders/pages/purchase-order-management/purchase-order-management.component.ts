// src/app/purchase-orders/pages/purchase-order-management/purchase-order-management.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { PurchaseOrder, PurchaseOrderQuery } from '../../models/purchase-order.model';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';
import { ToastrAlertService } from '../../../../shared/services/toastr-alert.service';

@Component({
  selector: 'app-purchase-order-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './purchase-order-management.component.html',
  styleUrls: ['./purchase-order-management.component.css'],
})
export class PurchaseOrderManagementComponent implements OnInit {
  private purchaseOrderService = inject(PurchaseOrderService);
  private router               = inject(Router);
  private alertService         = inject(SweetAlertService);
  private toastr               = inject(ToastrAlertService);

  orders:  PurchaseOrder[] = [];
  loading  = true;
  error    = '';

  // Paginación
  page      = 1;
  pageSize  = 10;
  total     = 0;
  totalPages = 0;

  // Filtros
  searchTerm   = '';
  statusFilter: string | null = null;

  // ── Lifecycle ────────────────────────────────────────────

  ngOnInit() {
    this.loadPage();
  }

  // ── Datos ─────────────────────────────────────────────────

  loadPage() {
    this.loading = true;
    this.error   = '';

    const query: PurchaseOrderQuery = {
      search: this.searchTerm   || undefined,
      status: this.statusFilter || undefined,
      page:   this.page,
      limit:  this.pageSize,
    };

    this.purchaseOrderService.findAll(query).subscribe({
      next: (res) => {
        this.orders     = res.purchaseOrders;
        this.total      = res.total;
        this.totalPages = res.totalPages;
        this.loading    = false;
      },
      error: (err) => {
        this.error   = err?.error?.message ?? 'Error al cargar órdenes';
        this.loading = false;
      },
    });
  }

  // ── Navegación ────────────────────────────────────────────

  onView(order: PurchaseOrder) {
    this.router.navigate(['/dashboard', 'purchase-orders', 'detail', order._id]);
  }

  onEdit(order: PurchaseOrder) {
    this.router.navigate(['/dashboard', 'purchase-orders', 'edit', order._id]);
  }

  onDelete(order: PurchaseOrder) {
    this.alertService
      .confirm(
        `¿Eliminar la orden <b>${order.orderNumber}</b>?`,
        'Confirmar eliminación',
        'Sí, eliminar',
        'Cancelar',
        true,
      )
      .then((res) => {
        if (!res.isConfirmed) return;
        this.purchaseOrderService.delete(order._id).subscribe({
          next: () => {
            this.toastr.success(`Orden ${order.orderNumber} eliminada`);
            // Si era el único elemento en la página, retroceder una página
            if (this.orders.length === 1 && this.page > 1) this.page--;
            this.loadPage();
          },
          error: (err) => {
            this.toastr.error(err?.error?.message ?? 'No se pudo eliminar la orden');
          },
        });
      });
  }

  // ── Paginación y filtros ──────────────────────────────────

  onPageChange(newPage: number) {
    if (newPage < 1 || newPage > this.totalPages) return;
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

  /** Último registro visible en la página actual (no supera el total). */
  get currentPageEnd(): number {
    return Math.min(this.page * this.pageSize, this.total);
  }

  /** Array de páginas visibles (máximo 5 páginas alrededor de la actual). */
  get visiblePages(): number[] {
    const delta = 2;
    const start = Math.max(1, this.page - delta);
    const end   = Math.min(this.totalPages, this.page + delta);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  // ── Helpers ───────────────────────────────────────────────

  supplierName(order: PurchaseOrder): string {
    return order.supplierId?.name ?? '—';
  }

  badgeClass(status: string): string {
    const map: Record<string, string> = {
      pending:   'badge-warning',
      approved:  'badge-primary',
      completed: 'badge-success',
      rejected:  'badge-danger',
      cancelled: 'badge-danger',
    };
    return map[status] ?? 'badge-secondary';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      pending:   'Pendiente',
      approved:  'Aprobada',
      completed: 'Completada',
      rejected:  'Rechazada',
      cancelled: 'Cancelada',
    };
    return map[status] ?? status;
  }
}