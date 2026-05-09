# Service Orders API - Documentación para Frontend

> Backend: NestJS + MongoDB  
> Auth: Firebase Auth + Roles (ADMIN, SALES, TECHNICIAN)  
> Base URL: `http://localhost:3000/service-orders`

---

## 🔐 Autenticación

Todas las rutas requieren:
- **Header**: `Authorization: Bearer <firebase-id-token>`
- **Roles**: ADMIN, SALES, TECHNICIAN

---

## 📦 Enums

### ServiceOrderStatus
```typescript
enum ServiceOrderStatus {
  INGRESADO = 'INGRESADO',
  DIAGNOSIS = 'DIAGNOSIS',
  REPARACION = 'REPARACION',
  PRUEBAS = 'PRUEBAS',
  ENTREGADO = 'ENTREGADO',
  CANCELADO = 'CANCELADO',
}
```

### UserRole (para referencia)
```typescript
enum UserRole {
  ADMIN = 'ADMIN',
  SALES = 'SALES',
  TECHNICIAN = 'TECHNICIAN',
  CLIENT = 'CLIENT',
}
```

---

## 📐 Modelos de Datos

### ServiceOrder (Respuesta)
```typescript
interface ServiceOrder {
  _id: string;
  orderNumber: string;           // Formato: OS-YYYYMMDD-NNNN
  customerId: CustomerPopulated; // Objeto poblado (ver abajo)
  device: CustomerDevice;
  symptom: string;
  description: string;
  photos: string[];
  items: ServiceItem[];
  laborCost: number;
  totalCost: number;              // Calculado automáticamente
  status: ServiceOrderStatus;
  technicianId: TechnicianPopulated; // Objeto poblado (ver abajo)
  diagnosisNotes: string;
  repairNotes: string;
  testNotes: string;
  deliveryNotes: string;
  statusNotes: string;             // Notas del último cambio de estado
  warrantyMonths: number;
  isWarranty: boolean;
  saleId?: string;
  createdAt: string;               // ISO Date
  updatedAt: string;               // ISO Date
}
```

### CustomerPopulated
```typescript
interface CustomerPopulated {
  _id: string;
  fullName: string;
  phone: string;
  email: string;
}
```

### TechnicianPopulated
```typescript
interface TechnicianPopulated {
  _id: string;
  displayName: string;
  email: string;
}
```

### CustomerDevice
```typescript
interface CustomerDevice {
  type: string;              // 'iPhone', 'iPad', 'Mac', etc.
  model: string;             // '13 Pro Max', 'Air M2', etc.
  imei?: string;
  serial?: string;
  aestheticCondition?: string; // 'Bueno', 'Rayones', etc.
  accessoriesLeft: string[];  // ['Cargador', 'Caja', etc.]
}
```

### ServiceItem
```typescript
interface ServiceItem {
  partName: string;     // 'Pantalla iPhone 13 Original'
  quantity: number;
  unitCost: number;      // Costo de compra (interno)
  unitPrice: number;     // Precio de venta (cliente)
  notes?: string;
}
```

---

## 📥 DTOs (Request Bodies)

### CreateServiceOrderDto
```typescript
interface CreateServiceOrderDto {
  customerId: string;        // MongoDB ObjectId del cliente
  device: CustomerDevice;
  symptom: string;
  description?: string;
  photos?: string[];          // URLs de imágenes
  laborCost?: number;         // Default: 0, máximo 2 decimales
  warrantyMonths?: number;    // Default: 3
  items: ServiceItemDto[];    // Mínimo 1 item válido
}

// ServiceItemDto (para creación)
interface ServiceItemDto {
  partName: string;
  quantity: number;           // Mínimo: 1
  unitCost: number;           // Mínimo: 0
  unitPrice: number;          // Mínimo: 0
  notes?: string;
}
```

### UpdateServiceOrderDto
```typescript
interface UpdateServiceOrderDto {
  symptom?: string;
  description?: string;
  photos?: string[];
  laborCost?: number;
  diagnosisNotes?: string;
  repairNotes?: string;
  testNotes?: string;
  deliveryNotes?: string;
  warrantyMonths?: number;
  isWarranty?: boolean;
}
// ⚠️ Solo campos listados arriba son permitidos (whitelist)
```

### ChangeStatusDto
```typescript
interface ChangeStatusDto {
  status: ServiceOrderStatus;
  notes?: string;  // Se guarda en statusNotes
}
```

### AddServiceItemDto
```typescript
interface AddServiceItemDto {
  item: ServiceItemDto;  // El item a agregar
}
```

---

## 🌐 Endpoints

### 1. Crear Orden de Servicio
```http
POST /service-orders
```

**Headers:**
```
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

**Body:**
```json
{
  "customerId": "507f1f77bcf86cd799439011",
  "device": {
    "type": "iPhone",
    "model": "13 Pro Max",
    "imei": "123456789012345",
    "serial": "ABC123",
    "aestheticCondition": "Bueno",
    "accessoriesLeft": ["Cargador", "Caja"]
  },
  "symptom": "Pantalla rota",
  "description": "Se cayó al piso",
  "laborCost": 150,
  "warrantyMonths": 3,
  "items": [
    {
      "partName": "Pantalla iPhone 13 Pro Max Original",
      "quantity": 1,
      "unitCost": 200,
      "unitPrice": 350,
      "notes": "Repuesto original"
    }
  ]
}
```

**Respuesta (201):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "orderNumber": "OS-20260505-0001",
  "customerId": { "_id": "...", "fullName": "Juan Pérez", "phone": "123456", "email": "juan@email.com" },
  "device": { ... },
  "symptom": "Pantalla rota",
  "status": "INGRESADO",
  "totalCost": 500,
  "items": [ ... ],
  "technicianId": { "_id": "...", "displayName": "Técnico 1", "email": "tech@email.com" },
  "createdAt": "2026-05-05T10:00:00.000Z",
  "updatedAt": "2026-05-05T10:00:00.000Z"
}
```

