// src/app/category-characteristics/category-characteristics.routes.ts
import { Routes } from '@angular/router';
import { roleGuard } from '../../auth/guards/role.guard';
import { UserRole } from '../../auth/models/user.model';

export const CATEGORY_CHARACTERISTICS_ROUTES: Routes = [
  {
    path: '',
    data: { titulo: 'Características de Categorias', subtitulo: 'Características individuales de cara categoría', rutaBreadcrumbs:'Caracteristicas' },
    loadComponent: () => import('./pages/characteristics-page/characteristics-page.component').then((c) => c.CategoryCharacteristicsPageComponent),
    title: 'Características - Apple Store Potosí',
  },
  {
    path: 'management',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES] },
    loadComponent: () =>
      import('./pages/characteristics-management/characteristics-management.component').then(
        (c) => c.CategoryCharacteristicsManagementComponent
      ),
    title: 'Gestión de Características - Apple Store Potosí',
  },
  {
    path: 'create',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES] },
    loadComponent: () =>
      import('./components/characteristic-form/characteristic-form.component').then(
        (c) => c.CategoryCharacteristicFormComponent
      ),
    title: 'Crear Característica - Apple Store Potosí',
  },
  {
    path: 'edit/:id',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES] },
    loadComponent: () =>
      import('./components/characteristic-form/characteristic-form.component').then(
        (c) => c.CategoryCharacteristicFormComponent
      ),
    title: 'Editar Característica - Apple Store Potosí',
  },
  {
    path: 'detail/:id',
    loadComponent: () =>
      import('./components/characteristic-detail/characteristic-detail.component').then(
        (c) => c.CategoryCharacteristicDetailComponent
      ),
    title: 'Detalle de Característica - Apple Store Potosí',
  },
];