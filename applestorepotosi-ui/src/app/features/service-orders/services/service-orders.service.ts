// service-orders/services/service-orders.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServiceItem, ServiceOrder, ServiceOrderStatus } from '../models/service-order.model';
import { environment } from '../../../../environments/environment';
import { IncomeReport } from '../models/income-report.interface';

@Injectable({ providedIn: 'root' })
export class ServiceOrdersService {
  // private api = '/api/service-orders';
  private api = `${environment.apiUrl}/service-orders`;

  constructor(private http: HttpClient) {}

  getAll(params?: any): Observable<{ orders: ServiceOrder[]; total: number; page: number; totalPages: number }> {
    return this.http.get<{ orders: ServiceOrder[]; total: number; page: number; totalPages: number }>(this.api, { params });
  }

  getOne(id: string): Observable<ServiceOrder> {
    return this.http.get<ServiceOrder>(`${this.api}/${id}`);
  }

  create(payload: Partial<ServiceOrder>): Observable<ServiceOrder> {
    return this.http.post<ServiceOrder>(this.api, payload);
  }

  update(id: string, payload: Partial<ServiceOrder>): Observable<ServiceOrder> {
    return this.http.put<ServiceOrder>(`${this.api}/${id}`, payload);
  }

  changeStatus(id: string, status: ServiceOrderStatus, notes?: string): Observable<ServiceOrder> {
    return this.http.put<ServiceOrder>(`${this.api}/${id}/status`, { status, notes });
  }

  addItem(id: string, item: ServiceItem): Observable<ServiceOrder> {
    return this.http.post<ServiceOrder>(`${this.api}/${id}/items`, { item });
  }

  getIncomeReport(params?: {
    startDate?: string;
    endDate?: string;
    technicianId?: string;
  }): Observable<IncomeReport> {
    return this.http.get<IncomeReport>(`${this.api}/income-report`, { params });
  }
}