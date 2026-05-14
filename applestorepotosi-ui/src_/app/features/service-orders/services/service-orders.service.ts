// service-orders/services/service-orders.service.ts
// ============================================================
// SERVICIO FRONTEND - Sincronizado con backend simplificado
// ============================================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServiceItem, ServiceOrder } from '../models/service-order.model';
import { environment } from '../../../../environments/environment';
import { IncomeReport } from '../models/income-report.interface';
import { ServiceOrderIncomeReport } from '../../reports/models/reports.model';

@Injectable({ providedIn: 'root' })
export class ServiceOrdersService {
  private api = `${environment.apiUrl}/service-orders`;

  constructor(private http: HttpClient) {}

  /* ---------- CRUD ---------- */

  getAll(params?: {
    search?: string;
    page?: number;
    limit?: number;
    status?: string;
    customerId?: string;
    technicianId?: string;
    startDate?: string;
    endDate?: string;
  }): Observable<{ orders: ServiceOrder[]; total: number; page: number; totalPages: number }> {
    return this.http.get<{ orders: ServiceOrder[]; total: number; page: number; totalPages: number }>(
      this.api,
      { params },
    );
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

  /* ---------- cambio de estado ---------- */
  changeStatus(
    id: string,
    status: string,
    notes: string | undefined,
  ): Observable<ServiceOrder> {
    return this.http.put<ServiceOrder>(`${this.api}/${id}/status`, {
      status,
      notes,
    });
  }

  /* ---------- items ---------- */

  addItem(id: string, item: ServiceItem): Observable<ServiceOrder> {
    return this.http.post<ServiceOrder>(`${this.api}/${id}/items`, { item });
  }

  removeItem(id: string, index: number): Observable<ServiceOrder> {
    return this.http.delete<ServiceOrder>(`${this.api}/${id}/items/${index}`);
  }

  /* ---------- reportes ---------- */

  /**
   * ✅ NUEVO: Obtiene el reporte de ingresos de órdenes de servicio
   * Usa el endpoint optimizado del backend: GET /service-orders/income-report
   * 
   * El backend aggregation retorna:
   * - orderCount: número de órdenes
   * - totalLabor: suma de mano de obra
   * - totalPartsRevenue: ingreso por repuestos (precio de venta)
   * - totalPartsCost: costo de repuestos
   * - totalInvoiced: total facturado (ingreso real)
   * - grossMargin: margen bruto
   * - grossMarginPercent: margen bruto %
   */
  incomeReport(filters: {
    startDate?: string;
    endDate?: string;
    technicianId?: string;
  }): Observable<ServiceOrderIncomeReport> {
    let params = new HttpParams();
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.technicianId) params = params.set('technicianId', filters.technicianId);

    return this.http.get<ServiceOrderIncomeReport>(`${this.api}/income-report`, { params });
  }

  
}