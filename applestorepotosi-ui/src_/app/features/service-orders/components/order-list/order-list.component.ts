// service-orders/components/order-list/order-list.component.ts
// ============================================================
// LISTADO DE ÓRDENES - Compatible con flujo simplificado
// ============================================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ServiceOrdersService } from '../../services/service-orders.service';
import {
  ServiceOrder,
  ServiceOrderStatus,
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
} from '../../models/service-order.model';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: 'order-list.component.html',
})
export class OrderListComponent implements OnInit, OnDestroy {
  orders: ServiceOrder[] = [];
  search = '';
  page = 1;
  limit = 20;
  total = 0;
  totalPages = 0;

  /* filtros adicionales */
  statusFilter: ServiceOrderStatus | '' = '';
  startDate = '';
  endDate = '';

  /* Opciones de filtro disponibles */
  statusOptions: { value: ServiceOrderStatus; label: string }[] = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'en_proceso', label: 'En Proceso' },
    { value: 'completada', label: 'Completada' },
    { value: 'cancelada', label: 'Cancelada' },
  ];

  private destroy$ = new Subject<void>();

  constructor(private svc: ServiceOrdersService) {}

  ngOnInit() {
    this.load();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load() {
    const params: any = {
      search: this.search,
      page: this.page,
      limit: this.limit,
    };
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.startDate) params.startDate = this.startDate;
    if (this.endDate) params.endDate = this.endDate;

    this.svc
      .getAll(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.orders = res.orders;
          this.total = res.total;
          this.totalPages = res.totalPages;
        },
        error: (err) => {
          console.error('Error cargando órdenes:', err);
          alert('Error al cargar órdenes de servicio');
        },
      });
  }

  /* ---------- paginación ---------- */
  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.load();
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.load();
    }
  }

  /* ---------- helpers ---------- */

  /**
   * Devuelve la clase CSS del badge según el estado.
   */
  mapColor(status: ServiceOrderStatus): string {
    return STATUS_BADGE_CLASSES[status] || 'secondary';
  }

  /**
   * Devuelve la etiqueta legible del estado.
   */
  getStatusLabel(status: ServiceOrderStatus): string {
    return STATUS_LABELS[status] || status;
  }

  /**
   * Obtiene el nombre del cliente manejando tanto string como objeto populado.
   */
  getCustomerName(order: ServiceOrder): string {
    const cid = order.customerId;
    if (typeof cid === 'string') return '—';
    return cid?.fullName || '—';
  }

  /**
   * Obtiene el nombre del técnico manejando tanto string como objeto populado.
   */
  getTechnicianName(order: ServiceOrder): string {
    const tid = order.technicianId;
    if (typeof tid === 'string') return '—';
    return tid?.displayName || '—';
  }
}