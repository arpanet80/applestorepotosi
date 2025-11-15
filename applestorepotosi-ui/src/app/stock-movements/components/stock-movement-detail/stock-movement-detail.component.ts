import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { StockMovementsService } from '../../services/stock-movements.service';
import { StockMovement } from '../../models/stock-movement.model';
import { AuthService } from '../../../auth/services/auth.service';
import { UserRole } from '../../../auth/models/user.model';

@Component({
  selector: 'app-stock-movement-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './stock-movement-detail.component.html',
  styleUrls: ['./stock-movement-detail.component.css']
})
export class StockMovementDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private stockService = inject(StockMovementsService);
  private authService = inject(AuthService);

  movement: StockMovement | null = null;
  loading = true;
  error = '';

  canEdit = false;

  ngOnInit() {
    this.checkPermissions();
    this.loadMovement();
  }

  private checkPermissions() {
    this.canEdit = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
  }

  private loadMovement() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID de movimiento no válido';
      this.loading = false;
      return;
    }

    this.stockService.findOne(id).subscribe({
      next: (movement) => {
        this.movement = movement;
        this.loading = false;
      },
      error: () => {
        this.error = 'Movimiento no encontrado';
        this.loading = false;
      }
    });
  }

  onEdit() {
    if (!this.movement) return;
    this.router.navigate(['/dashboard', 'stock-movements', 'edit', this.movement._id]);
  }

  onDelete() {
    if (!this.movement) return;
    if (confirm(`¿Eliminar movimiento ${this.movement._id}?`)) {
      this.stockService.delete(this.movement._id).subscribe({
        next: () => this.router.navigate(['/dashboard', 'stock-movements']),
        error: () => alert('Error al eliminar el movimiento')
      });
    }
  }
}