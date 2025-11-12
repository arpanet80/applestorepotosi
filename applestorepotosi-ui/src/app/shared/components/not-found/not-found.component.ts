// src/app/shared/not-found/not-found.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="not-found-container">
      <div class="not-found-content">
        <!-- Encabezado con logo -->
        <div class="not-found-header">
          <div class="logo">
            <span class="logo-icon">🍎</span>
            <span class="logo-text">Apple Store Potosí</span>
          </div>
        </div>

        <!-- Contenido principal -->
        <div class="error-card">
          <div class="error-icon">🔍</div>
          
          <h1>404 - Página No Encontrada</h1>
          
          <p class="error-description">
            La página que estás buscando no existe o ha sido movida.
          </p>

          <!-- Información de debug (solo en desarrollo) -->
          <div class="debug-info" *ngIf="isDevelopment">
            <div class="debug-item">
              <strong>Ruta solicitada:</strong> 
              <code>{{ requestedPath }}</code>
            </div>
            <div class="debug-item">
              <strong>Usuario autenticado:</strong> 
              <span [class]="isLoggedIn ? 'status-success' : 'status-error'">
                {{ isLoggedIn ? 'Sí' : 'No' }}
              </span>
            </div>
            <div class="debug-item" *ngIf="userRole">
              <strong>Rol del usuario:</strong> 
              <span class="role-badge">{{ userRole }}</span>
            </div>
          </div>

          <!-- Mensajes contextuales -->
          <div class="context-message">
            <div class="message-icon">💡</div>
            <p>
              <strong>Posibles razones:</strong><br>
              • La URL puede contener errores<br>
              • La página fue eliminada o movida<br>
              • No tienes permisos para acceder<br>
              • Enlace externo incorrecto
            </p>
          </div>

          <!-- Sugerencias basadas en el rol del usuario -->
          <div class="suggestions" *ngIf="isLoggedIn">
            <h3>🎯 Sugerencias para {{ userName }}</h3>
            <div class="suggestions-grid">
              
              <!-- Sugerencias para ADMIN -->
              <div *ngIf="userRole === 'admin'" class="suggestion-card">
                <div class="suggestion-icon">👑</div>
                <h4>Panel Administrativo</h4>
                <p>Accede a las herramientas de administración del sistema</p>
                <button class="suggestion-btn" routerLink="/dashboard/admin">
                  Ir al Panel Admin
                </button>
              </div>

              <!-- Sugerencias para SALES -->
              <div *ngIf="userRole === 'sales'" class="suggestion-card">
                <div class="suggestion-icon">💰</div>
                <h4>Punto de Venta</h4>
                <p>Gestiona ventas y atención al cliente</p>
                <button class="suggestion-btn" routerLink="/dashboard/sales">
                  Ir a Ventas
                </button>
              </div>

              <!-- Sugerencias para TECHNICIAN -->
              <div *ngIf="userRole === 'technician'" class="suggestion-card">
                <div class="suggestion-icon">🔧</div>
                <h4>Servicio Técnico</h4>
                <p>Gestiona reparaciones y diagnósticos</p>
                <button class="suggestion-btn" routerLink="/dashboard/technician">
                  Ir a Técnico
                </button>
              </div>

              <!-- Sugerencias para CUSTOMER -->
              <div *ngIf="userRole === 'customer'" class="suggestion-card">
                <div class="suggestion-icon">🛍️</div>
                <h4>Mi Cuenta</h4>
                <p>Revisa tus pedidos y servicios</p>
                <button class="suggestion-btn" routerLink="/dashboard/customer">
                  Ir a Mi Cuenta
                </button>
              </div>

              <!-- Sugerencia común: Dashboard -->
              <div class="suggestion-card">
                <div class="suggestion-icon">📊</div>
                <h4>Dashboard Principal</h4>
                <p>Ve a la página principal de tu panel</p>
                <button class="suggestion-btn" routerLink="/dashboard">
                  Ir al Dashboard
                </button>
              </div>

              <!-- Sugerencia común: Perfil -->
              <div class="suggestion-card">
                <div class="suggestion-icon">👤</div>
                <h4>Mi Perfil</h4>
                <p>Actualiza tu información personal</p>
                <button class="suggestion-btn" routerLink="/dashboard/profile">
                  Ver Perfil
                </button>
              </div>

            </div>
          </div>

          <!-- Acciones principales -->
          <div class="primary-actions">
            <h3>🚀 ¿Qué te gustaría hacer?</h3>
            <div class="actions-grid">
              
              <button class="action-btn primary" routerLink="/dashboard" *ngIf="isLoggedIn">
                <span class="action-icon">🏠</span>
                <span>Ir al Inicio</span>
              </button>

              <button class="action-btn primary" routerLink="/login" *ngIf="!isLoggedIn">
                <span class="action-icon">🔐</span>
                <span>Iniciar Sesión</span>
              </button>

              <button class="action-btn secondary" (click)="goBack()">
                <span class="action-icon">↩️</span>
                <span>Volver Atrás</span>
              </button>

              <button class="action-btn secondary" (click)="goHome()">
                <span class="action-icon">🍎</span>
                <span>Página Principal</span>
              </button>

              <button class="action-btn outline" (click)="searchInApp()">
                <span class="action-icon">🔍</span>
                <span>Buscar en la App</span>
              </button>

              <button class="action-btn outline" (click)="reportProblem()">
                <span class="action-icon">🐛</span>
                <span>Reportar Problema</span>
              </button>

            </div>
          </div>

          <!-- Búsqueda rápida -->
          <div class="quick-search">
            <h4>🔍 ¿Buscas algo específico?</h4>
            <div class="search-suggestions">
              <button class="search-tag" (click)="navigateTo('/products')">Productos</button>
              <button class="search-tag" (click)="navigateTo('/dashboard/profile')">Mi Perfil</button>
              <button class="search-tag" (click)="navigateTo('/dashboard/settings')">Configuración</button>
              <button class="search-tag" (click)="navigateTo('/customer/orders')">Mis Pedidos</button>
              <button class="search-tag" (click)="navigateTo('/technician/repairs')">Reparaciones</button>
              <button class="search-tag" (click)="navigateTo('/sales/point-of-sale')">Punto de Venta</button>
            </div>
          </div>

          <!-- Información de contacto -->
          <div class="contact-support">
            <div class="support-icon">💬</div>
            <p><strong>¿Necesitas ayuda?</strong></p>
            <p>Si crees que esto es un error, contacta a nuestro equipo de soporte:</p>
            <div class="contact-methods">
              <a href="mailto:soporte@applestorepotosi.com" class="contact-link">
                <span class="contact-icon">✉️</span>
                soporte@applestorepotosi.com
              </a>
              <a href="tel:+1234567890" class="contact-link">
                <span class="contact-icon">📞</span>
                +1 (234) 567-890
              </a>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="not-found-footer">
          <p>&copy; 2024 Apple Store Potosí. Todos los derechos reservados.</p>
          <p class="footer-note">
            Error 404 - Página no encontrada • 
            <button class="footer-link" (click)="refreshPage()">Recargar página</button> • 
            <button class="footer-link" (click)="viewSitemap()">Ver mapa del sitio</button>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .not-found-content {
      width: 100%;
      max-width: 900px;
    }

    .not-found-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: white;
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 1rem;
    }

    .logo-icon {
      font-size: 2rem;
    }

    .error-card {
      background: white;
      border-radius: 20px;
      padding: 3rem;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
      text-align: center;
    }

    .error-icon {
      font-size: 6rem;
      margin-bottom: 1.5rem;
      animation: bounce 2s infinite;
    }

    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
      }
      40% {
        transform: translateY(-10px);
      }
      60% {
        transform: translateY(-5px);
      }
    }

    .error-card h1 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
      font-size: 2.5rem;
      font-weight: 700;
    }

    .error-description {
      color: #666;
      font-size: 1.2rem;
      margin-bottom: 2rem;
      line-height: 1.6;
    }

    .debug-info {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      text-align: left;
    }

    .debug-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid #e9ecef;
    }

    .debug-item:last-child {
      border-bottom: none;
    }

    .status-success {
      color: #27ae60;
      font-weight: bold;
    }

    .status-error {
      color: #e74c3c;
      font-weight: bold;
    }

    .role-badge {
      background: #667eea;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .context-message {
      background: #e3f2fd;
      border: 1px solid #bbdefb;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      text-align: left;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .message-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .context-message p {
      margin: 0;
      color: #455a64;
      line-height: 1.6;
    }

    .suggestions {
      margin-bottom: 2rem;
      text-align: left;
    }

    .suggestions h3 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
      text-align: center;
    }

    .suggestions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .suggestion-card {
      background: #f8f9fa;
      border: 2px solid #e9ecef;
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
      transition: all 0.3s ease;
    }

    .suggestion-card:hover {
      border-color: #667eea;
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }

    .suggestion-icon {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    .suggestion-card h4 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
    }

    .suggestion-card p {
      color: #666;
      margin: 0 0 1rem 0;
      font-size: 0.9rem;
      line-height: 1.4;
    }

    .suggestion-btn {
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 0.5rem 1rem;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.3s ease;
      width: 100%;
    }

    .suggestion-btn:hover {
      background: #5a6fd8;
    }

    .primary-actions {
      margin-bottom: 2rem;
    }

    .primary-actions h3 {
      margin: 0 0 1.5rem 0;
      color: #2c3e50;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .action-btn {
      border: none;
      border-radius: 10px;
      padding: 1rem 1.5rem;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 1rem;
    }

    .action-btn.primary {
      background: #667eea;
      color: white;
    }

    .action-btn.primary:hover {
      background: #5a6fd8;
      transform: translateY(-2px);
    }

    .action-btn.secondary {
      background: #f8f9fa;
      color: #2c3e50;
      border: 2px solid #e9ecef;
    }

    .action-btn.secondary:hover {
      background: #e9ecef;
      transform: translateY(-2px);
    }

    .action-btn.outline {
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
    }

    .action-btn.outline:hover {
      background: #667eea;
      color: white;
      transform: translateY(-2px);
    }

    .action-icon {
      font-size: 1.2rem;
    }

    .quick-search {
      margin-bottom: 2rem;
    }

    .quick-search h4 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
      text-align: center;
    }

    .search-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: center;
    }

    .search-tag {
      background: #e3f2fd;
      color: #1976d2;
      border: 1px solid #bbdefb;
      border-radius: 20px;
      padding: 0.5rem 1rem;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.3s ease;
    }

    .search-tag:hover {
      background: #1976d2;
      color: white;
      transform: translateY(-1px);
    }

    .contact-support {
      background: #fff3e0;
      border: 1px solid #ffe0b2;
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
      margin-bottom: 2rem;
    }

    .support-icon {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    .contact-support p {
      margin: 0 0 1rem 0;
      color: #e65100;
    }

    .contact-methods {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      align-items: center;
    }

    .contact-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.3s ease;
    }

    .contact-link:hover {
      color: #5a6fd8;
    }

    .not-found-footer {
      color: white;
      text-align: center;
      margin-top: 2rem;
      opacity: 0.8;
    }

    .footer-note {
      font-size: 0.9rem;
      margin-top: 0.5rem;
    }

    .footer-link {
      background: none;
      border: none;
      color: white;
      text-decoration: underline;
      cursor: pointer;
      opacity: 0.8;
      transition: opacity 0.3s ease;
    }

    .footer-link:hover {
      opacity: 1;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .not-found-container {
        padding: 1rem;
      }

      .error-card {
        padding: 2rem;
      }

      .error-card h1 {
        font-size: 2rem;
      }

      .suggestions-grid {
        grid-template-columns: 1fr;
      }

      .actions-grid {
        grid-template-columns: 1fr;
      }

      .search-suggestions {
        justify-content: flex-start;
      }

      .context-message {
        flex-direction: column;
        text-align: center;
      }
    }

    @media (max-width: 480px) {
      .error-card {
        padding: 1.5rem;
      }

      .debug-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
      }

      .contact-methods {
        align-items: flex-start;
      }
    }
  `]
})
export class NotFoundComponent implements OnInit {
  
  requestedPath = '';
  isLoggedIn = false;
  userRole = '';
  userName = '';
  isDevelopment = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.loadUserData();
    this.getRequestedPath();
    this.checkEnvironment();
  }

  private loadUserData(): void {
    const user = this.authService.getCurrentUser();
    this.isLoggedIn = !!user;
    
    if (user) {
      this.userRole = user.role;
      this.userName = user.displayName || user.email || 'Usuario';
    }
  }

  private getRequestedPath(): void {
    this.requestedPath = this.router.url;
    console.log(`🔍 Ruta no encontrada: ${this.requestedPath}`);
  }

  private checkEnvironment(): void {
    this.isDevelopment = !environment.production;
  }

  goBack(): void {
    window.history.back();
  }

  goHome(): void {
    if (this.isLoggedIn) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  refreshPage(): void {
    window.location.reload();
  }

  searchInApp(): void {
    // En una app real, podrías abrir un modal de búsqueda
    alert('Funcionalidad de búsqueda - Próximamente');
  }

  reportProblem(): void {
    const emailSubject = `Problema 404 - Ruta no encontrada: ${this.requestedPath}`;
    const emailBody = `Hola equipo de soporte,\n\nEncontré un error 404 al intentar acceder a: ${this.requestedPath}\n\nInformación adicional:\n- Usuario: ${this.userName || 'No autenticado'}\n- Rol: ${this.userRole || 'N/A'}\n- Navegador: ${navigator.userAgent}\n\nGracias.`;
    
    window.open(`mailto:soporte@applestorepotosi.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`);
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  viewSitemap(): void {
    // En una app real, mostrarías un modal con el mapa del sitio
    alert('Mapa del sitio - Próximamente');
  }
}