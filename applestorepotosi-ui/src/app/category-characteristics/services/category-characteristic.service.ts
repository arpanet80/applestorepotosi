import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CategoryCharacteristic,
  CategoryCharacteristicQuery,
  CategoryCharacteristicResponse,
  CategoryCharacteristicStats,
} from '../models/category-characteristic.model';

@Injectable({ providedIn: 'root' })
export class CategoryCharacteristicService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/category-characteristics`;

  create(dto: Partial<CategoryCharacteristic>) {
    return this.http.post<CategoryCharacteristic>(this.apiUrl, dto);
  }

  findAll(query: CategoryCharacteristicQuery): Observable<CategoryCharacteristicResponse> {
    let params = new HttpParams();
    Object.keys(query).forEach((k) => {
      const v = query[k as keyof CategoryCharacteristicQuery];
      if (v !== undefined && v !== null) params = params.set(k, v.toString());
    });
    return this.http.get<CategoryCharacteristicResponse>(this.apiUrl, { params });
  }

  findOne(id: string) {
    return this.http.get<CategoryCharacteristic>(`${this.apiUrl}/${id}`);
  }

  update(id: string, dto: Partial<CategoryCharacteristic>) {
    return this.http.put<CategoryCharacteristic>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  toggleActive(id: string) {
    return this.http.put<CategoryCharacteristic>(`${this.apiUrl}/${id}/toggle-active`, {});
  }

  getStats() {
    return this.http.get<CategoryCharacteristicStats>(`${this.apiUrl}/stats`);
  }

  searchCharacteristics(q: string, limit = 10) {
    return this.http.get<CategoryCharacteristic[]>(`${this.apiUrl}/search?q=${q}&limit=${limit}`);
  }

  findByCategory(categoryId: string, page = 1, limit = 10) {
    return this.http.get<CategoryCharacteristicResponse>(
      `${this.apiUrl}/category/${categoryId}?page=${page}&limit=${limit}`
    );
  }

  findRequiredByCategory(categoryId: string, page = 1, limit = 10) {
    return this.http.get<CategoryCharacteristicResponse>(
      `${this.apiUrl}/category/${categoryId}/required?page=${page}&limit=${limit}`
    );
  }

  getCharacteristicTypes() {
    return this.http.get<{ value: string; label: string }[]>(`${this.apiUrl}/types`);
  }

  checkName(categoryId: string, name: string, excludeId?: string) {
    let url = `${this.apiUrl}/check-name/${categoryId}/${name}`;
    if (excludeId) url += `?excludeId=${excludeId}`;
    return this.http.get<{ exists: boolean; available: boolean }>(url);
  }
}