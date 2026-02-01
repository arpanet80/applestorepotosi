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
  private authService = inject(AuthService);
  private router = inject(Router);
  public  sweetAlertService = inject(SweetAlertService);
  public  toastrAlertService = inject(ToastrAlertService);

  // Tarjetas de estadísticas
  statsCards: StatCard[] = [];
  loading = true;
  error = '';

  searchTerm = '';
  statusFilter: string | null = null;
  canCreate = true;
  canManage = false;

  ///////////////////////////////////////////////////////////////////
  //////////////////////// TABLA ////////////////////////////////////
  ///////////////////////////////////////////////////////////////////

  orders: PurchaseOrder[] = [];
  columns: TableColumnSchema[] = this.buildColumns();

  tablaOpciones: TablaOpciones = {
    // registrosPorPagina: 5      // página size personalizado
    btnNuevo: true,            // mostrará botón “Nuevo”
    buscador: true,            // mostrará caja de búsqueda
    inlineEdit: false,          // habilitará el lápiz
    botones: [
      { id: 'nuevo',  icon: 'ki-duotone ki-plus fs-2',  colorClass: 'btn btn-sm btn-primary', label: 'Nueva Orden', show: () => this.canCreate  },
      { id: 'actualizar',   icon: 'bi-arrow-repeat',   colorClass: 'btn btn-light-warning', label: 'Actualizar' },
      // { id: 'delete',  icon: 'bi bi-trash',     colorClass: 'btn-danger',  tooltip: 'Eliminar seleccionados' }
    ]
  };

  onBtnExtra(id: string) {
    switch (id) {
      case 'nuevo': this.onCreateOrder(); break;
      case 'actualizar':  this.loadOrders(); break;
      // case 'delete': this.exportar(); break;
    }
  }

  private buildColumns(): TableColumnSchema[] {
    return [
      { key: 'orderNumber', type: 'text',       label: 'Número' },
      { key: 'supplierId',  keysubnivel: 'name', type: 'subnivel', label: 'Proveedor', style: 'text-warning', readonly: true },   // un subnivel es no editable
      { key: 'totals',      keysubnivel: 'totalAmount', type: 'subnivel', label: 'Total (BS)', style: 'text-center', readonly: true },   // un subnivel es no editable}, 
      { key: 'isDeleted',   type: 'badge',       label: 'Activo', badgeStyle: (val) => ({ color: val ? 'success' : 'danger' }), readonly: true },
      { key: 'status',      type: 'badge',      label: 'Estado' , readonly: true,   // no editable
        badgeStyle: (val, row) => {
          switch (val) {
            case 'pending':  return { color: 'warning', icon: 'bi bi-clock fs-6' };
            case 'received': return { color: 'success', icon: 'ki-duotone ki-check-circle' };
            case 'cancelled':return { color: 'danger',  icon: 'ki-duotone ki-cross-circle' };
            default:         return { color: 'primary' };
          }
        }
      },
      { key: 'createdAt',    type: 'date',   label: 'Fecha' },
      { key: 'acciones', type: 'button', label: 'Acciones', style: 'text-center',
        buttons: [
          // { id: 'inlineEdit',    icon: 'bi bi-pencil',   colorClass: 'btn-light-warning', tooltip: 'Editar', show: (r) => !(r as any).isEdit }, 
          { id: 'ver',     icon: 'bi bi-eye',            colorClass: 'btn-light-primary', tooltip: 'Ver orden'},
          { id: 'editar',  icon: 'bi-box-arrow-in-down', colorClass: 'btn-light-success', tooltip: 'Editar orden', show: (r) => this.canManage },
          { id: 'eliminar',icon: 'bi-trash',             colorClass: 'btn-light-danger',  tooltip: 'Anular OC', show: (r) => this.canManage },
          // { id: 'imprimir',icon: 'bi bi-printer',        colorClass: 'btn-light-info',    tooltip: 'Imprimir OC' },
          // { id: 'recibir', icon: 'bi-box-arrow-in-down', colorClass: 'btn-light-success', tooltip: 'Recibir mercancía', show: (r) => r.status === 'pending' },
        ]
      }
    ];
  }

  onTableAction(ev: { action: string; row: any }): void {
    switch (ev.action) {
      case 'ver':      this.onSelectOrder(ev.row); break;
      case 'editar':  this.onEditOrder(ev.row); break;
      case 'eliminar': this.onToggleStatus(ev.row); break;
      // case 'eliminar': this.onDeleteOrder(ev.row); break;
      // case 'imprimir': this.onPrint(ev.row);  break;
    }
  }

  saveInlineEdit(row: any) {        // Guarda los cambios realizados en edicion INLINE
    console.log("=====> Guardando cambios en fila de tabla: ", row);
    // alert('Guardando cambios de ' + row.supplierId.name);
    // this.purchaseOrderService.update(row._id!, row).subscribe({
    //   next: () => {
    //     this.loadOrders(),
    //     this.alertService.success('Operación exitosa');
    //   },
    //   error: (e) => this.alertService.error('Error al guardar')
    // });
    this.toastrAlertService.success('Operación exitosa');
    (row as any).isEdit = false;
  }
  ///////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////

  ngOnInit() {
    this.checkPermissions();
    this.loadOrders();
    this.loadStats();
  }

  checkPermissions(): void {
      const user = this.authService.getCurrentUser();
      if (!user) return;
      this.canManage = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
      this.canCreate = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
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
        console.log("=========> ",this.orders);
        // this.orders.set(res.purchaseOrders);
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
      next: (s) => {

        /* ======  ARMADO MANUAL  ====== */
        this.statsCards = [
          { icon: 'bi bi-box',           color: 'primary',  label: 'Total Órdenes', value: s.total ?? 0 },
          { icon: 'bi-hourglass-split',  color: 'success',  label: 'Pendientes',         value: s.pendingAmount ?? 0 },
          { icon: 'bi-check-circle-fill',color: 'warning',  label: 'Completadas',   value: s.completedAmount ?? 0 },
          { icon: 'bi-receipt-cutoff',   color: 'danger',   label: 'Monto Total', value: s.totalAmount ?? 0 }
        ];
      },
      error: () => {},
    });
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

  onToggleStatus(order: PurchaseOrder): void {
    if (!order) return;
    const action = order.isActive ? 'desactivar' : 'activar';

    this.sweetAlertService
      .confirm(
        `¿Está seguro de <b>${action}</b> el producto <b>${order._id}</b>?`,
        `Confirmar ${action}`,
        'Sí, ' + action,
        'Cancelar',
        true
      )
      .then(res => {
        if (!res.isConfirmed) return;
        this.sweetAlertService.loading('Procesando...');

        this.purchaseOrderService.delete(order._id).subscribe({
          next: () => {
            this.sweetAlertService.close();
            this.toastrAlertService.success(
              `Registro ${order._id} ${action}do correctamente`,
              'Operación completada'
            );
            this.loadOrders();
            this.loadStats();
          },
          error: () => {
            this.sweetAlertService.close();
            this.toastrAlertService.error(
              `No se pudo ${action} el registro`,
              'Error'
            );
          }
        });

      });
  }

}