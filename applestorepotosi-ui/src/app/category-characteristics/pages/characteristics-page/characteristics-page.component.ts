// src/app/category-characteristics/pages/characteristics-page/characteristics-page.component.ts
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { CategoryCharacteristicService } from '../../services/category-characteristic.service';
import { CategoryCharacteristicListComponent } from '../../components/characteristic-list/characteristic-list.component';
import {
  CategoryCharacteristic,
  CategoryCharacteristicStats,
  CategoryCharacteristicQuery,
} from '../../models/category-characteristic.model';
import { AuthService } from '../../../auth/services/auth.service';
import { UserRole } from '../../../auth/models/user.model';

@Component({
  selector: 'app-characteristics-page',
  standalone: true,
  imports: [CommonModule, RouterModule, CategoryCharacteristicListComponent],
  templateUrl: './characteristics-page.component.html',
  styleUrls: ['./characteristics-page.component.css'],
})
export class CategoryCharacteristicsPageComponent implements OnInit, OnDestroy {
  private service = inject(CategoryCharacteristicService);
  private authService = inject(AuthService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();

  characteristics: CategoryCharacteristic[] = [];
  stats: CategoryCharacteristicStats | null = null;
  loading = true;
  error = '';

  searchTerm = '';
  activeFilter: 'all' | 'active' | 'inactive' = 'all';

  canCreate = false;
  canManage = false;

  ngOnInit() {
    this.checkPermissions();
    this.loadCharacteristics();
    this.loadStats();
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

  public loadCharacteristics() {
    this.loading = true;
    this.error = '';
    const query: CategoryCharacteristicQuery = {
      search: this.searchTerm || undefined,
      isActive: this.activeFilter === 'all' ? undefined : this.activeFilter === 'active',
    };
    this.service.findAll(query).subscribe({
      next: (res) => {
        this.characteristics = res.characteristics;
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar características';
        this.loading = false;
      },
    });
  }

  private loadStats() {
    this.service.getStats().subscribe({
      next: (s) => (this.stats = s),
      error: () => {},
    });
  }

  onSearch(term: string) {
    this.searchTerm = term;
    this.loadCharacteristics();
  }

  onFilterChange(filter: 'all' | 'active' | 'inactive') {
    this.activeFilter = filter;
    this.loadCharacteristics();
  }

  onSelectCharacteristic(c: CategoryCharacteristic) {
    this.router.navigate(['/dashboard', 'category-characteristics', 'detail', c._id]);
  }

  onEditCharacteristic(c: CategoryCharacteristic) {
    this.router.navigate(['/dashboard', 'category-characteristics', 'edit', c._id]);
  }

  onDeleteCharacteristic(c: CategoryCharacteristic) {
    if (!confirm(`¿Eliminar característica "${c.name}"?`)) return;
    this.service.delete(c._id).subscribe({
      next: () => {
        this.loadCharacteristics();
        this.loadStats();
      },
    });
  }

  onCreateCharacteristic() {
    this.router.navigate(['/dashboard', 'category-characteristics', 'create']);
  }

  onManageCharacteristics() {
    this.router.navigate(['/dashboard', 'category-characteristics', 'management']);
  }

  onRefresh() {
    this.loadCharacteristics();
    this.loadStats();
  }

  getFilterClass(filter: string): string {
    return this.activeFilter === filter ? 'btn-filter active' : 'btn-filter';
  }
}