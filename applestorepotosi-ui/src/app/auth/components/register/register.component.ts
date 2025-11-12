import { Component, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NgIf, CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-register',
  imports: [NgIf, CommonModule, ReactiveFormsModule, RouterModule ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnDestroy {
  @ViewChild('termsCheckbox') termsCheckbox!: ElementRef<HTMLInputElement>;
  
  registerForm: FormGroup;
  loading = false;
  googleLoading = false;
  error = '';
  
  private authSubscription: Subscription;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      displayName: ['', [Validators.required]],
      phoneNumber: ['', [Validators.pattern(/^\+?[\d\s-]+$/)]]
    });

    // Suscribirse a cambios de estado de autenticación
    this.authSubscription = this.authService.loading$.subscribe(loading => {
      this.loading = loading;
    });

    this.authSubscription.add(
      this.authService.error$.subscribe(error => {
        if (error) {
          this.error = error.message;
        } else {
          this.error = '';
        }
      })
    );
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  async registerWithGoogle() {
    this.googleLoading = true;
    this.error = '';
    
    try {
      await this.authService.loginWithGoogle();
    } catch (error: any) {
      console.error('Error en componente registro Google:', error);
    } finally {
      this.googleLoading = false;
    }
  }

  async onSubmit() {
    if (this.registerForm.valid && this.termsCheckbox.nativeElement.checked) {
      this.error = '';
      
      try {
        const { email, password, displayName, phoneNumber } = this.registerForm.value;
        await this.authService.register(email, password, displayName, phoneNumber);
      } catch (error: any) {
        console.error('Error en componente registro:', error);
      }
    } else {
      this.markFormGroupTouched();
      
      if (!this.termsCheckbox.nativeElement.checked) {
        this.error = 'Debe aceptar los términos y condiciones';
      }
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldClass(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (!field) return '';
    
    if (field.touched && field.invalid) {
      return 'field-error';
    }
    
    if (field.touched && field.valid) {
      return 'field-success';
    }
    
    return '';
  }

  // Verificar si el formulario puede ser enviado
  canSubmit(): boolean {
    return this.registerForm.valid && this.termsCheckbox?.nativeElement?.checked;
  }

  // 🔄 RESETEAR FORMULARIO
  resetForm() {
    this.registerForm.reset();
    this.error = '';
    if (this.termsCheckbox?.nativeElement) {
      this.termsCheckbox.nativeElement.checked = false;
    }
    this.authService.clearError();
  }
}