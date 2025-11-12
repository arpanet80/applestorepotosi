// src/app/dashboard/dashboard/dashboard.component.ts - VERSIÓN CORRECTA
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  template: `
    <div class="dashboard-layout">
      <!-- Header con navegación principal -->
      <header class="dashboard-header">
        <div class="header-content">
          <div class="header-left">
            <div class="logo" routerLink="/dashboard">
              <span class="logo-icon">🍎</span>
              <span class="logo-text">Apple Store Potosí</span>
            </div>
          </div>
          
          <div class="header-center">
            <nav class="main-nav">
              <a class="nav-item" routerLink="/dashboard" routerLinkActive="active">Inicio</a>
              <a class="nav-item" routerLink="/dashboard/profile" routerLinkActive="active">Perfil</a>
              <a class="nav-item" routerLink="/dashboard/settings" routerLinkActive="active">Configuración</a>
            </nav>
          </div>
          
          <div class="header-right">
            <div class="user-menu">
              <span class="user-greeting">Hola, {{userName}}</span>
              <div class="user-avatar" (click)="toggleUserMenu()">
                {{userAvatar}}
              </div>
              <div class="user-dropdown" *ngIf="showUserMenu">
                <a class="dropdown-item" routerLink="/dashboard/profile">Mi Perfil</a>
                <a class="dropdown-item" routerLink="/dashboard/settings">Configuración</a>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item logout" (click)="logout()">Cerrar Sesión</button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Sidebar con navegación por rol -->
      <aside class="dashboard-sidebar">
        <nav class="sidebar-nav">
          <div class="sidebar-section">
            <h4 class="section-title">Navegación Principal</h4>
            <a class="sidebar-item" routerLink="/dashboard" routerLinkActive="active">
              <span class="item-icon">📊</span>
              <span class="item-text">Resumen</span>
            </a>
          </div>

          <!-- Navegación específica por rol -->
          <div class="sidebar-section" *ngIf="userRole === 'admin'">
            <h4 class="section-title">Administración</h4>
            <a class="sidebar-item" routerLink="/dashboard/admin" routerLinkActive="active">
              <span class="item-icon">👑</span>
              <span class="item-text">Panel Admin</span>
            </a>
            <a class="sidebar-item" routerLink="/dashboard/admin/users" routerLinkActive="active">
              <span class="item-icon">👥</span>
              <span class="item-text">Usuarios</span>
            </a>
          </div>

          <div class="sidebar-section" *ngIf="userRole === 'sales'">
            <h4 class="section-title">Ventas</h4>
            <a class="sidebar-item" routerLink="/dashboard/sales" routerLinkActive="active">
              <span class="item-icon">💰</span>
              <span class="item-text">Panel Ventas</span>
            </a>
            <a class="sidebar-item" routerLink="/dashboard/sales/point-of-sale" routerLinkActive="active">
              <span class="item-icon">🖨️</span>
              <span class="item-text">Punto de Venta</span>
            </a>
          </div>

          <!-- Más secciones por rol... -->
        </nav>
      </aside>

      <!-- Área principal de contenido DINÁMICO -->
      <main class="dashboard-main">
        <router-outlet></router-outlet>  <!-- ¡Aquí se cargan los componentes específicos! -->
      </main>

      <!-- Footer opcional -->
      <footer class="dashboard-footer">
        <div class="footer-content">
          <p>&copy; 2024 Apple Store Potosí - {{userRole}} Dashboard</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .dashboard-layout {
      display: grid;
      grid-template-areas: 
        "header header"
        "sidebar main"
        "footer footer";
      grid-template-rows: auto 1fr auto;
      grid-template-columns: 250px 1fr;
      min-height: 100vh;
    }

    .dashboard-header {
      grid-area: header;
      background: white;
      border-bottom: 1px solid #e0e0e0;
      padding: 1rem 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1400px;
      margin: 0 auto;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: bold;
      font-size: 1.2rem;
      cursor: pointer;
      color: #2c3e50;
    }

    .logo-icon {
      font-size: 1.5rem;
    }

    .main-nav {
      display: flex;
      gap: 2rem;
    }

    .nav-item {
      text-decoration: none;
      color: #666;
      font-weight: 500;
      transition: color 0.3s ease;
    }

    .nav-item:hover,
    .nav-item.active {
      color: #667eea;
    }

    .user-menu {
      position: relative;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      cursor: pointer;
    }

    .user-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      min-width: 200px;
      z-index: 1000;
    }

    .dropdown-item {
      display: block;
      padding: 0.75rem 1rem;
      text-decoration: none;
      color: #333;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      cursor: pointer;
      transition: background 0.3s ease;
    }

    .dropdown-item:hover {
      background: #f8f9fa;
    }

    .dropdown-item.logout {
      color: #e74c3c;
    }

    .dropdown-divider {
      height: 1px;
      background: #e0e0e0;
      margin: 0.5rem 0;
    }

    .dashboard-sidebar {
      grid-area: sidebar;
      background: #f8f9fa;
      border-right: 1px solid #e0e0e0;
      padding: 1.5rem 0;
    }

    .sidebar-nav {
      padding: 0 1rem;
    }

    .sidebar-section {
      margin-bottom: 2rem;
    }

    .section-title {
      font-size: 0.8rem;
      text-transform: uppercase;
      color: #666;
      margin: 0 0 1rem 1rem;
      font-weight: 600;
    }

    .sidebar-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      text-decoration: none;
      color: #333;
      border-radius: 8px;
      transition: all 0.3s ease;
      margin-bottom: 0.25rem;
    }

    .sidebar-item:hover,
    .sidebar-item.active {
      background: #667eea;
      color: white;
    }

    .item-icon {
      font-size: 1.2rem;
    }

    .dashboard-main {
      grid-area: main;
      background: #f8f9fa;
      padding: 2rem;
      overflow-y: auto;
    }

    .dashboard-footer {
      grid-area: footer;
      background: white;
      border-top: 1px solid #e0e0e0;
      padding: 1rem 2rem;
      text-align: center;
      color: #666;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .dashboard-layout {
        grid-template-areas: 
          "header"
          "main"
          "footer";
        grid-template-columns: 1fr;
      }

      .dashboard-sidebar {
        display: none; /* O implementar menu móvil */
      }

      .dashboard-main {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
        gap: 1rem;
      }

      .main-nav {
        gap: 1rem;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  
  userName = 'Usuario';
  userRole = '';
  userAvatar = 'U';
  showUserMenu = false;

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
      this.userAvatar = this.generateAvatar(user.displayName || user.email);
    }
  }

  private generateAvatar(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  logout(): void {
    this.authService.logout();
  }
}