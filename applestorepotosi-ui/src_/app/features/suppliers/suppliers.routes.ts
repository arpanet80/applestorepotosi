// src/app/suppliers/suppliers.routes.ts
import { Routes } from '@angular/router';
import { roleGuard } from '../../auth/guards/role.guard';
import { UserRole } from '../../auth/models/user.model';

export const SUPPLIERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/supplier-management/supplier-management.component').then((c) => c.SupplierManagementComponent),
    data: { titulo: 'Proveedores', subtitulo: 'Administra los proveedores disponibles', rutaBreadcrumbs:'Proveedores' },
    title: 'Proveedores - Apple Store Potosí',
  },
  {
    path: 'create',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES], titulo: 'Nuevo proveedor', subtitulo: 'Crear nuevo proveedor', rutaBreadcrumbs:'Nuevo proveedores'  },
    loadComponent: () =>import('./components/supplier-form/supplier-form.component').then((c) => c.SupplierFormComponent),
    title: 'Crear Proveedor - Apple Store Potosí',
  },
  {
    path: 'edit/:id',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES], titulo: 'Edit proveedor', subtitulo: 'Editar informacion del proveedor', rutaBreadcrumbs:'Editar proveedores'  },
    loadComponent: () => import('./components/supplier-form/supplier-form.component').then((c) => c.SupplierFormComponent),
    title: 'Editar Proveedor - Apple Store Potosí',
  },
  {
    path: 'detail/:id',
    loadComponent: () => import('./components/supplier-detail/supplier-detail.component').then((c) => c.SupplierDetailComponent),
    data: { roles: [UserRole.ADMIN, UserRole.SALES], titulo: 'Detalle proveedor', subtitulo: 'Detalle del proveedor', rutaBreadcrumbs:'Detalle proveedores'  },
    title: 'Detalle de Proveedor - Apple Store Potosí',
  },
];