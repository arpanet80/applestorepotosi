// src/app/customer/customer-dashboard/customer-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { UserRole } from '../../auth/models/user.model';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="customer-dashboard">
      <header class="dashboard-header">
        <div class="header-content">
          <h1>🛍️ Mi Cuenta - Apple Store Potosí</h1>
          <p>Bienvenido a tu centro de servicios Apple</p>
        </div>
      </header>

      <div class="dashboard-content">
        <!-- Resumen del cliente -->
        <div class="customer-summary">
          <div class="welcome-card">
            <div class="welcome-content">
              <h2>¡Hola, {{ customerName }}! 👋</h2>
              <p>Gracias por confiar en Apple Store Potosí para tus productos y servicios Apple</p>
            </div>
            <div class="loyalty-points">
              <div class="points-badge">
                <span class="points-value">1,250</span>
                <span class="points-label">Puntos de Fidelidad</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Servicios activos -->
        <div class="active-services">
          <h3>📋 Mis Servicios Activos</h3>
          <div class="services-grid">
            <div class="service-card" *ngFor="let service of activeServices">
              <div class="service-icon">{{ service.icon }}</div>
              <div class="service-info">
                <h4>{{ service.title }}</h4>
                <p>{{ service.description }}</p>
                <span class="service-status" [class]="service.status">{{ service.statusText }}</span>
              </div>
              <button class="btn-outline" [routerLink]="service.link">Ver</button>
            </div>
          </div>
        </div>

        <!-- Módulos del cliente -->
        <div class="modules-grid">
          <!-- Mis Compras -->
          <div class="module-card" routerLink="/customer/orders">
            <div class="module-icon">📦</div>
            <h3>Mis Compras</h3>
            <p>Historial y seguimiento de pedidos</p>
            <div class="module-actions">
              <span class="badge">12 pedidos</span>
            </div>
          </div>

          <!-- Servicio Técnico -->
          <div class="module-card" routerLink="/customer/services">
            <div class="module-icon">🔧</div>
            <h3>Mis Servicios</h3>
            <p>Reparaciones y mantenimientos</p>
            <div class="module-actions">
              <span class="badge">3 servicios</span>
            </div>
          </div>

          <!-- Garantías -->
          <div class="module-card" routerLink="/customer/warranty">
            <div class="module-icon">📋</div>
            <h3>Mis Garantías</h3>
            <p>Gestionar garantías y soporte</p>
            <div class="module-actions">
              <span class="badge">2 activas</span>
            </div>
          </div>

          <!-- Productos -->
          <div class="module-card" routerLink="/products">
            <div class="module-icon">🛍️</div>
            <h3>Comprar Productos</h3>
            <p>Explorar catálogo de productos Apple</p>
            <div class="module-actions">
              <span class="badge">Nuevos</span>
            </div>
          </div>

          <!-- Soporte -->
          <div class="module-card" routerLink="/customer/support">
            <div class="module-icon">💬</div>
            <h3>Soporte Apple</h3>
            <p>Ayuda y asistencia técnica</p>
            <div class="module-actions">
              <span class="badge">24/7</span>
            </div>
          </div>

          <!-- Configuración -->
          <div class="module-card" routerLink="/profile">
            <div class="module-icon">⚙️</div>
            <h3>Mi Configuración</h3>
            <p>Preferencias y datos personales</p>
            <div class="module-actions">
              <span class="badge">Perfil</span>
            </div>
          </div>
        </div>

        <!-- Productos recomendados -->
        <div class="recommendations">
          <h3>🎯 Productos Recomendados para Ti</h3>
          <div class="products-grid">
            <div class="product-card" *ngFor="let product of recommendedProducts">
              <div class="product-image-placeholder">{{ product.emoji }}</div>
              <div class="product-info">
                <h4>{{ product.name }}</h4>
                <p class="product-price">{{ product.price }}</p>
                <button class="btn-small" routerLink="/products">Ver</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .customer-dashboard {
      min-height: 100vh;
      background: #f8f9fa;
    }

    .dashboard-header {
      background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
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

    .customer-summary {
      margin-bottom: 2rem;
    }

    .welcome-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .welcome-content h2 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
    }

    .welcome-content p {
      margin: 0;
      color: #666;
    }

    .points-badge {
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      text-align: center;
    }

    .points-value {
      display: block;
      font-size: 1.5rem;
      font-weight: bold;
    }

    .points-label {
      font-size: 0.8rem;
      opacity: 0.9;
    }

    .active-services {
      background: white;
      border-radius: 12px;
      padding: 1.5rem 2rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }

    .active-services h3 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
    }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .service-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #9b59b6;
    }

    .service-icon {
      font-size: 1.5rem;
    }

    .service-info {
      flex: 1;
    }

    .service-info h4 {
      margin: 0 0 0.25rem 0;
      color: #2c3e50;
    }

    .service-info p {
      margin: 0 0 0.5rem 0;
      color: #666;
      font-size: 0.9rem;
    }

    .service-status {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 500;
    }

    .service-status.active {
      background: #d4edda;
      color: #155724;
    }

    .service-status.pending {
      background: #fff3cd;
      color: #856404;
    }

    .service-status.completed {
      background: #d1ecf1;
      color: #0c5460;
    }

    .btn-outline {
      background: white;
      color: #9b59b6;
      border: 2px solid #9b59b6;
      border-radius: 6px;
      padding: 6px 12px;
      cursor: pointer;
      font-size: 0.8rem;
      transition: all 0.3s ease;

      &:hover {
        background: #9b59b6;
        color: white;
      }
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
        border-color: #9b59b6;
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
      background: #9b59b6;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .recommendations {
      background: white;
      border-radius: 12px;
      padding: 1.5rem 2rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .recommendations h3 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .product-card {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.3s ease;
      background: white;
    }

    .product-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .product-image-placeholder {
      width: 100%;
      height: 120px;
      background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
    }

    .product-info {
      padding: 1rem;
    }

    .product-info h4 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
      font-size: 0.9rem;
    }

    .product-price {
      color: #9b59b6;
      font-weight: bold;
      margin: 0 0 0.5rem 0;
    }

    .btn-small {
      background: #9b59b6;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.8rem;
      width: 100%;
      transition: all 0.3s ease;

      &:hover {
        background: #8e44ad;
      }
    }

    /* Estilos responsive */
    @media (max-width: 768px) {
      .dashboard-content {
        padding: 1rem;
      }

      .welcome-card {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .services-grid {
        grid-template-columns: 1fr;
      }

      .modules-grid {
        grid-template-columns: 1fr;
      }

      .products-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 480px) {
      .products-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CustomerDashboardComponent implements OnInit {
  
  customerName = 'Cliente';
  activeServices = [
    {
      icon: '🔧',
      title: 'Reparación iPhone 14',
      description: 'Cambio de pantalla',
      status: 'active',
      statusText: 'En Proceso',
      link: '/customer/services'
    },
    {
      icon: '📦',
      title: 'Pedido #ORD-001',
      description: 'AirPods Pro 2da Gen',
      status: 'pending', 
      statusText: 'En Camino',
      link: '/customer/orders'
    },
    {
      icon: '📋',
      title: 'Garantía MacBook',
      description: 'Cubre hasta Mar 2025',
      status: 'active',
      statusText: 'Activa',
      link: '/customer/warranty'
    }
  ];

  recommendedProducts = [
    {
      id: 1,
      name: 'iPhone 15 Pro',
      price: '$1,199.00',
      emoji: '📱'
    },
    {
      id: 2,
      name: 'Apple Watch Series 9',
      price: '$399.00',
      emoji: '⌚'
    },
    {
      id: 3,
      name: 'AirPods Max',
      price: '$549.00',
      emoji: '🎧'
    },
    {
      id: 4,
      name: 'MagSafe Charger',
      price: '$39.00',
      emoji: '⚡'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // ngOnInit() {
  //   const user = this.authService.getCurrentUser();
  //   this.customerName = user?.displayName || 'Cliente';
  //   console.log('🛍️ Panel de cliente cargado');
  // }

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.customerName = user?.displayName || 'Cliente';
    console.log(`✅ ${user?.role} dashboard cargado para: ${user?.displayName}`);
    
    // Verificación adicional de rol (opcional)
    if (user && user.role !== UserRole.CUSTOMER) { // Cambiar por rol correspondiente
      console.warn('⚠️ Usuario sin permisos para este dashboard');
      this.router.navigate(['/unauthorized']);
    }
  }
}