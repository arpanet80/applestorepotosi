import { Routes } from '@angular/router';
import { authGuard } from './auth/guards/auth.guard';
import { roleGuard } from './auth/guards/role.guard';
import { UserRole } from './auth/models/user.model';
import { MainLayout } from './layouts/keen-layout/main-layout/main-layout';
import { Title } from '@angular/platform-browser';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./auth/components/login/login.component').then(c => c.LoginComponent) },
  { path: 'register', loadComponent: () => import('./auth/components/register/register.component').then(c => c.RegisterComponent) },
  { path: 'unauthorized', loadComponent: () => import('./auth/components/unauthorized/unauthorized.component').then(c => c.UnauthorizedComponent) },

  /* ------------------------------------------------------------------
   *  DASHBOARD CON LAYOUT COMÚN
   * ------------------------------------------------------------------ */
  {
    path: 'dashboard',
    canActivate: [authGuard],
    component: MainLayout,
    children: [
      /* raíz del dashboard → decide a qué sub-rol redirigir */
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./dashboard/dashboard-redirect/dashboard-redirect.component').then(c => c.DashboardRedirectComponent)
      },

      /* perfil común a todos los roles */
      {
        path: 'profile',
        loadComponent: () => import('./dashboard/profile/profile.component').then(c => c.ProfileComponent),
        title: 'Mi Perfil - Apple Store Potosí'
      },

      /* ================================================================
       *  R A M A   A D M I N  (incluye SUPERADMIN)
       * ================================================================ */
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadComponent: () => import('./dashboard/admin-dashboard/admin-dashboard.component').then(c => c.AdminDashboardComponent),
        title: 'Panel Admin - Apple Store Potosí',
      },
      /*  MÓDULOS EXCLUSIVOS ADMIN  */
      {
        path: 'users',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadChildren: () => import('./users/users.routes').then(m => m.USERS_ROUTES),
        title: 'Gestión de Usuarios'
      },
      {
        path: 'categories',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadChildren: () => import('./features/categories/categories.routes').then(m => m.CATEGORIES_ROUTES)
      },
      {
        path: 'categories_management', // de categorias
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.SALES], titulo: 'Gestión de Categorías', subtitulo: 'Administra las categorías disponibles en la tienda', rutaBreadcrumbs:'Management' },
        loadComponent: () =>import('././features/categories/pages/category-management/category-management.component').then((c) => c.CategoryManagementComponent),
        title: 'Gestión de Categorías - Apple Store Potosí',
      },
      {
        path: 'category-characteristics',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadChildren: () => import('./features/category-characteristics/category-characteristics.routes').then(m => m.CATEGORY_CHARACTERISTICS_ROUTES)
      },
      {
        path: 'brands',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadChildren: () => import('./features/brands/brands.routes').then(m => m.BRANDS_ROUTES)
      },
      {
        path: 'products',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadChildren: () => import('./features/products/products.routes').then(m => m.PRODUCTS_ROUTES)
      },
      { 
        path: 'products_catalog',
        canActivate: [roleGuard], // Solo roleGuard para rutas específicas
        data: { roles: [UserRole.ADMIN, UserRole.SALES], titulo: 'Catalogo de Productos', subtitulo: 'Gestiona y explora todos los productos disponibles', rutaBreadcrumbs:'Catalogo Productos' },
        loadComponent: () => import('./features/products/pages/products-page/products-page.component').then(c => c.ProductsPageComponent),
        title: 'Catalogo de Productos - Apple Store Potosí'
      },
      {
        path: 'suppliers',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadChildren: () => import('./features/suppliers/suppliers.routes').then(m => m.SUPPLIERS_ROUTES)
      },
      {
        path: 'purchase-orders',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.SALES], },
        loadChildren: () => import('./features/purchase-orders/purchase-orders.routes').then(m => m.PURCHASE_ORDERS_ROUTES)
      },
      {
        path: 'stock-movements',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadChildren: () => import('./features/stock-movements/stock-movements.routes').then(m => m.STOCK_MOVEMENTS_ROUTES)
      },
      {
        path: 'sales',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN, UserRole.SALES] },
        loadChildren: () => import('./features/sales/sales.routes').then(m => m.SALES_ROUTES)
      },
      {
        path: 'customers',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadChildren: () => import('./features/customers/customers.routes').then(m => m.CUSTOMERS_ROUTES)
      },
      /* ------ módulos pendientes (reservado) ------ */
      /*
      {
        path: 'audit',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadComponent: () => import('./admin/audit/audit.component').then(c => c.AuditComponent),
        title: 'Auditoría Global'
      },
      {
        path: 'settings',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadComponent: () => import('./admin/system-settings/system-settings.component').then(c => c.SystemSettingsComponent),
        title: 'Configuraciones'
      },
      */

      /* ================================================================
       *  R A M A   S A L E S  (vendedor)
       * ================================================================ */
      {
        path: 'sales_dashboard',
        canActivate: [roleGuard],
        data: { roles: [UserRole.SALES] },
        loadComponent: () => import('./dashboard/sales-dashboard/sales-dashboard.component').then(c => c.SalesDashboardComponent),
        title: 'Panel Ventas - Apple Store Potosí'
      },
      {
        path: 'point-of-sale',
        canActivate: [roleGuard],
        data: { roles: [UserRole.SALES] },
        loadComponent: () => import('./features/pos/components/pos.component').then(c => c.PosComponent),
        title: 'Punto de Venta'
      },
      {
        path: 'my-sales',
        canActivate: [roleGuard],
        data: { roles: [UserRole.SALES] },
        loadChildren: () => import('./features/my-sales/routes').then(c => c.MY_SALES_ROUTES),
        title: 'Mis Ventas'
      },
      {
        path: 'customers-sales',
        canActivate: [roleGuard],
        data: { roles: [UserRole.SALES] },
        loadChildren: () => import('./features/customers/customers.routes').then(m => m.CUSTOMERS_ROUTES)
      },
      
      {
        path: 'caja',
        canActivate: [roleGuard],
        data: { roles: [UserRole.SALES] },
        loadComponent: () => import('./features/caja/components/caja.component').then(c => c.CajaComponent),
        title: 'Caja'
      },

      /* ================================================================
       *  R A M A   T E C H N I C I A N
       * ================================================================ */
      {
        path: 'technician',
        canActivate: [roleGuard],
        data: { roles: [UserRole.TECHNICIAN] },
        loadComponent: () => import('./dashboard/technician-dashboard/technician-dashboard.component').then(c => c.TechnicianDashboardComponent),
        title: 'Panel Técnico'
      },
      {
        path: 'technician-stock-movements',
        canActivate: [roleGuard],
        data: { roles: [UserRole.TECHNICIAN] },
        loadChildren: () => import('./features/technician/technician.routes').then(c => c.TECHNICIAN_STOCK_MOVEMENTS_ROUTES),
        title: 'Movimientos de Stock Técnico'
      },
      {
        path: 'technician-products',
        canActivate: [roleGuard],
        data: { roles: [UserRole.TECHNICIAN] },
        loadComponent: () => import('./features/technician/components/products-home/technician-products-home.component').then(c => c.TechnicianProductsHomeComponent),
        title: 'Productos - Técnico'
      },
      {
        path: 'technician-products-detail/:id',
        canActivate: [roleGuard],
        data: { roles: [UserRole.TECHNICIAN], titulo: 'Detalles del Producto', subtitulo: 'Muestra los detalles del producto seleccionado', rutaBreadcrumbs:'Detalle de producto' },
        loadComponent: () => import('./features/technician/components/product-detail/technician-product-detail.component').then(c => c.TechnicianProductDetailComponent),
        title: 'Detalle de Producto - Técnico'
      },
      {
        path: 'service-orders',
        canActivate: [roleGuard],
        data: { roles: [UserRole.TECHNICIAN] },
        loadChildren: () => import('./features/service-orders/service-orders.routes').then(m => m.SERVICE_ORDERS_ROUTES),
        title: 'Órdenes de Servicio'
      },

      /* ================================================================
       *  R A M A   C U S T O M E R
       * ================================================================ */
      {
        path: 'customer',
        canActivate: [roleGuard],
        data: { roles: [UserRole.CUSTOMER] },
        loadComponent: () => import('./dashboard/customer-dashboard/customer-dashboard.component').then(c => c.CustomerDashboardComponent),
        title: 'Mi Cuenta'
      },

      /* ------------------------------------------------------------------
       *  VISTA GENÉRICA (resumen común a todos)
       * ------------------------------------------------------------------ */
      {
        path: 'overview',
        loadComponent: () => import('./dashboard/overview/overview.component').then(c => c.OverviewComponent),
        title: 'Resumen - Apple Store Potosí'
      }
    ]
  },

  /* ====================================================================
   *  VERIFICACIÓN DE TICKETS (página pública sin layout)
   * ==================================================================== */
  {
    path: 'verify',
    loadComponent: () => import('./features/sales/pages/ticket-verify/ticket-verify.component').then(c => c.TicketVerifyComponent),
    title: 'Verificar Ticket - Apple Store Potosí'
  },

  /* ====================================================================
   *  PÁGINAS FUERA DEL LAYOUT
   * ==================================================================== */
  { path: 'maintenance', loadComponent: () => import('./shared/components/maintenance/maintenance.component').then(c => c.MaintenanceComponent) },
  { path: 'not-found', loadComponent: () => import('./shared/components/not-found/not-found.component').then(c => c.NotFoundComponent) },
  { path: '**', redirectTo: '/not-found' },
];