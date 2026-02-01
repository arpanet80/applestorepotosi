// src/app/core/constants/menu-admin.const.ts

import { UserRole } from '../../../../../auth/models/user.model';
import { MenuSidebar } from '../interfaces/menu.interface';

export const MENU_ADMIN = {
    etiquetaAdmin: { titulo: 'Administración', roles: [UserRole.ADMIN] },

    simpleDashoard: {
            titulo: 'Dashboard admin',
            icono:  "bi bi-grid-fill", 
            url: "/dashboard/admin",
            roles: [UserRole.ADMIN],
    },

    menuPrimerNivelProducts: [
        {
            titulo: 'Productos',
            icono: 'bi bi-box-fill',       // bi-list-ul
            url: '/dashboard/products',
            roles: [UserRole.ADMIN],
            opcionSimple: [
                { titulo: 'Catalogo de Productos', url: '/dashboard/products_catalog', roles: [UserRole.ADMIN] },
                { titulo: 'Gestion de Productos',   url: '/dashboard/products', roles: [UserRole.ADMIN] },
            ]
        },
    ],

    menuPrimerNivelCategorias: [
        {
        titulo: 'Categorias',
        icono: 'bi bi-tag-fill',       // bi-list-ul
        url: '/dashboard/procesos',
        roles: [UserRole.ADMIN],
        opcionSimple: [
            { titulo: 'Catalogo de categorias', url: '/dashboard/categories', roles: [UserRole.ADMIN] },
            { titulo: 'Gestion de categorias',   url: '/dashboard/categories_management', roles: [UserRole.ADMIN] },
            { titulo: 'Caracteristicas',   url: '/dashboard/category-characteristics', roles: [UserRole.ADMIN] }
        ]
        },
    ],

    simpleUsMarcas: {
            titulo: 'Marcas',
            icono:  "bi bi-star-fill", 
            url: "/dashboard/brands",
            roles: [UserRole.ADMIN],
    },

    simpleProveedores: {
            titulo: 'Proveedores',
            icono:  "bi-briefcase", 
            url: "/dashboard/suppliers",
            roles: [UserRole.ADMIN],
    },

    simpleUsuarios: {
            titulo: 'Gestion de usuarios',
            icono:  "bi bi-people-fill", 
            url: "/dashboard/users",
            roles: [UserRole.ADMIN],
    },

    etiquetaOperaciones: { titulo: 'Operaciones', roles: [UserRole.ADMIN] },

    simpleOrders: {
            titulo: 'Ordenes de Compra',
            icono:  "bi bi-list-check", 
            url: "/dashboard/purchase-orders",
            roles: [UserRole.ADMIN],
    },

    simpleStock: {
            titulo: 'Movimiento de stock',
            icono:  "bi bi-receipt", 
            url: "/dashboard/stock-movements",
            roles: [UserRole.ADMIN],
    },

    simpleVentas: {
            titulo: 'Ventas',
            icono:  "bi bi-receipt", 
            url: "/dashboard/sales",
            roles: [UserRole.ADMIN],
    },

    simpleClientes: {
            titulo: 'Clientes',
            icono:  "bi bi-receipt", 
            url: "/dashboard/customers",
            roles: [UserRole.ADMIN],
    },

    //////////////////////////////////////////////////////////////////
    //////////  MENU S A L E S              //////////////////////////
    //////////////////////////////////////////////////////////////////
    // /
    etiquetaSales: { titulo: 'Ventas', roles: [UserRole.SALES] },

    simpleDashoardSales: {
            titulo: 'Dashboard Ventas',
            icono:  "bi bi-tag-fill", 
            url: "/dashboard/sales_dashboard",
            roles: [UserRole.SALES],
    },

    simplePuntoVenta: {
            titulo: 'Punto de Venta',
            icono:  "bi bi-cash", 
            url: "/dashboard/sales/pos",
            roles: [UserRole.SALES],
    },

    simpleMisVentas: {
            titulo: 'Mis Ventas',
            icono:  "bi-currency-dollar", 
            url: "/dashboard/my-sales",
            roles: [UserRole.SALES],
    },

    simpleSalesClientesSales: {
            titulo: 'Clientes',
            icono:  "bi bi-receipt", 
            url: "/dashboard/customers-sales",
            roles: [UserRole.SALES],
    },

    simpleProductos: {
            titulo: 'Productos',
            icono:  "bi bi-box-fill", 
            url: "/dashboard/products_catalog",
            roles: [UserRole.SALES],
    },

    simpleCaja: {
            titulo: 'Caja',
            icono:  "bi-credit-card", 
            url: "/dashboard/caja", 
            roles: [UserRole.SALES],
    },

    //////////////////////////////////////////////////////////////////
    //////////  MENU TECHNICIAN             //////////////////////////
    //////////////////////////////////////////////////////////////////
    
    etiquetaTechnician: { titulo: 'Tecnico', roles: [UserRole.TECHNICIAN] },

    simpleDashoardTecnico: {
            titulo: 'Dashboard Tecnico',
            icono:  "bi bi-tools", 
            url: "/dashboard/technician",
            roles: [UserRole.TECHNICIAN],
    },

    simpleMovimientoStock: {
            titulo: 'Movimiento de stock',
            icono:  "bi bi-arrow-left-right", 
            url: "/dashboard/technician-stock-movements",
            roles: [UserRole.TECHNICIAN],
    },

    simpleProductosTecnico: {
            titulo: 'Productos',
            icono:  "bi bi-box", 
            url: "/dashboard/technician-products",
            roles: [UserRole.TECHNICIAN],
    },

    simpleOrdenServicio: {
            titulo: 'Ordenes de Servicio',
            icono:  "bi bi-clipboard-check", 
            url: "/dashboard/service-orders",
            roles: [UserRole.TECHNICIAN],
    },

};



