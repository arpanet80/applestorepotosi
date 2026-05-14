import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  StockMovement,
  StockMovementResponse,
  StockMovementQuery,
  StockAdjustmentDto
} from '../models/stock-movement.model';

@Injectable({ providedIn: 'root' })
export class StockMovementsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/stock-movements`;

  findAll(query: StockMovementQuery): Observable<StockMovementResponse> {
    let params = new HttpParams();
    Object.keys(query).forEach(k => {
      const v = (query as any)[k];
      if (v !== undefined && v !== null) params = params.set(k, v.toString());
    });
    return this.http.get<StockMovementResponse>(this.apiUrl, { params });
  }

  getAllSinParams(): Observable<StockMovement[]> {
    return this.http.get<StockMovement[]>(`${this.apiUrl}/all`);
  }

  findOne(id: string): Observable<StockMovement> {
    return this.http.get<StockMovement>(`${this.apiUrl}/${id}`);
  }

  create(data: any): Observable<StockMovement> {
    return this.http.post<StockMovement>(this.apiUrl, data);
  }

  createAdjustment(data: StockAdjustmentDto): Observable<StockMovement> {
    return this.http.post<StockMovement>(`${this.apiUrl}/adjustment`, data);
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }

  getDailySummary(days: number = 7): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/daily-summary?days=${days}`);
  }

  getRecentMovements(limit: number = 20): Observable<StockMovement[]> {
    return this.http.get<StockMovement[]>(`${this.apiUrl}/recent?limit=${limit}`);
  }

  findByProduct(productId: string, page = 1, limit = 10): Observable<{ movements: StockMovement[]; total: number }> {
    return this.http.get<{ movements: StockMovement[]; total: number }>(
      `${this.apiUrl}/product/${productId}?page=${page}&limit=${limit}`
    );
  }

  getProductHistory(productId: string, days = 30): Observable<StockMovement[]> {
    return this.http.get<StockMovement[]>(`${this.apiUrl}/product/${productId}/history?days=${days}`);
  }

  calculateCurrentStock(productId: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/product/${productId}/current-stock`);
  }

  update(id: string, data: any): Observable<StockMovement> {
    return this.http.put<StockMovement>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}