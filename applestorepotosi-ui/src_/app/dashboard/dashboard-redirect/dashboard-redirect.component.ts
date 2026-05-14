// src/app/dashboard/dashboard-redirect/dashboard-redirect.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { CommonModule } from '@angular/common';
import { filter, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard-redirect',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-flex flex-column flex-root">
      <div class="d-flex flex-column flex-center flex-column-fluid">
        <div class="d-flex flex-column flex-center text-center p-10">
          
          <!-- Spinner Card -->
          <div class="card card-flush w-lg-500px py-5">
            <div class="card-body py-15 py-lg-20">
              
              <!-- Logo/Brand -->
              <div class="mb-7">
                <span class="text-primary fs-2x fw-bold">🎁</span>
                <span class="text-gray-800 fs-2x fw-bold ms-2">Apple Store Potosí</span>
              </div>

              <!-- Spinner Icon -->
              <div class="mb-10">
                <div class="d-flex justify-content-center mb-5">
                  <span class="spinner-border spinner-border-lg text-primary" 
                        role="status" 
                        style="width: 4rem; height: 4rem; border-width: 0.4em;">
                  </span>
                </div>
                
                <h3 class="fw-bold text-gray-900 mb-3">
                  Redirigiendo...
                </h3>
                
                <div class="fw-semibold fs-6 text-gray-600">
                  Te estamos llevando a tu panel de control
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="mb-8">
                <div class="progress h-10px">
                  <div class="progress-bar progress-bar-striped progress-bar-animated bg-primary" 
                       role="progressbar" 
                       style="width: 100%">
                  </div>
                </div>
              </div>

              <!-- Info Notice -->
              <div class="notice d-flex bg-light-primary rounded border-primary border border-dashed p-6">
                <i class="ki-duotone ki-information fs-2tx text-primary me-4">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                </i>
                <div class="d-flex flex-stack flex-grow-1">
                  <div class="fw-semibold text-start">
                    <div class="fs-7 text-gray-700">
                      Estamos preparando tu espacio de trabajo personalizado
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- Footer -->
          <div class="d-flex flex-center flex-wrap px-5 mt-10">
            <div class="text-gray-600 fw-semibold fs-7">
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
    }

    .spinner-border-lg {
      animation: spinner-border 0.75s linear infinite;
    }

    @keyframes spinner-border {
      to {
        transform: rotate(360deg);
      }
    }

    .progress-bar-animated {
      animation: progress-bar-stripes 1s linear infinite;
    }

    @keyframes progress-bar-stripes {
      0% {
        background-position: 1rem 0;
      }
      100% {
        background-position: 0 0;
      }
    }

    .card {
      animation: fadeInUp 0.5s ease;
    }

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

    .notice {
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.8;
      }
    }
  `]
})
export class DashboardRedirectComponent implements OnInit, OnDestroy {
  private hasRedirected = false;
  private routerSubscription?: Subscription;
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const currentUrl = this.router.url;

    if (currentUrl !== '/dashboard') {
      // No estás en /dashboard, no hagas nada
      return;
    }

    const redirected = sessionStorage.getItem('dashboard_redirected');

    if (!redirected) {
      this.redirectToDashboard();
      sessionStorage.setItem('dashboard_redirected', 'true');
    } else {
      // Ya redirigiste, pero sigues en /dashboard: fuerza la redirección de nuevo
      this.redirectToDashboard();
    }
  }

  /*
  ngOnInit() {
    console.log('🔄 DashboardRedirect: Componente inicializado');
    
    // Solo redirigir si no se ha hecho antes en esta sesión
    const redirected = sessionStorage.getItem('dashboard_redirected');
    
    if (!redirected || redirected !== 'true') {
      console.log('🔄 Primera carga, redirigiendo...');
      this.redirectToDashboard();
    } else {
      console.log('✅ Ya se redirigió antes, manteniendo posición actual');
      // Si ya se redirigió, mantener la navegación actual
      this.router.navigate([], { replaceUrl: true });
    }

    // Escuchar cambios de navegación para limpiar el flag si es necesario
    this.routerSubscription = this.router.events
      .pipe(
        filter(event => event instanceof NavigationStart),
        take(1)
      )
      .subscribe(() => {
        console.log('🔄 Navegación detectada, limpiando flag');
        sessionStorage.removeItem('dashboard_redirected');
      });
  }
  */

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private redirectToDashboard(): void {
    if (this.hasRedirected) {
      console.log('⚠️ Ya se ejecutó la redirección, evitando duplicados');
      return;
    }

    const user = this.authService.getCurrentUser();
    
    if (user) {
      this.hasRedirected = true;
      const dashboardRoute = this.getDashboardRouteByRole(user.role);
      console.log("=========>", user.role);
      console.log(`🔄 Redirigiendo automáticamente a: ${dashboardRoute} (rol: ${user.role})`);
      
      // Marcar que ya se redirigió
      sessionStorage.setItem('dashboard_redirected', 'true');
      
      // Usar replaceUrl para evitar que se pueda volver atrás
      this.router.navigate([dashboardRoute], { replaceUrl: true });
    } else {
      console.log('⚠️ No hay usuario, redirigiendo a login');
      sessionStorage.removeItem('dashboard_redirected');
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }

  private getDashboardRouteByRole(role: string): string {
    const roleRoutes: { [key: string]: string } = {
      'admin': '/dashboard/admin',
      'sales': '/dashboard/sales_dashboard',
      'technician': '/dashboard/technician', 
      'customer': '/dashboard/customer'
    };
    
    return roleRoutes[role] || '/dashboard/overview';
  }
}