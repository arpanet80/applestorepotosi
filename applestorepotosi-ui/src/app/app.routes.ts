// src/app/app.routes.ts - VERSIÓN COMPLETA CON REDIRECCIÓN POR ROLES
import { Routes } from '@angular/router';
import { authGuard } from './auth/guards/auth.guard';
import { roleGuard } from './auth/guards/role.guard';
import { UserRole } from './auth/models/user.model';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/components/login/login.component').then(c => c.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/components/register/register.component').then(c => c.RegisterComponent)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./auth/components/unauthorized/unauthorized.component').then(c => c.UnauthorizedComponent)
  },
  
  // ========== DASHBOARD PRINCIPAL CON RUTAS HIJAS ==========
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./dashboard/dashboard/dashboard.component').then(c => c.DashboardComponent),
    children: [
      // Redirección automática al dashboard del rol del usuario
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./dashboard/dashboard-redirect/dashboard-redirect.component').then(c => c.DashboardRedirectComponent)
      },
      
      // Perfil de usuario (compartido para todos los roles)
      {
        path: 'profile',
        loadComponent: () => import('./dashboard/profile/profile.component').then(c => c.ProfileComponent),
        title: 'Mi Perfil - Apple Store Potosí'
      },

      // ========== RUTAS DE PRODUCTOS ==========
      {
        path: 'products',
        loadChildren: () => import('./products/products.routes').then(m => m.PRODUCTS_ROUTES)
      },
      {
        path: 'brands',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadChildren: () => import('./brands/brands.routes').then(m => m.BRANDS_ROUTES)
        // loadComponent: () => import('./admin/brands-management/brands-management.component').then(c => c.BrandsManagementComponent),
        // title: 'Gestión de Marcas - Admin'
      },
      {
        path: 'categories',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadChildren: () => import('./categories/categories.routes').then(m => m.CATEGORIES_ROUTES)
      },
      {
        path: 'category-characteristics',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadChildren: () => import('./category-characteristics/category-characteristics.routes').then(m => m.CATEGORY_CHARACTERISTICS_ROUTES)
      },
      {
        path: 'customers',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadChildren: () => import('./customers/customers.routes').then(m => m.CUSTOMERS_ROUTES)
      },
      {
        path: 'purchase-orders',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadChildren: () => import('./purchase-orders/purchase-orders.routes').then(m => m.PURCHASE_ORDERS_ROUTES)
      },
      {
        path: 'suppliers',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadChildren: () => import('./suppliers/suppliers.routes').then(m => m.SUPPLIERS_ROUTES)
      },
      {
        path: 'sales',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadChildren: () => import('./sales/sales.routes').then(m => m.SALES_ROUTES)
      },
      {
        path: 'stock-movements',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadChildren: () => import('./stock-movements/stock-movements.routes').then(m => m.STOCK_MOVEMENTS_ROUTES)
      },

      // ========== RUTAS DE CLIENTES ==========
      // {
      //   path: 'customers',
      //   loadChildren: () => import('./customers/customers.routes').then(m => m.CUSTOMERS_ROUTES)
      // },

      // ========== DASHBOARDS ESPECÍFICOS POR ROL ==========
      
      // PANEL ADMINISTRADOR
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadComponent: () => import('./dashboard/admin-dashboard/admin-dashboard.component').then(c => c.AdminDashboardComponent),
        title: 'Panel Admin - Apple Store Potosí'
      },
      
      // RUTAS ESPECÍFICAS DE ADMIN
/*
      {
        path: 'admin/users',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadComponent: () => import('./admin/users-management/users-management.component').then(c => c.UsersManagementComponent),
        title: 'Gestión de Usuarios - Admin'
      },
      {
        path: 'admin/sales',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadComponent: () => import('./admin/sales-reports/sales-reports.component').then(c => c.SalesReportsComponent),
        title: 'Reportes de Ventas - Admin'
      },
      {
        path: 'admin/settings',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadComponent: () => import('./admin/system-settings/system-settings.component').then(c => c.SystemSettingsComponent),
        title: 'Configuración del Sistema - Admin'
      },
*/
      // PANEL VENTAS
      {
        path: 'sales',
        canActivate: [roleGuard],
        data: { roles: [UserRole.SALES, UserRole.ADMIN] },
        loadComponent: () => import('./dashboard/sales-dashboard/sales-dashboard.component').then(c => c.SalesDashboardComponent),
        title: 'Panel Ventas - Apple Store Potosí'
      },


      // RUTAS ESPECÍFICAS DE VENTAS
      
