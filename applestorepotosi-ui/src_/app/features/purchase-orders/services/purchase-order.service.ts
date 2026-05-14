// src/app/purchase-orders/services/purchase-order.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderResponse,
  PurchaseOrderQuery,
  PurchaseOrderStats,
} from '../models/purchase-order.model';

export interface CreatePurchaseOrderDto {
  supplierId: string;
  orderDate?: string;
  items: Array<{ productId: string; quantity: number; unitCost: number }>;
  notes?: string;
}

export interface UpdatePurchaseOrderDto extends Partial<CreatePurchaseOrderDto> {}

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  private http   = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/purchase-orders`;

  create(dto: CreatePurchaseOrderDto): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(this.apiUrl, dto);
  }

  findAll(query: PurchaseOrderQuery): Observable<PurchaseOrderResponse> {
    let params = new HttpParams();
    (Object.keys(query) as (keyof PurchaseOrderQuery)[]).forEach((k) => {
      const v = query[k];
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    });
    return this.http.get<PurchaseOrderResponse>(this.apiUrl, { params });
  }

  findOne(id: string): Observable<PurchaseOrder> {
    return this.http.get<PurchaseOrder>(`${this.apiUrl}/${id}`);
  }

  update(id: string, dto: UpdatePurchaseOrderDto): Observable<PurchaseOrder> {
    return this.http.put<PurchaseOrder>(`${this.apiUrl}/${id}`, dto);
  }

  /** Soft-delete. El backend responde 204 sin cuerpo. */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateStatus(id: string, status: string, reason?: string): Observable<PurchaseOrder> {
    return this.http.put<PurchaseOrder>(`${this.apiUrl}/${id}/status`, { status, reason });
  }

  approveOrder(id: string, reason?: string): Observable<PurchaseOrder> {
    return this.http.put<PurchaseOrder>(`${this.apiUrl}/${id}/approve`, { reason });
  }

  rejectOrder(id: string, reason?: string): Observable<PurchaseOrder> {
    return this.http.put<PurchaseOrder>(`${this.apiUrl}/${id}/reject`, { reason });
  }

  completeOrder(id: string): Observable<PurchaseOrder> {
    return this.http.put<PurchaseOrder>(`${this.apiUrl}/${id}/complete`, {});
  }

  cancelOrder(id: string, reason?: string): Observable<PurchaseOrder> {
    return this.http.put<PurchaseOrder>(`${this.apiUrl}/${id}/cancel`, { reason });
  }

  getStats(): Observable<PurchaseOrderStats> {
    return this.http.get<PurchaseOrderStats>(`${this.apiUrl}/stats`);
  }

  /**
   * El backend espera un array de items en el body, no un objeto envuelto.
   * POST /purchase-orders/calculate-total  body: PurchaseOrderItem[]
   */
  calculateTotal(
    items: Array<{ productId: string; quantity: number; unitCost: number }>,
  ): Observable<{ total: number }> {
    return this.http.post<{ total: number }>(`${this.apiUrl}/calculate-total`, items);
  }
}