// src/app/products/pages/product-management/product-management.component.ts
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { ProductListComponent } from '../../components/product-list/product-list.component';
import { Product, ProductQuery, ProductStats } from '../../models/product.model';
import { AuthService } from '../../../auth/services/auth.service';
import { UserRole } from '../../../auth/models/user.model';

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductListComponent],
  templateUrl: './product-management.component.html',
  styleUrls: ['./product-management.component.css']
})
export class ProductManagementComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  private destroy$ = new Subject<void>();
  
  // Estados de datos
  products: Product[] = [];
  stats: ProductStats | null = null;
  loading = true;
  error = '';
  
  // Filtros avanzados
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

  ngOnInit() {
    this.loadProducts();
    this.loadStats();
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
    this.router.navigate(['/products', 'detail', product._id]);
  }

  onProductEdit(product: Product) {
    this.router.navigate(['/products', 'edit', product._id]);
  }

  onProductDelete(product: Product) {
    if (confirm(`¿Estás seguro de eliminar el producto "${product.name}"? Esta acción no se puede deshacer.`)) {
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

  onBulkAction(action: string) {
    // Implementar acciones masivas según sea necesario
    switch (action) {
      case 'export':
        this.exportProducts();
        break;
      case 'activate':
        this.bulkToggleActive(true);
        break;
      case 'deactivate':
        this.bulkToggleActive(false);
        break;
    }
  }

  private exportProducts() {
    // Implementar exportación de productos
    alert('Funcionalidad de exportación en desarrollo');
  }

  private bulkToggleActive(active: boolean) {
    // Implementar activación/desactivación masiva
    alert(`Funcionalidad de ${active ? 'activación' : 'desactivación'} masiva en desarrollo`);
  }

  onRefresh() {
    this.loadProducts();
    this.loadStats();
  }

  // Helpers para el template
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
}