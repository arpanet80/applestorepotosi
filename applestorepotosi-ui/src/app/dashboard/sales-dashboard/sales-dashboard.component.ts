// src/app/sales/sales-dashboard/sales-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { UserRole } from '../../auth/models/user.model';

@Component({
  selector: 'app-sales-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="sales-dashboard">
      <header class="dashboard-header">
        <div class="header-content">
          <h1>💰 Panel de Ventas</h1>
          <p>Gestión comercial y atención al cliente</p>
        </div>
      </header>

      <div class="dashboard-content">
        <!-- Estadísticas de ventas -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">💰</div>
            <div class="stat-info">
              <div class="stat-value">$45,250</div>
              <div class="stat-label">Ventas Hoy</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📦</div>
            <div class="stat-info">
              <div class="stat-value">28</div>
              <div class="stat-label">Productos Vendidos</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-info">
              <div class="stat-value">15</div>
              <div class="stat-label">Clientes Atendidos</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-info">
              <div class="stat-value">92%</div>
              <div class="stat-label">Meta Diaria</div>
            </div>
          </div>
        </div>

        <!-- Módulos de ventas -->
        <div class="modules-grid">
          <!-- Punto de Venta -->
          <div class="module-card primary" routerLink="/sales/point-of-sale">
            <div class="module-icon">🖨️</div>
            <h3>Punto de Venta</h3>
            <p>Sistema de ventas rápido y eficiente</p>
            <div class="module-actions">
              <span class="badge">Nueva Venta</span>
            </div>
          </div>

          <!-- Gestión de Clientes -->
          <div class="module-card" routerLink="/customers">
            <div class="module-icon">👥</div>
            <h3>Gestión de Clientes</h3>
            <p>Administrar base de datos de clientes</p>
            <div class="module-actions">
              <span class="badge">156 clientes</span>
            </div>
          </div>

          <!-- Inventario -->
          <div class="module-card" routerLink="/products">
            <div class="module-icon">📱</div>
            <h3>Control de Inventario</h3>
            <p>Gestión de stock y productos</p>
            <div class="module-actions">
              <span class="badge">245 productos</span>
            </div>
          </div>

          <!-- Reportes -->
          <div class="module-card" routerLink="/admin/sales">
            <div class="module-icon">📊</div>
            <h3>Reportes de Ventas</h3>
            <p>Estadísticas y análisis comerciales</p>
            <div class="module-actions">
              <span class="badge">Ver reportes</span>
            </div>
          </div>
        </div>

        <!-- Ventas recientes -->
        <div class="recent-sales">
          <h3>🛒 Ventas Recientes</h3>
          <div class="sales-list">
            <div class="sale-item" *ngFor="let sale of recentSales">
              <div class="sale-info">
                <strong>Venta #{{ sale.id }}</strong>
                <span class="sale-client">{{ sale.client }}</span>
                <span class="sale-products">{{ sale.products }} productos</span>
              </div>
              <div class="sale-amount">
                <span class="amount">{{ sale.amount }}</span>
                <span class="sale-time">{{ sale.time }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Acciones rápidas -->
        <div class="quick-actions">
          <h3>Acciones Rápidas</h3>
          <div class="actions-grid">
            <button class="action-btn primary" routerLink="/sales/point-of-sale">
              <span class="action-icon">🖨️</span>
              <span>Nueva Venta</span>
            </button>
            <button class="action-btn" routerLink="/customers">
              <span class="action-icon">👤</span>
              <span>Gestionar Clientes</span>
            </button>
            <button class="action-btn" routerLink="/products">
              <span class="action-icon">📦</span>
              <span>Ver Inventario</span>
            </button>
            <button class="action-btn" routerLink="/admin/sales">
              <span class="action-icon">📊</span>
              <span>Ver Reportes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sales-dashboard {
      min-height: 100vh;
      background: #f8f9fa;
    }

    .dashboard-header {
      background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
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
      border-left: 4px solid #27ae60;
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
        border-color: #27ae60;
      }
    }

    .module-card.primary {
      border-left: 4px solid #27ae60;
      background: linear-gradient(135deg, #f8fff9 0%, #e8f5e8 100%);
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
      background: #27ae60;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .recent-sales {
      background: white;
      border-radius: 12px;
      padding: 1.5rem 2rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }

    .recent-sales h3 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
    }

    .sales-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .sale-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #27ae60;
    }

    .sale-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .sale-client {
      color: #666;
      font-size: 0.9rem;
    }

    .sale-products {
      color: #27ae60;
      font-size: 0.8rem;
    }

    .sale-amount {
      text-align: right;
    }

    .amount {
      font-weight: bold;
      color: #27ae60;
      font-size: 1.1rem;
    }

    .sale-time {
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

      &:hover {
        background: #27ae60;
        color: white;
        border-color: #27ae60;
        transform: translateY(-2px);
      }
    }

    .action-btn.primary:hover {
      background: #27ae60;
      border-color: #27ae60;
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

      .sale-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .sale-amount {
        text-align: left;
      }

      .actions-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SalesDashboardComponent implements OnInit {
  
  recentSales = [
    {
      id: 'V001',
      client: 'Carlos Rodríguez',
      products: 2,
      amount: '$1,250.00',
      time: '10:30 AM'
    },
    {
      id: 'V002',
      client: 'Ana Martínez', 
      products: 1,
      amount: '$850.00',
      time: '11:15 AM'
    },
    {
      id: 'V003',
      client: 'Tech Solutions SA',
      products: 5,
      amount: '$3,450.00', 
      time: '09:45 AM'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    console.log(`✅ ${user?.role} dashboard cargado para: ${user?.displayName}`);
    
    // Verificación adicional de rol (opcional)
    if (user && user.role !== UserRole.SALES) { // Cambiar por rol correspondiente
      console.warn('⚠️ Usuario sin permisos para este dashboard');
      this.router.navigate(['/unauthorized']);
    }
  }
}