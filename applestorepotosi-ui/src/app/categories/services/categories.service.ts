// src/app/categories/services/categories.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {Category,CategoryResponse,CategoryStats,CategoryQuery,} from '../models/categories.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/categories`;

  create(category: Partial<Category>) {
    return this.http.post<Category>(this.apiUrl, category);
  }

  findAll(query: CategoryQuery): Observable<CategoryResponse> {
    let params = new HttpParams();
    Object.keys(query).forEach((k) => {
      const v = query[k as keyof CategoryQuery];
      if (v !== undefined && v !== null) params = params.set(k, v.toString());
    });
    return this.http.get<CategoryResponse>(this.apiUrl, { params });
  }

  findOne(id: string) {
    return this.http.get<Category>(`${this.apiUrl}/${id}`);
  }

  update(id: string, category: Partial<Category>) {
    return this.http.put<Category>(`${this.apiUrl}/${id}`, category);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getStats() {
    return this.http.get<CategoryStats>(`${this.apiUrl}/stats`);
  }

  searchCategories(q: string, limit = 10) {
    return this.http.get<Category[]>(`${this.apiUrl}/search?q=${q}&limit=${limit}`);
  }

  // getCategoryTree() {
  //   return this.http.get<Category[]>(`${this.apiUrl}/tree`);
  // }

  getMainCategories() {
    return this.http.get<Category[]>(`${this.apiUrl}/main`);
  }

  getSubcategories(parentId: string) {
    return this.http.get<Category[]>(`${this.apiUrl}/${parentId}/subcategories`);
  }

  toggleActive(id: string) {
    return this.http.put<Category>(`${this.apiUrl}/${id}/toggle-active`, {});
  }

  checkSlug(slug: string, excludeId?: string) {
    let url = `${this.apiUrl}/check-slug/${slug}`;
    if (excludeId) url += `?excludeId=${excludeId}`;
    return this.http.get<{ exists: boolean; available: boolean }>(url);
  }

  getCategoryTree() {
  console.log('>>> Llamando a /categories/tree');
  return this.http.get<Category[]>(`${this.apiUrl}/tree`).pipe(
    tap({
      next: (r) => console.log('>>> Respuesta tree:', r),
      error: (e) => console.error('>>> Error tree:', e),
    })
  );
}
}