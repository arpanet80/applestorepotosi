import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="d-flex flex-column flex-root">
      <div class="d-flex flex-column flex-center flex-column-fluid">
        <div class="d-flex flex-column flex-center text-center p-10">
          
          <!-- Main Card -->
          <div class="card card-flush w-lg-650px py-5">
            <div class="card-body py-15 py-lg-20">
              
              <!-- Logo/Brand -->
              <div class="mb-10">
                <a routerLink="/" class="mb-12">
                  <span class="text-primary fs-2x fw-bold">🎁</span>
                  <span class="text-gray-800 fs-2x fw-bold ms-2">Apple Store Potosí</span>
                </a>
              </div>

              <!-- Error Icon & Title -->
              <div class="mb-10">
                <div class="symbol symbol-100px symbol-circle mb-7">
                  <span class="symbol-label bg-light-danger">
                    <i class="ki-duotone ki-cross-circle fs-3x text-danger">
                      <span class="path1"></span>
                      <span class="path2"></span>
                    </i>
                  </span>
                </div>
                
                <h1 class="fw-bolder fs-2qx text-gray-900 mb-4">
                  Acceso Denegado
                </h1>
                
                <div class="fw-semibold fs-6 text-gray-500 mb-7">
                  No tienes permisos para acceder a esta página.
                </div>
              </div>

              <!-- User Info Notice -->
              <div class="notice d-flex bg-light-warning rounded border-warning border border-dashed p-6 mb-10" *ngIf="currentUser">
                <i class="ki-duotone ki-shield-tick fs-2tx text-warning me-4">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                </i>
                <div class="d-flex flex-stack flex-grow-1">
                  <div class="fw-semibold text-start">
                    <div class="fs-6 text-gray-800 mb-2">
                      <span class="fw-bold">Información de tu cuenta:</span>
                    </div>
                    <div class="fs-7 text-gray-700">
                      <div class="mb-2">
                        <span class="text-gray-600">Usuario:</span>
                        <span class="text-gray-900 fw-semibold ms-2">{{ currentUser.displayName || currentUser.email }}</span>
                      </div>
                      <div>
                        <span class="text-gray-600">Rol actual:</span>
                        <span class="badge badge-warning ms-2">{{ getRoleLabel(currentUser.role) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Explanation Notice -->
              <div class="notice d-flex bg-light-info rounded border-info border border-dashed p-6 mb-10">
                <i class="ki-duotone ki-information fs-2tx text-info me-4">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                </i>
                <div class="d-flex flex-stack flex-grow-1">
                  <div class="fw-semibold text-start">
                    <div class="fs-6 text-gray-800 fw-bold mb-2">
                      ¿Por qué veo este mensaje?
                    </div>
                    <div class="fs-7 text-gray-600">
                      • Esta página requiere permisos específicos que tu cuenta no tiene<br>
                      • Tu rol actual no permite acceder a este recurso<br>
                      • Es posible que necesites contactar al administrador del sistema
                    </div>
                  </div>
                </div>
              </div>

              <!-- Available Actions for Current Role -->
              <div class="mb-10" *ngIf="currentUser">
                <h4 class="text-gray-900 fw-bold mb-5">
                  Acciones disponibles para tu rol
                </h4>
                
                <div class="row g-5">
                  
                  <!-- Admin -->
                  <div class="col-md-6" *ngIf="currentUser.role === 'admin'">
                    <div class="card card-bordered h-100 hover-elevate-up cursor-pointer" routerLink="/dashboard/admin">
                      <div class="card-body d-flex flex-center flex-column p-9">
                        <div class="symbol symbol-65px symbol-circle mb-5">
                          <span class="symbol-label fs-2x fw-semibold bg-light-primary text-primary">👑</span>
                        </div>
                        <div class="fs-5 fw-bold text-gray-800 mb-2">Panel Admin</div>
                        <div class="fs-7 text-gray-600 text-center">
                          Gestión administrativa
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Sales -->
                  <div class="col-md-6" *ngIf="currentUser.role === 'sales'">
                    <div class="card card-bordered h-100 hover-elevate-up cursor-pointer" routerLink="/dashboard/sales">
                      <div class="card-body d-flex flex-center flex-column p-9">
                        <div class="symbol symbol-65px symbol-circle mb-5">
                          <span class="symbol-label fs-2x fw-semibold bg-light-success text-success">💰</span>
                        </div>
                        <div class="fs-5 fw-bold text-gray-800 mb-2">Punto de Venta</div>
                        <div class="fs-7 text-gray-600 text-center">
                          Gestión de ventas
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Technician -->
                  <div class="col-md-6" *ngIf="currentUser.role === 'technician'">
                    <div class="card card-bordered h-100 hover-elevate-up cursor-pointer" routerLink="/dashboard/technician">
                      <div class="card-body d-flex flex-center flex-column p-9">
                        <div class="symbol symbol-65px symbol-circle mb-5">
                          <span class="symbol-label fs-2x fw-semibold bg-light-warning text-warning">🔧</span>
                        </div>
                        <div class="fs-5 fw-bold text-gray-800 mb-2">Servicio Técnico</div>
                        <div class="fs-7 text-gray-600 text-center">
                          Reparaciones y soporte
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Customer -->
                  <div class="col-md-6" *ngIf="currentUser.role === 'customer'">
                    <div class="card card-bordered h-100 hover-elevate-up cursor-pointer" routerLink="/dashboard/customer">
                      <div class="card-body d-flex flex-center flex-column p-9">
                        <div class="symbol symbol-65px symbol-circle mb-5">
                          <span class="symbol-label fs-2x fw-semibold bg-light-info text-info">🛍️</span>
                        </div>
                        <div class="fs-5 fw-bold text-gray-800 mb-2">Mi Cuenta</div>
                        <div class="fs-7 text-gray-600 text-center">
                          Pedidos y servicios
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Dashboard -->
                  <div class="col-md-6">
                    <div class="card card-bordered h-100 hover-elevate-up cursor-pointer" routerLink="/dashboard">
                      <div class="card-body d-flex flex-center flex-column p-9">
                        <div class="symbol symbol-65px symbol-circle mb-5">
                          <span class="symbol-label fs-2x fw-semibold bg-light-primary text-primary">🏠</span>
                        </div>
                        <div class="fs-5 fw-bold text-gray-800 mb-2">Dashboard</div>
                        <div class="fs-7 text-gray-600 text-center">
                          Página principal
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Profile -->
                  <div class="col-md-6">
                    <div class="card card-bordered h-100 hover-elevate-up cursor-pointer" routerLink="/dashboard/profile">
                      <div class="card-body d-flex flex-center flex-column p-9">
                        <div class="symbol symbol-65px symbol-circle mb-5">
                          <span class="symbol-label fs-2x fw-semibold bg-light-dark text-dark">👤</span>
                        </div>
                        <div class="fs-5 fw-bold text-gray-800 mb-2">Mi Perfil</div>
                        <div class="fs-7 text-gray-600 text-center">
                          Configuración de cuenta
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <!-- Primary Actions -->
              <div class="mb-10">
                <div class="d-flex flex-center flex-wrap gap-3">
                  <button class="btn btn-lg btn-primary" (click)="goToDashboard()">
                    <i class="ki-duotone ki-home fs-2">
                      <span class="path1"></span>
                      <span class="path2"></span>
                    </i>
                    Ir al Dashboard
                  </button>

                  <button class="btn btn-lg btn-light-primary" (click)="goBack()">
                    <i class="ki-duotone ki-arrow-left fs-2">
                      <span class="path1"></span>
                      <span class="path2"></span>
                    </i>
                    Volver Atrás
                  </button>

                  <button class="btn btn-lg btn-light-danger" (click)="logout()">
                    <i class="ki-duotone ki-exit-left fs-2">
                      <span class="path1"></span>
                      <span class="path2"></span>
                    </i>
                    Cerrar Sesión
                  </button>
                </div>
              </div>

              <!-- Help Notice -->
              <div class="notice d-flex bg-light-primary rounded border-primary border border-dashed p-6">
                <i class="ki-duotone ki-questionnaire-tablet fs-2tx text-primary me-4">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                <div class="d-flex flex-stack flex-grow-1">
                  <div class="fw-semibold text-start">
                    <div class="fs-6 text-gray-800 fw-bold mb-2">
                      ¿Necesitas ayuda?
                    </div>
                    <div class="fs-7 text-gray-700 mb-3">
                      Si crees que deberías tener acceso a esta página, contacta al administrador del sistema.
                    </div>
                    <div class="d-flex flex-wrap gap-5">
                      <a href="mailto:admin@applestorepotosi.com" class="text-primary text-hover-primary fw-semibold">
                        <i class="ki-duotone ki-sms fs-3 me-1">
                          <span class="path1"></span>
                          <span class="path2"></span>
                        </i>
                        admin@applestorepotosi.com
                      </a>
                      <a href="tel:+1234567890" class="text-primary text-hover-primary fw-semibold">
                        <i class="ki-duotone ki-phone fs-3 me-1">
                          <span class="path1"></span>
                          <span class="path2"></span>
                        </i>
                        +1 (234) 567-890
                      </a>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- Footer -->
          <div class="d-flex flex-center flex-wrap px-5 mt-10">
            <div class="text-gray-600 fw-semibold fs-6">
              &copy; 2024 Apple Store Potosí. Todos los derechos reservados.
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
      /*/ background-color: #ffffff;*/
    }

    .cursor-pointer {
      cursor: pointer;
    }

    .hover-elevate-up {
      transition: all 0.3s ease;
    }

    .hover-elevate-up:hover {
      transform: translateY(-5px);
      box-shadow: 0 0.5rem 1.5rem 0.5rem rgba(0, 0, 0, 0.075);
    }

    .card-bordered {
      border: 1px solid #eff2f5;
    }

    /* Card hover effects */
    .card {
      transition: all 0.3s ease;
    }

    /* Button hover effects */
    .btn {
      transition: all 0.3s ease;
    }

    .btn:hover {
      transform: translateY(-2px);
    }

    /* Notice box styling */
    .notice {
      transition: all 0.3s ease;
    }

    .notice:hover {
      box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.075);
    }

    /* Symbol styling */
    .symbol-label {
      transition: all 0.3s ease;
    }

    .card:hover .symbol-label {
      transform: scale(1.1);
    }

    /* Pulse animation for main icon */
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }

    .symbol-100px .symbol-label {
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

    /* Badge styling */
    .badge {
      transition: all 0.3s ease;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .w-lg-650px {
        width: 100% !important;
      }

      .fs-2qx {
        font-size: 2rem !important;
      }

      .symbol-100px {
        width: 80px !important;
        height: 80px !important;
      }

      .symbol-65px {
        width: 50px !important;
        height: 50px !important;
      }

      .col-md-6 {
        width: 100%;
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

      .notice {
        flex-direction: column;
        text-align: center;
      }

      .notice i {
        margin: 0 auto 1rem;
      }

      .notice .fw-semibold {
        text-align: center !important;
      }
    }

    /* Accessibility improvements */
    button:focus,
    a:focus {
      outline: 2px solid #009ef7;
      outline-offset: 2px;
    }
  `]
})
export class UnauthorizedComponent {
  currentUser: any;
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }
  
  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  goBack(): void {
    window.history.back();
  }
  
  logout() {
    this.authService.logout();
  }

  getRoleLabel(role: string): string {
    const roleLabels: { [key: string]: string } = {
      'admin': 'Administrador',
      'sales': 'Ventas',
      'technician': 'Técnico',
      'customer': 'Cliente'
    };
    return roleLabels[role] || role;
  }
}