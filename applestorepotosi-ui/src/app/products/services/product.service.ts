// src/app/products/services/product.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Product, ProductResponse, ProductStats, ProductQuery, ProductImage } from '../models/product.model';
import { environment } from '../../../environments/environment';
import { StockMovement } from '../models/stock-movement.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/products`
  private apiUrlBase = `${environment.apiUrl}`

  // Product CRUD
  create(product: any): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, { ...product });
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

  update(id: string, product: any): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, product);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Stock Management
  updateStock(id: string, quantity: number, reason?: string): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}/stock`, { quantity, reason });
  }

  incrementStock(id: string, quantity: number): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}/increment-stock`, { quantity });
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

  // Status Management
  toggleActive(id: string): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}/toggle-active`, {});
  }

  toggleFeatured(id: string): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}/toggle-featured`, {});
  }

  // Special Queries
  findActiveProducts(): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.apiUrl}/active`);
  }

  findFeaturedProducts(limit: number = 10): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/featured?limit=${limit}`);
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
    return this.http.get<Product[]>(`${this.apiUrl}/search?q=${search}&limit=${limit}`);
  }

  findByCategory(categoryId: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/category/${categoryId}`);
  }

  findByBrand(brandId: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/brand/${brandId}`);
  }

  // Validation
  checkSku(sku: string, excludeId?: string): Observable<{ exists: boolean; available: boolean }> {
    let url = `${this.apiUrl}/check-sku/${sku}`;
    if (excludeId) {
      url += `?excludeId=${excludeId}`;
    }
    return this.http.get<{ exists: boolean; available: boolean }>(url);
  }

  checkBarcode(barcode: string, excludeId?: string): Observable<{ exists: boolean; available: boolean }> {
    let url = `${this.apiUrl}/check-barcode/${barcode}`;
    if (excludeId) {
      url += `?excludeId=${excludeId}`;
    }
    return this.http.get<{ exists: boolean; available: boolean }>(url);
  }

  // Images Management
  getProductImages(productId: string): Observable<ProductImage[]> {
    return this.http.get<ProductImage[]>(`${this.apiUrl}/${productId}/images`);
  }

  reorderProductImages(updates: Array<{ id: string; sortOrder: number }>): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/images/reorder`, updates);
  }

  deleteProductImage(imageId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/images/${imageId}`);
  }

  // Datos para selects
  getCategories(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrlBase}/categories`)
      .pipe(map(res => res.categories)); 
    // return this.http.get<any[]>(`${this.apiUrlBase}/categories`);
  }

  getBrands(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrlBase}/brands`)
      .pipe(map(res => res.brands)); 
    // return this.http.get<any[]>(`${this.apiUrlBase}/brands`);
  }

  getSuppliers(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrlBase}/suppliers`)
      .pipe(map(res => res.suppliers)); 
    // return this.http.get<any[]>(`${this.apiUrlBase}/suppliers`);
  }

  uploadImage(productId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<any>(`${this.apiUrlBase}/products/${productId}/images`, formData);
  }

  addProductImage(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/images`, data);
  }

  setPrimaryImage(imageId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/images/${imageId}/primary`, {});
  }

  removeProductImage(imageId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/images/${imageId}`);
  }

  updateProductImage(imageId: string, imageData: any): Observable<ProductImage> {
    return this.http.put<ProductImage>(`${this.apiUrl}/images/${imageId}`, imageData);
  }

  getStockHistory(productId: string): Observable<StockMovement[]> {
    return this.http.get<StockMovement[]>(`${this.apiUrl}/${productId}/stock-history`);
  }

  getProductsForSelect(): Observable<Array<{ _id: string; name: string }>> {
    return this.http.get<Array<{ _id: string; name: string }>>(`${this.apiUrl}/select-options`);
  }
}