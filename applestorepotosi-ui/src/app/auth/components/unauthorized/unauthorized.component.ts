import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="unauthorized-container">
      <div class="unauthorized-card">
        <div class="unauthorized-header">
          <div class="warning-icon">⚠️</div>
          <h1>Acceso No Autorizado</h1>
        </div>
        
        <div class="unauthorized-content">
          <p>No tienes permisos para acceder a esta página.</p>
          <p *ngIf="currentUser" class="user-info">
            Tu rol actual: <strong>{{ currentUser.role }}</strong>
          </p>
          <p class="instruction">
            Contacta al administrador si necesitas acceso a esta sección.
          </p>
        </div>
        
        <div class="unauthorized-actions">
          <button class="btn-primary" (click)="goToDashboard()">
            Ir al Dashboard
          </button>
          <button class="btn-secondary" (click)="logout()">
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .unauthorized-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      padding: 40px;
      max-width: 500px;
      width: 100%;
      text-align: center;
    }
    
    .unauthorized-header {
      margin-bottom: 2rem;
      
      .warning-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
      }
      
      h1 {
        margin: 0;
        color: #e74c3c;
        font-size: 2rem;
        font-weight: 600;
      }
    }
    
    .unauthorized-content {
      margin-bottom: 2rem;
      
      p {
        margin: 0 0 1rem 0;
        color: #666;
        font-size: 1.1rem;
        line-height: 1.5;
      }
      
      .user-info {
        background: #fff3e0;
        padding: 12px 16px;
        border-radius: 8px;
        border-left: 4px solid #ff9800;
        
        strong {
          color: #e67e22;
        }
      }
      
      .instruction {
        font-size: 0.95rem;
        color: #888;
        font-style: italic;
      }
    }
    
    .unauthorized-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      padding: 12px 24px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }
      
      &:active {
        transform: translateY(0);
      }
    }
    
    .btn-secondary {
      background: white;
      color: #666;
      border: 2px solid #ddd;
      border-radius: 8px;
      padding: 12px 24px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        background: #f8f9fa;
        border-color: #999;
        transform: translateY(-2px);
      }
      
      &:active {
        transform: translateY(0);
      }
    }
    
    /* Responsive */
    @media (max-width: 480px) {
      .unauthorized-container {
        padding: 10px;
      }
      
      .unauthorized-card {
        padding: 30px 20px;
      }
      
      .unauthorized-header {
        h1 {
          font-size: 1.5rem;
        }
        
        .warning-icon {
          font-size: 3rem;
        }
      }
      
      .unauthorized-content {
        p {
          font-size: 1rem;
        }
      }
      
      .unauthorized-actions {
        flex-direction: column;
        
        button {
          width: 100%;
        }
      }
    }
    
    /* Mejoras de accesibilidad */
    button:focus {
      outline: 2px solid #667eea;
      outline-offset: 2px;
    }
  `]
})
export class UnauthorizedComponent {
  currentUser: any;
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }
  
  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
  
  logout() {
    this.authService.logout();
  }
}