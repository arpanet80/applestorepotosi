// src/app/products/products.routes.ts - VERSIÓN CORREGIDA
import { Routes } from '@angular/router';
import { roleGuard } from '../../auth/guards/role.guard';
import { UserRole } from '../../auth/models/user.model';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '', // Esta ruta ya está protegida por el authGuard del padre
    loadComponent: () => import('./pages/product-management/product-management.component').then(c => c.ProductManagementComponent),    
    data: { titulo: 'Gestión de Productos', subtitulo: 'Panel avanzado para administración de productos', rutaBreadcrumbs:'Products' },
    title: 'Productos - Apple Store Potosí'
  },
  // { 
  //   path: 'catalog',
  //   canActivate: [roleGuard], // Solo roleGuard para rutas específicas
  //   data: { roles: [UserRole.ADMIN, UserRole.SALES] },
  //   loadComponent: () => import('./pages/products-page/products-page.component').then(c => c.ProductsPageComponent),
  //   title: 'Catalogo de Productos - Apple Store Potosí'
  // },
  {
    path: 'create',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES], titulo: 'Crear Producto', subtitulo: 'Crear un nuevo producto', rutaBreadcrumbs:'Nuevo Producto' },
    loadComponent: () => import('./components/product-form/product-form.component').then(c => c.ProductFormComponent),title: 'Crear Producto - Apple Store Potosí'},
  {
    path: 'edit/:id',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES] , titulo: 'Editar Producto', subtitulo: 'Editar un producto', rutaBreadcrumbs:'Editar Producto' },
    loadComponent: () => 
      import('./components/product-form/product-form.component').then(c => c.ProductFormComponent),
    title: 'Editar Producto - Apple Store Potosí'
  },
  {
    path: 'detail/:id',
    data: { titulo: 'Detalle del Producto', subtitulo: 'Visualice los detalles del producto seleccionado', rutaBreadcrumbs:'Detalle Producto' },
    loadComponent: () => import('./components/product-detail/product-detail.component').then(c => c.ProductDetailComponent),
    title: 'Detalle de Producto - Apple Store Potosí'
  },
  {
    path: 'stock/:id',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.SALES], titulo: 'Sotck del Producto', subtitulo: 'Agregar o disminuir el stock del producto seleccionado', rutaBreadcrumbs:'Stock Producto' },
    loadComponent: () => import('./components/product-stock/product-stock.component').then(c => c.ProductStockComponent),title: 'Gestión de Stock - Apple Store Potosí'}
  
];