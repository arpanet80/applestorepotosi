// service-orders/service-orders.routes.ts
import { Routes } from '@angular/router';

export const SERVICE_ORDERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/order-list/order-list.component').then(m => m.OrderListComponent),
  },
  {
    path: 'new',
    loadComponent: () => import('./components/order-form/order-form.component').then(m => m.OrderFormComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./components/order-detail/order-detail.component').then(m => m.OrderDetailComponent),
  },
  {
    path: 'reports/technical-income',
    loadComponent: () => import('./components/income-report/income-report.component').then(m => m.IncomeReportComponent),
  },
];