// characteristics-page.component.ts
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { CategoryCharacteristicService } from '../../services/category-characteristic.service';
import { CategoryCharacteristicListComponent } from '../../components/characteristic-list/characteristic-list.component';
import {CategoryCharacteristic,CategoryCharacteristicStats,CategoryCharacteristicQuery,} from '../../models/category-characteristic.model';
import { AuthService } from '../../../../auth/services/auth.service';
import { UserRole } from '../../../../auth/models/user.model';

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

  /* Filtros */
  searchTerm = '';
  activeFilter: 'all' | 'active' | 'inactive' = 'all';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  typeFilter = '';
  requiredFilter = '';
  categoryFilter = '';

  /* Paginación */
  currentPage = 1;
  itemsPerPage = 12;
  totalItems = 0;
  totalPages = 0;

  /* Auxiliares */
  canCreate = false;
  canManage = false;
  categories: { _id: string; name: string }[] = [];

  ngOnInit() {
    this.checkPermissions();
    this.loadCategories();
    this.loadCharacteristics();
    this.loadStats();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* ---------- Permisos ---------- */
  private checkPermissions() {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.canCreate = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
    this.canManage = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
  }

  /* ---------- Carga de datos ---------- */
  public loadCharacteristics() {
    this.loading = true;
    this.error = '';

    const query: CategoryCharacteristicQuery = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      search: this.searchTerm || undefined,
      isActive: this.statusFilter === 'all' ? undefined : this.statusFilter === 'active',
      type: this.typeFilter || undefined,
      isRequired: this.requiredFilter === '' ? undefined : this.requiredFilter === 'true',
      categoryId: this.categoryFilter || undefined,
    };

    this.service.findAll(query).subscribe({
      next: (res) => {
        this.characteristics = res.characteristics;
        this.totalItems = res.total;
        this.totalPages = res.totalPages;
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

  private loadCategories() {
    // Mock / reemplazar por servicio real
    this.categories = [
      { _id: '1', name: 'Smartphones' },
      { _id: '2', name: 'Laptops' },
      { _id: '3', name: 'Tablets' },
      { _id: '4', name: 'Wearables' },
      { _id: '5', name: 'Accessories' },
    ];
  }

  /* ---------- Eventos de filtros ---------- */
  onSearch(term: string) {
    this.searchTerm = term;
    this.currentPage = 1;
    this.loadCharacteristics();
  }

  onFilterChange(filter: 'all' | 'active' | 'inactive') {
    this.activeFilter = filter;
    this.statusFilter = filter;
    this.currentPage = 1;
    this.loadCharacteristics();
  }

  onStatusFilterChange(filter: 'all' | 'active' | 'inactive') {
    this.statusFilter = filter;
    this.currentPage = 1;
    this.loadCharacteristics();
  }

  onTypeFilterChange(filter: string) {
    this.typeFilter = filter;
    this.currentPage = 1;
    this.loadCharacteristics();
  }

  onRequiredFilterChange(filter: string) {
    this.requiredFilter = filter;
    this.currentPage = 1;
    this.loadCharacteristics();
  }

  onCategoryFilterChange(categoryId: string) {
    this.categoryFilter = categoryId;
    this.currentPage = 1;
    this.loadCharacteristics();
  }

  clearAllFilters() {
    this.searchTerm = '';
    this.activeFilter = 'all';
    this.statusFilter = 'all';
    this.typeFilter = '';
    this.requiredFilter = '';
    this.categoryFilter = '';
    this.currentPage = 1;
    this.loadCharacteristics();
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.searchTerm) count++;
    if (this.statusFilter !== 'all') count++;
    if (this.typeFilter) count++;
    if (this.requiredFilter) count++;
    if (this.categoryFilter) count++;
    return count;
  }

  /* ---------- Paginación ---------- */
  onPageChange(page: number) {
    this.currentPage = page;
    this.loadCharacteristics();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getDisplayedRange(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
    return `${start}-${end} de ${this.totalItems}`;
  }

  getPages(): number[] {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  }

  /* ---------- Navegación ---------- */
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

  /* ---------- helpers para botones antiguos ---------- */
  getFilterClass(filter: string): string {
    return this.activeFilter === filter ? 'btn-filter active' : 'btn-filter';
  }
}