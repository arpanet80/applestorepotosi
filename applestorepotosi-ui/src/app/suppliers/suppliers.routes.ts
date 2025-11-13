// src/app/suppliers/suppliers.routes.ts
import { Routes } from '@angular/router';
import { roleGuard } from '../auth/guards/role.guard';
import { UserRole } from '../auth/models/user.model';

export const SUPPLIERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/supplier-management/supplier-management.component').then(
        (c) => c.SupplierManagementComponent
      ),
    title: 'Proveedores - Apple Store Potosí',
  },
  {
    path: 'create',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES] },
    loadComponent: () =>
      import('./components/supplier-form/supplier-form.component').then(
        (c) => c.SupplierFormComponent
      ),
    title: 'Crear Proveedor - Apple Store Potosí',
  },
  {
    path: 'edit/:id',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES] },
    loadComponent: () =>
      import('./components/supplier-form/supplier-form.component').then(
        (c) => c.SupplierFormComponent
      ),
    title: 'Editar Proveedor - Apple Store Potosí',
  },
  {
    path: 'detail/:id',
    loadComponent: () =>
      import('./components/supplier-detail/supplier-detail.component').then(
        (c) => c.SupplierDetailComponent
      ),
    title: 'Detalle de Proveedor - Apple Store Potosí',
  },
];