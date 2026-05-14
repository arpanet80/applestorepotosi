// src/app/purchase-orders/pages/purchase-order-page/purchase-order-page.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { PurchaseOrder, PurchaseOrderStats } from '../../models/purchase-order.model';
import { AuthService } from '../../../../auth/services/auth.service';
import { UserRole } from '../../../../auth/models/user.model';
import { TablaOpciones, TableColumnSchema } from '../../../../shared/components/tabla-generica/tabla-column.model';
import { TablaGenericaComponent } from '../../../../shared/components/tabla-generica/tabla-generica.component';
import { ToastrAlertService } from '../../../../shared/services/toastr-alert.service';
import { StatCard } from '../../../../shared/components/stats-cards/stat-card.model';
import { StatsCardsComponent } from '../../../../shared/components/stats-cards/stats-cards.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-purchase-order-page',
  standalone: true,
  imports: [CommonModule, RouterModule, TablaGenericaComponent, StatsCardsComponent, SpinnerComponent],
  templateUrl: './purchase-order-page.component.html',
  styleUrls: ['./purchase-order-page.component.css'],
})
export class PurchaseOrderPageComponent implements OnInit {
  private purchaseOrderService = inject(PurchaseOrderService);
  private authService          = inject(AuthService);
  private router               = inject(Router);
  public  sweetAlertService    = inject(SweetAlertService);
  public  toastrAlertService   = inject(ToastrAlertService);

  statsCards: StatCard[] = [];
  loading = true;
  error   = '';

  searchTerm   = '';
  statusFilter: string | null = null;
  canCreate    = false;
  canManage    = false;

  orders:  PurchaseOrder[]    = [];
  columns: TableColumnSchema[] = this.buildColumns();

  tablaOpciones: TablaOpciones = {
    btnNuevo:   true,
    buscador:   true,
    inlineEdit: false,
    botones: [
      {
        id: 'nuevo',
        icon: 'ki-duotone ki-plus fs-2',
        colorClass: 'btn btn-sm btn-primary',
        label: 'Nueva Orden',
        show: () => this.canCreate,
      },
      {
        id: 'actualizar',
        icon: 'bi-arrow-repeat',
        colorClass: 'btn btn-light-warning',
        label: 'Actualizar',
      },
    ],
  };

  // ── Lifecycle ────────────────────────────────────────────

  ngOnInit() {
    this.checkPermissions();
    this.loadOrders();
    this.loadStats();
  }

  // ── Permisos ─────────────────────────────────────────────

  checkPermissions(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.canManage = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
    this.canCreate = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
  }

  // ── Tabla ────────────────────────────────────────────────

  private buildColumns(): TableColumnSchema[] {
    return [
      { key: 'orderNumber', type: 'text',  label: 'Número' },

      // supplierId es un objeto populado { _id, name, ... }
      {
        key: 'supplierId',
        keysubnivel: 'name',
        type: 'subnivel',
        label: 'Proveedor',
        style: 'text-warning',
        readonly: true,
      },

      {
        key: 'totalAmount',
        type: 'text',
        label: 'Total (BS)',
        style: 'text-center',
        readonly: true,
      },

      // isDeleted: false = activo, true = eliminado
      {
        key: 'isDeleted',
        type: 'badge',
        label: 'Activo',
        badgeStyle: (val: boolean) => ({
          color: val ? 'danger' : 'success',
          label: val ? 'Eliminado' : 'Activo',
        }),
        readonly: true,
      },

      {
        key: 'status',
        type: 'badge',
        label: 'Estado',
        readonly: true,
        badgeStyle: (val: any, _row: any) => {
          switch (val) {
            case 'pending':   return { color: 'warning' as const, icon: 'bi bi-clock fs-6',           label: 'Pendiente' };
            case 'approved':  return { color: 'primary' as const, icon: 'bi bi-check-circle fs-6',    label: 'Aprobada'  };
            case 'completed': return { color: 'success' as const, icon: 'ki-duotone ki-check-circle', label: 'Completada'};
            case 'rejected':  return { color: 'danger'  as const, icon: 'bi bi-x-circle fs-6',        label: 'Rechazada' };
            case 'cancelled': return { color: 'danger'  as const, icon: 'ki-duotone ki-cross-circle', label: 'Cancelada' };
            default:          return { color: 'info'    as const, label: val ?? '—' };
          }
        },
      },

      { key: 'orderDate', type: 'date', label: 'Fecha orden' },

      {
        key: 'acciones',
        type: 'button',
        label: 'Acciones',
        style: 'text-center',
        buttons: [
          {
            id: 'ver',
            icon: 'bi bi-eye',
            colorClass: 'btn-light-primary',
            tooltip: 'Ver detalle',
          },
          {
            id: 'editar',
            icon: 'bi-pencil',
            colorClass: 'btn-light-success',
            tooltip: 'Editar orden',
            show: () => this.canManage,
          },
          {
            id: 'eliminar',
            icon: 'bi-trash',
            colorClass: 'btn-light-danger',
            tooltip: 'Eliminar orden',
            // Solo mostrar si la orden no está completada/aprobada y el usuario puede gestionar
            show: (r: PurchaseOrder) =>
              this.canManage && !['completed', 'approved'].includes(r.status),
          },
        ],
      },
    ];
  }

