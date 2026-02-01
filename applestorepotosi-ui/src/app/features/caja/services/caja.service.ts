import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CashSession } from '../modules/cash-session.model';

interface ListRes { sessions: CashSession[]; total: number; page: number; totalPages: number; }

@Injectable({ providedIn: 'root' })
export class CajaService {
  private api = `${environment.apiUrl}/cash-sessions`;

  constructor(private http: HttpClient) {}

  /* ---------- sesión abierta ---------- */
  getOpen(): Observable<CashSession> {
    return this.http.get<CashSession>(`${this.api}/open`);
  }

  /* ---------- listado paginado ---------- */
  list(params: {
    startDate?: Date;
    endDate?: Date;
    closeType?: 'X' | 'Z';
    user?: string;
    page?: number;
    limit?: number;
  }): Observable<ListRes> {
    let p = new HttpParams()
      .set('page', String(params.page || 1))
      .set('limit', String(params.limit || 20));

    if (params.startDate) p = p.set('startDate', params.startDate.toISOString());
    if (params.endDate)   p = p.set('endDate', params.endDate.toISOString());
    if (params.closeType) p = p.set('closeType', params.closeType);
    if (params.user)      p = p.set('user', params.user);

    return this.http.get<ListRes>(this.api, { params: p });
  }

  /* ---------- abrir ---------- */
  open(openingBalance: number): Observable<CashSession> {
    return this.http.post<CashSession>(`${this.api}/open`, { sessionId: this.genId(), openingBalance });
  }

  /* ---------- movimiento manual ---------- */
  cashInOut(amount: number, motive: string): Observable<CashSession> {
    return this.http.patch<CashSession>(`${this.api}/cash-in-out`, { amount, motive });
  }

  /* ---------- cerrar ---------- */
  close(id: string, dto: any): Observable<CashSession> {
    return this.http.post<CashSession>(`${this.api}/${id}/close`, dto);
  }

  /* ---------- utils ---------- */
  private genId(): string {
    const hoy = new Date();
    return `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, '0')}${String(hoy.getDate()).padStart(2, '0')}-${Date.now().toString().slice(-4)}`;
  }
}