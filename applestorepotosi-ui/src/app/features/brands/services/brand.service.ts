// src/app/brands/services/brand.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Brand, BrandResponse, BrandStats, BrandQuery } from '../models/brand.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BrandService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/brands`;

  // CRUD
  create(brand: Partial<Brand>) { return this.http.post<Brand>(this.apiUrl, brand); }
  findAll(query: BrandQuery): Observable<BrandResponse> {
    let params = new HttpParams();
    Object.keys(query).forEach(k => {
      const v = query[k as keyof BrandQuery];
      if (v !== undefined && v !== null) params = params.set(k, v.toString());
    });
    return this.http.get<BrandResponse>(this.apiUrl, { params });
  }
  findOne(id: string) { return this.http.get<Brand>(`${this.apiUrl}/${id}`); }
  update(id: string, brand: Partial<Brand>) { return this.http.put<Brand>(`${this.apiUrl}/${id}`, brand); }
  delete(id: string) { return this.http.delete<void>(`${this.apiUrl}/${id}`); }

  // Utilidades
  getStats() { return this.http.get<BrandStats>(`${this.apiUrl}/stats`); }
  searchBrands(q: string, limit = 10) { return this.http.get<Brand[]>(`${this.apiUrl}/search?q=${q}&limit=${limit}`); }
  getActiveBrands() { return this.http.get<Brand[]>(`${this.apiUrl}/active`); }
  getCountries() { return this.http.get<string[]>(`${this.apiUrl}/countries`); }
  checkName(name: string, excludeId?: string) {
    let url = `${this.apiUrl}/check-name/${name}`;
    if (excludeId) url += `?excludeId=${excludeId}`;
    return this.http.get<{ exists: boolean; available: boolean }>(url);
  }

  toggleActive(id: string): Observable<Brand> {
    return this.http.put<Brand>(`${this.apiUrl}/${id}/toggle-active`, {});
  }

  uploadLogo(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ url: string }>(`${this.apiUrl}/upload-logo`, formData)
      .pipe(map(res => res.url));
  }

  deactivate(uid: string): Observable<Brand> {
      return this.http.put<Brand>(`${this.apiUrl}/${uid}/deactivate`, {});
    }
  
    activate(uid: string): Observable<Brand> {
      return this.http.put<Brand>(`${this.apiUrl}/${uid}/activate`, {});
    }
}