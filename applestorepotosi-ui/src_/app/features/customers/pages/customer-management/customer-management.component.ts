// src/app/customers/pages/customer-management/customer-management.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer.model';
import { FormsModule } from '@angular/forms';
import { TablaOpciones, TableColumnSchema } from '../../../../shared/components/tabla-generica/tabla-column.model';
import { AuthService } from '../../../../auth/services/auth.service';
import { ToastrAlertService } from '../../../../shared/services/toastr-alert.service';
import { UserRole } from '../../../../auth/models/user.model';
import { StatCard } from '../../../../shared/components/stats-cards/stat-card.model';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { StatsCardsComponent } from '../../../../shared/components/stats-cards/stats-cards.component';
import { TablaGenericaComponent } from '../../../../shared/components/tabla-generica/tabla-generica.component';

@Component({
  selector: 'app-customer-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TablaGenericaComponent, StatsCardsComponent, SpinnerComponent],
  templateUrl: './customer-management.component.html',
  styleUrls: ['./customer-management.component.css'],
})
export class CustomerManagementComponent implements OnInit {
  private customerService = inject(CustomerService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastrAlertService = inject(ToastrAlertService);

  // Tarjetas de estadísticas
  statsCards: StatCard[] = [];
  loading = true;
  error = '';

  canCreate = true;
  canManage = false;

  ///////////////////////////////////////////////////////////////////
  //////////////////////// TABLA ////////////////////////////////////
  ///////////////////////////////////////////////////////////////////
  
  customers: Customer[] = [];
  columns: TableColumnSchema[] = this.buildColumns();

  tablaOpciones: TablaOpciones = {
    btnNuevo: true,            // mostrará botón “Nuevo”
    buscador: true,            // mostrará caja de búsqueda
    inlineEdit: false,          // habilitará el lápiz
    botones: [
      { id: 'nuevo',  icon: 'ki-duotone ki-plus fs-2',  colorClass: 'btn btn-sm btn-primary', label: 'Nuevo Cliente', show: () => this.canCreate  },
      { id: 'actualizar',   icon: 'bi-arrow-repeat',   colorClass: 'btn btn-light-warning', label: 'Actualizar' },
    ]
  };

  onBtnExtra(id: string) {
    switch (id) {
      case 'nuevo': this.onCreate(); break;
      case 'actualizar':  this.loadCustomers(); break;
    }
  }

  private buildColumns(): TableColumnSchema[] {
    return [
      { key: 'fullName', type: 'text',       label: 'Nombre cliente' },
      // { key: 'email',  type: 'text', label: 'Correo'  }, 
      { key: 'phone',  type: 'text', label: 'Telefono'  }, 
      { key: 'loyaltyPoints',   type: 'text',  label: 'Puntos'},
      { key: 'isActive',      type: 'badge',      label: 'Estado' ,
        badgeStyle: (val, row) => {
          switch (val) {
            case true:  return { color: 'success'};
            case false: return { color: 'danger'};
            default:         return { color: 'primary' };
          }
        }
      },
      { key: 'createdAt',    type: 'date',   label: 'Creado en' },
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
      case 'ver':      this.onview(ev.row); break;
      case 'editar':  this.onEdit(ev.row); break;
      case 'eliminar': this.toggleActive(ev.row); break;
      // case 'eliminar': this.onDeleteOrder(ev.row); break;
      // case 'imprimir': this.onPrint(ev.row);  break;
    }
  }

  ///////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////

  ngOnInit() {
    this.checkPermissions();
    this.loadCustomers();
    this.loadStats();
  }

  checkPermissions(): void {
      const user = this.authService.getCurrentUser();
      if (!user) return;
      this.canManage = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
      this.canCreate = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
  }

  loadStats() {
    this.customerService.getStats().subscribe({
      next: (s) => {

        /* ======  ARMADO MANUAL  ====== */
        this.statsCards = [
          { icon: 'bi bi-box',           color: 'primary',  label: 'Total Clientes', value: s.total ?? 0 },
          { icon: 'bi-hourglass-split',  color: 'success',  label: 'Clientes activos',         value: s.active ?? 0 },
          { icon: 'bi-check-circle-fill',color: 'warning',  label: 'Con Fidelidad',   value: s.withLoyaltyPoints ?? 0 },
        ];
      },
      error: () => {},
    });
  }

  loadCustomers() {
    this.loading = true;
    this.error = '';
    this.customerService.getCustomerRaw().subscribe({
      next: (res) => {
        this.customers = res;
        console.log("🚀 ~ CustomerManagementComponent ~ loadPage ~ customers:", this.customers)
        // this.total = res.total;
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar órdenes de compra';
        this.loading = false;
      },
    });
  }

  onEdit(c: Customer) {
    this.router.navigate(['/dashboard', 'customers', 'edit', c._id]);
  }

  onview(c: Customer) {
    this.router.navigate(['/dashboard', 'customers', 'detail', c._id]);
  }

  onDelete(c: Customer) {
    if (!confirm(`¿Eliminar cliente "${c.fullName}"?`)) return;
    this.customerService.delete(c._id).subscribe(() => this.loadCustomers());
  }

  onCreate() {
    this.router.navigate(['/dashboard', 'customers', 'create']);
  }

  toggleActive(c: Customer) {

    this.customerService.toggleActive(c._id).subscribe({
      next: (updated) => {
        this.toastrAlertService.success(`Cliente ${updated.isActive ? 'activado' : 'desactivado'} correctamente`);
        this.loadCustomers();
        const idx = this.customers.findIndex((c) => c._id === updated._id);
        if (idx !== -1) this.customers[idx] = updated;
      },
    });
  }

}