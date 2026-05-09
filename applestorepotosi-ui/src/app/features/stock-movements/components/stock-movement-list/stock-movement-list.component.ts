import { Component, OnInit, OnDestroy, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { StockMovementsService } from '../../services/stock-movements.service';
import { StockMovement, StockMovementQuery } from '../../models/stock-movement.model';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';
import { ToastrAlertService } from '../../../../shared/services/toastr-alert.service';

@Component({
  selector: 'app-stock-movement-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './stock-movement-list.component.html',
  styleUrls: ['./stock-movement-list.component.css']
})
export class StockMovementListComponent implements OnInit, OnDestroy {
  private stockService = inject(StockMovementsService);
  private sweetAlert = inject(SweetAlertService);
  private toastr = inject(ToastrAlertService);

  private destroy$ = new Subject<void>();

  filters = input<Partial<StockMovementQuery>>({});
  showActions = input(true);

  movementSelected = output<StockMovement>();
  movementEdit = output<StockMovement>();
  movementDelete = output<StockMovement>();

  movements: StockMovement[] = [];
  loading = false;
  error = '';

  ngOnInit() {
    this.loadMovements();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMovements() {
    this.loading = true;
    this.error = '';
    const query = this.filters() as StockMovementQuery;

    this.stockService.findAll(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          // CORRECCIÓN: tipado explícito - verificar la estructura de respuesta del backend
          this.movements = res.stockMovements ?? [];
          this.loading = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'Error al cargar movimientos';
          this.loading = false;
          this.toastr.error(this.error, 'Error');
        }
      });
  }

  onSelectMovement(movement: StockMovement) {
    this.movementSelected.emit(movement);
  }

  onEditMovement(movement: StockMovement) {
    this.movementEdit.emit(movement);
  }

  // CORRECCIÓN: migrado de confirm() nativo a SweetAlert para consistencia UX
  onDeleteMovement(movement: StockMovement) {
    this.sweetAlert
      .confirm(
        `¿Está seguro de eliminar el movimiento <b>${movement._id}</b>?<br>Esta acción no se puede deshacer.`,
        'Confirmar eliminación',
        'Sí, eliminar',
        'Cancelar',
        true
      )
      .then((res) => {
        if (!res.isConfirmed) return;
        this.movementDelete.emit(movement);
      });
  }

  trackByMovementId(index: number, movement: StockMovement): string {
    return movement._id;
  }

}