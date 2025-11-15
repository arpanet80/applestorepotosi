import { Routes } from '@angular/router';
import { roleGuard } from '../auth/guards/role.guard';
import { UserRole } from '../auth/models/user.model';

export const STOCK_MOVEMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/stock-movements-page/stock-movements-page.component').then(c => c.StockMovementsPageComponent),
    title: 'Movimientos de Stock - Apple Store Potosí'
  },
  {
    path: 'management',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES] },
    loadComponent: () => import('./pages/stock-movement-management/stock-movement-management.component').then(c => c.StockMovementManagementComponent),
    title: 'Gestión de Movimientos - Apple Store Potosí'
  },
  {
    path: 'adjustment',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES] },
    loadComponent: () => import('./components/stock-adjustment-form/stock-adjustment-form.component').then(c => c.StockAdjustmentFormComponent),
    title: 'Crear Movimiento - Apple Store Potosí'
  },
  {
    path: 'create',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES] },
    loadComponent: () => import('./components/stock-movement-form/stock-movement-form.component').then(c => c.StockMovementFormComponent),
    title: 'Ajuste de Stock - Apple Store Potosí'
  },
  {
    path: 'edit/:id',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES] },
    loadComponent: () => import('./components/stock-movement-form/stock-movement-form.component').then(c => c.StockMovementFormComponent),
    title: 'Editar Movimiento - Apple Store Potosí'
  },
  {
    path: 'detail/:id',
    loadComponent: () => import('./components/stock-movement-detail/stock-movement-detail.component').then(c => c.StockMovementDetailComponent),
    title: 'Detalle de Movimiento - Apple Store Potosí'
  }
];