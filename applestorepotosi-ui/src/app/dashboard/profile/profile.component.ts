// profile.component.ts - ACTUALIZADO
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="profile-container">
      <div class="profile-card">
        <h1>Mi Perfil</h1>
        
        <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
          <!-- Información Básica -->
          <div class="form-section">
            <h3>Información Básica</h3>
            
            <div class="form-group">
              <label>Email</label>
              <input type="email" formControlName="email" class="form-input" readonly>
              <small>El email no se puede modificar</small>
            </div>

            <div class="form-group">
              <label>Nombre para mostrar</label>
              <input type="text" formControlName="displayName" class="form-input">
            </div>

            <div class="form-group">
              <label>Teléfono</label>
              <input type="tel" formControlName="phoneNumber" class="form-input">
            </div>
          </div>

          <!-- Información Extendida -->
          <div class="form-section" *ngIf="showExtendedProfile">
            <h3>Información Personal</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label>Nombre</label>
                <input type="text" formControlName="firstName" class="form-input">
              </div>

              <div class="form-group">
                <label>Apellido</label>
                <input type="text" formControlName="lastName" class="form-input">
              </div>
            </div>

            <div class="form-group">
              <label>Teléfono personal</label>
              <input type="tel" formControlName="personalPhone" class="form-input">
            </div>

            <div class="form-group">
              <label>Género</label>
              <select formControlName="gender" class="form-input">
                <option value="">Seleccionar...</option>
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <div class="form-group">
              <label>Fecha de nacimiento</label>
              <input type="date" formControlName="dateOfBirth" class="form-input">
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary" [disabled]="loading || profileForm.invalid">
              {{ loading ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
            <button type="button" class="btn-outline" (click)="goBack()">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      padding: 2rem;
      max-width: 600px;
      margin: 0 auto;
    }

    .profile-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .form-section {
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #eee;
    }

    .form-section h3 {
      color: #2c3e50;
      margin-bottom: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 1rem;
    }

    .form-input:read-only {
      background-color: #f5f5f5;
      color: #666;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }

    .btn-primary, .btn-outline {
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      cursor: pointer;
    }

    .btn-primary {
      background: #667eea;
      color: white;
      border: none;
    }

    .btn-outline {
      background: white;
      color: #667eea;
      border: 1px solid #667eea;
    }

    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }
      
      .form-actions {
        flex-direction: column;
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  loading = false;
  showExtendedProfile = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      // Información básica
      email: ['', [Validators.required, Validators.email]],
      displayName: ['', [Validators.required]],
      phoneNumber: [''],
      
      // Información extendida
      firstName: [''],
      lastName: [''],
      personalPhone: [''],
      gender: [''],
      dateOfBirth: ['']
    });
  }

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.profileForm.patchValue({
        email: user.email,
        displayName: user.displayName || '',
        phoneNumber: user.phoneNumber || '',
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        personalPhone: user.profile?.phone || '',
        gender: user.profile?.gender || '',
        dateOfBirth: user.profile?.dateOfBirth || ''
      });

      // Mostrar sección extendida si hay datos o el usuario quiere editarlos
      this.showExtendedProfile = !!(user.profile?.firstName || user.profile?.lastName);
    }
  }

  async onSubmit() {
    if (this.profileForm.valid) {
      this.loading = true;
      try {
        const formData = this.profileForm.value;
        
        // Preparar datos para el backend
        const updateData = {
          displayName: formData.displayName,
          phoneNumber: formData.phoneNumber,
          profile: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.personalPhone,
            gender: formData.gender,
            dateOfBirth: formData.dateOfBirth
          }
        };

        await this.authService.updateExtendedProfile(updateData);
        this.loading = false;
        this.router.navigate(['/dashboard']);
      } catch (error) {
        this.loading = false;
        console.error('Error actualizando perfil:', error);
      }
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}