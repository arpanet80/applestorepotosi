// src/app/features/cash-sessions/cash-session.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CashSession } from '../models/cash-session.model';

@Injectable({ providedIn: 'root' })
export class CashSessionService {
  private api = `${environment.apiUrl}/cash-sessions`;

  constructor(private http: HttpClient) {}

  open(openingBalance: number): Observable<CashSession> {
    const sessionId = this.generateSessionId();
    return this.http.post<CashSession>(`${this.api}/open`, { sessionId, openingBalance });
  }

  getOpen(): Observable<CashSession | null> {
    return this.http.get<CashSession | null>(`${this.api}/open`);
  }

  close(id: string, dto: {
    actualCash: number;
    closeType: 'X' | 'Z';
    medios: { efectivo: number; tarjeta: number; transfer: number; deposito: number };
    notes?: string;
  }): Observable<CashSession> {
    return this.http.post<CashSession>(`${this.api}/${id}/close`, dto);
  }

  findById(id: string): Observable<CashSession> {
    return this.http.get<CashSession>(`${this.api}/${id}`);
  }

  private generateSessionId(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}-CAJA1`;
  }
}