import { Routes } from '@angular/router';
import { roleGuard } from '../../auth/guards/role.guard';
import { UserRole } from '../../auth/models/user.model';

export const SALES_ROUTES: Routes = [
  {
    path: 'catalogo',
    loadComponent: () => import('./pages/sales-page/sales-page.component').then(c => c.SalesPageComponent),
    data: { titulo: 'Ventas', subtitulo: 'Administra las Ventas', rutaBreadcrumbs:'Ventas' },
    title: 'Ventas - Apple Store Potosí'
  },
  {
    path: '',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES], titulo: 'Gestión de Ventas', subtitulo: 'Gestión de Ventas', rutaBreadcrumbs:'Ventas'  },
    loadComponent: () => import('./pages/sale-management/sale-management.component').then(c => c.SaleManagementComponent),
    title: 'Gestión de Ventas - Apple Store Potosí'
  },

  // {
  //   path: 'my-sales',
  //   canActivate: [roleGuard],
  //   data: { roles: [UserRole.SALES, UserRole.ADMIN] },
  //   loadComponent: () => import('./pages/my-sales/my-sales.component').then(c => c.MySalesComponent),
  //   title: 'Mis Ventas - Apple Store Potosí'
  // },
  {
    path: 'create',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES], titulo: 'Nueva Venta', subtitulo: 'Crear una nueva Venta', rutaBreadcrumbs:'Crear Venta'  },
    loadComponent: () => import('./components/sale-form/sale-form.component').then(c => c.SaleFormComponent),
    title: 'Crear Venta - Apple Store Potosí'
  },
  {
    path: 'edit/:id',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES] , titulo: 'Editar Ventas', subtitulo: 'Edicion de una Venta', rutaBreadcrumbs:'Editar Venta'  },
    loadComponent: () => import('./components/sale-form/sale-form.component').then(c => c.SaleFormComponent),
    title: 'Editar Venta - Apple Store Potosí'
  },
  {
    path: 'detail/:id',
    data: { titulo: 'Detalle de Venta', subtitulo: 'Información acerca de una Venta', rutaBreadcrumbs:'Detalle Venta'  },
    loadComponent: () => import('./components/sale-detail/sale-detail.component').then(c => c.SaleDetailComponent),
    title: 'Detalle de Venta - Apple Store Potosí'
  },
  {
    path: 'pos',
    loadComponent: () => import('../pos/components/pos.component').then(c => c.PosComponent),
    title: 'Punto de Venta - Apple Store Potosí',
  },
  
];