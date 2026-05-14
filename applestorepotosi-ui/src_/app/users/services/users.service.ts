import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserResponse, UserQuery } from '../models/user.model';
import { UpdateProfile } from '../models/update-profile.interface';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  findAll(query: UserQuery): Observable<{users: User[], total: number, totalPages: number}> {
    let params = new HttpParams()
    .set('page',  String(query.page  ?? 1))
    .set('limit', String(query.limit ?? 10));
    
    if (query.role) params = params.set('role', query.role); // "" es falsy → no se envía
    
    if (query.search?.trim()) params = params.set('search', query.search.trim());
    if (query.role)             params = params.set('role',  query.role);  // ← aquí el filtro

    return this.http.get<{users: User[], total: number, totalPages: number}>(this.apiUrl, {params});
  }

  // findAll(query: UserQuery): Observable<User[]> {
  //   let params = new HttpParams();
  //   Object.keys(query).forEach(k => {
  //     const v = (query as any)[k];
  //     if (v !== undefined && v !== null) params = params.set(k, v.toString());
  //   });
  //   // backend devuelve User[] directamente
  //   return this.http.get<User[]>(this.apiUrl, { params });
  // }

  findOne(uid: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${uid}`);
  }

  update(uid: string, data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${uid}/profile`, data);
  }

  deactivate(uid: string): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${uid}/deactivate`, {});
  }

  activate(uid: string): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${uid}/activate`, {});
  }

  delete(uid: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${uid}`);
  }

  updateUserProfile(uid: string, data: UpdateProfile) {
    return this.http.put(`${this.apiUrl}/${uid}/profile`, data);
  }
}