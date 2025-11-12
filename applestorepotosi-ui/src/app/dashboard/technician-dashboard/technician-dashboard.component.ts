// src/app/technician/technician-dashboard/technician-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { UserRole } from '../../auth/models/user.model';

@Component({
  selector: 'app-technician-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="technician-dashboard">
      <header class="dashboard-header">
        <div class="header-content">
          <h1>🔧 Panel de Servicio Técnico</h1>
          <p>Gestión de reparaciones y diagnósticos Apple</p>
        </div>
      </header>

      <div class="dashboard-content">
        <!-- Estadísticas de reparaciones -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">🔄</div>
            <div class="stat-info">
              <div class="stat-value">8</div>
              <div class="stat-label">En Proceso</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⏳</div>
            <div class="stat-info">
              <div class="stat-value">4</div>
              <div class="stat-label">En Espera</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-info">
              <div class="stat-value">12</div>
              <div class="stat-label">Completadas Hoy</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⚠️</div>
            <div class="stat-info">
              <div class="stat-value">2</div>
              <div class="stat-label">Urgentes</div>
            </div>
          </div>
        </div>

        <!-- Módulos técnicos -->
        <div class="modules-grid">
          <!-- Reparaciones -->
          <div class="module-card" routerLink="/technician/repairs">
            <div class="module-icon">🛠️</div>
            <h3>Gestión de Reparaciones</h3>
            <p>Administrar reparaciones en proceso y nuevas</p>
            <div class="module-actions">
              <span class="badge warning">8 activas</span>
            </div>
          </div>

          <!-- Diagnósticos -->
          <div class="module-card" routerLink="/technician/diagnostics">
            <div class="module-icon">🔍</div>
            <h3>Diagnósticos</h3>
            <p>Realizar diagnósticos y evaluaciones técnicas</p>
            <div class="module-actions">
              <span class="badge">4 pendientes</span>
            </div>
          </div>

          <!-- Repuestos -->
          <div class="module-card" routerLink="/technician/parts">
            <div class="module-icon">⚙️</div>
            <h3>Gestión de Repuestos</h3>
            <p>Control de inventario de partes y componentes</p>
            <div class="module-actions">
              <span class="badge">45 repuestos</span>
            </div>
          </div>

          <!-- Productos -->
          <div class="module-card" routerLink="/products">
            <div class="module-icon">📱</div>
            <h3>Catálogo de Productos</h3>
            <p>Información técnica de modelos Apple</p>
            <div class="module-actions">
              <span class="badge">24 modelos</span>
            </div>
          </div>
        </div>

        <!-- Reparaciones urgentes -->
        <div class="urgent-repairs">
          <h3>🔴 Reparaciones Urgentes</h3>
          <div class="repairs-list">
            <div class="repair-item" *ngFor="let repair of urgentRepairs">
              <div class="repair-info">
                <strong>{{ repair.device }}</strong>
                <span class="repair-client">{{ repair.client }}</span>
                <span class="repair-issue">{{ repair.issue }}</span>
              </div>
              <div class="repair-actions">
                <span class="repair-priority">{{ repair.priority }}</span>
                <button class="btn-small" routerLink="/technician/repairs">Atender</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Acciones rápidas -->
        <div class="quick-actions">
          <h3>Acciones Rápidas</h3>
          <div class="actions-grid">
            <button class="action-btn" routerLink="/technician/repairs">
              <span class="action-icon">➕</span>
              <span>Nueva Reparación</span>
            </button>
            <button class="action-btn" routerLink="/technician/diagnostics">
              <span class="action-icon">🔍</span>
              <span>Nuevo Diagnóstico</span>
            </button>
            <button class="action-btn" routerLink="/technician/parts">
              <span class="action-icon">📦</span>
              <span>Ver Repuestos</span>
            </button>
            <button class="action-btn" routerLink="/products">
              <span class="action-icon">📱</span>
              <span>Ver Productos</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .technician-dashboard {
      min-height: 100vh;
      background: #f8f9fa;
    }

    .dashboard-header {
      background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
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
    }

    .stat-card:nth-child(1) { border-left: 4px solid #3498db; }
    .stat-card:nth-child(2) { border-left: 4px solid #f39c12; }
    .stat-card:nth-child(3) { border-left: 4px solid #27ae60; }
    .stat-card:nth-child(4) { border-left: 4px solid #e74c3c; }

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
        border-color: #f39c12;
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
      background: #3498db;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .badge.warning {
      background: #e74c3c;
    }

    .urgent-repairs {
      background: white;
      border-radius: 12px;
      padding: 1.5rem 2rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
      border-left: 4px solid #e74c3c;
    }

    .urgent-repairs h3 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
    }

    .repairs-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .repair-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #fff5f5;
      border-radius: 8px;
      border: 1px solid #fed7d7;
    }

    .repair-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .repair-client {
      color: #666;
      font-size: 0.9rem;
    }

    .repair-issue {
      color: #e53e3e;
      font-size: 0.8rem;
    }

    .repair-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .repair-priority {
      background: #e53e3e;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .btn-small {
      background: #e53e3e;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
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
        background: #f39c12;
        color: white;
        border-color: #f39c12;
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

      .repair-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .repair-actions {
        width: 100%;
        justify-content: space-between;
      }

      .actions-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TechnicianDashboardComponent implements OnInit {
  
  urgentRepairs = [
    {
      id: 'R001',
      device: 'iPhone 15 Pro',
      client: 'Juan Pérez',
      issue: 'Pantalla rota - Urgente',
      priority: 'ALTA'
    },
    {
      id: 'R002', 
      device: 'MacBook Pro M2',
      client: 'María García',
      issue: 'No enciende - Revisión inmediata',
      priority: 'ALTA'
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
    if (user && user.role !== UserRole.TECHNICIAN) { // Cambiar por rol correspondiente
      console.warn('⚠️ Usuario sin permisos para este dashboard');
      this.router.navigate(['/unauthorized']);
    }
  }
}