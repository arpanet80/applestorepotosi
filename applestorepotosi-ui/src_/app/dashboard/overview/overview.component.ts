// src/app/dashboard/overview/overview.component.ts - Keen Style
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { UserRole } from '../../auth/models/user.model';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="d-flex flex-column flex-root">
      <div class="d-flex flex-column-fluid">
        <div class="container-xxl">
          
          <!-- Page Header -->
          <div class="page-title d-flex flex-column justify-content-center flex-wrap me-3 mb-5">
            <h1 class="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
              📊 Resumen General
            </h1>
            <ul class="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
              <li class="breadcrumb-item text-muted">
                <a routerLink="/dashboard" class="text-muted text-hover-primary">Dashboard</a>
              </li>
              <li class="breadcrumb-item">
                <span class="bullet bg-gray-500 w-5px h-2px"></span>
              </li>
              <li class="breadcrumb-item text-muted">Overview</li>
            </ul>
          </div>

          <!-- Welcome Card -->
          <div class="card card-flush mb-5 mb-xl-10">
            <div class="card-body d-flex flex-column flex-xl-row align-items-center p-9">
              
              <!-- Avatar -->
              <div class="d-flex flex-center flex-shrink-0 me-5 mb-5 mb-xl-0">
                <div class="symbol symbol-100px symbol-circle">
                  <img src="assets/media/avatars/blank.png" alt="avatar">
                  <div class="position-absolute translate-middle bottom-0 start-100 mb-6 bg-success rounded-circle border border-4 border-white h-20px w-20px"></div>
                </div>
              </div>

              <!-- Content -->
              <div class="flex-grow-1">
                <div class="d-flex flex-wrap align-items-center mb-2">
                  <h2 class="text-gray-900 fw-bold me-2 fs-2">
                    ¡Bienvenido, {{ userName }}! 👋
                  </h2>
                  <span class="badge" [ngClass]="'badge-' + getRoleBadgeClass()" [class.fs-7]="true">
                    {{ userRoleDisplay }}
                  </span>
                </div>
                <div class="fw-semibold text-gray-600 fs-6 mb-5">
                  Esta es tu vista general con información relevante del sistema Apple Store Potosí
                </div>
                
                <!-- Quick Actions -->
                <div class="d-flex flex-wrap gap-3">
                  <a [routerLink]="roleDashboardRoute" class="btn btn-primary">
                    <i class="ki-duotone ki-arrow-right fs-3">
                      <span class="path1"></span>
                      <span class="path2"></span>
                    </i>
                    Ir a mi panel específico
                  </a>
                  <a routerLink="/dashboard/profile" class="btn btn-light-primary">
                    <i class="ki-duotone ki-profile-user fs-3">
                      <span class="path1"></span>
                      <span class="path2"></span>
                      <span class="path3"></span>
                      <span class="path4"></span>
                    </i>
                    Mi Perfil
                  </a>
                </div>
              </div>

            </div>
          </div>

          <!-- System Stats -->
          <div class="row g-5 g-xl-10 mb-5 mb-xl-10">
            
            <div class="col-sm-6 col-xl-3">
              <div class="card h-100">
                <div class="card-body d-flex flex-column p-8">
                  <div class="d-flex align-items-center mb-5">
                    <div class="symbol symbol-60px symbol-circle me-3">
                      <span class="symbol-label bg-light-primary">
                        <i class="ki-duotone ki-people fs-2x text-primary">
                          <span class="path1"></span>
                          <span class="path2"></span>
                          <span class="path3"></span>
                          <span class="path4"></span>
                          <span class="path5"></span>
                        </i>
                      </span>
                    </div>
                    <div class="flex-grow-1">
                      <span class="text-gray-500 fw-semibold d-block fs-7">Usuarios</span>
                      <span class="text-gray-900 fw-bold fs-2">{{ systemStats.totalUsers }}</span>
                    </div>
                  </div>
                  <div class="d-flex align-items-center">
                    <span class="badge badge-light-success fs-8 fw-bold">+12%</span>
                    <span class="text-gray-600 fw-semibold fs-7 ms-2">vs mes anterior</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-sm-6 col-xl-3">
              <div class="card h-100">
                <div class="card-body d-flex flex-column p-8">
                  <div class="d-flex align-items-center mb-5">
                    <div class="symbol symbol-60px symbol-circle me-3">
                      <span class="symbol-label bg-light-info">
                        <i class="ki-duotone ki-cube-2 fs-2x text-info">
                          <span class="path1"></span>
                          <span class="path2"></span>
                          <span class="path3"></span>
                        </i>
                      </span>
                    </div>
                    <div class="flex-grow-1">
                      <span class="text-gray-500 fw-semibold d-block fs-7">Productos</span>
                      <span class="text-gray-900 fw-bold fs-2">{{ systemStats.totalProducts }}</span>
                    </div>
                  </div>
                  <div class="d-flex align-items-center">
                    <span class="badge badge-light-info fs-8 fw-bold">+8%</span>
                    <span class="text-gray-600 fw-semibold fs-7 ms-2">vs mes anterior</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-sm-6 col-xl-3">
              <div class="card h-100">
                <div class="card-body d-flex flex-column p-8">
                  <div class="d-flex align-items-center mb-5">
                    <div class="symbol symbol-60px symbol-circle me-3">
                      <span class="symbol-label bg-light-success">
                        <i class="ki-duotone ki-dollar fs-2x text-success">
                          <span class="path1"></span>
                          <span class="path2"></span>
                          <span class="path3"></span>
                        </i>
                      </span>
                    </div>
                    <div class="flex-grow-1">
                      <span class="text-gray-500 fw-semibold d-block fs-7">Ventas del Mes</span>
                      <span class="text-gray-900 fw-bold fs-2">{{ systemStats.monthlySales }}</span>
                    </div>
                  </div>
                  <div class="d-flex align-items-center">
                    <span class="badge badge-light-success fs-8 fw-bold">+24%</span>
                    <span class="text-gray-600 fw-semibold fs-7 ms-2">vs mes anterior</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-sm-6 col-xl-3">
              <div class="card h-100">
                <div class="card-body d-flex flex-column p-8">
                  <div class="d-flex align-items-center mb-5">
                    <div class="symbol symbol-60px symbol-circle me-3">
                      <span class="symbol-label bg-light-warning">
                        <i class="ki-duotone ki-wrench fs-2x text-warning">
                          <span class="path1"></span>
                          <span class="path2"></span>
                        </i>
                      </span>
                    </div>
                    <div class="flex-grow-1">
                      <span class="text-gray-500 fw-semibold d-block fs-7">Reparaciones</span>
                      <span class="text-gray-900 fw-bold fs-2">{{ systemStats.activeRepairs }}</span>
                    </div>
                  </div>
                  <div class="d-flex align-items-center">
                    <span class="badge badge-light-warning fs-8 fw-bold">Activas</span>
                    <span class="text-gray-600 fw-semibold fs-7 ms-2">En proceso</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Role Specific Info -->
          <div class="row g-5 g-xl-10 mb-5 mb-xl-10">
            <div class="col-xl-12">
              <div class="card card-flush">
                <div class="card-header pt-7">
                  <h3 class="card-title align-items-start flex-column">
                    <span class="card-label fw-bold text-gray-800">
                      🎯 Información para {{ userRoleDisplay }}
                    </span>
                    <span class="text-gray-500 mt-1 fw-semibold fs-6">
                      Datos específicos de tu rol
                    </span>
                  </h3>
                </div>

                <div class="card-body pt-6">
                  
                  <!-- ADMIN -->
                  <div *ngIf="userRole === 'admin'" class="row g-5">
                    <div class="col-md-4">
                      <div class="d-flex flex-stack">
                        <div class="d-flex align-items-center me-3">
                          <div class="symbol symbol-50px me-3">
                            <span class="symbol-label bg-light-primary">
                              <i class="ki-duotone ki-user-tick fs-2x text-primary">
                                <span class="path1"></span>
                                <span class="path2"></span>
                                <span class="path3"></span>
                              </i>
                            </span>
                          </div>
                          <div>
                            <span class="text-gray-500 fw-semibold d-block fs-7">Registros Hoy</span>
                            <span class="text-gray-900 fw-bold fs-2">3</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="col-md-4">
                      <div class="d-flex flex-stack">
                        <div class="d-flex align-items-center me-3">
                          <div class="symbol symbol-50px me-3">
                            <span class="symbol-label bg-light-success">
                              <i class="ki-duotone ki-chart-line-up fs-2x text-success">
                                <span class="path1"></span>
                                <span class="path2"></span>
                              </i>
                            </span>
                          </div>
                          <div>
                            <span class="text-gray-500 fw-semibold d-block fs-7">Ventas del Día</span>
                            <span class="text-gray-900 fw-bold fs-2">$12,450</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="col-md-4">
                      <div class="d-flex flex-stack">
                        <div class="d-flex align-items-center me-3">
                          <div class="symbol symbol-50px me-3">
                            <span class="symbol-label bg-light-danger">
                              <i class="ki-duotone ki-notification-on fs-2x text-danger">
                                <span class="path1"></span>
                                <span class="path2"></span>
                                <span class="path3"></span>
                                <span class="path4"></span>
                                <span class="path5"></span>
                              </i>
                            </span>
                          </div>
                          <div>
                            <span class="text-gray-500 fw-semibold d-block fs-7">Alertas Sistema</span>
                            <span class="badge badge-danger fs-3">2</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- SALES -->
                  <div *ngIf="userRole === 'sales'" class="row g-5">
                    <div class="col-md-4">
                      <div class="d-flex flex-stack">
                        <div class="d-flex align-items-center me-3">
                          <div class="symbol symbol-50px me-3">
                            <span class="symbol-label bg-light-success">
                              <i class="ki-duotone ki-dollar fs-2x text-success">
                                <span class="path1"></span>
                                <span class="path2"></span>
                                <span class="path3"></span>
                              </i>
                            </span>
                          </div>
                          <div>
                            <span class="text-gray-500 fw-semibold d-block fs-7">Ventas Hoy</span>
                            <span class="text-gray-900 fw-bold fs-2">$8,250</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="col-md-4">
                      <div class="d-flex flex-stack">
                        <div class="d-flex align-items-center me-3">
                          <div class="symbol symbol-50px me-3">
                            <span class="symbol-label bg-light-info">
                              <i class="ki-duotone ki-profile-user fs-2x text-info">
                                <span class="path1"></span>
                                <span class="path2"></span>
                                <span class="path3"></span>
                                <span class="path4"></span>
                              </i>
                            </span>
                          </div>
                          <div>
                            <span class="text-gray-500 fw-semibold d-block fs-7">Clientes Atendidos</span>
                            <span class="text-gray-900 fw-bold fs-2">15</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="col-md-4">
                      <div class="d-flex flex-stack">
                        <div class="d-flex align-items-center me-3">
                          <div class="symbol symbol-50px me-3">
                            <span class="symbol-label bg-light-primary">
                              <i class="ki-duotone ki-chart-simple-2 fs-2x text-primary">
                                <span class="path1"></span>
                                <span class="path2"></span>
                                <span class="path3"></span>
                                <span class="path4"></span>
                              </i>
                            </span>
                          </div>
                          <div>
                            <span class="text-gray-500 fw-semibold d-block fs-7">Meta Diaria</span>
                            <span class="text-gray-900 fw-bold fs-2">85%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- TECHNICIAN -->
                  <div *ngIf="userRole === 'technician'" class="row g-5">
                    <div class="col-md-4">
                      <div class="d-flex flex-stack">
                        <div class="d-flex align-items-center me-3">
                          <div class="symbol symbol-50px me-3">
                            <span class="symbol-label bg-light-warning">
                              <i class="ki-duotone ki-wrench fs-2x text-warning">
                                <span class="path1"></span>
                                <span class="path2"></span>
                              </i>
                            </span>
                          </div>
                          <div>
                            <span class="text-gray-500 fw-semibold d-block fs-7">En Proceso</span>
                            <span class="text-gray-900 fw-bold fs-2">8</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="col-md-4">
                      <div class="d-flex flex-stack">
                        <div class="d-flex align-items-center me-3">
                          <div class="symbol symbol-50px me-3">
                            <span class="symbol-label bg-light-info">
                              <i class="ki-duotone ki-search-list fs-2x text-info">
                                <span class="path1"></span>
                                <span class="path2"></span>
                                <span class="path3"></span>
                              </i>
                            </span>
                          </div>
                          <div>
                            <span class="text-gray-500 fw-semibold d-block fs-7">Diagnósticos</span>
                            <span class="text-gray-900 fw-bold fs-2">4</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="col-md-4">
                      <div class="d-flex flex-stack">
                        <div class="d-flex align-items-center me-3">
                          <div class="symbol symbol-50px me-3">
                            <span class="symbol-label bg-light-danger">
                              <i class="ki-duotone ki-timer fs-2x text-danger">
                                <span class="path1"></span>
                                <span class="path2"></span>
                                <span class="path3"></span>
                              </i>
                            </span>
                          </div>
                          <div>
                            <span class="text-gray-500 fw-semibold d-block fs-7">Urgentes</span>
                            <span class="badge badge-danger fs-3">2</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- CUSTOMER -->
                  <div *ngIf="userRole === 'customer'" class="row g-5">
                    <div class="col-md-4">
                      <div class="d-flex flex-stack">
                        <div class="d-flex align-items-center me-3">
                          <div class="symbol symbol-50px me-3">
                            <span class="symbol-label bg-light-primary">
                              <i class="ki-duotone ki-basket fs-2x text-primary">
                                <span class="path1"></span>
                                <span class="path2"></span>
                                <span class="path3"></span>
                                <span class="path4"></span>
                              </i>
                            </span>
                          </div>
                          <div>
                            <span class="text-gray-500 fw-semibold d-block fs-7">Pedidos Activos</span>
                            <span class="text-gray-900 fw-bold fs-2">2</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="col-md-4">
                      <div class="d-flex flex-stack">
                        <div class="d-flex align-items-center me-3">
                          <div class="symbol symbol-50px me-3">
                            <span class="symbol-label bg-light-warning">
                              <i class="ki-duotone ki-setting-2 fs-2x text-warning">
                                <span class="path1"></span>
                                <span class="path2"></span>
                              </i>
                            </span>
                          </div>
                          <div>
                            <span class="text-gray-500 fw-semibold d-block fs-7">Servicios</span>
                            <span class="text-gray-900 fw-bold fs-2">1</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="col-md-4">
                      <div class="d-flex flex-stack">
                        <div class="d-flex align-items-center me-3">
                          <div class="symbol symbol-50px me-3">
                            <span class="symbol-label bg-light-success">
                              <i class="ki-duotone ki-star fs-2x text-success">
                                <span class="path1"></span>
                                <span class="path2"></span>
                              </i>
                            </span>
                          </div>
                          <div>
                            <span class="text-gray-500 fw-semibold d-block fs-7">Puntos</span>
                            <span class="text-gray-900 fw-bold fs-2">1,250</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          <!-- Recent Activity & Quick Actions -->
          <div class="row g-5 g-xl-10">
            
            <!-- Recent Activity -->
            <div class="col-xl-8">
              <div class="card card-flush h-xl-100">
                <div class="card-header pt-7">
                  <h3 class="card-title align-items-start flex-column">
                    <span class="card-label fw-bold text-gray-800">🕒 Actividad Reciente</span>
                    <span class="text-gray-500 mt-1 fw-semibold fs-6">Últimas acciones en el sistema</span>
                  </h3>
                  <div class="card-toolbar">
                    <a href="#" class="btn btn-sm btn-light">Ver Todo</a>
                  </div>
                </div>

                <div class="card-body pt-5">
                  <div class="timeline">
                    <div class="timeline-item" *ngFor="let activity of recentActivities; let i = index">
                      <div class="timeline-line w-40px"></div>
                      <div class="timeline-icon symbol symbol-circle symbol-40px">
                        <div class="symbol-label" [ngClass]="'bg-light-' + getActivityColor(i)">
                          <span class="fs-2">{{ activity.icon }}</span>
                        </div>
                      </div>
                      <div class="timeline-content mb-10 mt-n1">
                        <div class="pe-3 mb-2">
                          <div class="fs-6 fw-semibold text-gray-800 mb-1">
                            {{ activity.text }}
                          </div>
                          <div class="d-flex align-items-center mt-1 fs-7">
                            <div class="text-muted me-2">
                              <i class="ki-duotone ki-time fs-6 me-1">
                                <span class="path1"></span>
                                <span class="path2"></span>
                              </i>
                              {{ activity.time }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="col-xl-4">
              <div class="card card-flush h-xl-100">
                <div class="card-header pt-7">
                  <h3 class="card-title align-items-start flex-column">
                    <span class="card-label fw-bold text-gray-800">🚀 Acciones Rápidas</span>
                    <span class="text-gray-500 mt-1 fw-semibold fs-6">Accesos directos</span>
                  </h3>
                </div>

                <div class="card-body pt-5">
                  <div class="d-flex flex-column gap-5">
                    
                    <a routerLink="/dashboard/profile" class="btn btn-flex btn-light-primary">
                      <i class="ki-duotone ki-profile-user fs-3 me-2">
                        <span class="path1"></span>
                        <span class="path2"></span>
                        <span class="path3"></span>
                        <span class="path4"></span>
                      </i>
                      Mi Perfil
                    </a>

                    <a [routerLink]="roleDashboardRoute" class="btn btn-flex btn-light-success">
                      <i class="ki-duotone ki-element-11 fs-3 me-2">
                        <span class="path1"></span>
                        <span class="path2"></span>
                        <span class="path3"></span>
                        <span class="path4"></span>
                      </i>
                      Mi Panel
                    </a>

                    <a routerLink="/products" class="btn btn-flex btn-light-info">
                      <i class="ki-duotone ki-shop fs-3 me-2">
                        <span class="path1"></span>
                        <span class="path2"></span>
                        <span class="path3"></span>
                        <span class="path4"></span>
                        <span class="path5"></span>
                      </i>
                      Productos
                    </a>

                    <a routerLink="/dashboard/settings" class="btn btn-flex btn-light-warning">
                      <i class="ki-duotone ki-setting-3 fs-3 me-2">
                        <span class="path1"></span>
                        <span class="path2"></span>
                        <span class="path3"></span>
                        <span class="path4"></span>
                        <span class="path5"></span>
                      </i>
                      Configuración
                    </a>

                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      /* background-color: #f5f8fa;*/
    }

    .card {
      transition: all 0.3s ease;
    }

    .card:hover {
      box-shadow: 0 0.5rem 1.5rem 0.5rem rgba(0, 0, 0, 0.075);
    }

    .symbol-label {
      transition: all 0.3s ease;
    }

    .card:hover .symbol-label {
      transform: scale(1.05);
    }

    .timeline {
      position: relative;
    }

    .timeline-item {
      position: relative;
      padding-bottom: 2rem;
    }

    .timeline-item:last-child {
      padding-bottom: 0;
    }

    .timeline-line {
      position: absolute;
      left: 20px;
      top: 40px;
      bottom: -20px;
      border-left: 2px dashed #e4e6ef;
    }

    .timeline-item:last-child .timeline-line {
      display: none;
    }

    .timeline-icon {
      position: absolute;
      left: 0;
      top: 0;
    }

    .timeline-content {
      margin-left: 60px;
    }

    .btn-flex {
      display: flex;
      align-items: center;
      justify-content: flex-start;
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

    .card {
      animation: fadeInUp 0.5s ease;
    }

    @media (max-width: 768px) {
      .d-flex.gap-3 {
        flex-direction: column;
      }

      .timeline-content {
        margin-left: 50px;
      }
    }
  `]
})
export class OverviewComponent implements OnInit {
  
  userName = 'Usuario';
  userRole: UserRole = UserRole.CUSTOMER;
  userRoleDisplay = 'Cliente';
  roleDashboardRoute = '/dashboard/customer';

  systemStats = {
    totalUsers: 156,
    totalProducts: 245,
    monthlySales: 284,
    activeRepairs: 12
  };

  recentActivities = [
    {
      icon: '📱',
      text: 'Nuevo iPhone 15 agregado al catálogo',
      time: 'Hace 2 horas'
    },
    {
      icon: '💰',
      text: 'Venta realizada por $1,250.00',
      time: 'Hace 3 horas'
    },
    {
      icon: '🔧',
      text: 'Reparación de MacBook Pro completada',
      time: 'Hace 4 horas'
    },
    {
      icon: '👤',
      text: 'Nuevo usuario registrado en el sistema',
      time: 'Hace 5 horas'
    }
  ];

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
      this.userRoleDisplay = this.getRoleDisplayName(user.role);
      this.roleDashboardRoute = this.getRoleDashboardRoute(user.role);
      
      console.log(`📊 Overview cargado para: ${this.userName} (${this.userRole})`);
    }
  }

  private getRoleDisplayName(role: UserRole): string {
    const roleNames = {
      [UserRole.ADMIN]: 'Administrador',
      [UserRole.SALES]: 'Vendedor',
      [UserRole.TECHNICIAN]: 'Técnico',
      [UserRole.CUSTOMER]: 'Cliente'
    };
    
    return roleNames[role] || 'Usuario';
  }

  private getRoleDashboardRoute(role: UserRole): string {
    const routes = {
      [UserRole.ADMIN]: '/dashboard/admin',
      [UserRole.SALES]: '/dashboard/sales',
      [UserRole.TECHNICIAN]: '/dashboard/technician',
      [UserRole.CUSTOMER]: '/dashboard/customer'
    };
    
    return routes[role] || '/dashboard';
  }

  getRoleBadgeClass(): string {
    const badgeClasses = {
      [UserRole.ADMIN]: 'light-primary',
      [UserRole.SALES]: 'light-success',
      [UserRole.TECHNICIAN]: 'light-warning',
      [UserRole.CUSTOMER]: 'light-info'
    };
    
    return badgeClasses[this.userRole] || 'light-primary';
  }

  getActivityColor(index: number): string {
    const colors = ['primary', 'success', 'warning', 'info'];
    return colors[index % colors.length];
  }
}