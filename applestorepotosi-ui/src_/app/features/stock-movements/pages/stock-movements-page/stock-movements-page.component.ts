import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { StockMovementsService } from '../../services/stock-movements.service';
import { StockMovementListComponent } from '../../components/stock-movement-list/stock-movement-list.component';
import { StockMovement, StockMovementQuery, StockMovementType } from '../../models/stock-movement.model';
import { AuthService } from '../../../../auth/services/auth.service';
import { UserRole } from '../../../../auth/models/user.model';
import { TablaOpciones, TableColumnSchema } from '../../../../shared/components/tabla-generica/tabla-column.model';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { StatsCardsComponent } from '../../../../shared/components/stats-cards/stats-cards.component';
import { TablaGenericaComponent } from '../../../../shared/components/tabla-generica/tabla-generica.component';
import { StatCard } from '../../../../shared/components/stats-cards/stat-card.model';

@Component({
  selector: 'app-stock-movements-page',
  standalone: true,
  imports: [CommonModule, RouterModule, TablaGenericaComponent, StatsCardsComponent, SpinnerComponent],
  templateUrl: './stock-movements-page.component.html',
  styleUrls: ['./stock-movements-page.component.css']
})
export class StockMovementsPageComponent implements OnInit, OnDestroy {
  private stockService = inject(StockMovementsService);
  private authService = inject(AuthService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();

  loading = true;
  error = '';

  searchTerm = '';
  typeFilter: 'all' | 'in' | 'out' | 'adjustment' = 'all';

  canCreate = false;
  canManage = false;

  // Tarjetas de estadísticas
    statsCards: StatCard[] = [];

  ///////////////////////////////////////////////////////////////////
  //////////////////////// TABLA ////////////////////////////////////
  ///////////////////////////////////////////////////////////////////
  movements: StockMovement[] = [];
  columns: TableColumnSchema[] = this.buildColumns();

  tablaOpciones: TablaOpciones = {
    // registrosPorPagina: 5      // página size personalizado
    btnNuevo: true,            // mostrará botón “Nuevo”
    buscador: true,            // mostrará caja de búsqueda
    inlineEdit: false,          // habilitará el lápiz
    botones: [
      { id: 'nuevo',        icon: 'ki-duotone ki-plus fs-2',  colorClass: 'btn btn-sm btn-primary', label: 'Nuevo movimiento', show: () => this.canCreate  },
      { id: 'ajuste',       icon: 'bi bi-trash',              colorClass: 'btn-success',             label: 'Ajustes de stock' },
      { id: 'actualizar',   icon: 'bi-arrow-repeat',          colorClass: 'btn btn-light-warning', label: 'Actualizar' }
    ]
  };

  onBtnExtra(id: string) {
    switch (id) {
      case 'nuevo': this.onCreateMovement(); break;
      case 'ajuste': this.onCreateAdjustment(); break;
      case 'actualizar':  this.loadMovements(); break;
    }
  }

  private buildColumns(): TableColumnSchema[] {
    return [
      { key: 'productId',  keysubnivel: 'name', type: 'subnivel', label: 'Producto', readonly: true }, 
      { key: 'quantity', type: 'text',       label: 'Cantidad' },
      { key: 'reason', type: 'text',       label: 'Razon' },
      { key: 'previousStock', type: 'text', label: 'Stock anterior' },
      { key: 'newStock', type: 'text', label: 'Nuevo stock' },
      { key: 'acciones', type: 'button', label: 'Acciones', style: 'text-center',
        buttons: [
          { id: 'ver',     icon: 'bi bi-eye',            colorClass: 'btn-light-primary', tooltip: 'Ver orden'},
          { id: 'editar',  icon: 'bi-box-arrow-in-down', colorClass: 'btn-light-success', tooltip: 'Editar orden', show: (r) => this.canManage },
          { id: 'eliminar',icon: 'bi-trash',             colorClass: 'btn-light-danger',  tooltip: 'Anular OC', show: (r) => this.canManage },
        ]
      }
    ];
  }

  onTableAction(ev: { action: string; row: any }): void {
    switch (ev.action) {
      case 'ver':    this.onViewMovement(ev.row); break;
      case 'editar':  this.onEditMovement(ev.row); break;
      case 'eliminar': this.onDeleteMovement(ev.row); break;
    }
  }
  ///////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////

  ngOnInit() {
    this.checkPermissions();
    this.loadMovements();
    this.loadStats();
  }

  loadStats() {
    this.stockService.getStats().subscribe({
      next: (s) => {
        /* ======  ARMADO MANUAL  ====== */
        this.statsCards = [
          { icon: 'bi bi-box',           color: 'primary',  label: 'Total Movimientos', value: s.total ?? 0 },
          { icon: 'bi-hourglass-split',  color: 'success',  label: 'Entradas',         value: s.totalIn ?? 0 },
          { icon: 'bi-check-circle-fill',color: 'warning',  label: 'Salidas',   value: s.totalOut ?? 0 },
          // { icon: 'bi-receipt-cutoff',   color: 'danger',   label: 'Monto Total', value: s.totalAmount ?? 0 }
        ];
      },
      error: () => {},
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkPermissions() {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.canCreate = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
    this.canManage = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
  }

  loadMovements() {
    this.loading = true;
    this.error = '';

    // const query: StockMovementQuery = {
    //     type: this.getTypeFilter()
    // };

    this.stockService.getAllSinParams().subscribe({
        next: res => {
         
          this.movements = res;
          console.log("🚀 ~ StockMovementsPageComponent ~ loadMovements ~ movements:", this.movements)
          this.loading = false;
        },
        error: () => {
        this.error = 'Error al cargar movimientos';
        this.loading = false;
        }
    });
  }

  private getTypeFilter(): StockMovementType | undefined {
    return this.typeFilter === 'all' ? undefined : this.typeFilter as StockMovementType;
    }

  onSearch(term: string) {
    this.searchTerm = term;
    this.loadMovements();
  }

  onFilterChange(filter: 'all' | 'in' | 'out' | 'adjustment') {
    this.typeFilter = filter;
    this.loadMovements();
  }

  onSelectMovement(movement: StockMovement) {
    this.router.navigate(['/dashboard', 'stock-movements', 'detail', movement._id]);
  }

  onViewMovement(movement: StockMovement) {
    this.router.navigate(['/dashboard', 'stock-movements', 'detail', movement._id]);
  }

  onEditMovement(movement: StockMovement) {
    this.router.navigate(['/dashboard', 'stock-movements', 'edit', movement._id]);
  }

  onDeleteMovement(movement: StockMovement) {
    if (!confirm(`¿Eliminar movimiento ${movement._id}?`)) return;
    this.stockService.delete(movement._id).subscribe(() => this.loadMovements());
  }

  onCreateMovement() {
    this.router.navigate(['/dashboard', 'stock-movements', 'create']);
  }

  onCreateAdjustment() {
    this.router.navigate(['/dashboard', 'stock-movements', 'adjustment']);
  }

  onManageMovements() {
    this.router.navigate(['/dashboard', 'stock-movements', 'management']);
  }

  onRefresh() {
    this.loadMovements();
  }

  getFilterClass(filter: string): string {
    return this.typeFilter === filter ? 'btn-filter active' : 'btn-filter';
  }

  getMovementFilters(): Partial<StockMovementQuery> {
    return {
        type: this.typeFilter === 'all' ? undefined : this.typeFilter as StockMovementType
    };
  }
}