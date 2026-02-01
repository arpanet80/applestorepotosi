// src/app/products/components/product-list/product-list.component.ts
import { Component, OnInit, inject, output, input } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product, ProductQuery } from '../../models/product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIf],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  
  // Inputs para filtros
  filters = input<Partial<ProductQuery>>({});
  showActions = input(true);
  
  // Outputs para eventos
  productSelected = output<Product>();
  productEdit = output<Product>();
  productDelete = output<Product>();
  
  products: Product[] = [];
  loading = false;
  error = '';

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading = true;
    this.error = '';
    
    const query = this.filters() as ProductQuery;
    
    this.productService.findAll(query).subscribe({
      next: (response) => {
        this.products = response.products;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los productos';
        this.loading = false;
        console.error('Error loading products:', err);
      }
    });
  }

  onSelectProduct(product: Product) {
    this.productSelected.emit(product);
  }

  onEditProduct(product: Product) {
    this.productEdit.emit(product);
  }

  onDeleteProduct(product: Product) {
    if (confirm(`¿Estás seguro de eliminar el producto "${product.name}"?`)) {
      this.productDelete.emit(product);
    }
  }

  toggleActive(product: Product) {
    this.productService.toggleActive(product._id).subscribe({
      next: (updatedProduct) => {
        const index = this.products.findIndex(p => p._id === product._id);
        if (index !== -1) {
          this.products[index] = updatedProduct;
        }
      },
      error: (err) => {
        console.error('Error toggling product active status:', err);
        alert('Error al cambiar el estado del producto');
      }
    });
  }

  getStockStatusClass(product: Product): string {
    switch (product.stockStatus) {
      case 'out-of-stock': return 'status-out-of-stock';
      case 'low-stock': return 'status-low-stock';
      case 'over-stock': return 'status-over-stock';
      default: return 'status-in-stock';
    }
  }

  getStockStatusText(product: Product): string {
    switch (product.stockStatus) {
      case 'out-of-stock': return 'Sin Stock';
      case 'low-stock': return 'Stock Bajo';
      case 'over-stock': return 'Stock Excedido';
      default: return 'En Stock';
    }
  }
}