---

### 2. Listar Órdenes (Paginado)
```http
GET /service-orders?page=1&limit=20&status=INGRESADO&customerId=...&technicianId=...&startDate=...&endDate=...
```

**Query Params:**
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `page` | number | 1 | Página actual |
| `limit` | number | 20 | Items por página (máx: 100) |
| `status` | string | - | Filtrar por estado |
| `customerId` | string | - | Filtrar por cliente (ObjectId) |
| `technicianId` | string | - | Filtrar por técnico (ObjectId) |
| `startDate` | string | - | Fecha inicio (ISO o YYYY-MM-DD) |
| `endDate` | string | - | Fecha fin (ISO o YYYY-MM-DD) |

**Respuesta (200):**
```json
{
  "orders": [ ... ],      // Array de ServiceOrder
  "total": 100,          // Total de registros
  "page": 1,
  "totalPages": 5
}
```

---

### 3. Obtener Orden por ID
```http
GET /service-orders/:id
```

**Respuesta (200):**
```json
{
  "_id": "...",
  "orderNumber": "OS-20260505-0001",
  "customerId": { ... },
  "technicianId": { ... },
  "items": [ ... ],
  "status": "INGRESADO",
  ...
}
```

---

### 4. Actualizar Orden
```http
PUT /service-orders/:id
```

**Body:** `UpdateServiceOrderDto` (solo campos permitidos)

**Respuesta (200):** Objeto `ServiceOrder` actualizado

---

### 5. Cambiar Estado
```http
PUT /service-orders/:id/status
```

**Body:**
```json
{
  "status": "DIAGNOSIS",
  "notes": "Se encontró falla en la placa"
}
```

**Transiciones Válidas:**
```
INGRESADO   → DIAGNOSIS o CANCELADO
DIAGNOSIS   → REPARACION o CANCELADO
REPARACION  → PRUEBAS o CANCELADO
PRUEBAS     → ENTREGADO o CANCELADO
ENTREGADO   → (ninguno)
CANCELADO   → (ninguno)
```

**Respuesta (200):** Objeto `ServiceOrder` con nuevo estado

---

### 6. Agregar Item/Repuesto
```http
POST /service-orders/:id/items
```

**Body:**
```json
{
  "item": {
    "partName": "Batería iPhone 13",
    "quantity": 1,
    "unitCost": 50,
    "unitPrice": 100
  }
}
```

**Reglas:**
- No se pueden agregar items si estado es `ENTREGADO` o `CANCELADO`
- `totalCost` se recalcula automáticamente

**Respuesta (201):** Objeto `ServiceOrder` actualizado con nuevo item

---

### 7. Reporte de Ingresos
```http
GET /service-orders/income-report?startDate=...&endDate=...&technicianId=...
```

**Query Params:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `startDate` | string | Fecha inicio |
| `endDate` | string | Fecha fin |
| `technicianId` | string | Filtrar por técnico |

**Respuesta (200):**
```json
{
  "orderCount": 50,
  "totalLabor": 7500.00,
  "totalParts": 12000.00,
  "totalInvoiced": 19500.00,
  "grossMargin": 0.00
}
```
> ⚠️ Solo incluye órdenes con status != CANCELADO

---

## ⚠️ Reglas de Negocio

1. **Número de orden único**: Formato `OS-YYYYMMDD-NNNN`, generado atómicamente
2. **Cálculo de totalCost**: `Σ(items.quantity * items.unitPrice) + laborCost`
3. **Al menos 1 item válido** requerido al crear orden
4. **Transiciones de estado**: Solo las definidas en el mapa de transiciones
5. **Autorización**: Técnico solo modifica sus propias órdenes (ADMIN puede todas)
6. **Ítems no editables**: Una vez agregado un item, no hay endpoint para editarlo o eliminarlo
7. **Paginación**: `limit` máximo 100, `page` mínimo 1

---

## 🚫 Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Bad Request (ID inválido, transición inválida, validaciones) |
| 401 | Unauthorized (token faltante o inválido) |
| 403 | Forbidden (rol insuficiente o no autorizado para modificar orden) |
| 404 | Not Found (orden, cliente o técnico no encontrado) |

**Ejemplo de error (400):**
```json
{
  "statusCode": 400,
  "message": "Transición inválida: de INGRESADO a ENTREGADO. Permitidas: DIAGNOSIS, CANCELADO",
  "error": "Bad Request"
}
```

---

## 📝 Notas para el Frontend

1. **Obtener technicianId**: El backend lo obtiene automáticamente del token Firebase (`user.uid` → busca en Users)
2. **Población automática**: `customerId` y `technicianId` vienen poblados con `_id`, `fullName/displayName`, `email`
3. **Fechas**: Enviar como ISO string o `YYYY-MM-DD`, el backend las convierte a `Date`
4. **Filtros opcionales**: En `findAll`, cualquier filtro no proporcionado se ignora
5. **Recálculo de totalCost**: Ocurre automáticamente al agregar items o cambiar `laborCost`