  onBtnExtra(id: string) {
    switch (id) {
      case 'nuevo':      this.onCreateOrder(); break;
      case 'actualizar': this.loadOrders();    break;
    }
  }

  onTableAction(ev: { action: string; row: PurchaseOrder }): void {
    switch (ev.action) {
      case 'ver':      this.onSelectOrder(ev.row); break;
      case 'editar':   this.onEditOrder(ev.row);   break;
      case 'eliminar': this.onDeleteOrder(ev.row); break;
    }
  }

  saveInlineEdit(_row: any) {
    // inline edit deshabilitado por ahora
  }

  // ── Carga de datos ────────────────────────────────────────

  loadOrders() {
    this.loading = true;
    this.error   = '';
    this.purchaseOrderService
      .findAll({
        search: this.searchTerm  || undefined,
        status: this.statusFilter || undefined,
      })
      .subscribe({
        next: (res) => {
          this.orders  = res.purchaseOrders;
          this.loading = false;
        },
        error: () => {
          this.error   = 'Error al cargar órdenes de compra';
          this.loading = false;
        },
      });
  }

  loadStats() {
    this.purchaseOrderService.getStats().subscribe({
      next: (s: PurchaseOrderStats) => {
        this.statsCards = [
          { icon: 'bi bi-box',            color: 'primary', label: 'Total Órdenes',    value: s.total            ?? 0 },
          { icon: 'bi-hourglass-split',   color: 'warning', label: 'Monto pendiente',  value: s.pendingAmount    ?? 0 },
          { icon: 'bi-check-circle-fill', color: 'success', label: 'Monto completado', value: s.completedAmount  ?? 0 },
          { icon: 'bi-receipt-cutoff',    color: 'danger',  label: 'Monto total',      value: s.totalAmount      ?? 0 },
        ];
      },
      error: () => {},
    });
  }

  // ── Navegación ────────────────────────────────────────────

  onSelectOrder(order: PurchaseOrder) {
    this.router.navigate(['/dashboard', 'purchase-orders', 'detail', order._id]);
  }

  onEditOrder(order: PurchaseOrder) {
    this.router.navigate(['/dashboard', 'purchase-orders', 'edit', order._id]);
  }

  onCreateOrder() {
    this.router.navigate(['/dashboard', 'purchase-orders', 'create']);
  }

  // ── Eliminación con confirmación ──────────────────────────

  onDeleteOrder(order: PurchaseOrder): void {
    if (!order) return;

    this.sweetAlertService
      .confirm(
        `¿Está seguro de <b>eliminar</b> la orden <b>${order.orderNumber}</b>?<br>
         Esta acción marcará la orden como eliminada.`,
        'Confirmar eliminación',
        'Sí, eliminar',
        'Cancelar',
        true,
      )
      .then((res) => {
        if (!res.isConfirmed) return;
        this.sweetAlertService.loading('Procesando...');

        this.purchaseOrderService.delete(order._id).subscribe({
          next: () => {
            this.sweetAlertService.close();
            this.toastrAlertService.success(
              `Orden ${order.orderNumber} eliminada correctamente`,
              'Operación completada',
            );
            this.loadOrders();
            this.loadStats();
          },
          error: (err) => {
            this.sweetAlertService.close();
            const msg = err?.error?.message ?? 'No se pudo eliminar la orden';
            this.toastrAlertService.error(msg, 'Error');
          },
        });
      });
  }
}