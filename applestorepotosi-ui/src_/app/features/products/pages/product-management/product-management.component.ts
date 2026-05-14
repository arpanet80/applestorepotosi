// src/app/products/pages/product-management/product-management.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { ProductService } from '../../services/product.service';
import { Product, ProductQuery, ProductStats } from '../../models/product.model';
import { AuthService } from '../../../../auth/services/auth.service';
import { UserRole } from '../../../../auth/models/user.model';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';
import { ToastrAlertService } from '../../../../shared/services/toastr-alert.service';
import { Category } from '../../../categories/models/categories.model';
import { Brand } from '../../../brands/models/brand.model';
import { CategoryService } from '../../../categories/services/categories.service';
import { BrandService } from '../../../brands/services/brand.service';

interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-product-management',
  standalone: true,
  // FIX 1: FormsModule faltaba — necesario para [(ngModel)] en los selects del HTML
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product-management.component.html',
  styleUrls: ['./product-management.component.css'],
})
export class ProductManagementComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private router = inject(Router);
  public sweetAlertService = inject(SweetAlertService);
  public toastrAlertService = inject(ToastrAlertService);
  private categoryService = inject(CategoryService);
  private brandService = inject(BrandService);

  private destroy$ = new Subject<void>();
  // FIX 2: Subject para debounce de búsqueda — evita un HTTP por cada tecla
  private searchInput$ = new Subject<string>();

  // ── Datos ──────────────────────────────────────────────────────────────────
  products: Product[] = [];
  stats: ProductStats | null = null;
  loading = true;
  error = '';

  // ── Filtros ────────────────────────────────────────────────────────────────
  searchTerm = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  stockFilter: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock' | 'over-stock' = 'all';
  categoryFilter = '';
  brandFilter = '';

  // FIX 3: Listas dinámicas desde el backend via ProductService.getCategories/getBrands
  // categories: SelectOption[] = [];
  // brands: SelectOption[] = [];
  categories: Category[] = [];
  brands: Brand[] = [];
  filtersLoaded = false;

  // ── Paginación ─────────────────────────────────────────────────────────────
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;

  canManage = false;

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.checkPermissions();
    this.setupSearchDebounce(); // FIX 2: inicializar antes de cualquier carga
    this.loadFilterOptions();  // FIX 3: cargar opciones reales del backend
    this.loadProducts();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Permisos ───────────────────────────────────────────────────────────────

  checkPermissions(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.canManage = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
  }

  // ── Debounce de búsqueda ───────────────────────────────────────────────────

  private setupSearchDebounce(): void {
    this.searchInput$
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.searchTerm = term;
        this.currentPage = 1;
        this.loadProducts();
      });
  }

  // ── Opciones de filtros desde el backend ──────────────────────────────────

  // FIX 3: ProductService ya tiene getCategories() y getBrands() que manejan
  // tanto respuesta envuelta ({ categories: [] }) como array plano.
  private loadFilterOptions(): void {
    this.categoryService
    .getActiveOptions()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res) => (this.categories = res.categories),
      error: () => {
        this.toastrAlertService.warning('No se pudieron cargar las categorías', 'Aviso');
        this.categories = [];
      },
    });

  this.brandService
    .getActiveOptions()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res) => {
        this.brands = res.brands;
        this.filtersLoaded = true;
      },
      error: () => {
        this.toastrAlertService.warning('No se pudieron cargar las marcas', 'Aviso');
        this.brands = [];
        this.filtersLoaded = true;
      },
    });
  }

  // ── Carga de productos ────────────────────────────────────────────────────

  loadProducts(): void {
    this.loading = true;
    this.error = '';

    this.productService
      .findAll(this.buildQuery())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.products = response.products;
          this.totalItems = response.total;
          this.totalPages = response.totalPages;
          this.loading = false;
        },
        error: (err) => {
          // FIX 4: Mostrar el mensaje real del backend para facilitar el debug,
          // además del mensaje genérico para el usuario.
          const backendMsg = err?.error?.message;
          console.error('Error loading products:', backendMsg ?? err);
          this.error = 'Error al cargar los productos. Por favor, intente nuevamente.';
          this.loading = false;
        },
      });
  }

  private buildQuery(): ProductQuery {
      const query: ProductQuery = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    if (this.searchTerm.trim()) {
      query.search = this.searchTerm.trim();
    }
    if (this.statusFilter !== 'all') {
      query.isActive = this.statusFilter === 'active';
    }
    if (this.stockFilter !== 'all') {
      query.stockStatus = this.stockFilter;
    }
    if (this.categoryFilter) {
      query.categoryId = this.categoryFilter;
    }
    if (this.brandFilter) {
      query.brandId = this.brandFilter;
    }

    return query;
  }

  // ── Estadísticas ───────────────────────────────────────────────────────────

  private loadStats(): void {
    this.productService
      .getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => (this.stats = stats),
        error: (err) => console.error('Error loading stats:', err),
      });
  }

  // ── Handlers de filtros ───────────────────────────────────────────────────

  // FIX 2: onSearch solo emite al Subject; el debounce hace el resto
  onSearch(searchTerm: string): void {
    this.searchInput$.next(searchTerm);
  }

  onStatusFilterChange(filter: 'all' | 'active' | 'inactive'): void {
    this.statusFilter = filter;
    this.currentPage = 1;
    this.loadProducts();
  }

  onStockFilterChange(filter: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock' | 'over-stock'): void {
    this.stockFilter = filter;
    this.currentPage = 1;
    this.loadProducts();
  }

  onCategoryFilterChange(categoryId: string): void {
    this.categoryFilter = categoryId;
    this.currentPage = 1;
    this.loadProducts();
  }

  onBrandFilterChange(brandId: string): void {
    this.brandFilter = brandId;
    this.currentPage = 1;
    this.loadProducts();
  }

  // ── Paginación ─────────────────────────────────────────────────────────────

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadProducts();
  }

  // ── Acciones sobre productos ──────────────────────────────────────────────

  onProductSelected(product: Product): void {
    this.router.navigate(['/dashboard', 'products', 'detail', product._id]);
  }

  onProductEdit(product: Product): void {
    this.router.navigate(['/dashboard', 'products', 'edit', product._id]);
  }

  onProductDelete(product: Product): void {
    this.sweetAlertService
      .confirm(
        `¿Está seguro de eliminar el producto <b>${product.name}</b>?<br>Esta acción no se puede deshacer.`,
        'Confirmar eliminación',
        'Sí, eliminar',
        'Cancelar',
        true,
      )
      .then((res) => {
        if (!res.isConfirmed) return;
        this.sweetAlertService.loading('Eliminando...');

        this.productService
          .delete(product._id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.sweetAlertService.close();
              this.toastrAlertService.success(
                `Producto "${product.name}" eliminado correctamente`,
                'Eliminación completada',
              );
              this.loadProducts();
              this.loadStats();
            },
            error: (err) => {
              this.sweetAlertService.close();
              this.toastrAlertService.error(
                `No se pudo eliminar el producto "${product.name}"`,
                'Error',
              );
              console.error('Error deleting product:', err);
            },
          });
      });
  }

  onToggleStatus(product: Product): void {
    if (!product) return;
    const action = product.isActive ? 'desactivar' : 'activar';
    const pastTense = product.isActive ? 'desactivado' : 'activado';

    this.sweetAlertService
      .confirm(
        `¿Está seguro de <b>${action}</b> el producto <b>${product.name}</b>?`,
        `Confirmar ${action}`,
        `Sí, ${action}`,
        'Cancelar',
        true,
      )
      .then((res) => {
        if (!res.isConfirmed) return;
        this.sweetAlertService.loading('Procesando...');

        const obs$ = product.isActive
          ? this.productService.deactivate(product._id)
          : this.productService.activate(product._id);

        obs$.pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.sweetAlertService.close();
            this.toastrAlertService.success(
              `Producto "${product.name}" ${pastTense} correctamente`,
              'Operación completada',
            );
            this.loadProducts();
          },
          error: () => {
            this.sweetAlertService.close();
            this.toastrAlertService.error(
              `No se pudo ${action} el producto "${product.name}"`,
              'Error',
            );
          },
        });
      });
  }

  onRefresh(): void {
    this.loadProducts();
    this.loadStats();
  }

  onBulkAction(action: string): void {
    this.toastrAlertService.info(
      `Acción masiva "${action}" no implementada aún`,
      'En desarrollo',
    );
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  clearAllFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.stockFilter = 'all';
    this.categoryFilter = '';
    this.brandFilter = '';
    this.currentPage = 1;
    this.loadProducts();
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.statusFilter !== 'all') count++;
    if (this.stockFilter !== 'all') count++;
    if (this.categoryFilter) count++;
    if (this.brandFilter) count++;
    if (this.searchTerm.trim()) count++;
    return count;
  }

  getDisplayedRange(): string {
    if (this.totalItems === 0) return '0 de 0';
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
    return `${start}-${end} de ${this.totalItems}`;
  }

  getPages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  trackByProductId(_index: number, product: Product): string {
    return product._id;
  }
}