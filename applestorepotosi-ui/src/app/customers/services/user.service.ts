import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user-select.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  searchUsers(q: string, limit = 10): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/search?q=${q}&limit=${limit}`);
  }
}