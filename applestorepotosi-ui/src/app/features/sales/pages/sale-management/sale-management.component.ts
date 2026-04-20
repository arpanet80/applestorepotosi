import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SaleService } from '../../services/sale.service';
import { Sale } from '../../models/sale.model';
import { StatCard } from '../../../../shared/components/stats-cards/stat-card.model';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { StatsCardsComponent } from '../../../../shared/components/stats-cards/stats-cards.component';
import { TablaGenericaComponent } from '../../../../shared/components/tabla-generica/tabla-generica.component';
import { AuthService } from '../../../../auth/services/auth.service';
import { UserRole } from '../../../../auth/models/user.model';
import { TablaOpciones, TableColumnSchema } from '../../../../shared/components/tabla-generica/tabla-column.model';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';
import { ToastrAlertService } from '../../../../shared/services/toastr-alert.service';
import { TicketPrintService } from '../../../../shared/services/ticket-print.service';
import { convertSaleToPrintable } from '../../utils/sale-to-printable.util';

@Component({
  selector: 'app-sale-management',
  standalone: true,
  imports: [CommonModule, RouterModule, TablaGenericaComponent, StatsCardsComponent, SpinnerComponent],
  templateUrl: './sale-management.component.html',
  styleUrls: ['./sale-management.component.css']
})
export class SaleManagementComponent implements OnInit {
  private saleService = inject(SaleService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private sweetAlertService = inject(SweetAlertService);
  private toastrAlertService = inject(ToastrAlertService);
  private ticketService = inject(TicketPrintService);  // ← AGREGAR

  loading = true;
  error = '';

  canCreate = false;
  canManage = false;

  // Tarjetas de estadísticas
  statsCards: StatCard[] = [];
  
  // TABLA
  sales: Sale[] = [];
  columns: TableColumnSchema[] = this.buildColumns();
  tablaOpciones: TablaOpciones = {
    btnNuevo: true,
    buscador: true,
    inlineEdit: false,
    botones: [
      { id: 'nuevo', icon: 'ki-duotone ki-plus fs-2', colorClass: 'btn btn-sm btn-primary', label: 'Nueva venta', show: () => this.canCreate },
      { id: 'actualizar', icon: 'bi-arrow-repeat', colorClass: 'btn btn-light-warning', label: 'Actualizar' }
    ]
  };

  onBtnExtra(id: string) {
    switch (id) {
      case 'nuevo': this.onCreate(); break;
      case 'actualizar': this.loadSales(); break;
    }
  }

  private buildColumns(): TableColumnSchema[] {
    return [
      { key: 'saleNumber', type: 'text', label: 'Codigo' },
      { key: 'customerId', keysubnivel: 'fullName', type: 'subnivel', label: 'Cliente' },
      { key: 'saleDate', type: 'date', label: 'Fecha' },
      { key: 'totals', keysubnivel: 'subtotal', type: 'subnivel', label: 'Subtotal' }, 
      { key: 'status', type: 'badge', label: 'Estado',
        badgeStyle: (val, row) => {
          switch (val) {
            case 'pending': return { color: 'warning' };
            case 'confirmed': return { color: 'success' };
            case 'delivered': return { color: 'info' };
            default: return { color: 'danger' };
          }
        } 
      },
      { key: 'acciones', type: 'button', label: 'Acciones', style: 'text-center',
        buttons: [
          { id: 'ver', icon: 'bi bi-eye', colorClass: 'btn-light-primary', tooltip: 'Ver orden' },
          { id: 'imprimir', icon: 'bi-printer', colorClass: 'btn-light-info', tooltip: 'Imprimir ticket' },  // ← AGREGAR
          { id: 'editar', icon: 'bi-box-arrow-in-down', colorClass: 'btn-light-warning', tooltip: 'Editar orden', show: (r) => this.canManage },
          { id: 'eliminar', icon: 'bi-trash', colorClass: 'btn-light-danger', tooltip: 'Anular OC', show: (r) => this.canManage },
        ]
      }
    ];
  }

  onTableAction(ev: { action: string; row: any }): void {
    switch (ev.action) {
      case 'ver': this.onView(ev.row); break;
      case 'imprimir': this.onPrintTicket(ev.row); break;  // ← AGREGAR
      case 'editar': this.onEdit(ev.row); break;
      case 'eliminar': this.onDelete(ev.row); break;
    }
  }

  // NUEVO MÉTODO
  onPrintTicket(sale: Sale): void {
    this.saleService.findOne(sale._id).subscribe({
      next: (fullSale) => {
        const items = (fullSale as any).items || [];
        const printable = convertSaleToPrintable(
          fullSale,
          items,
          fullSale.salesPersonId?.displayName || 'Vendedor'
        );
        
        this.ticketService.generateAndPrint(printable);
        this.toastrAlertService.success('Ticket enviado a impresión');
      },
      error: () => {
        this.toastrAlertService.error('No se pudo cargar la venta para imprimir');
      }
    });
  }

  private checkPermissions() {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.canCreate = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
    this.canManage = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
  }

  ngOnInit() {
    this.checkPermissions();
    this.loadSales();
    this.loadStats();
  }

  loadStats() {
    this.saleService.getStats().subscribe({
      next: (s) => {
        this.statsCards = [
          { icon: 'bi-check-circle-fill', color: 'warning', label: 'Ventas del día', value: s.todayCount ?? 0 },
          { icon: 'bi-hourglass-split', color: 'success', label: 'Ingresos del Dia', value: s.todayRevenue ?? 0 },
          { icon: 'bi-hourglass-split', color: 'success', label: 'Devoluciones del Dia', value: s.todayReturns.count ?? 0 },
          { icon: 'bi bi-box', color: 'primary', label: 'Total ventas', value: s.totalSales ?? 0 },
        ];
      },
      error: () => {},
    });
  }

  loadSales() {
    this.loading = true;
    this.saleService.findAllRaw().subscribe({
      next: res => {
        this.sales = res;
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar movimientos';
        this.loading = false;
      }
    });
  }

  onEdit(sale: Sale) {
    this.router.navigate(['/dashboard', 'sales', 'edit', sale._id]);
  }

  onDelete(sale: Sale): void {
    if (sale.status === 'cancelled') {
      this.toastrAlertService.success('La venta ya está cancelada');
      return;
    }

    this.sweetAlertService
      .confirm(
        `Se devolverá el stock y la venta pasará a estado CANCELADO.`,
        `¿Cancelar venta ${sale.saleNumber}?`,
        'Sí, cancelar',
        'No, regresar'
      )
      .then((res) => {
        if (res.isConfirmed) {
          this.sweetAlertService
            .textarea('Motivo (opcional)', 'Motivo de cancelación')
            .then((reason) => {
              if (reason.isDismissed) return;
              const notes = reason.value || undefined;
              this.saleService.cancelSale(sale._id, notes).subscribe({
                next: () => {
                  this.toastrAlertService.success('Venta cancelada correctamente');
                  this.loadSales();
                },
                error: (err) =>
                  this.sweetAlertService.error(
                    err.error?.message?.join?.(', ') || 'No se pudo cancelar la venta'
                  ),
              });
            });
        }
      });
  }

  onCreate() {
    this.router.navigate(['/dashboard', 'sales', 'create']);
  }

  onView(sale: Sale) {
    this.router.navigate(['/dashboard', 'sales', 'detail', sale._id]);
  }
}