// src/app/categories/categories.routes.ts
import { Routes } from '@angular/router';
import { roleGuard } from '../auth/guards/role.guard';
import { UserRole } from '../auth/models/user.model';

export const CATEGORIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/categories-page/categories-page.component').then(
        (c) => c.CategoriesPageComponent
      ),
    title: 'Categorías - Apple Store Potosí',
  },
  {
    path: 'management',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES] },
    loadComponent: () =>
      import('./pages/category-management/category-management.component').then(
        (c) => c.CategoryManagementComponent
      ),
    title: 'Gestión de Categorías - Apple Store Potosí',
  },
  {
    path: 'create',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES] },
    loadComponent: () =>
      import('./components/category-form/category-form.component').then(
        (c) => c.CategoryFormComponent
      ),
    title: 'Crear Categoría - Apple Store Potosí',
  },
  {
    path: 'edit/:id',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES] },
    loadComponent: () =>
      import('./components/category-form/category-form.component').then(
        (c) => c.CategoryFormComponent
      ),
    title: 'Editar Categoría - Apple Store Potosí',
  },
  {
    path: 'detail/:id',
    loadComponent: () =>
      import('./components/category-detail/category-detail.component').then(
        (c) => c.CategoryDetailComponent
      ),
    title: 'Detalle de Categoría - Apple Store Potosí',
  },
];