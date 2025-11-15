import { Component, OnInit, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StockMovementsService } from '../../services/stock-movements.service';
import { StockMovement, StockMovementQuery } from '../../models/stock-movement.model';

@Component({
  selector: 'app-stock-movement-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './stock-movement-list.component.html',
  styleUrls: ['./stock-movement-list.component.css']
})
export class StockMovementListComponent implements OnInit {
  private stockService = inject(StockMovementsService);

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

  loadMovements() {
    this.loading = true;
    this.error = '';
    const query = this.filters() as StockMovementQuery;
    this.stockService.findAll(query).subscribe({
      next: res => {
        this.movements = res.stockMovements;
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar movimientos';
        this.loading = false;
      }
    });
  }

  onSelectMovement(movement: StockMovement) {
    this.movementSelected.emit(movement);
  }

  onEditMovement(movement: StockMovement) {
    this.movementEdit.emit(movement);
  }

  onDeleteMovement(movement: StockMovement) {
    if (confirm(`¿Eliminar movimiento ${movement._id}?`)) {
      this.movementDelete.emit(movement);
    }
  }
}