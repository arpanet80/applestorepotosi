// profile.component.ts - TEMPLATE COMPLETO
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { AvatarService } from '../../auth/services/avatar.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="d-flex flex-column flex-root">
      <div class="d-flex flex-column-fluid">
        <div class="container-xxl">
          
          <!-- Breadcrumb -->
          <div class="d-flex align-items-center gap-2 gap-lg-3 mb-5">
            <a routerLink="/dashboard" class="text-gray-600 text-hover-primary">
              <i class="ki-duotone ki-home fs-3"></i>
            </a>
            <span class="text-gray-400">/</span>
            <span class="text-gray-600">Mi Perfil</span>
          </div>

          <!-- Profile Header Card -->
          <div class="card mb-5 mb-xl-10">
            <div class="card-body pt-9 pb-0">
              
              <!-- Header with Avatar -->
              <div class="d-flex flex-wrap flex-sm-nowrap mb-3">
                
                <!-- Avatar -->
                <div class="me-7 mb-4">
                  <div class="symbol symbol-100px symbol-lg-160px symbol-fixed position-relative">
                    <img 
                      [src]="profilePhotoUrl" 
                      [alt]="getAltText()"
                      class="rounded-circle"
                      (error)="onImageError($event)"
                    >
                    <div class="position-absolute translate-middle bottom-0 start-100 mb-6 bg-success rounded-circle border border-4 border-white h-20px w-20px"></div>
                  </div>
                </div>

                <!-- User Info -->
                <div class="flex-grow-1">
                  <div class="d-flex justify-content-between align-items-start flex-wrap mb-2">
                    <div class="d-flex flex-column">
                      <div class="d-flex align-items-center mb-2">
                        <span class="text-gray-900 fs-2 fw-bold me-1">
                          {{ currentUser?.displayName || currentUser?.email }}
                        </span>
                        <i class="ki-duotone ki-verify fs-1 text-primary" *ngIf="currentUser?.emailVerified">
                          <span class="path1"></span>
                          <span class="path2"></span>
                        </i>
                      </div>
                      <div class="d-flex flex-wrap fw-semibold fs-6 mb-4 pe-2">
                        <span class="d-flex align-items-center text-gray-500 me-5 mb-2">
                          <i class="ki-duotone ki-profile-circle fs-4 me-1">
                            <span class="path1"></span>
                            <span class="path2"></span>
                            <span class="path3"></span>
                          </i>
                          {{ getRoleLabel(currentUser?.role) }}
                        </span>
                        <span class="d-flex align-items-center text-gray-500 me-5 mb-2" *ngIf="currentUser?.email">
                          <i class="ki-duotone ki-sms fs-4 me-1">
                            <span class="path1"></span>
                            <span class="path2"></span>
                          </i>
                          {{ currentUser?.email }}
                        </span>
                        <span class="d-flex align-items-center text-gray-500 mb-2" *ngIf="currentUser?.phoneNumber">
                          <i class="ki-duotone ki-phone fs-4 me-1">
                            <span class="path1"></span>
                            <span class="path2"></span>
                          </i>
                          {{ currentUser?.phoneNumber }}
                        </span>
                      </div>
                    </div>

                    <div class="d-flex my-4">
                      <button class="btn btn-sm btn-light-primary me-2" (click)="triggerFileInput()">
                        <i class="ki-duotone ki-cloud-change fs-3">
                          <span class="path1"></span>
                          <span class="path2"></span>
                        </i>
                        Cambiar Foto
                      </button>
                      <input #fileInput type="file" accept="image/*" (change)="onPhotoSelected($event)" class="d-none">
                    </div>
                  </div>

                  <!-- Stats -->
                  <div class="d-flex flex-wrap flex-stack">
                    <div class="d-flex flex-column flex-grow-1 pe-8">
                      <div class="d-flex flex-wrap">
                        <div class="border border-gray-300 border-dashed rounded min-w-125px py-3 px-4 me-6 mb-3">
                          <div class="d-flex align-items-center">
                            <i class="ki-duotone ki-calendar fs-3 text-success me-2">
                              <span class="path1"></span>
                              <span class="path2"></span>
                            </i>
                            <div class="fs-2 fw-bold">{{ getMemberSince() }}</div>
                          </div>
                          <div class="fw-semibold fs-6 text-gray-500">Miembro desde</div>
                        </div>

                        <div class="border border-gray-300 border-dashed rounded min-w-125px py-3 px-4 me-6 mb-3">
                          <div class="d-flex align-items-center">
                            <i class="ki-duotone ki-timer fs-3 text-warning me-2">
                              <span class="path1"></span>
                              <span class="path2"></span>
                              <span class="path3"></span>
                            </i>
                            <div class="fs-2 fw-bold">{{ getLastLogin() }}</div>
                          </div>
                          <div class="fw-semibold fs-6 text-gray-500">Último acceso</div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <!-- Nav Tabs -->
              <ul class="nav nav-stretch nav-line-tabs nav-line-tabs-2x border-transparent fs-5 fw-bold">
                <li class="nav-item mt-2">
                  <a class="nav-link text-active-primary ms-0 me-10 py-5" 
                     [class.active]="activeTab === 'overview'"
                     (click)="activeTab = 'overview'">
                    Resumen
                  </a>
                </li>
                <li class="nav-item mt-2">
                  <a class="nav-link text-active-primary me-10 py-5" 
                     [class.active]="activeTab === 'settings'"
                     (click)="activeTab = 'settings'">
                    Configuración
                  </a>
                </li>
                <li class="nav-item mt-2">
                  <a class="nav-link text-active-primary me-10 py-5" 
                     [class.active]="activeTab === 'security'"
                     (click)="activeTab = 'security'">
                    Seguridad
                  </a>
                </li>
              </ul>

            </div>
          </div>

          <!-- Tab Content -->
          <div class="row g-5 g-xl-10">
            
            <!-- Overview Tab -->
            <div class="col-xl-12" *ngIf="activeTab === 'overview'">
              <div class="card card-flush h-xl-100">
                <div class="card-header pt-7">
                  <h3 class="card-title align-items-start flex-column">
                    <span class="card-label fw-bold text-gray-800">Información del Perfil</span>
                    <span class="text-gray-500 mt-1 fw-semibold fs-6">Resumen de tu cuenta</span>
                  </h3>
                </div>

                <div class="card-body pt-5">
                  <div class="row g-5">
                    
                    <div class="col-md-6">
                      <div class="d-flex flex-column mb-7 fv-row">
                        <label class="fs-6 fw-semibold mb-2">Email</label>
                        <div class="d-flex align-items-center">
                          <span class="text-gray-800 fs-6">{{ currentUser?.email }}</span>
                          <span class="badge badge-light-success ms-2" *ngIf="currentUser?.emailVerified">
                            Verificado
                          </span>
                        </div>
                      </div>
                    </div>

                    <div class="col-md-6">
                      <div class="d-flex flex-column mb-7 fv-row">
                        <label class="fs-6 fw-semibold mb-2">Rol</label>
                        <span class="badge badge-light-primary fs-6">{{ getRoleLabel(currentUser?.role) }}</span>
                      </div>
                    </div>

                    <div class="col-md-6">
                      <div class="d-flex flex-column mb-7 fv-row">
                        <label class="fs-6 fw-semibold mb-2">Estado</label>
                        <span class="badge badge-light-success fs-6">Activo</span>
                      </div>
                    </div>

                    <div class="col-md-6">
                      <div class="d-flex flex-column mb-7 fv-row">
                        <label class="fs-6 fw-semibold mb-2">ID de Usuario</label>
                        <code class="text-gray-700">{{ currentUser?.uid }}</code>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            <!-- Settings Tab -->
            <div class="col-xl-12" *ngIf="activeTab === 'settings'">
              <div class="card card-flush">
                <div class="card-header">
                  <h3 class="card-title">Editar Perfil</h3>
                </div>

                <div class="card-body">
                  <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
                    
                    <!-- Basic Info -->
                    <div class="row mb-10">
                      <label class="col-lg-3 col-form-label fw-semibold fs-6">Información Básica</label>
                      <div class="col-lg-9">
                        <div class="row g-5">
                          
                          <div class="col-lg-6 fv-row">
                            <label class="form-label fw-semibold required">Nombre para mostrar</label>
                            <input type="text" formControlName="displayName" 
                                   class="form-control form-control-lg form-control-solid"
                                   placeholder="Nombre completo">
                            <div class="form-text">Este nombre se mostrará en todo el sistema</div>
                          </div>

                          <div class="col-lg-6 fv-row">
                            <label class="form-label fw-semibold">Teléfono</label>
                            <input type="tel" formControlName="phoneNumber" 
                                   class="form-control form-control-lg form-control-solid"
                                   placeholder="+591 123 456 789">
                          </div>

                          <div class="col-lg-12 fv-row">
                            <label class="form-label fw-semibold">Email</label>
                            <input type="email" formControlName="email" 
                                   class="form-control form-control-lg form-control-solid"
                                   readonly>
                            <div class="form-text">El email no se puede modificar</div>
                          </div>

                        </div>
                      </div>
                    </div>

                    <!-- Extended Info -->
                    <div class="row mb-10">
                      <label class="col-lg-3 col-form-label fw-semibold fs-6">Información Personal</label>
                      <div class="col-lg-9">
                        <div class="row g-5">
                          
                          <div class="col-lg-6 fv-row">
                            <label class="form-label fw-semibold">Nombre</label>
                            <input type="text" formControlName="firstName" 
                                   class="form-control form-control-lg form-control-solid"
                                   placeholder="Nombre">
                          </div>

                          <div class="col-lg-6 fv-row">
                            <label class="form-label fw-semibold">Apellido</label>
                            <input type="text" formControlName="lastName" 
                                   class="form-control form-control-lg form-control-solid"
                                   placeholder="Apellido">
                          </div>

                          <div class="col-lg-6 fv-row">
                            <label class="form-label fw-semibold">Teléfono Personal</label>
                            <input type="tel" formControlName="personalPhone" 
                                   class="form-control form-control-lg form-control-solid"
                                   placeholder="+591 987 654 321">
                          </div>

                          <div class="col-lg-6 fv-row">
                            <label class="form-label fw-semibold">Género</label>
                            <select formControlName="gender" 
                                    class="form-select form-select-lg form-select-solid">
                              <option value="">Seleccionar...</option>
                              <option value="male">Masculino</option>
                              <option value="female">Femenino</option>
                              <option value="other">Otro</option>
                              <option value="prefer-not-to-say">Prefiero no decir</option>
                            </select>
                          </div>

                          <div class="col-lg-6 fv-row">
                            <label class="form-label fw-semibold">Fecha de Nacimiento</label>
                            <input type="date" formControlName="dateOfBirth" 
                                   class="form-control form-control-lg form-control-solid">
                          </div>

                          <div class="col-lg-6 fv-row">
                            <label class="form-label fw-semibold">Dirección</label>
                            <input type="text" formControlName="address" 
                                   class="form-control form-control-lg form-control-solid"
                                   placeholder="Dirección completa">
                          </div>

                        </div>
                      </div>
                    </div>

                    <!-- Notifications -->
                    <div class="row mb-10">
                      <label class="col-lg-3 col-form-label fw-semibold fs-6">Notificaciones</label>
                      <div class="col-lg-9">
                        <div class="d-flex flex-column gap-5">
                          
                          <div class="form-check form-switch form-check-custom form-check-solid">
                            <input class="form-check-input" type="checkbox" 
                                   formControlName="emailNotifications" id="emailNotif">
                            <label class="form-check-label fw-semibold text-gray-700" for="emailNotif">
                              Notificaciones por Email
                            </label>
                          </div>

                          <div class="form-check form-switch form-check-custom form-check-solid">
                            <input class="form-check-input" type="checkbox" 
                                   formControlName="smsNotifications" id="smsNotif">
                            <label class="form-check-label fw-semibold text-gray-700" for="smsNotif">
                              Notificaciones por SMS
                            </label>
                          </div>

                          <div class="form-check form-switch form-check-custom form-check-solid">
                            <input class="form-check-input" type="checkbox" 
                                   formControlName="marketingEmails" id="marketing">
                            <label class="form-check-label fw-semibold text-gray-700" for="marketing">
                              Recibir ofertas y promociones
                            </label>
                          </div>

                        </div>
                      </div>
                    </div>

                    <!-- Actions -->
                    <div class="d-flex justify-content-end gap-3">
                      <button type="button" class="btn btn-light" (click)="cancelEdit()">
                        Cancelar
                      </button>
                      <button type="submit" class="btn btn-primary" 
                              [disabled]="loading || profileForm.invalid">
                        <span *ngIf="!loading">
                          <i class="ki-duotone ki-check fs-3"></i>
                          Guardar Cambios
                        </span>
                        <span *ngIf="loading">
                          <span class="spinner-border spinner-border-sm align-middle ms-2"></span>
                          Guardando...
                        </span>
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            </div>

            <!-- Security Tab -->
            <div class="col-xl-12" *ngIf="activeTab === 'security'">
              <div class="card card-flush">
                <div class="card-header">
                  <h3 class="card-title">Seguridad de la Cuenta</h3>
                </div>

                <div class="card-body">
                  
                  <!-- Change Password -->
                  <div class="notice d-flex bg-light-warning rounded border-warning border border-dashed p-6 mb-10">
                    <i class="ki-duotone ki-shield-tick fs-2tx text-warning me-4">
                      <span class="path1"></span>
                      <span class="path2"></span>
                      <span class="path3"></span>
                    </i>
                    <div class="d-flex flex-stack flex-grow-1">
                      <div class="fw-semibold">
                        <h4 class="text-gray-900 fw-bold">Cambiar Contraseña</h4>
                        <div class="fs-6 text-gray-700">
                          Actualiza tu contraseña regularmente para mantener tu cuenta segura
                        </div>
                        <button class="btn btn-warning btn-sm mt-3" (click)="changePassword()">
                          Cambiar Contraseña
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Two Factor Auth -->
                  <div class="notice d-flex bg-light-info rounded border-info border border-dashed p-6 mb-10">
                    <i class="ki-duotone ki-security-user fs-2tx text-info me-4">
                      <span class="path1"></span>
                      <span class="path2"></span>
                    </i>
                    <div class="d-flex flex-stack flex-grow-1">
                      <div class="fw-semibold">
                        <h4 class="text-gray-900 fw-bold">Autenticación de Dos Factores</h4>
                        <div class="fs-6 text-gray-700">
                          Añade una capa extra de seguridad a tu cuenta
                        </div>
                        <button class="btn btn-info btn-sm mt-3">
                          {{ twoFactorEnabled ? 'Desactivar 2FA' : 'Activar 2FA' }}
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Sessions -->
                  <div class="mb-10">
                    <h4 class="text-gray-900 fw-bold mb-5">Sesiones Activas</h4>
                    <div class="table-responsive">
                      <table class="table table-row-dashed align-middle gs-0 gy-4">
                        <thead>
                          <tr class="fw-bold text-muted bg-light">
                            <th class="ps-4 min-w-200px rounded-start">Dispositivo</th>
                            <th class="min-w-150px">Ubicación</th>
                            <th class="min-w-150px">Último Acceso</th>
                            <th class="min-w-100px text-end rounded-end pe-4">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr *ngFor="let session of activeSessions">
                            <td class="ps-4">
                              <div class="d-flex align-items-center">
                                <i class="ki-duotone ki-{{ session.deviceIcon }} fs-2 me-3 text-primary">
                                  <span class="path1"></span>
                                  <span class="path2"></span>
                                </i>
                                <div class="d-flex flex-column">
                                  <span class="text-gray-800 fw-bold">{{ session.device }}</span>
                                  <span class="text-gray-500 fs-7">{{ session.browser }}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span class="text-gray-700">{{ session.location }}</span>
                            </td>
                            <td>
                              <span class="text-gray-700">{{ session.lastAccess }}</span>
                            </td>
                            <td class="text-end pe-4">
                              <button class="btn btn-sm btn-light-danger" 
                                      *ngIf="!session.current"
                                      (click)="revokeSession(session.id)">
                                Cerrar
                              </button>
                              <span class="badge badge-light-success" *ngIf="session.current">
                                Actual
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <!-- Delete Account -->
                  <div class="notice d-flex bg-light-danger rounded border-danger border border-dashed p-6">
                    <i class="ki-duotone ki-information fs-2tx text-danger me-4">
                      <span class="path1"></span>
                      <span class="path2"></span>
                      <span class="path3"></span>
                    </i>
                    <div class="d-flex flex-stack flex-grow-1">
                      <div class="fw-semibold">
                        <h4 class="text-gray-900 fw-bold">Eliminar Cuenta</h4>
                        <div class="fs-6 text-gray-700">
                          Esta acción es permanente y no se puede deshacer
                        </div>
                        <button class="btn btn-danger btn-sm mt-3" (click)="deleteAccount()">
                          Eliminar mi Cuenta
                        </button>
                      </div>
                    </div>
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
    }

    .nav-line-tabs .nav-link {
      cursor: pointer;
    }

    .nav-line-tabs .nav-link.active {
      border-bottom: 2px solid #009ef7;
    }

    .form-control-solid {
      background-color: #f5f8fa;
    }

    .form-control:focus {
      border-color: #009ef7;
      box-shadow: 0 0 0 0.25rem rgba(0, 158, 247, 0.1);
    }

    .card {
      transition: all 0.3s ease;
    }

    .notice {
      transition: all 0.3s ease;
    }

    .notice:hover {
      box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.075);
    }

    .table tbody tr {
      transition: background-color 0.2s ease;
    }

    .table tbody tr:hover {
      background-color: #f9f9f9;
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

    .avatar-placeholder {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      border-radius: 50%;
    }

    .avatar-loading {
      background: #f5f8fa;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }

    .avatar-loading::after {
      content: '';
      width: 20px;
      height: 20px;
      border: 2px solid #e0e0e0;
      border-top: 2px solid #009ef7;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .symbol-lg-160px {
        width: 100px !important;
        height: 100px !important;
      }

      .d-flex.gap-3 {
        flex-direction: column;
      }

      .btn {
        width: 100%;
      }
    }
  `]
})
export class ProfileComponent implements OnInit, OnDestroy {
  profileForm: FormGroup;
  loading = false;
  currentUser: any;
  activeTab = 'overview';
  profilePhotoUrl = '';
  twoFactorEnabled = false;
  
  private userSubscription!: Subscription;

  // ✅ Agregar las sessions activas que faltaban
  activeSessions = [
    {
      id: 1,
      device: 'Windows PC',
      browser: 'Chrome 120',
      deviceIcon: 'screen',
      location: 'Potosí, Bolivia',
      lastAccess: 'Hace 5 minutos',
      current: true
    },
    {
      id: 2,
      device: 'iPhone 14',
      browser: 'Safari',
      deviceIcon: 'phone',
      location: 'Potosí, Bolivia',
      lastAccess: 'Hace 2 horas',
      current: false
    }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private avatarService: AvatarService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      displayName: ['', [Validators.required]],
      phoneNumber: [''],
      firstName: [''],
      lastName: [''],
      personalPhone: [''],
      gender: [''],
      dateOfBirth: [''],
      address: [''],
      emailNotifications: [true],
      smsNotifications: [false],
      marketingEmails: [true]
    });
  }

  ngOnInit() {
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.updateUserData();
    });
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  private updateUserData(): void {
    if (this.currentUser) {
      this.profilePhotoUrl = this.avatarService.getAvatarUrl(this.currentUser);
      
      this.profileForm.patchValue({
        email: this.currentUser.email,
        displayName: this.currentUser.displayName || '',
        phoneNumber: this.currentUser.phoneNumber || '',
        firstName: this.currentUser.profile?.firstName || '',
        lastName: this.currentUser.profile?.lastName || '',
        personalPhone: this.currentUser.profile?.phone || '',
        gender: this.currentUser.profile?.gender || '',
        dateOfBirth: this.currentUser.profile?.dateOfBirth || '',
        address: this.currentUser.profile?.address || '',
        emailNotifications: this.currentUser.preferences?.emailNotifications ?? true,
        smsNotifications: this.currentUser.preferences?.smsNotifications ?? false,
        marketingEmails: this.currentUser.preferences?.marketingEmails ?? true
      });
    } else {
      this.profilePhotoUrl = this.avatarService.getDefaultAvatar();
    }
  }

  onImageError(event: any): void {
    console.warn('Error cargando imagen de perfil, usando avatar por defecto');
    event.target.src = this.avatarService.getDefaultAvatar();
  }

  getAltText(): string {
    return this.avatarService.getAltText(this.currentUser);
  }

  triggerFileInput() {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput?.click();
  }

  async onPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.loading = true;
      try {
        const reader = new FileReader();
        reader.onload = async (e: any) => {
          this.profilePhotoUrl = e.target.result;
          console.log('Nueva foto seleccionada, lista para subir');
          this.loading = false;
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error procesando imagen:', error);
        this.loading = false;
      }
    }
  }

  async onSubmit() {
    if (this.profileForm.valid) {
      this.loading = true;
      try {
        const formData = this.profileForm.value;
        
        const updateData = {
          displayName: formData.displayName,
          phoneNumber: formData.phoneNumber,
          profile: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.personalPhone,
            gender: formData.gender,
            dateOfBirth: formData.dateOfBirth,
            address: formData.address
          },
          preferences: {
            emailNotifications: formData.emailNotifications,
            smsNotifications: formData.smsNotifications,
            marketingEmails: formData.marketingEmails
          }
        };

        await this.authService.updateExtendedProfile(updateData);
        this.authService.refreshUserProfile();
        
        this.loading = false;
        this.activeTab = 'overview';
        alert('Perfil actualizado exitosamente');
      } catch (error) {
        this.loading = false;
        console.error('Error actualizando perfil:', error);
        alert('Error al actualizar el perfil');
      }
    }
  }

  cancelEdit() {
    this.activeTab = 'overview';
    this.updateUserData();
  }

  changePassword() {
    alert('Funcionalidad de cambio de contraseña - Próximamente');
  }

  revokeSession(sessionId: number) {
    if (confirm('¿Estás seguro de cerrar esta sesión?')) {
      this.activeSessions = this.activeSessions.filter(s => s.id !== sessionId);
      alert('Sesión cerrada exitosamente');
    }
  }

  deleteAccount() {
    const confirmation = prompt('Escribe "ELIMINAR" para confirmar la eliminación de tu cuenta:');
    if (confirmation === 'ELIMINAR') {
      alert('Funcionalidad de eliminación de cuenta - Próximamente');
    }
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

  getMemberSince(): string {
    if (this.currentUser?.createdAt) {
      const date = new Date(this.currentUser.createdAt);
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${months[date.getMonth()]} ${date.getFullYear()}`;
    }
    return 'N/A';
  }

  getLastLogin(): string {
    if (this.currentUser?.lastLoginAt) {
      const date = new Date(this.currentUser.lastLoginAt);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffHours < 1) return 'Hace unos minutos';
      if (diffHours === 1) return 'Hace 1 hora';
      if (diffHours < 24) return `Hace ${diffHours} horas`;
      
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Ayer';
      return `Hace ${diffDays} días`;
    }
    return 'N/A';
  }
}