// src/app/features/service-orders/components/order-detail/order-detail.component.ts
// ============================================================
// DETALLE DE ORDEN - Compatible con flujo simplificado 4 estados
// ============================================================

import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ServiceOrdersService } from '../../services/service-orders.service';
import {
  ServiceOrder,
  ServiceItem,
  ServiceOrderStatus,
  getAllowedNextStatuses,
  isValidTransition,
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
  isTerminalStatus,
} from '../../models/service-order.model';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './order-detail.component.html',
})
export class OrderDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(ServiceOrdersService);
  private fb = inject(FormBuilder);

  private destroy$ = new Subject<void>();

  /* estado */
  order: ServiceOrder | null = null;
  loading = true;
  errorMsg = '';
  savingStatus = false;
  addingItem = false;

  /* formularios */
  statusForm: FormGroup = this.fb.group({
    status: ['', Validators.required],
    notes: [''],
  });

  itemForm: FormGroup = this.fb.group({
    partName: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    unitCost: [0, [Validators.required, Validators.min(0)]],
    unitPrice: [0, [Validators.required, Validators.min(0)]],
    notes: [''],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/dashboard/service-orders']);
      return;
    }
    this.loadOrder(id);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrder(id: string) {
    this.loading = true;
    this.errorMsg = '';

    this.svc.getOne(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (o) => {
          this.order = o;
          this.loading = false;
          this.statusForm.patchValue({ status: o.status, notes: '' });
        },
        error: (err) => {
          this.loading = false;
          this.errorMsg = err.error?.message || 'Error al cargar la orden';
          console.error('Error cargando orden:', err);
        },
      });
  }

  /* ---------- cambio de estado ---------- */
  updateStatus() {
    if (!this.order || this.statusForm.invalid) return;

    const { status, notes } = this.statusForm.value;
    const currentStatus = this.order.status;

    /* validar transición en frontend antes de enviar */
    if (!isValidTransition(currentStatus, status)) {
      this.errorMsg = `No se puede cambiar de "${this.getStatusLabel(currentStatus)}" a "${this.getStatusLabel(status)}"`;
      return;
    }

    this.savingStatus = true;
    this.errorMsg = '';

    this.svc.changeStatus(this.order._id!, status, notes)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.order = updated;
          this.savingStatus = false;
          this.statusForm.patchValue({ status: updated.status, notes: '' });
        },
        error: (err) => {
          this.savingStatus = false;
          this.errorMsg = err.error?.message || 'Error al cambiar estado';
        },
      });
  }

  /* ---------- items ---------- */
  addItem() {
    if (!this.order || this.itemForm.invalid) return;

    const item: ServiceItem = this.itemForm.value;
    this.addingItem = true;
    this.errorMsg = '';

    this.svc.addItem(this.order._id!, item)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.order = updated;
          this.addingItem = false;
          this.itemForm.reset({
            partName: '',
            quantity: 1,
            unitCost: 0,
            unitPrice: 0,
            notes: '',
          });
        },
        error: (err) => {
          this.addingItem = false;
          this.errorMsg = err.error?.message || 'Error al agregar item';
        },
      });
  }

  removeItem(index: number) {
    if (!this.order) return;
    if (!confirm('¿Eliminar este repuesto?')) return;

    this.svc.removeItem(this.order._id!, index)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.order = updated;
        },
        error: (err) => {
          this.errorMsg = err.error?.message || 'Error al eliminar item';
        },
      });
  }

  /* ---------- helpers ---------- */
  getTotalItems(): number {
    if (!this.order) return 0;
    return this.order.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  }

  getCustomerName(): string {
    if (!this.order) return '—';
    const cid = this.order.customerId;
    if (typeof cid === 'string') return '—';
    return cid?.fullName || '—';
  }

  getTechnicianName(): string {
    if (!this.order) return '—';
    const tid = this.order.technicianId;
    if (typeof tid === 'string') return '—';
    return tid?.displayName || '—';
  }

  getCustomerPhone(): string {
    if (!this.order) return '—';
    const cid = this.order.customerId;
    if (typeof cid === 'string') return '—';
    return cid?.phone || '—';
  }

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
   * Devuelve solo los estados permitidos desde el estado actual.
   * Incluye el estado actual para permitir "no cambiar".
   */
  get allowedStatuses(): ServiceOrderStatus[] {
    if (!this.order) return [];
    const current = this.order.status;
    return [current, ...getAllowedNextStatuses(current)];
  }

  get safeStatus(): ServiceOrderStatus {
    return this.order?.status || 'pendiente';
  }

  /**
   * Verifica si la orden está en estado terminal (no editable).
   */
  get isFinalized(): boolean {
    if (!this.order) return false;
    return isTerminalStatus(this.order.status);
  }
}