import { Routes } from '@angular/router';
import { roleGuard } from '../../auth/guards/role.guard';
import { UserRole } from '../../auth/models/user.model';

export const TECHNICIAN_STOCK_MOVEMENTS_ROUTES: Routes = [
  {
    path: '',
    data: { titulo: 'Movimientos de Stock Técnico', subtitulo: 'Administra los Movimientos de stock', rutaBreadcrumbs:'Movimientos de stock' },
    loadComponent: () => import('./components/stock-movements-home/technician-stock-movements-home.component').then(c => c.TechnicianStockMovementsHomeComponent),
    title: 'Movimientos de Stock - Apple Store Potosí'
  },
  {
    path: 'detail/:id',
    canActivate: [roleGuard],
    data: { roles: [UserRole.TECHNICIAN] , titulo: 'Detalles del ajuste', subtitulo: 'Muestra los detalles del ajuste seleccionado', rutaBreadcrumbs:'Detalle de ajuste' },
    loadComponent: () => import('./components/stock-movement-detail/technician-stock-movement-detail.component').then(c => c.TechnicianStockMovementDetailComponent),
    title: 'Detalles de Stock - Apple Store Potosí'
  },
  {
    path: 'stock-adjust',
    canActivate: [roleGuard],
    data: { roles: [UserRole.TECHNICIAN] , titulo: 'Ajustes de stock', subtitulo: 'Administra los Ajustes de stock', rutaBreadcrumbs:'Ajustes de stock' },
    loadComponent: () => import('./components/stock-adjustment/technician-stock-adjustment.component').then(c => c.TechnicianStockAdjustmentComponent),
    title: 'Ajuste de Stock - Apple Store Potosí'
  },
];