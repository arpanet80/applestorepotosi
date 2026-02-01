// src/app/customer/customer-dashboard/customer-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { UserRole } from '../../auth/models/user.model';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['./customer-dashboard.component.css']
})
export class CustomerDashboardComponent implements OnInit {
  
  customerName = 'Cliente';
  activeServices = [
    {
      icon: '🔧',
      title: 'Reparación iPhone 14',
      description: 'Cambio de pantalla',
      status: 'active',
      statusText: 'En Proceso',
      link: '/customer/services'
    },
    {
      icon: '📦',
      title: 'Pedido #ORD-001',
      description: 'AirPods Pro 2da Gen',
      status: 'pending', 
      statusText: 'En Camino',
      link: '/customer/orders'
    },
    {
      icon: '📋',
      title: 'Garantía MacBook',
      description: 'Cubre hasta Mar 2025',
      status: 'active',
      statusText: 'Activa',
      link: '/customer/warranty'
    }
  ];

  recommendedProducts = [
    {
      id: 1,
      name: 'iPhone 15 Pro',
      price: '$1,199.00',
      emoji: '📱'
    },
    {
      id: 2,
      name: 'Apple Watch Series 9',
      price: '$399.00',
      emoji: '⌚'
    },
    {
      id: 3,
      name: 'AirPods Max',
      price: '$549.00',
      emoji: '🎧'
    },
    {
      id: 4,
      name: 'MagSafe Charger',
      price: '$39.00',
      emoji: '⚡'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.customerName = user?.displayName || 'Cliente';
    console.log(`✅ ${user?.role} dashboard cargado para: ${user?.displayName}`);
    
    // Verificación adicional de rol (opcional)
    if (user && user.role !== UserRole.CUSTOMER) {
      console.warn('⚠️ Usuario sin permisos para este dashboard');
      this.router.navigate(['/unauthorized']);
    }
  }

  // Métodos auxiliares para mapear emojis a iconos Keen
  getServiceIcon(emoji: string): string {
    const iconMap: {[key: string]: string} = {
      '🔧': 'setting-3',
      '📦': 'basket',
      '📋': 'security'
    };
    return iconMap[emoji] || 'abstract-26';
  }

  getProductIcon(emoji: string): string {
    const iconMap: {[key: string]: string} = {
      '📱': 'abstract-42',
      '⌚': 'watch',
      '🎧': 'headphones',
      '⚡': 'flash'
    };
    return iconMap[emoji] || 'abstract-42';
  }

  getStatusColor(status: string): string {
    const colorMap: {[key: string]: string} = {
      'active': 'primary',
      'pending': 'warning',
      'completed': 'success'
    };
    return colorMap[status] || 'secondary';
  }
}