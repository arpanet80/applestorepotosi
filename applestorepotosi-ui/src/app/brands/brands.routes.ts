// src/app/brands/brands.routes.ts
import { Routes } from '@angular/router';
import { roleGuard } from '../auth/guards/role.guard';
import { UserRole } from '../auth/models/user.model';

export const BRANDS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/brands-page/brands-page.component').then(c => c.BrandsPageComponent),
    title: 'Marcas - Apple Store Potosí'
  },
  {
    path: 'management',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES] },
    loadComponent: () => import('./pages/brand-management/brand-management.component').then(c => c.BrandManagementComponent),
    title: 'Gestión de Marcas - Apple Store Potosí'
  },
  {
    path: 'create',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES] },
    loadComponent: () => import('./components/brand-form/brand-form.component').then(c => c.BrandFormComponent),
    title: 'Crear Marca - Apple Store Potosí'
  },
  {
    path: 'edit/:id',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES] },
    loadComponent: () => import('./components/brand-form/brand-form.component').then(c => c.BrandFormComponent),
    title: 'Editar Marca - Apple Store Potosí'
  },
  {
    path: 'detail/:id',
    loadComponent: () => 
      import('./components/brand-detail/brand-detail.component').then(c => c.BrandDetailComponent),
      title: 'Detalle de Marca - Apple Store Potosí'
  },
];