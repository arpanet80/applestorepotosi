import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { StockMovementsService } from '../../services/stock-movements.service';
import { StockMovement } from '../../models/stock-movement.model';
import { AuthService } from '../../../../auth/services/auth.service';
import { UserRole } from '../../../../auth/models/user.model';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';
import { ToastrAlertService } from '../../../../shared/services/toastr-alert.service';

@Component({
  selector: 'app-stock-movement-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './stock-movement-detail.component.html',
  styleUrls: ['./stock-movement-detail.component.css']
})
export class StockMovementDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private stockService = inject(StockMovementsService);
  private authService = inject(AuthService);
  private sweetAlert = inject(SweetAlertService);
  private toastr = inject(ToastrAlertService);

  private destroy$ = new Subject<void>();

  movement: StockMovement | null = null;
  loading = true;
  error = '';

  canEdit = false;

  ngOnInit() {
    this.checkPermissions();
    this.loadMovement();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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

    this.stockService.findOne(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (movement) => {
          this.movement = movement;
          this.loading = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'Movimiento no encontrado';
          this.loading = false;
          this.toastr.error(this.error, 'Error');
        }
      });
  }

  onEdit() {
    if (!this.movement) return;
    this.router.navigate(['/dashboard', 'stock-movements', 'edit', this.movement._id]);
  }

  // CORRECCIÓN: migrado de confirm() nativo a SweetAlert para consistencia UX
  onDelete() {
    if (!this.movement) return;

    this.sweetAlert
      .confirm(
        `¿Está seguro de eliminar el movimiento <b>${this.movement._id}</b>?<br>Esta acción no se puede deshacer.`,
        'Confirmar eliminación',
        'Sí, eliminar',
        'Cancelar',
        true
      )
      .then((res) => {
        if (!res.isConfirmed) return;
        this.sweetAlert.loading('Eliminando...');

        this.stockService.delete(this.movement!._id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.sweetAlert.close();
              this.toastr.success('Movimiento eliminado correctamente', 'Éxito');
              this.router.navigate(['/dashboard', 'stock-movements']);
            },
            error: (err) => {
              this.sweetAlert.close();
              const msg = err?.error?.message || 'Error al eliminar el movimiento';
              this.toastr.error(msg, 'Error');
            }
          });
      });
  }

  
}