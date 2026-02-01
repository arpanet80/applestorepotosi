// src/app/sales/sales-dashboard/sales-dashboard.component.ts - Keen Style
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { UserRole } from '../../auth/models/user.model';

@Component({
  selector: 'app-sales-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sales-dashboard.component.html',
  styleUrls: ['./sales-dashboard.component.css']
})
export class SalesDashboardComponent implements OnInit {
  
  recentSales = [
    {
      id: 'V001',
      client: 'Carlos Rodríguez',
      products: 2,
      amount: '$1,250.00',
      time: '10:30 AM'
    },
    {
      id: 'V002',
      client: 'Ana Martínez', 
      products: 1,
      amount: '$850.00',
      time: '11:15 AM'
    },
    {
      id: 'V003',
      client: 'Tech Solutions SA',
      products: 5,
      amount: '$3,450.00', 
      time: '09:45 AM'
    },
    {
      id: 'V004',
      client: 'María González',
      products: 3,
      amount: '$2,100.00',
      time: '08:20 AM'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    console.log(`✅ ${user?.role} dashboard cargado para: ${user?.displayName}`);
    
    // Verificación adicional de rol
    if (user && user.role !== UserRole.SALES) {
      console.warn('⚠️ Usuario sin permisos para este dashboard');
      this.router.navigate(['/unauthorized']);
    }
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}