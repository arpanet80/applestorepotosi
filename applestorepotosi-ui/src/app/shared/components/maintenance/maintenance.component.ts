// src/app/shared/maintenance/maintenance.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="maintenance-container">
      <div class="maintenance-content">
        <!-- Header con logo y título -->
        <div class="maintenance-header">
          <div class="logo">
            <span class="logo-icon">🍎</span>
            <span class="logo-text">Apple Store Potosí</span>
          </div>
          <h1>🔧 Modo Mantenimiento</h1>
          <p class="subtitle">Estamos trabajando para mejorar tu experiencia</p>
        </div>

        <!-- Información principal -->
        <div class="maintenance-card">
          <div class="status-icon">🚧</div>
          
          <h2>Sistema en Mantenimiento</h2>
          
          <p class="maintenance-description">
            Nuestra plataforma se encuentra actualmente en mantenimiento programado 
            para implementar mejoras y garantizar un servicio óptimo.
          </p>

          <!-- Información específica del mantenimiento -->
          <div class="maintenance-info">
            <div class="info-item">
              <span class="info-label">Estado:</span>
              <span class="info-value status-in-progress">En Progreso</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">Inicio:</span>
              <span class="info-value">{{ maintenanceStart }}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">Estimado de Finalización:</span>
              <span class="info-value">{{ maintenanceEnd }}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">Tiempo Restante:</span>
              <span class="info-value countdown">{{ countdownText }}</span>
            </div>
          </div>

          <!-- Progreso del mantenimiento -->
          <div class="progress-section">
            <div class="progress-header">
              <span>Progreso del Mantenimiento</span>
              <span class="progress-percentage">{{ progress }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="progress"></div>
            </div>
            <div class="progress-steps">
              <div class="step" [class.active]="progress >= 25" [class.completed]="progress > 25">
                <span class="step-number">1</span>
                <span class="step-text">Preparación</span>
              </div>
              <div class="step" [class.active]="progress >= 50" [class.completed]="progress > 50">
                <span class="step-number">2</span>
                <span class="step-text">Actualización</span>
              </div>
              <div class="step" [class.active]="progress >= 75" [class.completed]="progress > 75">
                <span class="step-number">3</span>
                <span class="step-text">Verificación</span>
              </div>
              <div class="step" [class.active]="progress >= 100" [class.completed]="progress === 100">
                <span class="step-number">4</span>
                <span class="step-text">Finalización</span>
              </div>
            </div>
          </div>

          <!-- Mensaje del administrador -->
          <div class="admin-message">
            <div class="message-header">
              <span class="message-icon">💬</span>
              <strong>Mensaje del Equipo Técnico</strong>
            </div>
            <p class="message-text">
              Estamos implementando nuevas funcionalidades y mejoras de seguridad. 
              Agradecemos tu paciencia durante este proceso. El sistema estará disponible 
              nuevamente una vez completado el mantenimiento.
            </p>
          </div>

          <!-- Servicios afectados -->
          <div class="affected-services">
            <h4>📋 Servicios Afectados Temporalmente</h4>
            <div class="services-list">
              <div class="service-item" *ngFor="let service of affectedServices">
                <span class="service-name">{{ service.name }}</span>
                <span class="service-status" [class]="service.status">
                  {{ service.status === 'down' ? '⏸️ No Disponible' : '✅ Disponible' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Acciones disponibles -->
          <div class="available-actions">
            <h4>🔄 Acciones Disponibles</h4>
            <div class="actions-grid">
              <button class="action-btn" (click)="refreshPage()">
                <span class="action-icon">🔄</span>
                <span>Reintentar</span>
              </button>
              
              <button class="action-btn" (click)="checkStatus()">
                <span class="action-icon">📡</span>
                <span>Verificar Estado</span>
              </button>
              
              <button class="action-btn" routerLink="/login" *ngIf="!isLoggedIn">
                <span class="action-icon">🔐</span>
                <span>Ir al Login</span>
              </button>
              
              <button class="action-btn" routerLink="/dashboard" *ngIf="isLoggedIn">
                <span class="action-icon">🏠</span>
                <span>Ir al Dashboard</span>
              </button>
            </div>
          </div>

          <!-- Información de contacto -->
          <div class="contact-info">
            <p>📞 ¿Necesitas ayuda inmediata?</p>
            <div class="contact-methods">
              <a href="tel:+1234567890" class="contact-link">
                <span class="contact-icon">📞</span>
                +1 (234) 567-890
              </a>
              <a href="mailto:soporte@applestorepotosi.com" class="contact-link">
                <span class="contact-icon">✉️</span>
                soporte@applestorepotosi.com
              </a>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="maintenance-footer">
          <p>&copy; 2024 Apple Store Potosí. Todos los derechos reservados.</p>
          <p class="footer-note">
            ID de Mantenimiento: <code>{{ maintenanceId }}</code>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .maintenance-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .maintenance-content {
      width: 100%;
      max-width: 800px;
      text-align: center;
    }

    .maintenance-header {
      margin-bottom: 2rem;
      color: white;
    }

    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      font-size: 1.5rem;
      font-weight: bold;
    }

    .logo-icon {
      font-size: 2rem;
    }

    .maintenance-header h1 {
      margin: 0 0 0.5rem 0;
      font-size: 2.5rem;
    }

    .subtitle {
      margin: 0;
      opacity: 0.9;
      font-size: 1.1rem;
    }

    .maintenance-card {
      background: white;
      border-radius: 16px;
      padding: 2.5rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    }

    .status-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .maintenance-card h2 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
      font-size: 1.8rem;
    }

    .maintenance-description {
      color: #666;
      line-height: 1.6;
      margin-bottom: 2rem;
      font-size: 1.1rem;
    }

    .maintenance-info {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      text-align: left;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid #e9ecef;
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .info-label {
      color: #666;
      font-weight: 500;
    }

    .info-value {
      font-weight: bold;
      color: #2c3e50;
    }

    .status-in-progress {
      color: #f39c12;
    }

    .countdown {
      color: #e74c3c;
      font-family: 'Courier New', monospace;
    }

    .progress-section {
      margin-bottom: 2rem;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .progress-percentage {
      color: #27ae60;
      font-weight: bold;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 1.5rem;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #27ae60, #2ecc71);
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    .progress-steps {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      opacity: 0.5;
      transition: all 0.3s ease;
    }

    .step.active {
      opacity: 1;
    }

    .step.completed {
      opacity: 1;
    }

    .step.completed .step-number {
      background: #27ae60;
      color: white;
    }

    .step-number {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #e9ecef;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: bold;
    }

    .step-text {
      font-size: 0.8rem;
      color: #666;
      text-align: center;
    }

    .admin-message {
      background: #e3f2fd;
      border: 1px solid #bbdefb;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      text-align: left;
    }

    .message-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      color: #1976d2;
    }

    .message-text {
      color: #455a64;
      line-height: 1.5;
      margin: 0;
    }

    .affected-services {
      margin-bottom: 2rem;
      text-align: left;
    }

    .affected-services h4 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
    }

    .services-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .service-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .service-name {
      font-weight: 500;
    }

    .service-status.down {
      color: #e74c3c;
      font-weight: 500;
    }

    .service-status.up {
      color: #27ae60;
      font-weight: 500;
    }

    .available-actions {
      margin-bottom: 2rem;
      text-align: left;
    }

    .available-actions h4 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .action-btn {
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-weight: 500;
    }

    .action-btn:hover {
      background: #5a6fd8;
      transform: translateY(-2px);
    }

    .contact-info {
      background: #fff3e0;
      border: 1px solid #ffe0b2;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }

    .contact-info p {
      margin: 0 0 1rem 0;
      color: #e65100;
      font-weight: 500;
    }

    .contact-methods {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
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

    .maintenance-footer {
      color: white;
      opacity: 0.8;
    }

    .footer-note {
      font-size: 0.9rem;
      margin-top: 0.5rem;
    }

    code {
      background: rgba(255, 255, 255, 0.2);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .maintenance-container {
        padding: 1rem;
      }

      .maintenance-card {
        padding: 1.5rem;
      }

      .maintenance-header h1 {
        font-size: 2rem;
      }

      .progress-steps {
        grid-template-columns: repeat(2, 1fr);
      }

      .actions-grid {
        grid-template-columns: 1fr;
      }

      .contact-methods {
        flex-direction: column;
      }
    }

    @media (max-width: 480px) {
      .progress-steps {
        grid-template-columns: 1fr;
      }

      .info-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
      }
    }
  `]
})
export class MaintenanceComponent implements OnInit {
  
  maintenanceStart = '20 Nov 2024, 22:00';
  maintenanceEnd = '21 Nov 2024, 02:00';
  countdownText = '03:45:12';
  progress = 65;
  maintenanceId = 'MTN-2024-001';
  isLoggedIn = false;

  affectedServices = [
    { name: 'Sistema de Ventas', status: 'down' },
    { name: 'Gestión de Inventario', status: 'down' },
    { name: 'Servicio Técnico', status: 'down' },
    { name: 'Portal del Cliente', status: 'down' },
    { name: 'Sistema de Autenticación', status: 'up' },
    { name: 'Página de Información', status: 'up' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkAuthStatus();
    this.startCountdown();
    this.simulateProgress();
  }

  private checkAuthStatus(): void {
    this.isLoggedIn = this.authService.isAuthenticated();
  }

  private startCountdown(): void {
    // Simulación de countdown - en una app real usarías fechas reales
    setInterval(() => {
      // Lógica de countdown real iría aquí
      this.countdownText = this.updateCountdown();
    }, 1000);
  }

  private updateCountdown(): string {
    // Simulación - en producción calcularías el tiempo real
    const hours = Math.floor(Math.random() * 4);
    const minutes = Math.floor(Math.random() * 60);
    const seconds = Math.floor(Math.random() * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  private simulateProgress(): void {
    // Simula el progreso del mantenimiento
    const interval = setInterval(() => {
      if (this.progress < 100) {
        this.progress += Math.random() * 5;
        if (this.progress > 100) this.progress = 100;
      } else {
        clearInterval(interval);
      }
    }, 3000);
  }

  refreshPage(): void {
    window.location.reload();
  }

  checkStatus(): void {
    // Simular verificación de estado
    console.log('🔍 Verificando estado del sistema...');
    
    // En una app real, harías una petición al servidor
    setTimeout(() => {
      alert('El sistema sigue en mantenimiento. Por favor, intenta más tarde.');
    }, 1000);
  }

  // Método para forzar salida del modo mantenimiento (solo para desarrollo)
  forceExit(): void {
    if (confirm('¿Estás seguro de que quieres forzar la salida del modo mantenimiento?')) {
      this.router.navigate(['/dashboard']);
    }
  }
}