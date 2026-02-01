// src/app/categories/pages/categories-page/categories-page.component.ts
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { CategoryService } from '../../services/categories.service';
import { CategoryListComponent } from '../../components/category-list/category-list.component';
import { CategoryTreeComponent, TreeNode } from '../../components/category-tree/category-tree.component';
import { Category, CategoryStats, CategoryQuery } from '../../models/categories.model';
import { AuthService } from '../../../../auth/services/auth.service';
import { UserRole } from '../../../../auth/models/user.model';
import { StatCard } from '../../../../shared/components/stats-cards/stat-card.model';
import { StatsCardsComponent } from '../../../../shared/components/stats-cards/stats-cards.component';

@Component({
  selector: 'app-categories-page',
  standalone: true,
  imports: [ CommonModule, RouterModule, CategoryListComponent, CategoryTreeComponent, ReactiveFormsModule, NgIf, StatsCardsComponent],
  templateUrl: './categories-page.component.html',
  styleUrls: ['./categories-page.component.css'],
})
export class CategoriesPageComponent implements OnInit, OnDestroy {
  private categoryService = inject(CategoryService);
  private authService = inject(AuthService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();
  treeNodes: TreeNode[] = [];

  categories: Category[] = [];
  stats: CategoryStats | null = null;
  loading = true;
  error = '';

  searchTerm = '';
  activeFilter: 'all' | 'active' | 'inactive' = 'all';

  canCreate = false;
  canManage = false;

  searchControl = new FormControl('');

  // Tarjetas de estadísticas
  statsCards: StatCard[] = [];

  ngOnInit() {
    this.checkPermissions();
    this.setupSearchDebouncer();
    this.loadCategories();
    this.loadStats();
    this.loadTree();
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

  private setupSearchDebouncer() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(term => {
        this.searchTerm = (term ?? '').trim();
        this.loadCategories();
      });
  }

  clearSearch() {
    this.searchControl.setValue('');
  }

  public loadCategories() {
    this.loading = true;
    this.error = '';
    const query: CategoryQuery = {
      search: this.searchTerm || undefined,
      isActive: this.activeFilter === 'all' ? undefined : this.activeFilter === 'active',
    };
    this.categoryService.findAll(query).subscribe({
      next: res => {
        this.categories = res.categories;
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar categorías';
        this.loading = false;
      },
    });
  }

  private loadStats() {
    this.categoryService.getStats().subscribe({
      next: (s) => {
        this.stats = s; 

        /* ======  ARMADO MANUAL  ====== */
        this.statsCards = [
          { icon: 'bi bi-tags',          color: 'primary',   label: 'Total Categorias', value: s.total ?? 0 },
          { icon: 'bi bi-check-square-fill',         color: 'success',   label: 'Activos',         value: s.active ?? 0 },
          { icon: 'bi bi-diagram-3',    color: 'warning',      label: 'Dependientes',   value: s.withParent ?? 0 },
        ];
      },
      error: (err) => {
        console.error('Error loading stats:', err);
      },
    });
  }

  onFilterChange(filter: 'all' | 'active' | 'inactive') {
    this.activeFilter = filter;
    this.loadCategories();
  }

  onSelectCategory(category: Category) {
    this.router.navigate(['/dashboard', 'categories', 'detail', category._id]);
  }

  onEditCategory(category: Category) {
    this.router.navigate(['/dashboard', 'categories', 'edit', category._id]);
  }

  onDeleteCategory(category: Category) {
    if (!confirm(`¿Eliminar categoría "${category.name}"?`)) return;
    this.categoryService.delete(category._id).subscribe({
      next: () => {
        this.loadCategories();
        this.loadStats();
      },
    });
  }

  onCreateCategory() {
    this.router.navigate(['/dashboard', 'categories', 'create']);
  }

  onManageCategories() {
    this.router.navigate(['/dashboard', 'categories_management']);
  }

  onRefresh() {
    this.loadCategories();
    this.loadStats();
  }

  getFilterClass(filter: string): string {
    return this.activeFilter === filter ? 'btn-filter active' : 'btn-filter';
  }

  onCreateChildCategory(node: Category) {
    this.router.navigate(['/dashboard', 'categories', 'create'], {
      queryParams: { parentId: node._id },
    });
  }

  private loadTree() {
    this.categoryService.getCategoryTree().subscribe({
      next: tree => (this.treeNodes = tree),
      error: () => console.error('No se pudo cargar el árbol'),
    });
  }
}