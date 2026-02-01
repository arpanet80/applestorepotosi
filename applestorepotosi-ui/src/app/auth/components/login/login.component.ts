import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule, NgIf } from '@angular/common';
import { Subscription } from 'rxjs';
import { ControlMessagesComponent } from '../../../shared/components/validation-messages/validation-messages.component';

@Component({
  selector: 'app-login',
  imports: [NgIf, CommonModule, ReactiveFormsModule, RouterModule, ControlMessagesComponent ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  loading = false;
  googleLoading = false;
  error = '';
 
  private authSubscription: Subscription;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
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
    this.loginForm.reset();
    this.error = '';
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  // 🔐 LOGIN CON GOOGLE - MEJORADO
  async loginWithGoogle() {
    this.googleLoading = true;
    this.error = '';
    
    try {
      await this.authService.loginWithGoogle();
      // La redirección ahora se maneja dentro del AuthService
    } catch (error: any) {
      // El error ya se maneja en el AuthService, pero podemos hacer algo adicional aquí si es necesario
      console.error('Error en componente login Google:', error);
    } finally {
      this.googleLoading = false;
    }
  }

  // 📧 LOGIN CON EMAIL/PASSWORD - MEJORADO
  async onSubmit() {
    this.loginForm.markAllAsTouched(); // <-- asegura que se toquen
    
    if (this.loginForm.valid) {
      this.error = '';
      
      try {
        const { email, password } = this.loginForm.value;
        await this.authService.login(email, password);
        // La redirección ahora se maneja dentro del AuthService
      } catch (error: any) {
        // El error ya se maneja en el AuthService
        console.error('Error en componente login email:', error);
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  // 📍 MARCAR TODOS LOS CAMPOS COMO TOUCHED PARA MOSTRAR VALIDACIONES
  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  // 🔄 RESETEAR FORMULARIO
  resetForm() {
    this.loginForm.reset();
    this.error = '';
    this.authService.clearError();
  }

  // Devuelve el control del formulario
  getCtrl(name: string): FormControl {
    return this.loginForm.get(name) as FormControl;
  }
  
}