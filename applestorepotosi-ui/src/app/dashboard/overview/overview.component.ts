// src/app/dashboard/overview/overview.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { UserRole } from '../../auth/models/user.model';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="overview-dashboard">
      <header class="dashboard-header">
        <div class="header-content">
          <h1>📊 Resumen General</h1>
          <p>Visión general del sistema Apple Store Potosí</p>
        </div>
      </header>

      <div class="dashboard-content">
        <!-- Bienvenida personalizada por rol -->
        <div class="welcome-section">
          <div class="welcome-card">
            <h2>¡Bienvenido, {{ userName }}! 👋</h2>
            <p>Tu rol en el sistema: <strong>{{ userRoleDisplay }}</strong></p>
            <p>Esta es tu vista general con información relevante del sistema.</p>
            
            <div class="quick-access">
              <button 
                class="btn-primary" 
                [routerLink]="roleDashboardRoute">
                Ir a mi panel específico
              </button>
              <button 
                class="btn-outline" 
                routerLink="/dashboard/profile">
                Mi Perfil
              </button>
            </div>
          </div>
        </div>

        <!-- Estadísticas generales del sistema -->
        <div class="system-stats">
          <h3>📈 Estadísticas del Sistema</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">👥</div>
              <div class="stat-info">
                <div class="stat-value">{{ systemStats.totalUsers }}</div>
                <div class="stat-label">Usuarios Totales</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">📦</div>
              <div class="stat-info">
                <div class="stat-value">{{ systemStats.totalProducts }}</div>
                <div class="stat-label">Productos</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">💰</div>
              <div class="stat-info">
                <div class="stat-value">{{ systemStats.monthlySales }}</div>
                <div class="stat-label">Ventas del Mes</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🔧</div>
              <div class="stat-info">
                <div class="stat-value">{{ systemStats.activeRepairs }}</div>
                <div class="stat-label">Reparaciones Activas</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Información específica por rol -->
        <div class="role-specific-info">
          <h3>🎯 Información para {{ userRoleDisplay }}</h3>
          
          <!-- ADMIN: Resumen administrativo -->
          <div *ngIf="userRole === 'admin'" class="info-card admin-info">
            <h4>👑 Panel Administrativo</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Usuarios Registrados Hoy:</span>
                <span class="info-value">3</span>
              </div>
              <div class="info-item">
                <span class="info-label">Ventas del Día:</span>
                <span class="info-value">$12,450</span>
              </div>
              <div class="info-item">
                <span class="info-label">Alertas del Sistema:</span>
                <span class="info-value badge-warning">2</span>
              </div>
            </div>
          </div>

          <!-- SALES: Resumen comercial -->
          <div *ngIf="userRole === 'sales'" class="info-card sales-info">
            <h4>💰 Resumen Comercial</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Ventas Hoy:</span>
                <span class="info-value">$8,250</span>
              </div>
              <div class="info-item">
                <span class="info-label">Clientes Atendidos:</span>
                <span class="info-value">15</span>
              </div>
              <div class="info-item">
                <span class="info-label">Meta Diaria:</span>
                <span class="info-value">85%</span>
              </div>
            </div>
          </div>

          <!-- TECHNICIAN: Resumen técnico -->
          <div *ngIf="userRole === 'technician'" class="info-card technician-info">
            <h4>🔧 Resumen Técnico</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Reparaciones en Proceso:</span>
                <span class="info-value">8</span>
              </div>
              <div class="info-item">
                <span class="info-label">Diagnósticos Pendientes:</span>
                <span class="info-value">4</span>
              </div>
              <div class="info-item">
                <span class="info-label">Reparos Urgentes:</span>
                <span class="info-value badge-warning">2</span>
              </div>
            </div>
          </div>

          <!-- CUSTOMER: Resumen cliente -->
          <div *ngIf="userRole === 'customer'" class="info-card customer-info">
            <h4>🛍️ Mi Resumen</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Mis Pedidos Activos:</span>
                <span class="info-value">2</span>
              </div>
              <div class="info-item">
                <span class="info-label">Servicios en Proceso:</span>
                <span class="info-value">1</span>
              </div>
              <div class="info-item">
                <span class="info-label">Puntos de Fidelidad:</span>
                <span class="info-value">1,250</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Actividad reciente común -->
        <div class="recent-activity">
          <h3>🕒 Actividad Reciente</h3>
          <div class="activity-list">
            <div class="activity-item" *ngFor="let activity of recentActivities">
              <div class="activity-icon">{{ activity.icon }}</div>
              <div class="activity-content">
                <p class="activity-text">{{ activity.text }}</p>
                <span class="activity-time">{{ activity.time }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Acciones rápidas -->
        <div class="quick-actions">
          <h3>🚀 Acciones Rápidas</h3>
          <div class="actions-grid">
            <button class="action-btn" routerLink="/dashboard/profile">
              <span class="action-icon">👤</span>
              <span>Mi Perfil</span>
            </button>
            
            <button class="action-btn" [routerLink]="roleDashboardRoute">
              <span class="action-icon">🎯</span>
              <span>Mi Panel</span>
            </button>
            
            <button class="action-btn" routerLink="/products">
              <span class="action-icon">📱</span>
              <span>Productos</span>
            </button>
            
            <button class="action-btn" routerLink="/dashboard/settings">
              <span class="action-icon">⚙️</span>
              <span>Configuración</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overview-dashboard {
      min-height: 100vh;
      background: #f8f9fa;
    }

    .dashboard-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      text-align: center;
    }

    .header-content h1 {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
    }

    .header-content p {
      margin: 0;
      opacity: 0.9;
    }

    .dashboard-content {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .welcome-section {
      margin-bottom: 2rem;
    }

    .welcome-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      text-align: center;
    }

    .welcome-card h2 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
    }

    .quick-access {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-top: 1.5rem;
    }

    .btn-primary {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .btn-primary:hover {
      background: #5a6fd8;
      transform: translateY(-2px);
    }

    .btn-outline {
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .btn-outline:hover {
      background: #667eea;
      color: white;
    }

    .system-stats {
      background: white;
      border-radius: 12px;
      padding: 1.5rem 2rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }

    .system-stats h3 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }

    .stat-icon {
      font-size: 2rem;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: #2c3e50;
    }

    .stat-label {
      color: #666;
      font-size: 0.9rem;
    }

    .role-specific-info {
      background: white;
      border-radius: 12px;
      padding: 1.5rem 2rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }

    .role-specific-info h3 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
    }

    .info-card {
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid;
    }

    .admin-info {
      border-left-color: #2c3e50;
      background: #f8f9fa;
    }

    .sales-info {
      border-left-color: #27ae60;
      background: #f8fff9;
    }

    .technician-info {
      border-left-color: #f39c12;
      background: #fffaf0;
    }

    .customer-info {
      border-left-color: #9b59b6;
      background: #f8f5ff;
    }

    .info-card h4 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid #e0e0e0;
    }

    .info-label {
      color: #666;
    }

    .info-value {
      font-weight: bold;
      color: #2c3e50;
    }

    .badge-warning {
      background: #e74c3c;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
    }

    .recent-activity {
      background: white;
      border-radius: 12px;
      padding: 1.5rem 2rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }

    .recent-activity h3 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .activity-icon {
      font-size: 1.5rem;
    }

    .activity-content {
      flex: 1;
    }

    .activity-text {
      margin: 0 0 0.25rem 0;
      color: #2c3e50;
    }

    .activity-time {
      color: #666;
      font-size: 0.8rem;
    }

    .quick-actions {
      background: white;
      border-radius: 12px;
      padding: 1.5rem 2rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .quick-actions h3 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .action-btn {
      background: #f8f9fa;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 500;
    }

    .action-btn:hover {
      background: #667eea;
      color: white;
      border-color: #667eea;
      transform: translateY(-2px);
    }

    .action-icon {
      font-size: 1.2rem;
    }

    @media (max-width: 768px) {
      .dashboard-content {
        padding: 1rem;
      }

      .quick-access {
        flex-direction: column;
        align-items: center;
      }

      .stats-grid {
        grid-template-columns: 1fr 1fr;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .actions-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class OverviewComponent implements OnInit {
  
  userName = 'Usuario';
  userRole: UserRole = UserRole.CUSTOMER;
  userRoleDisplay = 'Cliente';
  roleDashboardRoute = '/dashboard/customer';

  systemStats = {
    totalUsers: 156,
    totalProducts: 245,
    monthlySales: 284,
    activeRepairs: 12
  };

  recentActivities = [
    {
      icon: '📱',
      text: 'Nuevo iPhone 15 agregado al catálogo',
      time: 'Hace 2 horas'
    },
    {
      icon: '💰',
      text: 'Venta realizada por $1,250.00',
      time: 'Hace 3 horas'
    },
    {
      icon: '🔧',
      text: 'Reparación de MacBook Pro completada',
      time: 'Hace 4 horas'
    },
    {
      icon: '👤',
      text: 'Nuevo usuario registrado en el sistema',
      time: 'Hace 5 horas'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUserData();
  }

  private loadUserData(): void {
    const user = this.authService.getCurrentUser();
    
    if (user) {
      this.userName = user.displayName || user.email || 'Usuario';
      this.userRole = user.role;
      this.userRoleDisplay = this.getRoleDisplayName(user.role);
      this.roleDashboardRoute = this.getRoleDashboardRoute(user.role);
      
      console.log(`📊 Overview cargado para: ${this.userName} (${this.userRole})`);
    }
  }

  private getRoleDisplayName(role: UserRole): string {
    const roleNames = {
      [UserRole.ADMIN]: 'Administrador',
      [UserRole.SALES]: 'Vendedor',
      [UserRole.TECHNICIAN]: 'Técnico',
      [UserRole.CUSTOMER]: 'Cliente'
    };
    
    return roleNames[role] || 'Usuario';
  }

  private getRoleDashboardRoute(role: UserRole): string {
    const routes = {
      [UserRole.ADMIN]: '/dashboard/admin',
      [UserRole.SALES]: '/dashboard/sales',
      [UserRole.TECHNICIAN]: '/dashboard/technician',
      [UserRole.CUSTOMER]: '/dashboard/customer'
    };
    
    return routes[role] || '/dashboard';
  }
}