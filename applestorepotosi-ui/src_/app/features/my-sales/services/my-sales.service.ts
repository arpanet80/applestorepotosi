/**
 * my-sales.service.ts
 * Servicio completo y funcional para el módulo “My Sales”.
 * Angular 20+ | standalone
 */
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Sale } from '../models/sale.model';
import { AuthService } from '../../../auth/services/auth.service';
import { environment } from '../../../../environments/environment';

/* ---------- interfaz auxiliar ---------- */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

/* ---------- servicio ---------- */
@Injectable({ providedIn: 'root' })
export class MySalesService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private api = `${environment.apiUrl}/sales`;

  /**
   * Lista las ventas del vendedor autenticado.
   * El backend espera query-params: page, limit, salesPersonId, startDate, endDate, search, status.
   */
  list(
    page = 1,
    limit = 10,
    startDate?: Date,
    endDate?: Date,
    search = '',
    status = ''
  ): Observable<PaginatedResponse<Sale>> {
    const uid = this.auth.getCurrentUser()?.uid;
    if (!uid) throw new Error('Usuario no autenticado');

    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit)
      .set('salesPersonId', uid);

    if (startDate) params = params.set('startDate', startDate.toISOString());
    if (endDate)   params = params.set('endDate',   endDate.toISOString());
    if (search)    params = params.set('search',    search.trim());
    if (status)    params = params.set('status',    status);

    return this.http
      .get<{ sales: Sale[]; total: number; page: number; totalPages: number }>(this.api, { params })
      .pipe(
        map(res => ({
          data: res.sales,
          total: res.total,
          page: res.page,
          totalPages: res.totalPages
        }))
      );
  }

  /** Retorna una venta completa (incluye items populados) */
  one(id: string): Observable<Sale> {
    return this.http.get<Sale>(`${this.api}/${id}`);
  }

  /** Cancela una venta y devuelve el documento actualizado */
  cancel(id: string, notes?: string): Observable<Sale> {
    return this.http.put<Sale>(`${this.api}/${id}/cancel`, { notes });
  }
}