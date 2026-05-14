// src/app/suppliers/services/supplier.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Supplier,
  SupplierResponse,
  SupplierQuery,
  SupplierStats,
} from '../models/supplier.model';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/suppliers`;

  create(dto: Partial<Supplier>) {
    return this.http.post<Supplier>(this.apiUrl, dto);
  }

  findAll(query: SupplierQuery): Observable<SupplierResponse> {
    let params = new HttpParams();
    Object.keys(query).forEach((k) => {
      const v = (query as any)[k];
      if (v !== undefined && v !== null) params = params.set(k, v.toString());
    });
    return this.http.get<SupplierResponse>(this.apiUrl, { params });
  }

  findOne(id: string) {
    return this.http.get<Supplier>(`${this.apiUrl}/${id}`);
  }

  update(id: string, dto: Partial<Supplier>) {
    return this.http.put<Supplier>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  toggleActive(id: string) {
    return this.http.put<Supplier>(`${this.apiUrl}/${id}/toggle-active`, {});
  }

  getStats() {
    return this.http.get<SupplierStats>(`${this.apiUrl}/stats`);
  }

  searchSuppliers(q: string, limit = 10) {
    return this.http.get<Supplier[]>(`${this.apiUrl}/search?q=${q}&limit=${limit}`);
  }

  getSuppliersForSelect() {
    return this.http.get<Pick<Supplier, '_id' | 'name'>[]>(`${this.apiUrl}/select-options`);
  }

  checkEmail(email: string, excludeId?: string) {
    let url = `${this.apiUrl}/check-email/${email}`;
    if (excludeId) url += `?excludeId=${excludeId}`;
    return this.http.get<{ exists: boolean; available: boolean }>(url);
  }

  checkTaxId(taxId: string, excludeId?: string) {
    let url = `${this.apiUrl}/check-tax-id/${taxId}`;
    if (excludeId) url += `?excludeId=${excludeId}`;
    return this.http.get<{ exists: boolean; available: boolean }>(url);
  }
  getUniqueCountries(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/countries`);
  }

  deactivate(uid: string): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.apiUrl}/${uid}/deactivate`, {});
  }

  activate(uid: string): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.apiUrl}/${uid}/activate`, {});
  }

}