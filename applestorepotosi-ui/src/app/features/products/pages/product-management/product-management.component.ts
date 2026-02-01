// src/app/products/pages/product-management/product-management.component.ts
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { Product, ProductQuery, ProductStats } from '../../models/product.model';
import { AuthService } from '../../../../auth/services/auth.service';
import { UserRole } from '../../../../auth/models/user.model';
import { SweetAlertService } from '../../../../shared/services/sweet-alert.service';
import { ToastrAlertService } from '../../../../shared/services/toastr-alert.service';

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-management.component.html',
  styleUrls: ['./product-management.component.css']
})
export class ProductManagementComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private router = inject(Router);
  public  sweetAlertService = inject(SweetAlertService);
  public  toastrAlertService = inject(ToastrAlertService);

  private destroy$ = new Subject<void>();

  // Estados
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

  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;

  canManage = false;

  ngOnInit() {
    this.checkPermissions();
    this.loadProducts();
    this.loadStats();
  }

  checkPermissions(): void {
      const user = this.authService.getCurrentUser();
      if (!user) return;
      this.canManage = this.authService.hasAnyRole([UserRole.ADMIN]);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public loadProducts() {
    this.loading = true;
    this.error = '';

    const query: ProductQuery = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      search: this.searchTerm || undefined,
      isActive: this.statusFilter === 'all' ? undefined : this.statusFilter === 'active',
      stockStatus: this.stockFilter === 'all' ? undefined : this.stockFilter,
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    };

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

  private loadStats() {
    this.productService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
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

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadProducts();
  }

  onProductSelected(product: Product) {
    this.router.navigate([ '/dashboard', 'products', 'detail', product._id]);
  }

  onProductEdit(product: Product) {
    this.router.navigate(['/dashboard', 'products', 'edit', product._id]);
  }

  onProductDelete(product: Product) {
    if (confirm(`¿Estás seguro de eliminar el producto "${product.name}"?`)) {
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
  }

  onRefresh() {
    this.loadProducts();
    this.loadStats();
  }

  onBulkAction(action: string) {
    alert(`Acción masiva "${action}" no implementada aún`);
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

  onToggleStatus(product: Product): void {
    if (!product) return;
    const action = product.isActive ? 'desactivar' : 'activar';

    this.sweetAlertService
      .confirm(
        `¿Está seguro de <b>${action}</b> el producto <b>${product.name}</b>?`,
        `Confirmar ${action}`,
        'Sí, ' + action,
        'Cancelar',
        true
      )
      .then(res => {
        if (!res.isConfirmed) return;
        this.sweetAlertService.loading('Procesando...');

        const obs = product.isActive
          ? this.productService.deactivate(product._id)
          : this.productService.activate(product._id);

        obs.subscribe({
          next: () => {
            this.sweetAlertService.close();
            this.toastrAlertService.success(
              `Producto ${product.name} ${action}do correctamente`,
              'Operación completada'
            );
            this.loadProducts();
          },
          error: () => {
            this.sweetAlertService.close();
            this.toastrAlertService.error(
              `No se pudo ${action} al usuario ${product.name}`,
              'Error'
            );
          }
        });
      });
    }
}