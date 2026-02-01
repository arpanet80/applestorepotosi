import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TablaGenericaComponent } from '../../../../shared/components/tabla-generica/tabla-generica.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { StatsCardsComponent } from '../../../../shared/components/stats-cards/stats-cards.component';
import { StockMovementsService } from '../../../stock-movements/services/stock-movements.service';
import { StockMovement } from '../../../stock-movements/models/stock-movement.model';
import { StatCard } from '../../../../shared/components/stats-cards/stat-card.model';
import { TablaOpciones, TableColumnSchema } from '../../../../shared/components/tabla-generica/tabla-column.model';

@Component({
  selector: 'app-technician-stock-movements-home',
  standalone: true,
  imports: [
    CommonModule,FormsModule,RouterModule, TablaGenericaComponent,SpinnerComponent,],
  templateUrl: './technician-stock-movements-home.component.html'
})
export class TechnicianStockMovementsHomeComponent implements OnInit {
  private service = inject(StockMovementsService);
  private router = inject(Router);

  movements: StockMovement[] = [];
  loading = true;
  statsCards: StatCard[] = [];

  /* tabla */
  columns: TableColumnSchema[] = [
    { key: 'productId', keysubnivel: 'name', type: 'subnivel', label: 'Producto', readonly: true },
    { key: 'type', type: 'badge', label: 'Tipo', badgeStyle: (v) => ({ color: v === 'in' ? 'success' : 'warning' }) },
    { key: 'quantity', type: 'number', label: 'Cantidad' },
    { key: 'reason', type: 'text', label: 'Razón' },
    { key: 'timestamp', type: 'date', label: 'Fecha' },
    { key: 'acciones', type: 'button', label: 'Ver', style: 'text-center',
      buttons: [{ id: 'ver', icon: 'ki-duotone ki-eye', colorClass: 'btn-light-primary', tooltip: 'Ver detalle' }]
    }
  ];

  tablaOpciones: TablaOpciones = {
    btnNuevo: false,
    buscador: true,
    botones: [
      { id: 'ajuste', icon: 'ki-duotone ki-plus fs-2', colorClass: 'btn btn-sm btn-success', label: 'Ajuste de stock' }
    ]
  };

  ngOnInit() {
    this.loadMovements();
    this.loadStats();
  }

  private loadMovements(): void {
    this.loading = true;
    this.service.findAll({ page: 1, limit: 100 }).subscribe({
      next: res => {
        this.movements = res.stockMovements;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private loadStats(): void {
    this.service.getStats().subscribe(s => {
      this.statsCards = [
        { icon: 'bi bi-box', color: 'primary', label: 'Total Movimientos', value: s.total ?? 0 },
        { icon: 'bi-hourglass-split', color: 'success', label: 'Entradas', value: s.totalIn ?? 0 },
        { icon: 'bi-check-circle-fill', color: 'warning', label: 'Salidas', value: s.totalOut ?? 0 }
      ];
    });
  }

  onTableAction(ev: { action: string; row: any }): void {
    if (ev.action === 'ver') this.router.navigate(['/dashboard/technician-stock-movements/detail', ev.row._id]);
  }

  onBtnExtra(id: string): void {
    if (id === 'ajuste') this.router.navigate(['/dashboard/technician-stock-movements/stock-adjust']);
  }
}