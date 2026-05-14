// src/app/products/components/product-list/product-list.component.ts
// VERSIÓN CORREGIDA - Componente de presentación puro (Smart/Dumb pattern)
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent {
  // ========== INPUTS DE DATOS (desde el padre) ==========
  /** Lista de productos a mostrar */
  products = input<Product[]>([]);
  /** Estado de carga */
  loading = input<boolean>(false);
  /** Mensaje de error */
  error = input<string>('');
  /** Mostrar acciones (editar/eliminar) */
  showActions = input<boolean>(true);
  /** Término de búsqueda activo (para empty state contextual) */
  searchTerm = input<string>('');
  /** Indica si hay filtros aplicados */
  hasFilters = input<boolean>(false);

  // ========== OUTPUTS DE EVENTOS (hacia el padre) ==========
  /** Producto seleccionado para ver detalle */
  productSelected = output<Product>();
  /** Producto seleccionado para editar */
  productEdit = output<Product>();
  /** Producto seleccionado para eliminar */
  productDelete = output<Product>();
  /** Producto para toggle de estado activo */
  productToggleActive = output<Product>();
  /** Solicitud de reintentar carga */
  retryLoad = output<void>();

  // ========== MÉTODOS DE PRESENTACIÓN (sin lógica de negocio) ==========

  onSelectProduct(product: Product): void {
    this.productSelected.emit(product);
  }

  onEditProduct(product: Product): void {
    this.productEdit.emit(product);
  }

  onDeleteProduct(product: Product): void {
    this.productDelete.emit(product);
  }

  onToggleActive(product: Product): void {
    this.productToggleActive.emit(product);
  }

  onRetry(): void {
    this.retryLoad.emit();
  }

  // ========== HELPERS DE UI ==========

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