// src/app/products/services/product.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable, catchError, of } from 'rxjs';
import { Product, ProductResponse, ProductStats, ProductQuery, ProductImage } from '../models/product.model';
import { environment } from '../../../../environments/environment';
import { StockMovement } from '../models/stock-movement.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/products`
  private apiUrlBase = `${environment.apiUrl}`

  // ==================== PRODUCT CRUD ====================

  create(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  findAll(query: ProductQuery): Observable<ProductResponse> {
    let params = new HttpParams();
    
    Object.keys(query).forEach(key => {
      const value = query[key as keyof ProductQuery];
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(item => params = params.append(key, item));
        } else {
          params = params.set(key, value.toString());
        }
      }
    });

    return this.http.get<ProductResponse>(this.apiUrl, { params });
  }

  findOne(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  findBySku(sku: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/sku/${sku}`);
  }

  findByBarcode(barcode: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/barcode/${barcode}`);
  }

  update(id: string, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, product);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ==================== STOCK MANAGEMENT ====================

  updateStock(id: string, quantity: number, reason?: string, referenceId?: string): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}/stock`, { quantity, reason, referenceId });
  }

  incrementStock(id: string, quantity: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/increment-stock`, { quantity });
  }

  decrementStock(id: string, quantity: number): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}/decrement-stock`, { quantity });
  }

  reserveStock(id: string, quantity: number): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}/reserve-stock`, { quantity });
  }

  releaseStock(id: string, quantity: number): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}/release-stock`, { quantity });
  }

  // ==================== STATUS MANAGEMENT ====================

  toggleActive(id: string): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}/toggle-active`, {});
  }

  toggleFeatured(id: string): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}/toggle-featured`, {});
  }

  activate(id: string): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}/activate`, {});
  }

  deactivate(id: string): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  // ==================== SPECIAL QUERIES ====================

  findActiveProducts(): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.apiUrl}/active`);
  }

  findFeaturedProducts(limit: number = 10): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/featured`, {
      params: { limit: limit.toString() }
    });
  }

  findLowStockProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/low-stock`);
  }

  findOutOfStockProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/out-of-stock`);
  }

  getStats(): Observable<ProductStats> {
    return this.http.get<ProductStats>(`${this.apiUrl}/stats`);
  }

  searchProducts(search: string, limit: number = 10): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/search`, {
      params: { q: search, limit: limit.toString() }
    });
  }

  findByCategory(categoryId: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/category/${categoryId}`);
  }

  findByBrand(brandId: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/brand/${brandId}`);
  }

  getProductsForSelect(): Observable<Array<{ _id: string; name: string; sku: string; salePrice: number }>> {
    return this.http.get<Array<{ _id: string; name: string; sku: string; salePrice: number }>>(`${this.apiUrl}/select-options`);
  }

  getProductsPaginated(page: number, limit: number): Observable<{ products: Product[]; totalPages: number }> {
    return this.http.get<{ products: Product[]; totalPages: number }>(
      `${this.apiUrl}/active-paginated`,
      { params: { page: page.toString(), limit: limit.toString() } }
    );
  }

  // ==================== VALIDATION ====================

  checkSku(sku: string, excludeId?: string): Observable<{ exists: boolean; available: boolean }> {
    let params = new HttpParams();
    if (excludeId) {
      params = params.set('excludeId', excludeId);
    }
    return this.http.get<{ exists: boolean; available: boolean }>(
      `${this.apiUrl}/check-sku/${sku}`,
      { params }
    );
  }

  checkBarcode(barcode: string, excludeId?: string): Observable<{ exists: boolean; available: boolean }> {
    let params = new HttpParams();
    if (excludeId) {
      params = params.set('excludeId', excludeId);
    }
    return this.http.get<{ exists: boolean; available: boolean }>(
      `${this.apiUrl}/check-barcode/${barcode}`,
      { params }
    );
  }

  // ==================== IMAGES MANAGEMENT ====================

  /**
   * Sube un archivo a ImageKit vía el backend.
   * Endpoint: POST /products/:id/upload
   */
  // uploadImage(productId: string, file: File, altText?: string, sortOrder?: number): Observable<ProductImage> {
  //   const formData = new FormData();
  //   formData.append('file', file);
  //   if (altText !== undefined) {
  //     formData.append('altText', altText);
  //   }
  //   if (sortOrder !== undefined) {
  //     formData.append('sortOrder', sortOrder.toString());
  //   }
  //   return this.http.post<ProductImage>(`${this.apiUrl}/${productId}/upload`, formData);
  // }

  /**
   * Asocia una imagen existente (ya subida) a un producto.
   * Endpoint: POST /products/:id/images
   */
  addProductImage(productId: string, imageData: Omit<ProductImage, '_id' | 'productId' | 'createdAt' | 'updatedAt'>): Observable<ProductImage> {
    return this.http.post<ProductImage>(`${this.apiUrl}/${productId}/images`, imageData);
  }

  getProductImages(productId: string): Observable<ProductImage[]> {
    return this.http.get<ProductImage[]>(`${this.apiUrl}/${productId}/images`);
  }

  updateProductImage(imageId: string, imageData: Partial<ProductImage>): Observable<ProductImage> {
    return this.http.put<ProductImage>(`${this.apiUrl}/images/${imageId}`, imageData);
  }

  setPrimaryImage(imageId: string): Observable<ProductImage> {
    return this.http.put<ProductImage>(`${this.apiUrl}/images/${imageId}/primary`, {});
  }

  reorderProductImages(updates: Array<{ id: string; sortOrder: number }>): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/images/reorder`, updates);
  }

  removeProductImage(imageId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/images/${imageId}`);
  }

  // ==================== STOCK HISTORY ====================

  getStockHistory(productId: string): Observable<StockMovement[]> {
    return this.http.get<StockMovement[]>(`${this.apiUrl}/${productId}/stock-history`);
  }

  // ==================== AUXILIARY DATA (flexible) ====================

  /**
   * Obtiene categorías. Soporta respuesta envuelta o array plano.
   */
  getCategories(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrlBase}/categories`).pipe(
      map(res => Array.isArray(res) ? res : (res?.categories ?? [])),
      catchError(() => of([]))
    );
  }

  /**
   * Obtiene marcas. Soporta respuesta envuelta o array plano.
   */
  getBrands(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrlBase}/brands`).pipe(
      map(res => Array.isArray(res) ? res : (res?.brands ?? [])),
      catchError(() => of([]))
    );
  }

  /**
   * Obtiene proveedores. Soporta respuesta envuelta o array plano.
   */
  getSuppliers(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrlBase}/suppliers`).pipe(
      map(res => Array.isArray(res) ? res : (res?.suppliers ?? [])),
      catchError(() => of([]))
    );
  }

  uploadProductImage(productId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    // NO enviar sortOrder ni altText si no los necesitas
    return this.http.post(`${this.apiUrl}/${productId}/upload`, formData);
  }
}