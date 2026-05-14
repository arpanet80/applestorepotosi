import { Routes } from '@angular/router';
import { roleGuard } from '../../auth/guards/role.guard';
import { UserRole } from '../../auth/models/user.model';

export const STOCK_MOVEMENTS_ROUTES: Routes = [
  {
    path: '',
    data: { titulo: 'Movimientos de stock', subtitulo: 'Administra los Movimientos de stock', rutaBreadcrumbs:'Movimientos de stock' },
    loadComponent: () => import('./pages/stock-movements-page/stock-movements-page.component').then(c => c.StockMovementsPageComponent),
    title: 'Movimientos de Stock - Apple Store Potosí'
  },
  {
    path: 'management',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN] },
    loadComponent: () => import('./pages/stock-movement-management/stock-movement-management.component').then(c => c.StockMovementManagementComponent),
    title: 'Gestión de Movimientos - Apple Store Potosí'
  },
  {
    path: 'adjustment',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN] , titulo: 'Ajustes de stock', subtitulo: 'Administra los Ajustes de stock', rutaBreadcrumbs:'Ajustes de stock' },
    loadComponent: () => import('./components/stock-adjustment-form/stock-adjustment-form.component').then(c => c.StockAdjustmentFormComponent),
    title: 'Ajuste de Stock - Apple Store Potosí'
  },
  {
    path: 'create',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES], titulo: 'Nuevo Moviento de Stock', subtitulo: 'Registro de un nuevo movimiento de stock', rutaBreadcrumbs:'Nueva movimiento'  },
    loadComponent: () => import('./components/stock-movement-form/stock-movement-form.component').then(c => c.StockMovementFormComponent),
    title: 'Crear Movimiento - Apple Store Potosí'
  },
  {
    path: 'edit/:id',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES] , titulo: 'Editar movimietno de stock', subtitulo: 'Edición de un movimiento de stock', rutaBreadcrumbs:'Editar movimiento'  },
    loadComponent: () => import('./components/stock-movement-form/stock-movement-form.component').then(c => c.StockMovementFormComponent),
    title: 'Editar Movimiento - Apple Store Potosí'
  },
  {
    path: 'detail/:id',
    data: { titulo: 'Detalle movimietno de stock', subtitulo: 'Detalle de un movimiento de stock', rutaBreadcrumbs:'Detalle movimiento'  },
    loadComponent: () => import('./components/stock-movement-detail/stock-movement-detail.component').then(c => c.StockMovementDetailComponent),
    title: 'Detalle de Movimiento - Apple Store Potosí'
  }
];