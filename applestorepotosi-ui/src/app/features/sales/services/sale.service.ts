import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Sale, SaleResponse, SaleQuery } from '../models/sale.model';
import { SaleItem } from '../models/sale-item.model';

@Injectable({ providedIn: 'root' })
export class SaleService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/sales`;

  create(data: any): Observable<Sale> {
    return this.http.post<Sale>(this.apiUrl, data);
  }

  findAll(query: SaleQuery): Observable<SaleResponse> {
    let params = new HttpParams();
    Object.keys(query).forEach(k => {
      const v = (query as any)[k];
      if (v !== undefined && v !== null) params = params.set(k, v.toString());
    });
    return this.http.get<SaleResponse>(this.apiUrl, { params });
  }
  findAllRaw(): Observable<Sale[]> {
    return this.http.get<Sale[]>(`${this.apiUrl}/all`);
  }

  findOne(id: string): Observable<Sale> {
    return this.http.get<Sale>(`${this.apiUrl}/${id}`);
  }

  update(id: string, data: Partial<Sale>): Observable<Sale> {
    return this.http.put<Sale>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  cancelSale(id: string, notes?: string): Observable<Sale> {
    return this.http.put<Sale>(`${this.apiUrl}/${id}/cancel`, { notes });
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }

  findItemsBySale(saleId: string): Observable<SaleItem[]> {
    return this.http.get<SaleItem[]>(`${this.apiUrl}/${saleId}/items`);
  }
}