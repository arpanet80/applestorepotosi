# 🍎 Apple Store Potosí

Sistema de gestión de punto de venta (POS) desarrollado con NestJS y Angular.

## 📋 Descripción

Aplicación web completa para la gestión de una tienda, incluyendo:
- 🛍️ Punto de venta (POS)
- 📦 Gestión de inventario
- 👥 Gestión de clientes
- 📊 Reportes y estadísticas
- 🔐 Autenticación con Firebase
- 📝 Órdenes de servicio
- 💰 Control de caja

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────┐
│         Frontend - Angular 20+          │
│         (Vercel - Producción)           │
└─────────────┬───────────────────────────┘
              │
              │ HTTPS + CORS
              ▼
┌─────────────────────────────────────────┐
│          Backend - NestJS               │
│        (Render - Producción)            │
└─────────────┬───────────────────────────┘
              │
              │ MongoDB Driver
              ▼
┌─────────────────────────────────────────┐
│       Database - MongoDB Atlas          │
│            (Cluster Gratuito)           │
└─────────────────────────────────────────┘
```

## 🚀 Stack Tecnológico

### Backend
- **Framework:** NestJS 11.x
- **Base de datos:** MongoDB + Mongoose
- **Autenticación:** Firebase Admin SDK
- **Deployment:** Render

### Frontend
- **Framework:** Angular 20+
- **UI:** Bootstrap 5
- **Autenticación:** Firebase Auth
- **Deployment:** Vercel

## 📦 Estructura del Proyecto

```
applestorepotosi/
├── applestorepotosi-api/       # Backend NestJS
│   ├── src/
│   │   ├── auth/              # Autenticación
│   │   ├── products/          # Productos
│   │   ├── sales/             # Ventas
│   │   ├── customers/         # Clientes
│   │   └── ...                # Otros módulos
│   ├── package.json
│   └── .env.example
│
├── applestorepotosi-ui/        # Frontend Angular
│   ├── src/
│   │   ├── app/
│   │   ├── environments/
│   │   └── assets/
│   ├── package.json
│   └── vercel.json
│
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD automatizado
│
└── README.md
```

## 🛠️ Instalación Local

### Prerrequisitos
- Node.js 20.x o superior
- npm o yarn
- MongoDB (local o Atlas)
- Cuenta de Firebase

### Backend

```bash
# 1. Clonar el repositorio
git clone https://github.com/arpanet80/applestorepotosi.git
cd applestorepotosi/applestorepotosi-api

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Ejecutar en modo desarrollo
npm run start:dev

# El backend estará disponible en http://localhost:3000
```

### Frontend

```bash
# 1. Ir a la carpeta del frontend
cd applestorepotosi-ui

# 2. Instalar dependencias
npm install

# 3. Configurar environment
# Editar src/environments/environment.development.ts con tu apiUrl

# 4. Ejecutar en modo desarrollo
npm start

# El frontend estará disponible en http://localhost:4200
```

## 🌐 Despliegue en Producción

Ver la [Guía Completa de Despliegue](./GUIA_DESPLIEGUE_COMPLETA.md) para instrucciones detalladas.

### URLs de Producción

- **Frontend:** https://applestorepotosi-ui.vercel.app
- **Backend:** https://applestorepotosi-api.onrender.com
- **API Health Check:** https://applestorepotosi-api.onrender.com/health

### CI/CD Automatizado

El proyecto usa GitHub Actions + Render + Vercel para CI/CD:

```
git push origin main
  ↓
GitHub Actions verifica builds
  ↓
Render despliega backend (3-5 min)
  ↓
Vercel despliega frontend (2-3 min)
  ↓
✅ Producción actualizada
```

## 🔧 Scripts Disponibles

### Backend (`applestorepotosi-api`)

```bash
npm run start:dev      # Desarrollo con hot-reload
npm run build          # Compilar para producción
npm run start:prod     # Ejecutar build de producción
npm run lint           # Linter
npm run test           # Tests unitarios
```

### Frontend (`applestorepotosi-ui`)

```bash
npm start              # Desarrollo (http://localhost:4200)
npm run build          # Build de desarrollo
npm run build:prod     # Build de producción (optimizado)
npm run test           # Tests unitarios
```

## 🔐 Variables de Entorno

### Backend (`.env`)

```env
MONGODB_URI=mongodb+srv://...
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
PORT=3000
NODE_ENV=production
CORS_ORIGINS=https://tu-app.vercel.app
```

### Frontend (`environment.production.ts`)

```typescript
export const environment = {
  production: true,
  firebase: { /* config */ },
  apiUrl: 'https://tu-backend.onrender.com'
};
```

## 📊 Funcionalidades Principales

### Módulo de Ventas
- ✅ Punto de venta (POS)
- ✅ Historial de ventas
- ✅ Devoluciones y ajustes
- ✅ Múltiples métodos de pago

### Módulo de Inventario
- ✅ Gestión de productos
- ✅ Control de stock
- ✅ Movimientos de inventario
- ✅ Órdenes de compra

### Módulo de Clientes
- ✅ CRUD de clientes
- ✅ Historial de compras
- ✅ Programa de lealtad

### Módulo de Reportes
- ✅ Ventas por período
- ✅ Productos más vendidos
- ✅ Análisis de inventario
- ✅ Logs de auditoría

## 🧪 Testing

```bash
# Backend
cd applestorepotosi-api
npm run test          # Tests unitarios
npm run test:cov      # Coverage

# Frontend
cd applestorepotosi-ui
npm run test          # Tests con Jasmine
```

## 🐛 Troubleshooting

### Backend no conecta a MongoDB
- Verificar `MONGODB_URI` en variables de entorno
- Verificar Network Access en MongoDB Atlas (0.0.0.0/0)

### CORS Errors
- Verificar `CORS_ORIGINS` en backend incluye tu dominio de Vercel
- Verificar protocolo (https://)

### Render Sleep (tier gratuito)
- Backend duerme después de 15 minutos de inactividad
- Primera petición puede tardar 30-60 segundos

Ver más en la [Guía de Troubleshooting](./GUIA_DESPLIEGUE_COMPLETA.md#7-troubleshooting)

## 📝 Licencia

Este proyecto es privado y no tiene licencia pública.

## 👥 Autor

**arpanet80**

## 🤝 Contribuir

Este es un proyecto privado. Si tienes acceso al repositorio:

1. Crear una rama: `git checkout -b feature/nueva-funcionalidad`
2. Hacer commits: `git commit -m "feat: agregar nueva funcionalidad"`
3. Push a la rama: `git push origin feature/nueva-funcionalidad`
4. Crear un Pull Request

## 📞 Soporte

Para reportar bugs o solicitar features, crear un issue en el repositorio.

---

**Última actualización:** Enero 2026
