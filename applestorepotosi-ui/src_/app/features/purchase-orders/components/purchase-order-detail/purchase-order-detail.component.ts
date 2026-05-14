// src/app/purchase-orders/components/purchase-order-detail/purchase-order-detail.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { PurchaseOrder, PurchaseOrderStatus } from '../../models/purchase-order.model';
import { AuthService } from '../../../../auth/services/auth.service';
import { UserRole } from '../../../../auth/models/user.model';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';
import { ToastrAlertService } from '../../../../shared/services/toastr-alert.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-purchase-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './purchase-order-detail.component.html',
  styleUrls: ['./purchase-order-detail.component.css'],
})
export class PurchaseOrderDetailComponent implements OnInit {
  private route                = inject(ActivatedRoute);
  private router               = inject(Router);
  private purchaseOrderService = inject(PurchaseOrderService);
  private authService          = inject(AuthService);
  private alertService         = inject(SweetAlertService);
  private toastr               = inject(ToastrAlertService);

  order:   PurchaseOrder | null = null;
  loading  = true;
  error    = '';
  canEdit  = false;
  canAdmin = false;

  // ── Lifecycle ────────────────────────────────────────────

  ngOnInit() {
    this.canEdit  = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
    this.canAdmin = this.authService.hasAnyRole([UserRole.ADMIN]);
    this.loadOrder();
  }

  // ── Carga ─────────────────────────────────────────────────

  loadOrder() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error   = 'ID de orden inválido';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error   = '';

    this.purchaseOrderService.findOne(id).subscribe({
      next: (o) => {
        this.order   = o;
        this.loading = false;
      },
      error: (err) => {
        this.error   = err?.error?.message ?? 'Orden no encontrada';
        this.loading = false;
      },
    });
  }

  // ── Navegación ────────────────────────────────────────────

  onEdit() {
    if (!this.order) return;
    this.router.navigate(['/dashboard', 'purchase-orders', 'edit', this.order._id]);
  }

  goBack() {
    this.router.navigate(['/dashboard', 'purchase-orders']);
  }

  // ── Acciones de estado ────────────────────────────────────

  onApprove() {
    if (!this.order) return;

    Swal.fire({
      title: '¿Aprobar orden?',
      html: `Orden <b>${this.order.orderNumber}</b>`,
      input: 'textarea',
      inputPlaceholder: 'Motivo (opcional)...',
      inputAttributes: { 'aria-label': 'Motivo' },
      showCancelButton: true,
      confirmButtonText: 'Aprobar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#50cd89',
      cancelButtonColor:  '#f1416c',
    }).then((result) => {
      if (!result.isConfirmed) return;
      const reason = result.value || undefined;

      this.purchaseOrderService.approveOrder(this.order!._id, reason).subscribe({
        next: () => {
          this.toastr.success('Orden aprobada correctamente');
          this.loadOrder();
        },
        error: (err) => {
          Swal.fire('Error', err?.error?.message ?? 'No se pudo aprobar la orden', 'error');
        },
      });
    });
  }

  onReject() {
    if (!this.order) return;

    Swal.fire({
      title: '¿Rechazar orden?',
      html: `Orden <b>${this.order.orderNumber}</b>`,
      input: 'textarea',
      inputPlaceholder: 'Motivo del rechazo...',
      showCancelButton: true,
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f1416c',
      cancelButtonColor:  '#7e8299',
    }).then((result) => {
      if (!result.isConfirmed) return;
      const reason = result.value || undefined;

      this.purchaseOrderService.rejectOrder(this.order!._id, reason).subscribe({
        next: () => {
          this.toastr.success('Orden rechazada');
          this.loadOrder();
        },
        error: (err) => {
          Swal.fire('Error', err?.error?.message ?? 'No se pudo rechazar la orden', 'error');
        },
      });
    });
  }

  onComplete() {
    if (!this.order) return;

    this.alertService
      .confirm(
        `¿Completar la orden <b>${this.order.orderNumber}</b>?<br>
         Se incrementará el stock de cada producto recibido.`,
        'Confirmar recepción',
        'Sí, completar',
        'Cancelar',
        true,
      )
      .then((res) => {
        if (!res.isConfirmed) return;
        this.alertService.loading('Procesando...');

        this.purchaseOrderService.completeOrder(this.order!._id).subscribe({
          next: () => {
            this.alertService.close();
            this.toastr.success('Orden completada. Stock actualizado.');
            this.loadOrder();
          },
          error: (err) => {
            this.alertService.close();
            Swal.fire('Error', err?.error?.message ?? 'No se pudo completar la orden', 'error');
          },
        });
      });
  }

  onCancel() {
    if (!this.order) return;

    Swal.fire({
      title: '¿Cancelar orden?',
      html: `Orden <b>${this.order.orderNumber}</b>`,
      input: 'textarea',
      inputPlaceholder: 'Motivo de cancelación...',
      showCancelButton: true,
      confirmButtonText: 'Cancelar orden',
      cancelButtonText:  'Volver',
      confirmButtonColor: '#f1416c',
      cancelButtonColor:  '#7e8299',
    }).then((result) => {
      if (!result.isConfirmed) return;
      const reason = result.value || undefined;

      this.purchaseOrderService.cancelOrder(this.order!._id, reason).subscribe({
        next: () => {
          this.toastr.success('Orden cancelada');
          this.loadOrder();
        },
        error: (err) => {
          Swal.fire('Error', err?.error?.message ?? 'No se pudo cancelar la orden', 'error');
        },
      });
    });
  }

  onDelete() {
    if (!this.order) return;

    this.alertService
      .confirm(
        `¿Eliminar la orden <b>${this.order.orderNumber}</b>?<br>Esta acción no se puede deshacer.`,
        'Confirmar eliminación',
        'Sí, eliminar',
        'Cancelar',
        true,
      )
      .then((res) => {
        if (!res.isConfirmed) return;
        this.alertService.loading('Eliminando...');

        this.purchaseOrderService.delete(this.order!._id).subscribe({
          next: () => {
            this.alertService.close();
            this.toastr.success(`Orden ${this.order!.orderNumber} eliminada`);
            this.router.navigate(['/dashboard', 'purchase-orders']);
          },
          error: (err) => {
            this.alertService.close();
            Swal.fire('Error', err?.error?.message ?? 'No se pudo eliminar la orden', 'error');
          },
        });
      });
  }

  // ── Helpers de vista ──────────────────────────────────────

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

  get supplierName(): string {
    return this.order?.supplierId?.name ?? '—';
  }

  /** Verifica si el status permite la acción dada. */
  can(action: 'approve' | 'reject' | 'complete' | 'cancel' | 'delete'): boolean {
    const s = this.order?.status;
    if (!s) return false;
    switch (action) {
      case 'approve':  return s === 'pending'  && this.canAdmin;
      case 'reject':   return s === 'pending'  && this.canAdmin;
      case 'complete': return s === 'approved' && this.canEdit;
      case 'cancel':   return ['pending', 'approved'].includes(s) && this.canEdit;
      case 'delete':   return !['completed', 'approved'].includes(s) && this.canAdmin;
    }
  }
}