import { Routes } from '@angular/router';
import { roleGuard } from '../auth/guards/role.guard';
import { UserRole } from '../auth/models/user.model';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/users-page/users-page.component').then(c => c.UsersPageComponent),
    title: 'Usuarios - Apple Store Potosí',
    data: {titulo: 'Administración de Usuarios', subtitulo: 'Manejo de los usuarios del sistema', rutaBreadcrumbs:'Usuarios'}
  },
  {
    path: 'detail/:uid',
    loadComponent: () => import('./components/user-detail/user-detail.component').then(c => c.UserDetailComponent),
    title: 'Detalle de Usuario - Apple Store Potosí'
  },
  {
    path: 'edit/:uid',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN] },
    loadComponent: () => import('./components/user-form/user-form.component').then(c => c.UserFormComponent),
    title: 'Editar Usuario - Apple Store Potosí'
  }
];