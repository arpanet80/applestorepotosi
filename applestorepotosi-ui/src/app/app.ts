import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './auth/services/auth.service';
import { AsyncPipe, NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgIf, AsyncPipe],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit{
  protected readonly title = signal('Apple Store Potosi');
  public authService = inject ( AuthService);
  private router = inject ( Router);

  constructor(
    
  ) {}

  async ngOnInit() {
    // La sesión se inicializa automáticamente en el AuthService
    console.log('🚀 Aplicación iniciada, verificando sesión...');
  }
}
