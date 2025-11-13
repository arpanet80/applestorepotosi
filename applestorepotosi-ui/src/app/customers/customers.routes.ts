// src/app/customers/customers.routes.ts
import { Routes } from '@angular/router';
import { roleGuard } from '../auth/guards/role.guard';
import { UserRole } from '../auth/models/user.model';

export const CUSTOMERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/customer-page/customer-page.component').then((c) => c.CustomerPageComponent),
    title: 'Clientes - Apple Store Potosí',
  },
  {
    path: 'management',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES] },
    loadComponent: () =>
      import('./pages/customer-management/customer-management.component').then(
        (c) => c.CustomerManagementComponent
      ),
    title: 'Gestión de Clientes - Apple Store Potosí',
  },
  {
    path: 'create',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES] },
    loadComponent: () =>
      import('./components/customer-form/customer-form.component').then((c) => c.CustomerFormComponent),
    title: 'Crear Cliente - Apple Store Potosí',
  },
  {
    path: 'edit/:id',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES] },
    loadComponent: () =>
      import('./components/customer-form/customer-form.component').then((c) => c.CustomerFormComponent),
    title: 'Editar Cliente - Apple Store Potosí',
  },
  {
    path: 'detail/:id',
    loadComponent: () =>
      import('./components/customer-detail/customer-detail.component').then(
        (c) => c.CustomerDetailComponent
      ),
    title: 'Detalle de Cliente - Apple Store Potosí',
  },
];