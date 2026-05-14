// src/app/brands/brands.routes.ts
import { Routes } from '@angular/router';
import { roleGuard } from '../../auth/guards/role.guard';
import { UserRole } from '../../auth/models/user.model';

export const BRANDS_ROUTES: Routes = [
  {
    path: '',
    data: { titulo: 'Gestion de marcas', subtitulo: 'Administre ls marcas disponibles del sistema', rutaBreadcrumbs:'Marcas' },
    loadComponent: () => import('./pages/brand-management/brand-management.component').then(c => c.BrandManagementComponent),
    title: 'Marcas - Apple Store Potosí'
  },
  {
    path: 'catalog',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES], titulo: 'Catalogo de marcas', subtitulo: 'Administre las marcas disponibles del sistema', rutaBreadcrumbs:'Catalogo' },
    loadComponent: () => import('./pages/brands-page/brands-page.component').then(c => c.BrandsPageComponent),
    title: 'Catalogo de Marcas - Apple Store Potosí'
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