/*
      {
        path: 'sales/point-of-sale',
        canActivate: [roleGuard],
        data: { roles: [UserRole.SALES, UserRole.ADMIN] },
        loadComponent: () => import('./sales/point-of-sale/point-of-sale.component').then(c => c.PointOfSaleComponent),
        title: 'Punto de Venta - Sales'
      },
      {
        path: 'sales/orders',
        canActivate: [roleGuard],
        data: { roles: [UserRole.SALES, UserRole.ADMIN] },
        loadComponent: () => import('./sales/orders-management/orders-management.component').then(c => c.OrdersManagementComponent),
        title: 'Gestión de Pedidos - Sales'
      },
*/

      // PANEL TÉCNICO
      {
        path: 'technician',
        canActivate: [roleGuard],
        data: { roles: [UserRole.TECHNICIAN, UserRole.ADMIN] },
        loadComponent: () => import('./dashboard/technician-dashboard/technician-dashboard.component').then(c => c.TechnicianDashboardComponent),
        title: 'Panel Técnico - Apple Store Potosí'
      },
      
      // RUTAS ESPECÍFICAS DE TÉCNICO
/*
      {
        path: 'technician/repairs',
        canActivate: [roleGuard],
        data: { roles: [UserRole.TECHNICIAN, UserRole.ADMIN] },
        loadComponent: () => import('./technician/repairs-management/repairs-management.component').then(c => c.RepairsManagementComponent),
        title: 'Gestión de Reparaciones - Technician'
      },
      {
        path: 'technician/diagnostics',
        canActivate: [roleGuard],
        data: { roles: [UserRole.TECHNICIAN, UserRole.ADMIN] },
        loadComponent: () => import('./technician/diagnostics/diagnostics.component').then(c => c.DiagnosticsComponent),
        title: 'Diagnósticos - Technician'
      },
      {
        path: 'technician/parts',
        canActivate: [roleGuard],
        data: { roles: [UserRole.TECHNICIAN, UserRole.ADMIN] },
        loadComponent: () => import('./technician/parts-inventory/parts-inventory.component').then(c => c.PartsInventoryComponent),
        title: 'Inventario de Repuestos - Technician'
      },
*/

      // PANEL CLIENTE
      {
        path: 'customer',
        canActivate: [roleGuard],
        data: { roles: [UserRole.CUSTOMER, UserRole.ADMIN] },
        loadComponent: () => import('./dashboard/customer-dashboard/customer-dashboard.component').then(c => c.CustomerDashboardComponent),
        title: 'Mi Cuenta - Apple Store Potosí'
      },

      // RUTAS ESPECÍFICAS DE CLIENTE
/*
      {
        path: 'customer/orders',
        canActivate: [roleGuard],
        data: { roles: [UserRole.CUSTOMER, UserRole.ADMIN] },
        loadComponent: () => import('./customer/orders-history/orders-history.component').then(c => c.OrdersHistoryComponent),
        title: 'Mis Pedidos - Customer'
      },
      {
        path: 'customer/services',
        canActivate: [roleGuard],
        data: { roles: [UserRole.CUSTOMER, UserRole.ADMIN] },
        loadComponent: () => import('./customer/services-history/services-history.component').then(c => c.ServicesHistoryComponent),
        title: 'Mis Servicios - Customer'
      },
      {
        path: 'customer/warranty',
        canActivate: [roleGuard],
        data: { roles: [UserRole.CUSTOMER, UserRole.ADMIN] },
        loadComponent: () => import('./customer/warranty-management/warranty-management.component').then(c => c.WarrantyManagementComponent),
        title: 'Mis Garantías - Customer'
      },
      {
        path: 'customer/support',
        canActivate: [roleGuard],
        data: { roles: [UserRole.CUSTOMER, UserRole.ADMIN] },
        loadComponent: () => import('./customer/support-tickets/support-tickets.component').then(c => c.SupportTicketsComponent),
        title: 'Soporte - Customer'
      },
*/

      // ========== RUTAS COMPARTIDAS ==========
      
      // Vista general del dashboard (stats comunes)
      {
        path: 'overview',
        loadComponent: () => import('./dashboard/overview/overview.component').then(c => c.OverviewComponent),
        title: 'Resumen - Apple Store Potosí'
      },

      // Configuración y perfil
      /*{
        path: 'settings',
        loadComponent: () => import('./dashboard/settings/settings.component').then(c => c.SettingsComponent),
        title: 'Configuración - Apple Store Potosí'
      }
      */
    ]
  },
  
  // ========== RUTAS DIRECTAS (SIN DASHBOARD LAYOUT) ==========
  
  // Página de mantenimiento
  {
    path: 'maintenance',
    loadComponent: () => import('./shared/components/maintenance/maintenance.component').then(c => c.MaintenanceComponent),
    title: 'Mantenimiento - Apple Store Potosí'
  },
  
  // Página de error 404
  {
    path: 'not-found',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(c => c.NotFoundComponent),
    title: 'Página No Encontrada - Apple Store Potosí'
  },
  
  // ========== FALLBACK ROUTE ==========
  {
    path: '**',
    redirectTo: '/not-found'
  }
];