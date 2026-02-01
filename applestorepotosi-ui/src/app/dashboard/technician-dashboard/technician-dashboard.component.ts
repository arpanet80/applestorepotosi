// src/app/technician/technician-dashboard/technician-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { UserRole } from '../../auth/models/user.model';

@Component({
  selector: 'app-technician-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './technician-dashboard.component.html',
  styleUrls: ['./technician-dashboard.component.css']
})
export class TechnicianDashboardComponent implements OnInit {
  
  urgentRepairs = [
    {
      id: 'R001',
      device: 'iPhone 15 Pro',
      client: 'Juan Pérez',
      issue: 'Pantalla rota - Urgente',
      priority: 'ALTA'
    },
    {
      id: 'R002', 
      device: 'MacBook Pro M2',
      client: 'María García',
      issue: 'No enciende - Revisión inmediata',
      priority: 'ALTA'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    console.log(`✅ ${user?.role} dashboard cargado para: ${user?.displayName}`);
    
    // Verificación adicional de rol (opcional)
    if (user && user.role !== UserRole.TECHNICIAN) { // Cambiar por rol correspondiente
      console.warn('⚠️ Usuario sin permisos para este dashboard');
      this.router.navigate(['/unauthorized']);
    }
  }
}