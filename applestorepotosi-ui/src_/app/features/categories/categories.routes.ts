// src/app/categories/categories.routes.ts
import { Routes } from '@angular/router';
import { roleGuard } from '../../auth/guards/role.guard';
import { UserRole } from '../../auth/models/user.model';

export const CATEGORIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>import('./pages/categories-page/categories-page.component').then((c) => c.CategoriesPageComponent),
    title: 'Categorías - Apple Store Potosí',
    data: {titulo: 'Catálogo de Categorías', subtitulo: 'Administra las categorías disponibles en la tienda', rutaBreadcrumbs:'Categorias'}
  },
  {
    path: 'create',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES], titulo: 'Nueva Categoría', subtitulo: 'Crear una categoria de productos', rutaBreadcrumbs:'Nueva categoria' },
    loadComponent: () =>import('./components/category-form/category-form.component').then((c) => c.CategoryFormComponent),
    title: 'Crear Categoría - Apple Store Potosí',
  },
  {
    path: 'edit/:id',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES], titulo: 'Editar Categoría', subtitulo: 'Editar campos de una categoria de productos', rutaBreadcrumbs:'Editar categoria' },
    loadComponent: () =>import('./components/category-form/category-form.component').then((c) => c.CategoryFormComponent),
    title: 'Editar Categoría - Apple Store Potosí',
  },
  {
    path: 'detail/:id',
    data: { titulo: 'Detalle de Categoría', subtitulo: 'Muestra el detalle de la categoria', rutaBreadcrumbs:'Detalle categoria' },
    loadComponent: () =>import('./components/category-detail/category-detail.component').then((c) => c.CategoryDetailComponent),
    title: 'Detalle de Categoría - Apple Store Potosí',
  },
];