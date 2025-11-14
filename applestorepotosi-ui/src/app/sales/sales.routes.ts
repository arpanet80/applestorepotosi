import { Routes } from '@angular/router';
import { roleGuard } from '../auth/guards/role.guard';
import { UserRole } from '../auth/models/user.model';

export const SALES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/sales-page/sales-page.component').then(c => c.SalesPageComponent),
    title: 'Ventas - Apple Store Potosí'
  },
  {
    path: 'management',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES] },
    loadComponent: () => import('./pages/sale-management/sale-management.component').then(c => c.SaleManagementComponent),
    title: 'Gestión de Ventas - Apple Store Potosí'
  },
  {
    path: 'create',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES] },
    loadComponent: () => import('./components/sale-form/sale-form.component').then(c => c.SaleFormComponent),
    title: 'Crear Venta - Apple Store Potosí'
  },
  {
    path: 'edit/:id',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES] },
    loadComponent: () => import('./components/sale-form/sale-form.component').then(c => c.SaleFormComponent),
    title: 'Editar Venta - Apple Store Potosí'
  },
  {
    path: 'detail/:id',
    loadComponent: () => import('./components/sale-detail/sale-detail.component').then(c => c.SaleDetailComponent),
    title: 'Detalle de Venta - Apple Store Potosí'
  }
];