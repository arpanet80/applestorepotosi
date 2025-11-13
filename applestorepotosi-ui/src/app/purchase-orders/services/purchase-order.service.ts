// src/app/purchase-orders/services/purchase-order.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PurchaseOrder,
  PurchaseOrderResponse,
  PurchaseOrderQuery,
  PurchaseOrderStats,
} from '../models/purchase-order.model';

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/purchase-orders`;

  create(dto: any) {
    return this.http.post<PurchaseOrder>(this.apiUrl, dto);
  }

  findAll(query: PurchaseOrderQuery): Observable<PurchaseOrderResponse> {
    let params = new HttpParams();
    Object.keys(query).forEach((k) => {
      const v = (query as any)[k];
      if (v !== undefined && v !== null) params = params.set(k, v.toString());
    });
    return this.http.get<PurchaseOrderResponse>(this.apiUrl, { params });
  }

  findOne(id: string) {
    return this.http.get<PurchaseOrder>(`${this.apiUrl}/${id}`);
  }

  update(id: string, dto: any) {
    return this.http.put<PurchaseOrder>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateStatus(id: string, status: string, reason?: string) {
    return this.http.put<PurchaseOrder>(`${this.apiUrl}/${id}/status`, { status, reason });
  }

  approveOrder(id: string, reason?: string) {
    return this.http.put<PurchaseOrder>(`${this.apiUrl}/${id}/approve`, { reason });
  }

  rejectOrder(id: string, reason?: string) {
    return this.http.put<PurchaseOrder>(`${this.apiUrl}/${id}/reject`, { reason });
  }

  completeOrder(id: string) {
    return this.http.put<PurchaseOrder>(`${this.apiUrl}/${id}/complete`, {});
  }

  cancelOrder(id: string, reason?: string) {
    return this.http.put<PurchaseOrder>(`${this.apiUrl}/${id}/cancel`, { reason });
  }

  getStats() {
    return this.http.get<PurchaseOrderStats>(`${this.apiUrl}/stats`);
  }

  calculateTotal(items: any[]) {
    return this.http.post<{ total: number }>(`${this.apiUrl}/calculate-total`, items);
  }
}