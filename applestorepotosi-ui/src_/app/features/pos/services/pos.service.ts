// src/app/features/pos/services/pos.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PosService {
  private api = `${environment.apiUrl}/pos`;

  constructor(private http: HttpClient) {}

  openSession(openingBalance: number): Observable<any> {
    return this.http.post(`${this.api}/open`, { openingBalance });
  }

  getCurrentSession(): Observable<any> {
    return this.http.get(`${this.api}/current`);
  }

  sell(payload: any): Observable<any> {
    return this.http.post(`${this.api}/sell`, payload);
  }

  closeSession(payload: any): Observable<any> {
    return this.http.post(`${this.api}/close`, payload);
  }

  getSessionReport(id: string): Observable<any> {
    return this.http.get(`${this.api}/report/${id}`);
  }
}