// src/app/admin/admin-dashboard/admin-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { UserRole } from '../../auth/models/user.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    console.log(`✅ ${user?.role} dashboard cargado para: ${user?.displayName}`);
    
    // Verificación adicional de rol (opcional)
    if (user && user.role !== UserRole.ADMIN) { // Cambiar por rol correspondiente
      console.warn('⚠️ Usuario sin permisos para este dashboard');
      this.router.navigate(['/unauthorized']);
    }
  }
}