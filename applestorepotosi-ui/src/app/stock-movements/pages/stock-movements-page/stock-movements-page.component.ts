import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { StockMovementsService } from '../../services/stock-movements.service';
import { StockMovementListComponent } from '../../components/stock-movement-list/stock-movement-list.component';
import { StockMovement, StockMovementQuery, StockMovementType } from '../../models/stock-movement.model';
import { AuthService } from '../../../auth/services/auth.service';
import { UserRole } from '../../../auth/models/user.model';

@Component({
  selector: 'app-stock-movements-page',
  standalone: true,
  imports: [CommonModule, RouterModule, StockMovementListComponent],
  templateUrl: './stock-movements-page.component.html',
  styleUrls: ['./stock-movements-page.component.css']
})
export class StockMovementsPageComponent implements OnInit, OnDestroy {
  private stockService = inject(StockMovementsService);
  private authService = inject(AuthService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();

  movements: StockMovement[] = [];
  loading = true;
  error = '';

  searchTerm = '';
  typeFilter: 'all' | 'in' | 'out' | 'adjustment' = 'all';

  canCreate = false;
  canManage = false;

  ngOnInit() {
    this.checkPermissions();
    this.loadMovements();
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

    const query: StockMovementQuery = {
        type: this.getTypeFilter()
    };

    this.stockService.findAll(query).subscribe({
        next: res => {
        let filtered = res.stockMovements;

        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(m =>
            m.productId.toLowerCase().includes(term) ||
            (m.reference && m.reference.toLowerCase().includes(term))
            );
        }

        this.movements = filtered;
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