// src/app/dashboard/dashboard-redirect/dashboard-redirect.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-redirect',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="redirect-container">
      <div class="spinner-large"></div>
      <p>Redirigiendo a tu panel de control...</p>
    </div>
  `,
  styles: [`
    .redirect-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: #f8f9fa;
    }
    
    .spinner-large {
      width: 50px;
      height: 50px;
      border: 4px solid #e0e0e0;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class DashboardRedirectComponent implements OnInit {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.redirectToDashboard();
  }

  private redirectToDashboard(): void {
    const user = this.authService.getCurrentUser();
    
    if (user) {
      const dashboardRoute = this.getDashboardRouteByRole(user.role);
      console.log(`🔄 Redirigiendo automáticamente a: ${dashboardRoute}`);
      this.router.navigate([dashboardRoute]);
    } else {
      console.log('⚠️ No hay usuario, redirigiendo a login');
      this.router.navigate(['/login']);
    }
  }

  private getDashboardRouteByRole(role: string): string {
    const roleRoutes: { [key: string]: string } = {
      'admin': '/dashboard/admin',
      'sales': '/dashboard/sales',
      'technician': '/dashboard/technician', 
      'customer': '/dashboard/customer'
    };
    
    return roleRoutes[role] || '/dashboard/overview';
  }
}