// src/app/products/components/product-detail/product-detail.component.ts - CORREGIDO DEFINITIVAMENTE
import { Component, OnInit, inject, OnDestroy, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { Product, ProductImage } from '../../models/product.model';
import { AuthService } from '../../../../auth/services/auth.service';
import { UserRole } from '../../../../auth/models/user.model';
import { KeenImageViewerComponent } from '../../../../shared/components/keen-image-viewer/keen-image-viewer/keen-image-viewer';

declare var bootstrap: any;

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, KeenImageViewerComponent ], 
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit, OnDestroy, AfterViewChecked  {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  
  private destroy$ = new Subject<void>();
  
  private tooltipsCreated = false;

  product!: Product;
  productImages: ProductImage[] = [];
  loading = true;
  error = '';

  imageUrls: string[] = []; 
  
  // Estados de UI
  activeTab: 'details' | 'specifications' | 'stock' | 'images' = 'details';
  primaryImage?: ProductImage;
  selectedImage?: ProductImage;
  
  // Permisos
  canEdit = false;
  canManageStock = false;
  canDelete = false;

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const productId = params['id'];
      if (productId) {
        this.loadProduct(productId);
        this.loadProductImages(productId);
      }
    });

    this.checkPermissions();
  }

  ngAfterViewChecked(): void {
    if (!this.tooltipsCreated) {
      const list = [].slice.call(
        document.querySelectorAll('[data-bs-toggle="tooltip"]')
      );
      if (list.length) {
        list.forEach((el: HTMLElement) => new bootstrap.Tooltip(el));
        this.tooltipsCreated = true;
      }
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkPermissions() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.canEdit = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
    this.canManageStock = this.authService.hasAnyRole([UserRole.ADMIN, UserRole.SALES]);
    this.canDelete = this.authService.hasAnyRole([UserRole.ADMIN]);
  }

  private loadProduct(productId: string) {
    this.loading = true;
    this.error = '';

    this.productService.findOne(productId).subscribe({
      next: (product) => {
        this.product = product;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar el producto';
        this.loading = false;
        console.error('Error loading product:', err);
      }
    });
  }

  private loadProductImages(productId: string) {
    this.productService.getProductImages(productId).subscribe({
      next: (images) => {
        this.productImages = images;
        this.imageUrls = images.map(img => img.url); 
        this.primaryImage = images.find(img => img.isPrimary) || images[0];
        this.selectedImage = this.primaryImage;
      },
      error: (err) => {
        console.error('Error loading product images:', err);
      }
    });
  }

  onEditProduct() {
    this.router.navigate(['/dashboard', 'products', 'edit', this.product._id]);
  }

  onManageStock() {
    this.router.navigate(['/dashboard', 'products', 'stock', this.product._id]);
  }

  onToggleActive() {
    if (!this.product) return;

    this.productService.toggleActive(this.product._id).subscribe({
      next: (updatedProduct) => {
        this.product = updatedProduct;
      },
      error: (err) => {
        console.error('Error toggling product active status:', err);
        alert('Error al cambiar el estado del producto');
      }
    });
  }

  onToggleFeatured() {
    if (!this.product) return;

    this.productService.toggleFeatured(this.product._id).subscribe({
      next: (updatedProduct) => {
        this.product = updatedProduct;
      },
      error: (err) => {
        console.error('Error toggling product featured status:', err);
        alert('Error al cambiar el estado destacado');
      }
    });
  }

  onDeleteProduct() {
    if (!this.product) return;

    const confirmMessage = `¿Estás seguro de eliminar el producto "${this.product.name}"?\nEsta acción no se puede deshacer.`;
    
    if (confirm(confirmMessage)) {
      this.productService.delete(this.product._id).subscribe({
        next: () => {
          this.router.navigate(['/products'], {
            queryParams: { deleted: true }
          });
        },
        error: (err) => {
          console.error('Error deleting product:', err);
          alert('Error al eliminar el producto');
        }
      });
    }
  }

  selectImage(image: ProductImage) {
    this.selectedImage = image;
  }

  setActiveTab(tab: 'details' | 'specifications' | 'stock' | 'images') {
    this.activeTab = tab;
  }

  // === MÉTODOS CORREGIDOS DEFINITIVAMENTE ===

  hasSpecifications(): boolean {
    return !!this.product?.specifications && Object.keys(this.product.specifications).length > 0;
  }

  getSpecifications(): { key: string; value: any }[] {
    if (!this.product?.specifications) return [];
    
    return Object.entries(this.product.specifications).map(([key, value]) => ({
      key: this.formatSpecificationKey(key),
      value
    }));
  }

  getStockStatusClass(): string {
    if (!this.product) return 'status-unknown';
    
    switch (this.product.stockStatus) {
      case 'out-of-stock': return 'status-out-of-stock';
      case 'low-stock': return 'status-low-stock';
      case 'over-stock': return 'status-over-stock';
      default: return 'status-in-stock';
    }
  }

  getStockStatusText(): string {
    if (!this.product) return 'Desconocido';
    
    switch (this.product.stockStatus) {
      case 'out-of-stock': return 'Sin Stock';
      case 'low-stock': return 'Stock Bajo';
      case 'over-stock': return 'Stock Excedido';
      default: return 'En Stock';
    }
  }

  getStockLevelPercentage(): number {
    if (!this.product) return 0;
    
    const available = this.product.availableQuantity || 0;
    const maxStock = this.product.maxStock || this.product.stockQuantity || 1;
    
    return Math.min((available / maxStock) * 100, 100);
  }

  getStockLevelClass(): string {
    const percentage = this.getStockLevelPercentage();
    
    if (percentage === 0) return 'level-empty';
    if (percentage <= 25) return 'level-low';
    if (percentage <= 75) return 'level-medium';
    return 'level-high';
  }

  private formatSpecificationKey(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  get toggleTextDesactivar(): string {
    return this.product?.isActive ? 'Desactivar producto' : 'Activar producto';
  }
  
  get toggleTextDestacado(): string {
    return this.product?.isFeatured ? 'Quitar Destacado' : 'Destacar';
  }



}