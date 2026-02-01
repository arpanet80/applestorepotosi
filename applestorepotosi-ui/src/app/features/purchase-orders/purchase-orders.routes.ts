// src/app/purchase-orders/purchase-orders.routes.ts
import { Routes } from '@angular/router';
import { roleGuard } from '../../auth/guards/role.guard';
import { UserRole } from '../../auth/models/user.model';

export const PURCHASE_ORDERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/purchase-order-page/purchase-order-page.component').then((c) => c.PurchaseOrderPageComponent),
    data: { titulo: 'Ordenes de compra', subtitulo: 'Administrar las ordenes de compra', rutaBreadcrumbs:'Orden de compra' },
    title: 'Órdenes de Compra - Apple Store Potosí',
  },
  {
    path: 'create',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES], titulo: 'Nueva Orden de compra', subtitulo: 'Registro de nueva orden de compra', rutaBreadcrumbs:'Nueva Orden de compra'  },
    loadComponent: () => import('./components/purchase-order-form/purchase-order-form.component').then((c) => c.PurchaseOrderFormComponent),
    title: 'Crear Orden de Compra - Apple Store Potosí',
  },
  {
    path: 'edit/:id',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES], titulo: 'Editar Orden de compra', subtitulo: 'Edicion de  orden de compra', rutaBreadcrumbs:'Editar Orden de compra'  },
    loadComponent: () => import('./components/purchase-order-form/purchase-order-form.component').then((c) => c.PurchaseOrderFormComponent),
    title: 'Editar Orden de Compra - Apple Store Potosí',
  },
  {
    path: 'detail/:id',
    data: { titulo: 'Detalle Orden de compra', subtitulo: 'Detalle de  orden de compra', rutaBreadcrumbs:'Detalle Orden de compra'  },
    loadComponent: () => import('./components/purchase-order-detail/purchase-order-detail.component').then((c) => c.PurchaseOrderDetailComponent),
    title: 'Detalle de Orden de Compra - Apple Store Potosí',
  },
  {
  path: 'management',
  canActivate: [roleGuard],
  data: { roles: [UserRole.ADMIN, UserRole.SALES] },
  loadComponent: () =>
    import('./pages/purchase-order-management/purchase-order-management.component').then(
      (c) => c.PurchaseOrderManagementComponent
    ),
  title: 'Gestión de Órdenes de Compra - Apple Store Potosí',
},
];