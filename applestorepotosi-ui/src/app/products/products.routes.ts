// src/app/products/products.routes.ts - VERSIÓN CORREGIDA
import { Routes } from '@angular/router';
import { roleGuard } from '../auth/guards/role.guard';
import { UserRole } from '../auth/models/user.model';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '', // Esta ruta ya está protegida por el authGuard del padre
    loadComponent: () => 
      import('./pages/products-page/products-page.component').then(c => c.ProductsPageComponent),
    title: 'Productos - Apple Store Potosí'
  },
  {
    path: 'management',
    canActivate: [roleGuard], // Solo roleGuard para rutas específicas
    data: { roles: [UserRole.ADMIN, UserRole.SALES] },
    loadComponent: () => 
      import('./pages/product-management/product-management.component').then(c => c.ProductManagementComponent),
    title: 'Gestión de Productos - Apple Store Potosí'
  },
  {
    path: 'create',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES] },
    loadComponent: () => 
      import('./components/product-form/product-form.component').then(c => c.ProductFormComponent),
    title: 'Crear Producto - Apple Store Potosí'
  },
  {
    path: 'edit/:id',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES] },
    loadComponent: () => 
      import('./components/product-form/product-form.component').then(c => c.ProductFormComponent),
    title: 'Editar Producto - Apple Store Potosí'
  },
  {
    path: 'detail/:id',
    loadComponent: () => 
      import('./components/product-detail/product-detail.component').then(c => c.ProductDetailComponent),
    title: 'Detalle de Producto - Apple Store Potosí'
  },
  {
    path: 'stock/:id',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES] },
    loadComponent: () => 
      import('./components/product-stock/product-stock.component').then(c => c.ProductStockComponent),
    title: 'Gestión de Stock - Apple Store Potosí'
  }
  
];