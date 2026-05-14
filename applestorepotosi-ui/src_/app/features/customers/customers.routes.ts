// src/app/customers/customers.routes.ts
import { Routes } from '@angular/router';
import { roleGuard } from '../../auth/guards/role.guard';
import { UserRole } from '../../auth/models/user.model';

export const CUSTOMERS_ROUTES: Routes = [
  {
    path: '',
    data: { titulo: 'Gestión de Clientes', subtitulo: 'Administracion de los Clientes', rutaBreadcrumbs:'Clientes' },
    loadComponent: () => import('./pages/customer-management/customer-management.component').then((c) => c.CustomerManagementComponent), title: 'Clientes - Apple Store Potosí',
  },
  {
    path: 'catalog',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN], titulo: 'Gestión de Clientes', subtitulo: 'Administra los clientes disponibles en la tienda', rutaBreadcrumbs:'Clientes' },
    loadComponent: () => import('./pages/customer-page/customer-page.component').then((c) => c.CustomerPageComponent),
    title: 'Gestión de Clientes - Apple Store Potosí',
  },
  // {
  //   path: 'crm',
  //   canActivate: [roleGuard],
  //   data: { roles: [UserRole.ADMIN, UserRole.SALES] },
  //   loadComponent: () =>
  //     import('./pages/customer-crm/customer-crm.component').then(
  //       (c) => c.CustomerCrmComponent
  //     ),
  //   title: 'CRM de Clientes - Apple Store Potosí',
  // },
  {
    path: 'create',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES], titulo: 'Crear Cliente', subtitulo: 'Crea nuevo cliente que tendrá acceso a la plataforma', rutaBreadcrumbs:'Nuevo Cliente' },
    loadComponent: () => import('./components/customer-form/customer-form.component').then((c) => c.CustomerFormComponent),
    title: 'Crear Cliente - Apple Store Potosí',
  },
  // {
  //   path: 'quick-create',
  //   canActivate: [roleGuard],
  //   data: { roles: [UserRole.SALES, UserRole.ADMIN] },
  //   loadComponent: () =>
  //     import('./components/customer-quick-form/customer-quick-form.component').then((c) => c.CustomerQuickFormComponent),
  //   title: 'Creación Rápida de Cliente - Apple Store Potosí',
  // },
  {
    path: 'edit/:id',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES], titulo: 'Editar Cliente', subtitulo: 'Edición de la información del cliente', rutaBreadcrumbs:'Editar Cliente' },
    loadComponent: () => import('./components/customer-form/customer-form.component').then((c) => c.CustomerFormComponent),
    title: 'Editar Cliente - Apple Store Potosí',
  },
  {
    path: 'detail/:id',
    data: { titulo: 'Detalle del Cliente', subtitulo: 'Detalles de la cuenta del cliente', rutaBreadcrumbs:'Detalles Cliente' },
    loadComponent: () => import('./components/customer-detail/customer-detail.component').then((c) => c.CustomerDetailComponent),
    title: 'Detalle de Cliente - Apple Store Potosí',
  },
];