////////////////////////////////////////////////////////
///////// EJEMPLO DE MENU COMPLETO ///////////////////
////////////////////////////////////////////////////////
/*
export const MENU_ADMIN: MenuSidebar = {
    etiqueta: { 
        titulo: 'Funcionarios',
        roles: [UserRole.ADMIN],
    },

    // etiquetaSistema: {
    //     titulo: 'Sistema'
    // },
    
    opcionSimple: {
            titulo: 'Configuracion',
            icono:  "bi bi-gear-fill", 
            url: "/dashboard/configuracion",
            roles: [Role.Admin,]
    },
    opcionSimpleAcercade: {
        titulo: 'Acerca de..',
        icono:  "bi bi-gear-fill", 
        url: "/dashboard/configuracion",
        roles: [Role.Admin, Role.Rrhh, Role.Usuario]
    },
    menuPrimerNivel: [
        {
            titulo: 'Funcionarios',
            icono: "bi bi-android",
            url: "/dashboard/funcionarios",
            roles: [Role.Admin, Role.Usuario],
            opcionSimple: [
                {
                    titulo: 'Registro',
                    url: "/dashboard/funcionarios/usuarioslist",
                    icono: "bi bi-android",
                    roles: [Role.Admin, Role.Usuario],
                },
                {
                    titulo: 'Perfil',
                    url: "/dashboard/funcionarios/usuariosperfil",
                    roles: [Role.Admin],


                },
                {
                    titulo: 'Credencial',
                    url: "/dashboard/funcionarios/credenciales",
                    roles: [Role.Admin],

                },
                {
                    titulo: 'Entrega Credencial',
                    url: "/dashboard/funcionarios/actacredenciales"
                },
            ]

        },
        {
            titulo: 'Sistemas',
            icono: "bi bi-android",
            url: "/dashboard/sistema",
            roles: [Role.Admin, Role.Usuario],
            opcionSimple: [
                
                {
                    titulo: 'Usuarios',
                    // icono:  "bi bi-gear-fill", 
                    url: "/dashboard/sistema/usuarios"
                },
                {
                    titulo: 'Sistemas Permisos',
                    // icono:  "bi bi-gear-fill", 
                    url: "/dashboard/sistema/sistemalist"
                },
            ]

        }
    ],
    menuSegundoNivel: [
        {
            titulo: 'MenuSEgundo Nivel',
            icono: "bi bi-android",
            url: "/dashboard/usuarios",
            roles: [Role.Admin, Role.Usuario],
            menuPrimerNivel: [
                {
                    titulo: 'Usuarios',
                    icono: "bi bi-android",
                    url: "/dashboard/usuarios",
                    roles: [Role.Admin, Role.Usuario],

                    opcionSimple: [
                        {
                            titulo: 'Lista usuarios',
                            url: "/dashboard/usuarios/usuarioslist",
                            roles: [Role.Admin],
                        },
                        {
                            titulo: 'Perfil',
                            // icono:  "bi bi-gear-fill", 
                            url: "/dashboard/usuarios/usuariosperfil"
                        },
                    ]
        
                },
                {
                    titulo: 'Formularios',
                    icono: "bi bi-android",
                    url: "/dashboard/formularios",
                    opcionSimple: [
                        {
                            titulo: 'Lista',
                            // icono:  "bi bi-gear-fill", 
                            url: "/dashboard/formularios/usuarioslist"
                        },
                        {
                            titulo: 'Reportes',
                            // icono:  "bi bi-gear-fill", 
                            url: "/dashboard/formularios/reporteslist"
                        },
                    ]
        
                }
            ]
        }
    ]
}

*/