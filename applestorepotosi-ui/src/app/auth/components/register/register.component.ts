import { Component, ElementRef, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NgIf, CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-register',
  imports: [NgIf, CommonModule, ReactiveFormsModule, RouterModule ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit, OnDestroy {
  @ViewChild('termsCheckbox') termsCheckbox!: ElementRef<HTMLInputElement>;
  
  registerForm: FormGroup;
  loading = false;
  googleLoading = false;
  error = '';
  termsAccepted = false;
  
  private authSubscription: Subscription;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.pattern(/^\+?[\d\s-]+$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { 
      validators: this.passwordMatchValidator 
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

  ngOnInit() {
    // Resetear formulario al inicializar el componente
    this.registerForm.reset();
    this.error = '';
    this.termsAccepted = false;
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  /**
   * Validador personalizado para verificar que las contraseñas coincidan
   */
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    if (confirmPassword.value === '') {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  /**
   * Verifica si las contraseñas no coinciden
   */
  get passwordsDoNotMatch(): boolean {
    const confirmPassword = this.registerForm.get('confirmPassword');
    return (
      this.registerForm.hasError('passwordMismatch') &&
      confirmPassword?.touched === true
    );
  }

  /**
   * Maneja el cambio del checkbox de términos
   */
  onTermsChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.termsAccepted = checkbox.checked;
  }

  /**
   * Registro con Google
   */
  async registerWithGoogle() {
    if (!this.termsAccepted) {
      this.error = 'Debes aceptar los términos y condiciones para continuar';
      return;
    }

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

  /**
   * Envío del formulario
   */
  async onSubmit() {
    // Marcar todos los campos como tocados para mostrar errores
    this.markFormGroupTouched();

    // Validar términos y condiciones
    if (!this.termsAccepted) {
      this.error = 'Debes aceptar los términos y condiciones para continuar';
      return;
    }

    // Validar formulario
    if (this.registerForm.invalid) {
      return;
    }

    this.error = '';
    
    try {
      const { email, password, displayName, phoneNumber } = this.registerForm.value;
      await this.authService.register(email, password, displayName, phoneNumber);
    } catch (error: any) {
      console.error('Error en componente registro:', error);
    }
  }

  /**
   * Marca todos los campos del formulario como tocados
   */
  private markFormGroupTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Verifica si el formulario puede ser enviado
   */
  canSubmit(): boolean {
    return this.registerForm.valid && this.termsAccepted;
  }

  /**
   * Resetea el formulario
   */
  resetForm() {
    this.registerForm.reset();
    this.error = '';
    this.termsAccepted = false;
    if (this.termsCheckbox?.nativeElement) {
      this.termsCheckbox.nativeElement.checked = false;
    }
    this.authService.clearError();
  }

  /**
   * Obtiene el mensaje de error para un campo específico
   */
  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (!field || !field.touched || !field.invalid) {
      return '';
    }

    if (field.hasError('required')) {
      return this.getRequiredMessage(fieldName);
    }

    if (field.hasError('email')) {
      return 'Ingresa un email válido';
    }

    if (field.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres requeridos`;
    }

    if (field.hasError('pattern')) {
      return 'Formato de teléfono inválido';
    }

    return '';
  }

  /**
   * Obtiene el mensaje de campo requerido personalizado
   */
  private getRequiredMessage(fieldName: string): string {
    const messages: { [key: string]: string } = {
      displayName: 'El nombre completo es requerido',
      email: 'El email es requerido',
      password: 'La contraseña es requerida',
      confirmPassword: 'Confirma tu contraseña'
    };
    return messages[fieldName] || 'Este campo es requerido';
  }
}