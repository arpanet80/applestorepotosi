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
    <div class="d-flex flex-column flex-root">
      <div class="d-flex flex-column flex-center flex-column-fluid">
        <div class="d-flex flex-column flex-center text-center p-10">
          
          <!-- Main Card -->
          <div class="card card-flush w-lg-750px py-5">
            <div class="card-body py-15 py-lg-20">
              
              <!-- Logo/Brand -->
              <div class="mb-7">
                <a routerLink="/" class="mb-12">
                  <span class="text-primary fs-2x fw-bold">🎁</span>
                  <span class="text-gray-800 fs-2x fw-bold ms-2">Apple Store Potosí</span>
                </a>
              </div>

              <!-- Status Icon & Title -->
              <div class="mb-10">
                <div class="text-warning mb-5" style="font-size: 5rem;">🔧</div>
                <h1 class="fw-bolder fs-2qx text-gray-900 mb-4">
                  Sistema en Mantenimiento
                </h1>
                <div class="fw-semibold fs-5 text-gray-600 mb-7">
                  Estamos trabajando para mejorar tu experiencia
                </div>
              </div>

              <!-- Maintenance Info -->
              <div class="card bg-light-primary border border-primary border-dashed mb-10">
                <div class="card-body p-8">
                  <div class="row g-5">
                    
                    <div class="col-md-6">
                      <div class="d-flex flex-column">
                        <span class="text-gray-600 fs-7 fw-semibold mb-2">Estado:</span>
                        <span class="badge badge-warning fs-6">
                          <i class="ki-duotone ki-loading fs-3 me-1">
                            <span class="path1"></span>
                            <span class="path2"></span>
                          </i>
                          En Progreso
                        </span>
                      </div>
                    </div>

                    <div class="col-md-6">
                      <div class="d-flex flex-column">
                        <span class="text-gray-600 fs-7 fw-semibold mb-2">Tiempo Restante:</span>
                        <span class="text-danger fs-4 fw-bold font-monospace">{{ countdownText }}</span>
                      </div>
                    </div>

                    <div class="col-md-6">
                      <div class="d-flex flex-column">
                        <span class="text-gray-600 fs-7 fw-semibold mb-2">Inicio:</span>
                        <span class="text-gray-800 fs-6 fw-semibold">{{ maintenanceStart }}</span>
                      </div>
                    </div>

                    <div class="col-md-6">
                      <div class="d-flex flex-column">
                        <span class="text-gray-600 fs-7 fw-semibold mb-2">Finalización Estimada:</span>
                        <span class="text-gray-800 fs-6 fw-semibold">{{ maintenanceEnd }}</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              <!-- Progress Section -->
              <div class="mb-10">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <span class="text-gray-800 fw-semibold fs-6">Progreso del Mantenimiento</span>
                  <span class="badge badge-light-success fs-6 fw-bold">{{ progress }}%</span>
                </div>
                
                <div class="progress h-10px mb-8">
                  <div class="progress-bar bg-success" 
                       role="progressbar" 
                       [style.width.%]="progress"
                       [attr.aria-valuenow]="progress"
                       aria-valuemin="0" 
                       aria-valuemax="100">
                  </div>
                </div>

                <!-- Progress Steps -->
                <div class="row g-5 mb-10">
                  <div class="col-6 col-md-3">
                    <div class="text-center" [class.opacity-50]="progress < 25">
                      <div class="symbol symbol-circle symbol-50px mb-3" 
                           [class.bg-light-primary]="progress < 25"
                           [class.bg-success]="progress >= 25">
                        <span class="symbol-label" 
                              [class.text-primary]="progress < 25"
                              [class.text-white]="progress >= 25">
                          <i class="ki-duotone ki-check fs-2" *ngIf="progress >= 25"></i>
                          <span class="fs-4 fw-bold" *ngIf="progress < 25">1</span>
                        </span>
                      </div>
                      <div class="text-gray-800 fs-7 fw-semibold">Preparación</div>
                    </div>
                  </div>

                  <div class="col-6 col-md-3">
                    <div class="text-center" [class.opacity-50]="progress < 50">
                      <div class="symbol symbol-circle symbol-50px mb-3" 
                           [class.bg-light-primary]="progress < 50"
                           [class.bg-success]="progress >= 50">
                        <span class="symbol-label" 
                              [class.text-primary]="progress < 50"
                              [class.text-white]="progress >= 50">
                          <i class="ki-duotone ki-check fs-2" *ngIf="progress >= 50"></i>
                          <span class="fs-4 fw-bold" *ngIf="progress < 50">2</span>
                        </span>
                      </div>
                      <div class="text-gray-800 fs-7 fw-semibold">Actualización</div>
                    </div>
                  </div>

                  <div class="col-6 col-md-3">
                    <div class="text-center" [class.opacity-50]="progress < 75">
                      <div class="symbol symbol-circle symbol-50px mb-3" 
                           [class.bg-light-primary]="progress < 75"
                           [class.bg-success]="progress >= 75">
                        <span class="symbol-label" 
                              [class.text-primary]="progress < 75"
                              [class.text-white]="progress >= 75">
                          <i class="ki-duotone ki-check fs-2" *ngIf="progress >= 75"></i>
                          <span class="fs-4 fw-bold" *ngIf="progress < 75">3</span>
                        </span>
                      </div>
                      <div class="text-gray-800 fs-7 fw-semibold">Verificación</div>
                    </div>
                  </div>

                  <div class="col-6 col-md-3">
                    <div class="text-center" [class.opacity-50]="progress < 100">
                      <div class="symbol symbol-circle symbol-50px mb-3" 
                           [class.bg-light-primary]="progress < 100"
                           [class.bg-success]="progress === 100">
                        <span class="symbol-label" 
                              [class.text-primary]="progress < 100"
                              [class.text-white]="progress === 100">
                          <i class="ki-duotone ki-check fs-2" *ngIf="progress === 100"></i>
                          <span class="fs-4 fw-bold" *ngIf="progress < 100">4</span>
                        </span>
                      </div>
                      <div class="text-gray-800 fs-7 fw-semibold">Finalización</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Admin Message -->
              <div class="notice d-flex bg-light-info rounded border-info border border-dashed p-6 mb-10">
                <i class="ki-duotone ki-message-text-2 fs-2tx text-info me-4">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                </i>
                <div class="d-flex flex-stack flex-grow-1">
                  <div class="fw-semibold text-start">
                    <div class="fs-6 text-gray-800 fw-bold mb-2">
                      Mensaje del Equipo Técnico
                    </div>
                    <div class="fs-7 text-gray-600">
                      Estamos implementando nuevas funcionalidades y mejoras de seguridad. 
                      Agradecemos tu paciencia durante este proceso. El sistema estará disponible 
                      nuevamente una vez completado el mantenimiento.
                    </div>
                  </div>
                </div>
              </div>

              <!-- Affected Services -->
              <div class="mb-10">
                <h4 class="text-gray-900 fw-bold mb-5">
                  <i class="ki-duotone ki-element-11 fs-2 me-2">
                    <span class="path1"></span>
                    <span class="path2"></span>
                    <span class="path3"></span>
                    <span class="path4"></span>
                  </i>
                  Servicios Afectados Temporalmente
                </h4>
                
                <div class="card card-bordered">
                  <div class="card-body p-0">
                    <div class="table-responsive">
                      <table class="table table-row-dashed align-middle gs-0 gy-4 mb-0">
                        <tbody>
                          <tr *ngFor="let service of affectedServices">
                            <td class="ps-6">
                              <div class="d-flex align-items-center">
                                <div class="symbol symbol-45px me-3">
                                  <span class="symbol-label" 
                                        [class.bg-light-danger]="service.status === 'down'"
                                        [class.bg-light-success]="service.status === 'up'">
                                    <i class="ki-duotone fs-2"
                                       [class.ki-cross]="service.status === 'down'"
                                       [class.ki-check]="service.status === 'up'"
                                       [class.text-danger]="service.status === 'down'"
                                       [class.text-success]="service.status === 'up'">
                                      <span class="path1"></span>
                                      <span class="path2"></span>
                                    </i>
                                  </span>
                                </div>
                                <div class="d-flex flex-column">
                                  <span class="text-gray-800 fw-semibold fs-6">{{ service.name }}</span>
                                </div>
                              </div>
                            </td>
                            <td class="text-end pe-6">
                              <span class="badge" 
                                    [class.badge-light-danger]="service.status === 'down'"
                                    [class.badge-light-success]="service.status === 'up'">
                                {{ service.status === 'down' ? 'No Disponible' : 'Disponible' }}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="mb-10">
                <h4 class="text-gray-900 fw-bold mb-5">Acciones Disponibles</h4>
                <div class="d-flex flex-center flex-wrap gap-3">
                  <button class="btn btn-lg btn-primary" (click)="refreshPage()">
                    <i class="ki-duotone ki-arrows-circle fs-2">
                      <span class="path1"></span>
                      <span class="path2"></span>
                    </i>
                    Reintentar
                  </button>

                  <button class="btn btn-lg btn-light-primary" (click)="checkStatus()">
                    <i class="ki-duotone ki-status fs-2">
                      <span class="path1"></span>
                      <span class="path2"></span>
                      <span class="path3"></span>
                      <span class="path4"></span>
                    </i>
                    Verificar Estado
                  </button>

                  <button class="btn btn-lg btn-light-info" routerLink="/login" *ngIf="!isLoggedIn">
                    <i class="ki-duotone ki-entrance-left fs-2">
                      <span class="path1"></span>
                      <span class="path2"></span>
                    </i>
                    Ir al Login
                  </button>

                  <button class="btn btn-lg btn-light-success" routerLink="/dashboard" *ngIf="isLoggedIn">
                    <i class="ki-duotone ki-home fs-2">
                      <span class="path1"></span>
                      <span class="path2"></span>
                    </i>
                    Ir al Dashboard
                  </button>
                </div>
              </div>

              <!-- Contact Support -->
              <div class="notice d-flex bg-light-warning rounded border-warning border border-dashed p-6">
                <i class="ki-duotone ki-notification-bing fs-2tx text-warning me-4">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                </i>
                <div class="d-flex flex-stack flex-grow-1">
                  <div class="fw-semibold text-start">
                    <h4 class="text-gray-900 fw-bold mb-2">¿Necesitas ayuda inmediata?</h4>
                    <div class="fs-7 text-gray-700 mb-3">
                      Si tienes alguna urgencia, contacta a nuestro equipo de soporte:
                    </div>
                    <div class="d-flex flex-wrap gap-5">
                      <a href="tel:+1234567890" class="text-primary text-hover-primary fw-semibold">
                        <i class="ki-duotone ki-phone fs-3 me-1">
                          <span class="path1"></span>
                          <span class="path2"></span>
                        </i>
                        +1 (234) 567-890
                      </a>
                      <a href="mailto:soporte@applestorepotosi.com" class="text-primary text-hover-primary fw-semibold">
                        <i class="ki-duotone ki-sms fs-3 me-1">
                          <span class="path1"></span>
                          <span class="path2"></span>
                        </i>
                        soporte@applestorepotosi.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- Footer -->
          <div class="d-flex flex-center flex-wrap px-5 mt-10">
            <div class="text-gray-600 fw-semibold fs-6 me-5">
              &copy; 2024 Apple Store Potosí. Todos los derechos reservados.
            </div>
            <div class="text-gray-600 fw-semibold fs-7">
              ID de Mantenimiento: <code class="text-primary">{{ maintenanceId }}</code>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      /* background-color: #f5f8fa;*/
    }


    .cursor-pointer {
      cursor: pointer;
    }

    .font-monospace {
      font-family: 'Courier New', monospace;
    }

    /* Progress bar animation */
    .progress-bar {
      transition: width 0.6s ease;
    }

    /* Card hover effects */
    .card {
      transition: all 0.3s ease;
    }

    .card-bordered:hover {
      box-shadow: 0 0.5rem 1.5rem 0.5rem rgba(0, 0, 0, 0.075);
    }

    /* Button hover effects */
    .btn {
      transition: all 0.3s ease;
    }

    .btn:hover {
      transform: translateY(-2px);
    }

    /* Symbol animations */
    .symbol-label {
      transition: all 0.3s ease;
    }

    /* Notice box styling */
    .notice {
      transition: all 0.3s ease;
    }

    .notice:hover {
      box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.075);
    }

    /* Table row hover */
    .table tbody tr {
      transition: background-color 0.2s ease;
    }

    .table tbody tr:hover {
      background-color: #f9f9f9;
    }

    /* Badge pulse animation */
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
    }

    .badge-warning {
      animation: pulse 2s ease-in-out infinite;
    }

    /* Fade in animation */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .card {
      animation: fadeInUp 0.5s ease;
    }

    /* Code styling */
    code {
      background-color: rgba(102, 126, 234, 0.1);
      color: #667eea;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .w-lg-750px {
        width: 100% !important;
      }

      .fs-2qx {
        font-size: 2rem !important;
      }

      .symbol-50px {
        width: 40px !important;
        height: 40px !important;
      }

      .btn-lg {
        padding: 0.75rem 1.5rem;
      }
    }

    @media (max-width: 576px) {
      .d-flex.gap-3 {
        flex-direction: column;
        width: 100%;
      }

      .btn-lg {
        width: 100%;
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
    setInterval(() => {
      this.countdownText = this.updateCountdown();
    }, 1000);
  }

  private updateCountdown(): string {
    const hours = Math.floor(Math.random() * 4);
    const minutes = Math.floor(Math.random() * 60);
    const seconds = Math.floor(Math.random() * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  private simulateProgress(): void {
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
    console.log('🔍 Verificando estado del sistema...');
    
    setTimeout(() => {
      alert('El sistema sigue en mantenimiento. Por favor, intenta más tarde.');
    }, 1000);
  }

  forceExit(): void {
    if (confirm('¿Estás seguro de que quieres forzar la salida del modo mantenimiento?')) {
      this.router.navigate(['/dashboard']);
    }
  }
}