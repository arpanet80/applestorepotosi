import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './auth/services/auth.service';
import { AsyncPipe, NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgIf, AsyncPipe],
  // templateUrl: './app.html',
  // styleUrl: './app.css'
  template: `
    <div class="app-loading" *ngIf="authService.loading$ | async; else appContent">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Cargando aplicación...</p>
      </div>
    </div>
    
    <ng-template #appContent>
      <router-outlet></router-outlet>
    </ng-template>
  `,
  styles: [`
    .app-loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: #f5f5f5;
    }
    
    .loading-spinner {
      text-align: center;
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e0e0e0;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class App implements OnInit {
  protected readonly title = signal('applestorepotosi-ui');

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    // La sesión se inicializa automáticamente en el AuthService
    console.log('🚀 Aplicación iniciada, verificando sesión...');
  }
}
