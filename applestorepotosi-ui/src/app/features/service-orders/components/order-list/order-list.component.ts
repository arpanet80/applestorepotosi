// service-orders/components/order-list/order-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ServiceOrdersService } from '../../services/service-orders.service';
import { ServiceOrder, ServiceOrderStatus } from '../../models/service-order.model';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: 'order-list.component.html'
})
export class OrderListComponent implements OnInit {
  orders: ServiceOrder[] = [];
  search = '';
  page = 1;
  limit = 20;

  constructor(private svc: ServiceOrdersService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.svc.getAll({ search: this.search, page: this.page, limit: this.limit }).subscribe((res) => {
      this.orders = res.orders;
    });
  }

  mapColor(status: ServiceOrderStatus) {
    const map: Record<ServiceOrderStatus, string> = {
      ingresado: 'warning',
      diagnosticado: 'info',
      aprobado: 'primary',
      reparado: 'success',
      entregado: 'secondary',
      finalizado: 'dark',
      cancelado: 'danger',
    };
    return map[status] || 'secondary';
  }

  getCustomerName(order: ServiceOrder): string {
    return (order.customerId as any)?.fullName || '—';
    }
}