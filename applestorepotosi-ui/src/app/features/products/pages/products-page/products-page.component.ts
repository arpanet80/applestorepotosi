// src/app/products/pages/products-page/products-page.component.ts
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, take, takeUntil } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { ProductListComponent } from '../../components/product-list/product-list.component';
import { Product, ProductQuery, ProductStats } from '../../models/product.model';
import { AuthService } from '../../../../auth/services/auth.service';
import { UserRole } from '../../../../auth/models/user.model';
import { ToastrService } from 'ngx-toastr';
import { StatCard } from '../../../../shared/components/stats-cards/stat-card.model';
import { StatsCardsComponent } from '../../../../shared/components/stats-cards/stats-cards.component';
import { StatsMapperService } from '../../../../shared/components/stats-cards/stats-mapper.service';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductListComponent, StatsCardsComponent],
  templateUrl: './products-page.component.html',
  styleUrls: ['./products-page.component.css']
})
export class ProductsPageComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastr = inject(ToastrService);
  // private mapperStats!: StatsMapperService
  
  private destroy$ = new Subject<void>();
  
  // Estados de datos
  products: Product[] = [];
  stats: ProductStats | null = null;
  loading = true;
  error = '';

  // Filtros
  searchTerm = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  stockFilter: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock' = 'all';
  categoryFilter = '';
  brandFilter = '';
  
  // Filtros y búsqueda
  activeFilter: 'all' | 'active' | 'inactive' | 'featured' | 'low-stock' | 'out-of-stock' = 'all';
  
  // Paginación
  currentPage = 1;
  itemsPerPage = 12;
  totalItems = 0;
  totalPages = 0;
  
  // Permisos
  canCreate = false;
  canManage = false;

  // Tarjetas de estadísticas
  statsCards: StatCard[] = [];

  ngOnInit() {

    this.checkPermissions();

    this.route.queryParams.pipe(take(1)).subscribe(params => {
      if (params['created'] === 'true') {
        this.toastr.success('Producto creado exitosamente', '¡Listo!');
      }
      if (params['updated'] === 'true') {
        this.toastr.info('Producto actualizado correctamente', 'Actualizado');
      }
    });

    // 👇 Limpia los parámetros sin recargar
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { created: null, updated: null },
      queryParamsHandling: 'merge'
    });

    this.loadProducts();
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

  public loadProducts() {
    this.loading = true;
    this.error = '';

    const query: ProductQuery = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      search: this.searchTerm || undefined,
      sortBy: 'name',
      sortOrder: 'asc'
    };

    // Aplicar filtros activos
    this.applyActiveFilter(query);

    this.productService.findAll(query).subscribe({
      next: (response) => {
        this.products = response.products;
        this.totalItems = response.total;
        this.totalPages = response.totalPages;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los productos';
        this.loading = false;
        console.error('Error loading products:', err);
      }
    });
  }

  private applyActiveFilter(query: ProductQuery) {
    switch (this.activeFilter) {
      case 'active':
        query.isActive = true;
        break;
      case 'inactive':
        query.isActive = false;
        break;
      case 'featured':
        query.isActive = true;
        query.isFeatured = true;
        break;
      case 'low-stock':
        query.stockStatus = 'low-stock';
        query.isActive = true;
        break;
      case 'out-of-stock':
        query.stockStatus = 'out-of-stock';
        query.isActive = true;
        break;
      default:
        // 'all' - no aplicar filtros adicionales
        break;
    }
  }

  private loadStats() {
    this.productService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;

        /* ======  ARMADO MANUAL  ====== */
        this.statsCards = [
          { icon: 'bi bi-box',          color: 'primary',   label: 'Total productos', value: stats.total ?? 0 },
          { icon: 'bi bi-star',         color: 'success',   label: 'Destacados',         value: stats.featured ?? 0 },
          { icon: 'bi bi-exclamation-triangle',    color: 'warning',      label: 'Stock bajo',   value: stats.lowStock ?? 0 },
          { icon: 'bi-bag-x',   color: 'danger', label: 'Sin stock', value: stats.outOfStock ?? 0 }
        ];

      },
      error: (err) => {
        console.error('Error loading stats:', err);
      }
    });
  }

  onSearch(searchTerm: string) {
    this.searchTerm = searchTerm;
    this.currentPage = 1;
    this.loadProducts();
  }

  onFilterChange(filter: 'all' | 'active' | 'inactive' | 'featured' | 'low-stock' | 'out-of-stock') {
    this.activeFilter = filter;
    this.currentPage = 1;
    this.loadProducts();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadProducts();
    this.scrollToTop();
  }

  onProductSelected(product: Product) {
    this.router.navigate(['/dashboard', 'products', 'detail', product._id]);
  }

  onProductEdit(product: Product) {
    this.router.navigate(['/products', 'edit', product._id]);
  }

  onProductDelete(product: Product) {
    this.productService.delete(product._id).subscribe({
      next: () => {
        this.loadProducts();
        this.loadStats();
      },
      error: (err) => {
        console.error('Error deleting product:', err);
        alert('Error al eliminar el producto');
      }
    });
  }

  onCreateProduct() {
    this.router.navigate(['/products', 'create']);
  }

  onManageProducts() {
    this.router.navigate(['/products', 'management']);
  }

  onRefresh() {
    this.loadProducts();
    this.loadStats();
  }

  private scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Helpers para el template
  getFilterButtonClass(filter: string): string {
    return this.activeFilter === filter ? 'btn-filter active' : 'btn-filter';
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
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.statusFilter !== 'all') count++;
    if (this.stockFilter !== 'all') count++;
    if (this.categoryFilter) count++;
    if (this.brandFilter) count++;
    if (this.searchTerm) count++;
    return count;
  }

  clearAllFilters() {
    this.statusFilter = 'all';
    this.stockFilter = 'all';
    this.categoryFilter = '';
    this.brandFilter = '';
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadProducts();
  }

  onStatusFilterChange(filter: 'all' | 'active' | 'inactive') {
    this.statusFilter = filter;
    this.currentPage = 1;
    this.loadProducts();
  }

  onStockFilterChange(filter: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock') {
    this.stockFilter = filter;
    this.currentPage = 1;
    this.loadProducts();
  }

  onCategoryFilterChange(categoryId: string) {
    this.categoryFilter = categoryId;
    this.currentPage = 1;
    this.loadProducts();
  }

  onBrandFilterChange(brandId: string) {
    this.brandFilter = brandId;
    this.currentPage = 1;
    this.loadProducts();
  }

}