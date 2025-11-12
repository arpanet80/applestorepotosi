// src/app/admin/admin-dashboard/admin-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { UserRole } from '../../auth/models/user.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-dashboard">
      <header class="dashboard-header">
        <div class="header-content">
          <h1>👑 Panel de Administración</h1>
          <p>Gestión completa del sistema Apple Store Potosí</p>
        </div>
      </header>

      <div class="dashboard-content">
        <!-- Estadísticas rápidas -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-info">
              <div class="stat-value">24</div>
              <div class="stat-label">Usuarios Activos</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📦</div>
            <div class="stat-info">
              <div class="stat-value">156</div>
              <div class="stat-label">Productos</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">💰</div>
            <div class="stat-info">
              <div class="stat-value">45</div>
              <div class="stat-label">Ventas Hoy</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🔧</div>
            <div class="stat-info">
              <div class="stat-value">12</div>
              <div class="stat-label">Reparaciones Activas</div>
            </div>
          </div>
        </div>

        <!-- Módulos de administración -->
        <div class="modules-grid">
          <!-- Gestión de Usuarios -->
          <div class="module-card" routerLink="/admin/users">
            <div class="module-icon">👥</div>
            <h3>Gestión de Usuarios</h3>
            <p>Administrar usuarios, roles y permisos del sistema</p>
            <div class="module-actions">
              <span class="badge">24 usuarios</span>
            </div>
          </div>

          <!-- Gestión de Productos -->
          <div class="module-card" routerLink="/products">
            <div class="module-icon">📱</div>
            <h3>Gestión de Productos</h3>
            <p>Administrar inventario, categorías y precios</p>
            <div class="module-actions">
              <span class="badge">156 productos</span>
            </div>
          </div>

          <!-- Gestión de Marcas -->
          <div class="module-card" routerLink="/admin/brands">
            <div class="module-icon">🏷️</div>
            <h3>Gestión de Marcas</h3>
            <p>Administrar marcas y proveedores</p>
            <div class="module-actions">
              <span class="badge">15 marcas</span>
            </div>
          </div>

          <!-- Gestión de Ventas -->
          <div class="module-card" routerLink="/admin/sales">
            <div class="module-icon">💰</div>
            <h3>Reportes de Ventas</h3>
            <p>Ver reportes y estadísticas de ventas</p>
            <div class="module-actions">
              <span class="badge">1.2M ingresos</span>
            </div>
          </div>

          <!-- Servicio Técnico -->
          <div class="module-card" routerLink="/technician">
            <div class="module-icon">🔧</div>
            <h3>Servicio Técnico</h3>
            <p>Gestionar reparaciones y técnicos</p>
            <div class="module-actions">
              <span class="badge">12 activas</span>
            </div>
          </div>

          <!-- Configuración -->
          <div class="module-card" routerLink="/admin/settings">
            <div class="module-icon">⚙️</div>
            <h3>Configuración</h3>
            <p>Configuración general del sistema</p>
            <div class="module-actions">
              <span class="badge">Sistema</span>
            </div>
          </div>
        </div>

        <!-- Acciones rápidas -->
        <div class="quick-actions">
          <h3>Acciones Rápidas</h3>
          <div class="actions-grid">
            <button class="action-btn" routerLink="/admin/users">
              <span class="action-icon">➕</span>
              <span>Nuevo Usuario</span>
            </button>
            <button class="action-btn" routerLink="/products">
              <span class="action-icon">📦</span>
              <span>Gestionar Productos</span>
            </button>
            <button class="action-btn" routerLink="/admin/brands">
              <span class="action-icon">🏷️</span>
              <span>Gestionar Marcas</span>
            </button>
            <button class="action-btn" routerLink="/sales/point-of-sale">
              <span class="action-icon">🖨️</span>
              <span>Punto de Venta</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard {
      min-height: 100vh;
      background: #f8f9fa;
    }

    .dashboard-header {
      background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
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

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      border-left: 4px solid #667eea;
    }

    .stat-icon {
      font-size: 2.5rem;
    }

    .stat-value {
      font-size: 1.8rem;
      font-weight: bold;
      color: #2c3e50;
    }

    .stat-label {
      color: #666;
      font-size: 0.9rem;
    }

    .modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .module-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: all 0.3s ease;
      border: 1px solid #e0e0e0;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        border-color: #667eea;
      }
    }

    .module-icon {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    .module-card h3 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
    }

    .module-card p {
      color: #666;
      margin-bottom: 1rem;
      line-height: 1.4;
    }

    .module-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .badge {
      background: #667eea;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
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

      &:hover {
        background: #667eea;
        color: white;
        border-color: #667eea;
        transform: translateY(-2px);
      }
    }

    .action-icon {
      font-size: 1.2rem;
    }

    @media (max-width: 768px) {
      .dashboard-content {
        padding: 1rem;
      }

      .stats-grid {
        grid-template-columns: 1fr 1fr;
      }

      .modules-grid {
        grid-template-columns: 1fr;
      }

      .actions-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    console.log(`✅ ${user?.role} dashboard cargado para: ${user?.displayName}`);
    
    // Verificación adicional de rol (opcional)
    if (user && user.role !== UserRole.ADMIN) { // Cambiar por rol correspondiente
      console.warn('⚠️ Usuario sin permisos para este dashboard');
      this.router.navigate(['/unauthorized']);
    }
  }
}