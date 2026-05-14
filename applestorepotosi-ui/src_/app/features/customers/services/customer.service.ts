import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Customer,
  CustomerResponse,
  CustomerQuery,
  CustomerStats,
} from '../models/customer.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/customers`;

  create(dto: Partial<Customer>) {
    return this.http.post<Customer>(this.apiUrl, dto);
  }

  findAll(query: CustomerQuery): Observable<CustomerResponse> {
    let params = new HttpParams();
    Object.keys(query).forEach((k) => {
      const v = (query as any)[k];
      if (v !== undefined && v !== null) params = params.set(k, v.toString());
    });
    return this.http.get<CustomerResponse>(this.apiUrl, { params });
  }

  getPublicGeneralId() {
    return this.http.get<string>(`${this.apiUrl}/customer-general-id`);
  }

  findOne(id: string) {
    return this.http.get<Customer>(`${this.apiUrl}/${id}`);
  }

  update(id: string, dto: Partial<Customer>) {
    return this.http.put<Customer>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  toggleActive(id: string) {
    return this.http.put<Customer>(`${this.apiUrl}/${id}/toggle-active`, {});
  }

  /* ---------- LEALTAD ---------- */
  addLoyaltyPoints(id: string, points: number, reason?: string) {
    return this.http.put<Customer>(`${this.apiUrl}/${id}/loyalty-points/add`, { points, reason });
  }

  subtractLoyaltyPoints(id: string, points: number, reason?: string) {
    return this.http.put<Customer>(`${this.apiUrl}/${id}/loyalty-points/subtract`, { points, reason });
  }

  setLoyaltyPoints(id: string, points: number) {
    return this.http.put<Customer>(`${this.apiUrl}/${id}/loyalty-points/set`, { points });
  }

  /* ---------- STATS ---------- */
  getStats() {
    return this.http.get<CustomerStats>(`${this.apiUrl}/stats`);
  }

  searchCustomers(q: string, limit = 10) {
    return this.http.get<Customer[]>(`${this.apiUrl}/search?q=${q}&limit=${limit}`);
  }

  getCustomersForSelect() {
    return this.http.get<Customer[]>(`${this.apiUrl}/select-options`);
  }

  /* ---------- VERIFICACIONES ---------- */
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

  /* ---------- USUARIO AUTENTICADO ---------- */
  getCurrentCustomer() {
    return this.http.get<Customer>(`${this.apiUrl}/me`);
  }

  getCustomerRaw(): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${this.apiUrl}/all`);
  }
}