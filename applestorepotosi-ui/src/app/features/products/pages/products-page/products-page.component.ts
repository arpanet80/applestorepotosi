// src/app/products/pages/products-page/products-page.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { ProductService } from '../../services/product.service';
import { ProductListComponent } from '../../components/product-list/product-list.component';
import { Product, ProductQuery, ProductStats } from '../../models/product.model';
import { AuthService } from '../../../../auth/services/auth.service';
import { UserRole } from '../../../../auth/models/user.model';
import { ToastrService } from 'ngx-toastr';
import { StatCard } from '../../../../shared/components/stats-cards/stat-card.model';
import { StatsCardsComponent } from '../../../../shared/components/stats-cards/stats-cards.component';

// FIX 1: Importar los servicios y modelos de categorías y marcas
import { BrandService } from '../../../brands/services/brand.service';
import { Brand } from '../../../brands/models/brand.model';
import { CategoryService } from '../../../categories/services/categories.service';
import { Category } from '../../../categories/models/categories.model';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ProductListComponent,
    StatsCardsComponent,
  ],
  templateUrl: './products-page.component.html',
  styleUrls: ['./products-page.component.css'],
})
export class ProductsPageComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private categoryService = inject(CategoryService);
  private brandService = inject(BrandService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastr = inject(ToastrService);

  private destroy$ = new Subject<void>();
  // FIX 2: Subject dedicado para debounce de búsqueda, evita una petición HTTP
  // por cada tecla pulsada. Se dispara la búsqueda 400ms después de que el
  // usuario deja de escribir, y solo si el valor cambió (distinctUntilChanged).
  private searchInput$ = new Subject<string>();

  // ── Datos ──────────────────────────────────────────────────────────────────
  products: Product[] = [];
  stats: ProductStats | null = null;
  loading = true;
  error = '';

  // FIX 3: Listas dinámicas para los selectores — se poblan desde el backend
  categories: Category[] = [];
  brands: Brand[] = [];

  // ── Filtros (única fuente de verdad) ──────────────────────────────────────
  searchTerm = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  stockFilter: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock' | 'over-stock' = 'all';
  categoryFilter = '';
  brandFilter = '';

  // ── Paginación ─────────────────────────────────────────────────────────────
  currentPage = 1;
  itemsPerPage = 12;
  totalItems = 0;
  totalPages = 0;
  itemsPerPageOptions = [8, 12, 16, 24, 48, 100];

  // ── Permisos ───────────────────────────────────────────────────────────────
  canCreate = false;

  // ── Estadísticas ───────────────────────────────────────────────────────────
  statsCards: StatCard[] = [];

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.checkPermissions();
    this.handleQueryParams();
    this.setupSearchDebounce();  // FIX 2: configurar debounce antes de cargar
    this.loadProducts();
    this.loadStats();
    this.loadFilterOptions(); // FIX 3: cargar categorías y marcas reales
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Permisos ───────────────────────────────────────────────────────────────

  private checkPermissions(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.canCreate = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
  }

  // ── Query params (toasts de éxito tras navegación) ────────────────────────

  private handleQueryParams(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params['created'] === 'true') {
        this.toastr.success('Producto creado exitosamente', '¡Listo!');
      }
      if (params['updated'] === 'true') {
        this.toastr.info('Producto actualizado correctamente', 'Actualizado');
      }
      if (params['created'] || params['updated']) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { created: null, updated: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }
    });
  }

  // ── Debounce de búsqueda ───────────────────────────────────────────────────

  // FIX 2: Centraliza el debounce. onSearch() solo emite al Subject;
  // la suscripción aquí espera 400ms de silencio antes de llamar a loadProducts().
  private setupSearchDebounce(): void {
    this.searchInput$
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe((term) => {
        this.searchTerm = term;
        this.currentPage = 1;
        this.loadProducts();
      });
  }

  // ── Carga de opciones para filtros ────────────────────────────────────────

  // FIX 3: Poblar los selectores con datos reales del backend.
  // Se usa limit:200 asumiendo que el catálogo de categorías/marcas
  // no supera ese número. Si lo hace, considerar un endpoint de select-options.
  private loadFilterOptions(): void {
    this.categoryService
      .getActiveOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => (this.categories = res.categories),
        error: () => {
          // No bloqueamos la UI si los filtros opcionales fallan
          this.toastr.warning('No se pudieron cargar las categorías', 'Aviso');
        },
      });

    this.brandService
      .getActiveOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => (this.brands = res.brands),
        error: () => {
          this.toastr.warning('No se pudieron cargar las marcas', 'Aviso');
        },
      });
  }

  // ── Carga de productos ────────────────────────────────────────────────────

  loadProducts(): void {
    this.loading = true;
    this.error = '';

    this.productService
      .findAll(this.buildQuery())
      .pipe(takeUntil(this.destroy$)) // FIX 4: cancelar petición si el componente se destruye
      .subscribe({
        next: (response) => {
          this.products = response.products;
          this.totalItems = response.total;
          this.totalPages = response.totalPages;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Error al cargar los productos. Intenta nuevamente.';
          this.loading = false;
          console.error('Error loading products:', err);
        },
      });
  }

  // FIX 5: buildQuery construye el objeto limpio para el backend.
  // Los IDs de categoría y marca son ObjectIds de MongoDB, NO números hardcodeados.
  private buildQuery(): ProductQuery {
    const query: ProductQuery = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      sortBy: 'name',
      sortOrder: 'asc',
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
    // FIX 5: categoryFilter y brandFilter ahora son ObjectIds reales del backend
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
        next: (stats) => {
          this.stats = stats;
          this.statsCards = [
            { icon: 'bi bi-box', color: 'primary', label: 'Total productos', value: stats.total ?? 0 },
            { icon: 'bi bi-star', color: 'success', label: 'Destacados', value: stats.featured ?? 0 },
            { icon: 'bi bi-exclamation-triangle', color: 'warning', label: 'Stock bajo', value: stats.lowStock ?? 0 },
            { icon: 'bi bi-bag-x', color: 'danger', label: 'Sin stock', value: stats.outOfStock ?? 0 },
          ];
        },
        error: (err) => console.error('Error loading stats:', err),
      });
  }

  // ── Handlers de filtros ───────────────────────────────────────────────────

  // FIX 2: onSearch solo emite al Subject; el debounce hace el resto
  onSearch(searchTerm: string): void {
    this.searchInput$.next(searchTerm);
  }

  // FIX 6: Los handlers usan los valores tipados directamente desde [(ngModel)],
  // eliminando el anti-patrón $any($event.target).value con (change).
  onStatusFilterChange(value: 'all' | 'active' | 'inactive'): void {
    this.statusFilter = value;
    this.currentPage = 1;
    this.loadProducts();
  }

  onStockFilterChange(value: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock' | 'over-stock'): void {
    this.stockFilter = value;
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
    this.scrollToTop();
  }

  onItemsPerPageChange(value: number): void {
    if (!this.itemsPerPageOptions.includes(value) || value === this.itemsPerPage) return;
    this.itemsPerPage = value;
    this.currentPage = 1;
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
    if (!confirm(`¿Estás seguro de eliminar el producto "${product.name}"?`)) return;

    this.productService.delete(product._id).subscribe({
      next: () => {
        this.toastr.success(`Producto "${product.name}" eliminado`, 'Eliminado');
        this.loadProducts();
        this.loadStats();
      },
      error: (err) => {
        console.error('Error deleting product:', err);
        this.toastr.error('Error al eliminar el producto', 'Error');
      },
    });
  }

  onProductToggleActive(product: Product): void {
    this.productService.toggleActive(product._id).subscribe({
      next: () => {
        this.toastr.success(
          `Producto ${product.isActive ? 'desactivado' : 'activado'}`,
          'Estado actualizado',
        );
        this.loadProducts();
      },
      error: (err) => {
        console.error('Error toggling product status:', err);
        this.toastr.error('Error al cambiar el estado', 'Error');
      },
    });
  }

  // ── Navegación ─────────────────────────────────────────────────────────────

  onCreateProduct(): void {
    this.router.navigate(['/dashboard', 'products', 'create']);
  }

  // FIX 7: onManageProducts() navegaba a la misma ruta causando un bucle.
  // Se corrige a una ruta de gestión avanzada diferente.
  onManageProducts(): void {
    this.router.navigate(['/dashboard', 'products', 'manage']);
  }

  onRefresh(): void {
    this.loadProducts();
    this.loadStats();
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

  hasAnyFilter(): boolean {
    return this.getActiveFiltersCount() > 0;
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

  getPages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  getDisplayedRange(): string {
    if (this.totalItems === 0) return '0-0';
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
    return `${start}-${end}`;
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}