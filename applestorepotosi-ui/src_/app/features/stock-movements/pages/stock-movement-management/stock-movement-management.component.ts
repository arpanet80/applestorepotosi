import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { StockMovementsService } from '../../services/stock-movements.service';
import { StockMovement } from '../../models/stock-movement.model';
import { AuthService } from '../../../../auth/services/auth.service';
import { UserRole } from '../../../../auth/models/user.model';

@Component({
  selector: 'app-stock-movement-management',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './stock-movement-management.component.html',
  styleUrls: ['./stock-movement-management.component.css']
})
export class StockMovementManagementComponent implements OnInit {
  private stockService = inject(StockMovementsService);
  private router = inject(Router);
  private authService = inject(AuthService);

  movements: StockMovement[] = [];
  loading = true;

  canEdit = false;

  ngOnInit() {
    this.checkPermissions();
    this.loadMovements();
  }

  private checkPermissions() {
    this.canEdit = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
  }

  loadMovements() {
    this.loading = true;
    this.stockService.findAll({}).subscribe({
      next: res => {
        this.movements = res.stockMovements;
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  onEdit(movement: StockMovement) {
    this.router.navigate(['/dashboard', 'stock-movements', 'edit', movement._id]);
  }

  onDelete(movement: StockMovement) {
    if (!confirm(`¿Eliminar movimiento ${movement._id}?`)) return;
    this.stockService.delete(movement._id).subscribe(() => this.loadMovements());
  }

  onCreate() {
    this.router.navigate(['/dashboard', 'stock-movements', 'create']);
  }

  onCreateAdjustment() {
    this.router.navigate(['/dashboard', 'stock-movements', 'adjustment']);
  }
}