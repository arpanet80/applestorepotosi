/* eslint-disable @typescript-eslint/no-explicit-any */
require('dotenv/config');
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { faker } from '@faker-js/faker';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import dayjs from 'dayjs';

/* ---------  TIPOS DE MONGOOSE  --------- */
import { UserDocument, UserRole } from '../users/schemas/user.schema';
import { BrandDocument } from '../brands/schemas/brand.schema';
import { CategoryDocument } from '../categories/schemas/category.schema';
import { SupplierDocument } from '../suppliers/schemas/supplier.schema';
import { ProductDocument } from '../products/schemas/product.schema';
import { CustomerDocument } from '../customers/schemas/customer.schema';
import { PaymentMethod, PaymentStatus, SaleStatus } from '../sales/schemas/sale.schema';

/////////////////////////////////////////////////////////////////////////////////////////
/////// Genera los registros de prueba de la DB - APPLE STORE                          //
/////// EJECUTAR:                                                                      //
/////// npx ts-node -r tsconfig-paths/register src/scripts/seed.test-new-records.ts    //
/////////////////////////////////////////////////////////////////////////////////////////

/* ---------  HELPERS  --------- */

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pickId = <T extends { _id: Types.ObjectId }>(arr: T[]): Types.ObjectId =>
  arr[Math.floor(Math.random() * arr.length)]._id;

/* ---------  DATOS REALES DE APPLE  --------- */

const APPLE_PRODUCTS = {
  iPhone: [
    { 
      name: 'iPhone 15 Pro Max', 
      specs: { 
        capacity: ['256GB', '512GB', '1TB'], 
        colors: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'],
        display: '6.7-inch Super Retina XDR',
        chip: 'A17 Pro',
        camera: '48MP Main + 12MP Ultra Wide + 12MP Telephoto'
      } 
    },
    { 
      name: 'iPhone 15 Pro', 
      specs: { 
        capacity: ['128GB', '256GB', '512GB', '1TB'], 
        colors: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'],
        display: '6.1-inch Super Retina XDR',
        chip: 'A17 Pro',
        camera: '48MP Main + 12MP Ultra Wide + 12MP Telephoto'
      } 
    },
    { 
      name: 'iPhone 15', 
      specs: { 
        capacity: ['128GB', '256GB', '512GB'], 
        colors: ['Pink', 'Yellow', 'Green', 'Blue', 'Black'],
        display: '6.1-inch Super Retina XDR',
        chip: 'A16 Bionic',
        camera: '48MP Main + 12MP Ultra Wide'
      } 
    },
    { 
      name: 'iPhone 14 Pro Max', 
      specs: { 
        capacity: ['128GB', '256GB', '512GB', '1TB'], 
        colors: ['Space Black', 'Silver', 'Gold', 'Deep Purple'],
        display: '6.7-inch Super Retina XDR',
        chip: 'A16 Bionic',
        camera: '48MP Main + 12MP Ultra Wide + 12MP Telephoto'
      } 
    },
    { 
      name: 'iPhone 14', 
      specs: { 
        capacity: ['128GB', '256GB', '512GB'], 
        colors: ['Midnight', 'Starlight', 'Purple', 'Blue', 'Red'],
        display: '6.1-inch Super Retina XDR',
        chip: 'A15 Bionic',
        camera: '12MP Main + 12MP Ultra Wide'
      } 
    },
    { 
      name: 'iPhone 13', 
      specs: { 
        capacity: ['128GB', '256GB', '512GB'], 
        colors: ['Midnight', 'Starlight', 'Blue', 'Pink', 'Green'],
        display: '6.1-inch Super Retina XDR',
        chip: 'A15 Bionic',
        camera: '12MP Main + 12MP Ultra Wide'
      } 
    },
  ],
  iPad: [
    { 
      name: 'iPad Pro 12.9"', 
      specs: { 
        capacity: ['128GB', '256GB', '512GB', '1TB', '2TB'], 
        colors: ['Space Gray', 'Silver'],
        display: '12.9-inch Liquid Retina XDR',
        chip: 'M2',
        camera: '12MP Wide + 10MP Ultra Wide'
      } 
    },
    { 
      name: 'iPad Air', 
      specs: { 
        capacity: ['64GB', '256GB'], 
        colors: ['Space Gray', 'Starlight', 'Pink', 'Purple', 'Blue'],
        display: '10.9-inch Liquid Retina',
        chip: 'M1',
        camera: '12MP Wide'
      } 
    },
    { 
      name: 'iPad', 
      specs: { 
        capacity: ['64GB', '256GB'], 
        colors: ['Space Gray', 'Silver'],
        display: '10.9-inch Liquid Retina',
        chip: 'A14 Bionic',
        camera: '12MP Wide'
      } 
    },
    { 
      name: 'iPad mini', 
      specs: { 
        capacity: ['64GB', '256GB'], 
        colors: ['Space Gray', 'Pink', 'Purple', 'Starlight'],
        display: '8.3-inch Liquid Retina',
        chip: 'A15 Bionic',
        camera: '12MP Wide'
      } 
    },
  ],
  Mac: [
    { 
      name: 'MacBook Pro 16"', 
      specs: { 
        chip: ['M3 Pro', 'M3 Max'], 
        memory: ['18GB', '36GB', '64GB'], 
        storage: ['512GB', '1TB', '2TB', '4TB'],
        display: '16.2-inch Liquid Retina XDR',
        colors: ['Space Gray', 'Silver']
      } 
    },
    { 
      name: 'MacBook Pro 14"', 
      specs: { 
        chip: ['M3', 'M3 Pro', 'M3 Max'], 
        memory: ['8GB', '18GB', '36GB'], 
        storage: ['512GB', '1TB', '2TB'],
        display: '14.2-inch Liquid Retina XDR',
        colors: ['Space Gray', 'Silver']
      } 
    },
    { 
      name: 'MacBook Air 15"', 
      specs: { 
        chip: ['M2'], 
        memory: ['8GB', '16GB', '24GB'], 
        storage: ['256GB', '512GB', '1TB'],
        display: '15.3-inch Liquid Retina',
        colors: ['Midnight', 'Starlight', 'Space Gray', 'Silver']
      } 
    },
    { 
      name: 'MacBook Air 13"', 
      specs: { 
        chip: ['M1', 'M2'], 
        memory: ['8GB', '16GB'], 
        storage: ['256GB', '512GB', '1TB'],
        display: '13.6-inch Liquid Retina',
        colors: ['Midnight', 'Starlight', 'Space Gray', 'Silver']
      } 
    },
    { 
      name: 'iMac 24"', 
      specs: { 
        chip: ['M1', 'M3'], 
        memory: ['8GB', '16GB'], 
        storage: ['256GB', '512GB', '1TB'], 
        colors: ['Blue', 'Green', 'Pink', 'Silver', 'Yellow', 'Orange', 'Purple'],
        display: '24-inch 4.5K Retina'
      } 
    },
  ],
  'Apple Watch': [
    { 
      name: 'Apple Watch Series 9', 
      specs: { 
        size: ['41mm', '45mm'], 
        colors: ['Pink', 'Midnight', 'Starlight', 'Silver', 'Product RED'],
        display: 'Always-On Retina',
        chip: 'S9 SiP',
        features: ['GPS', 'GPS + Cellular']
      } 
    },
    { 
      name: 'Apple Watch Ultra 2', 
      specs: { 
        size: ['49mm'], 
        colors: ['Titanium'],
        display: 'Always-On Retina',
        chip: 'S9 SiP',
        features: ['GPS + Cellular', 'Action Button', 'Dual Frequency GPS']
      } 
    },
    { 
      name: 'Apple Watch SE', 
      specs: { 
        size: ['40mm', '44mm'], 
        colors: ['Midnight', 'Starlight', 'Silver'],
        display: 'Retina',
        chip: 'S8 SiP',
        features: ['GPS', 'GPS + Cellular']
      } 
    },
  ],
  AirPods: [
    { 
      name: 'AirPods Pro 2nd Gen', 
      specs: { 
        colors: ['White'], 
        features: ['USB-C', 'Active Noise Cancellation', 'Transparency Mode'],
        chip: 'H2',
        battery: 'Up to 6 hours listening time'
      } 
    },
    { 
      name: 'AirPods 3rd Gen', 
      specs: { 
        colors: ['White'], 
        features: ['Lightning', 'MagSafe', 'Spatial Audio'],
        chip: 'H1',
        battery: 'Up to 6 hours listening time'
      } 
    },
    { 
      name: 'AirPods Max', 
      specs: { 
        colors: ['Space Gray', 'Silver', 'Green', 'Pink', 'Sky Blue'],
        features: ['Active Noise Cancellation', 'Transparency Mode', 'Spatial Audio'],
        chip: 'H1',
        battery: 'Up to 20 hours listening time'
      } 
    },
  ],
  'Accesorios Apple': [
    { 
      name: 'MagSafe Charger', 
      specs: { 
        color: 'White',
        power: '15W',
        compatibility: ['iPhone 12 and later', 'AirPods with MagSafe']
      } 
    },
    { 
      name: 'Magic Keyboard', 
      specs: { 
        layout: ['US', 'ES'],
        color: 'White',
        connectivity: ['Bluetooth', 'USB-C'],
        compatibility: ['Mac', 'iPad']
      } 
    },
    { 
      name: 'Magic Mouse', 
      specs: { 
        color: 'White',
        connectivity: ['Bluetooth', 'Lightning'],
        compatibility: ['Mac']
      } 
    },
    { 
      name: 'USB-C Power Adapter', 
      specs: { 
        wattage: ['20W', '30W', '67W', '96W', '140W'],
        color: 'White',
        compatibility: ['MacBook', 'iPad', 'iPhone']
      } 
    },
    { 
      name: 'iPhone Case', 
      specs: { 
        material: ['Silicone', 'Leather', 'Clear'], 
        colors: ['Product RED', 'Midnight', 'Forest Green', 'Ultramarine'],
        compatibility: ['iPhone 14', 'iPhone 15']
      } 
    },
  ]
};

const APPLE_ISSUES = [
  'Pantalla rota - necesita reemplazo de display',
  'Batería drenada rápidamente - requiere diagnóstico',
  'Cámara trasera no funciona - problema de hardware',
  'No carga - puerto Lightning dañado',
  'Altavoz no funciona - problema de audio',
  'Face ID no reconoce - sensor fallando',
  'WiFi no conecta - problema de antena',
  'Botón home no responde - necesita reemplazo',
  'Sobrecalentamiento - problema de refrigeración',
  'Micrófono no funciona - llamadas con audio distorsionado',
  'Pantalla táctil no responde en ciertas áreas',
  'iCloud bloqueado - necesita desbloqueo',
  'Actualización fallida - iPhone en modo recovery',
  'Agua en el dispositivo - daño por líquidos',
  'Batería hinchada - riesgo de seguridad'
];

const SERVICE_TYPES = [
  'Reparación de pantalla',
  'Cambio de batería',
  'Reparación de cámara',
  'Reparación de puerto de carga',
  'Reparación de altavoz',
  'Reparación de micrófono',
  'Desbloqueo de iCloud',
  'Recuperación de datos',
  'Diagnóstico general',
  'Reparación por daño por agua',
  'Reparación de botones',
  'Actualización de software'
];

// Enum para ServiceOrderStatus
const ServiceOrderStatus = {
  INGRESADO : 'ingresado',
  DIAGNOSTICADO : 'diagnosticado',
  APROBADO : 'aprobado',
  REPARADO : 'reparado',
  ENTREGADO : 'entregado',
  FINALIZADO : 'finalizado',
  CANCELADO : 'cancelado',
} as const;

type ServiceOrderStatusType = typeof ServiceOrderStatus[keyof typeof ServiceOrderStatus];

/* ---------  FUNCIÓN DE LIMPIEZA COMPLETA  --------- */
async function limpiarBaseDatosCompleta(app: any) {
  const collections = [
    'users', 'brands', 'categories', 'suppliers', 'products',
    'purchase_orders', 'stock_movements', 'customers', 'sales',
    'sale_items', 'cash_sessions', 'settings', 'audit_logs',
    'category_characteristics', 'customer_devices', 'service_orders'
  ];

  console.log('🧹 Eliminando TODAS las colecciones...');
  
  for (const collectionName of collections) {
    try {
      const model = app.get(getModelToken(collectionName));
      const result = await model.deleteMany({});
      console.log(`✅ Colección ${collectionName} eliminada (${result.deletedCount} documentos)`);
    } catch (error) {
      console.log(`⚠️  Colección ${collectionName} no existe o ya fue eliminada`);
    }
  }
  
  console.log('🗑️  Base de datos completamente limpia');
}

/* ---------  SEED  --------- */
async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  // PRIMERO: Limpia TODO
  await limpiarBaseDatosCompleta(app);

  // SEGUNDO: Carga los modelos
  const userModel      = app.get(getModelToken('User'));
  const brandModel     = app.get(getModelToken('Brand'));
  const categoryModel  = app.get(getModelToken('Category'));
  const supplierModel  = app.get(getModelToken('Supplier'));
  const productModel   = app.get(getModelToken('Product'));
  const poModel        = app.get(getModelToken('PurchaseOrder'));
  const stockModel     = app.get(getModelToken('StockMovement'));
  const customerModel  = app.get(getModelToken('Customer'));
  const saleModel      = app.get(getModelToken('Sale'));
  const saleItemModel  = app.get(getModelToken('SaleItem'));
  const cashModel      = app.get(getModelToken('CashSession'));
  const settingModel   = app.get(getModelToken('Setting'));
  const auditModel     = app.get(getModelToken('AuditLog'));
  const categoryCharModel = app.get(getModelToken('CategoryCharacteristic'));
  const customerDeviceModel = app.get(getModelToken('CustomerDevice'));
  const serviceOrderModel = app.get(getModelToken('ServiceOrder'));

  console.log('📝 Insertando datos Apple realistas...');

  /* 1. USUARIOS */
  const users = (await userModel.insertMany(
    Array.from({ length: 10 }, () => ({
      uid: faker.string.uuid(),
      email: faker.internet.email(),
      displayName: faker.person.fullName(),
      phoneNumber: faker.phone.number(),
      role: pick(Object.values(UserRole)),
      profile: {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        phone: faker.phone.number(),
        avatar: faker.image.avatar(),
        dateOfBirth: faker.date.birthdate(),
        gender: pick(['male', 'female', 'other']),
      },
      roleInfo: { name: pick(Object.values(UserRole)), permissions: [] },
      specialization: ['Apple', 'iOS', 'MacOS', 'Reparación'],
      preferences: {
        notifications: true,
        newsletter: false,
        smsAlerts: false,
        language: 'es',
      },
      isActive: true,
      emailVerified: pick([true, false]),
      lastLogin: faker.date.past(),
      photoURL: faker.image.avatar(),
      provider: 'local',
    })),
  )) as UserDocument[];

  /* 2. MARCAS - Solo Apple */
  const appleBrand = await brandModel.create({
    name: 'Apple',
    description: 'Apple Inc. - Diseñando productos innovadores desde 1976',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
    website: 'https://www.apple.com',
    country: 'Estados Unidos',
    supportUrl: 'https://support.apple.com',
    warrantyInfo: 'Garantía limitada de 1 año, AppleCare+ disponible',
    isActive: true,
  });

  /* 3. CATEGORÍAS APPLE */
  const categoryData = [
    { name: 'iPhone', slug: 'iphone', description: 'Teléfonos iPhone', parentId: null, imageUrl: faker.image.url(), isActive: true, updatedBy: users[0]._id.toString() },
    { name: 'iPad', slug: 'ipad', description: 'Tabletas iPad', parentId: null, imageUrl: faker.image.url(), isActive: true, updatedBy: users[0]._id.toString() },
    { name: 'Mac', slug: 'mac', description: 'Computadoras Mac', parentId: null, imageUrl: faker.image.url(), isActive: true, updatedBy: users[0]._id.toString() },
    { name: 'Apple Watch', slug: 'apple-watch', description: 'Relojes inteligentes Apple Watch', parentId: null, imageUrl: faker.image.url(), isActive: true, updatedBy: users[0]._id.toString() },
    { name: 'AirPods', slug: 'airpods', description: 'Auriculares inalámbricos AirPods', parentId: null, imageUrl: faker.image.url(), isActive: true, updatedBy: users[0]._id.toString() },
    { name: 'Accesorios Apple', slug: 'accesorios-apple', description: 'Accesorios originales Apple', parentId: null, imageUrl: faker.image.url(), isActive: true, updatedBy: users[0]._id.toString() },
  ];

  for (const cat of categoryData) {
    await categoryModel.updateOne(
      { slug: cat.slug },
      { $set: cat },
      { upsert: true }
    );
  }

  const appleCategories = await categoryModel.find({ slug: { $in: categoryData.map(c => c.slug) } }) as CategoryDocument[];


  /* 4. CARACTERÍSTICAS POR CATEGORÍA */
  const characteristics = [
    // iPhone
    { categoryId: appleCategories[0]._id, name: 'Capacidad', type: 'select', possibleValues: ['128GB', '256GB', '512GB', '1TB'], isRequired: true, isActive: true, description: 'Capacidad de almacenamiento', sortOrder: 1, updatedBy: users[0]._id.toString() },
    { categoryId: appleCategories[0]._id, name: 'Color', type: 'select', possibleValues: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium', 'Pink', 'Yellow', 'Green', 'Blue', 'Black', 'Midnight', 'Starlight', 'Purple', 'Red'], isRequired: true, isActive: true, description: 'Color del dispositivo', sortOrder: 2, updatedBy: users[0]._id.toString() },
    { categoryId: appleCategories[0]._id, name: 'Estado', type: 'select', possibleValues: ['Nuevo', 'Seminuevo', 'Reacondicionado'], isRequired: true, isActive: true, description: 'Estado del producto', sortOrder: 3, updatedBy: users[0]._id.toString() },

    // iPad
    { categoryId: appleCategories[1]._id, name: 'Capacidad', type: 'select', possibleValues: ['64GB', '128GB', '256GB', '512GB', '1TB'], isRequired: true, isActive: true, description: 'Capacidad de almacenamiento', sortOrder: 1, updatedBy: users[0]._id.toString() },
    { categoryId: appleCategories[1]._id, name: 'Color', type: 'select', possibleValues: ['Space Gray', 'Silver', 'Starlight', 'Pink', 'Purple', 'Blue'], isRequired: true, isActive: true, description: 'Color del dispositivo', sortOrder: 2, updatedBy: users[0]._id.toString() },
    { categoryId: appleCategories[1]._id, name: 'Conectividad', type: 'select', possibleValues: ['Wi-Fi', 'Wi-Fi + Cellular'], isRequired: true, isActive: true, description: 'Tipo de conectividad', sortOrder: 3, updatedBy: users[0]._id.toString() },

    // Mac
    { categoryId: appleCategories[2]._id, name: 'Chip', type: 'select', possibleValues: ['M1', 'M2', 'M3', 'M3 Pro', 'M3 Max'], isRequired: true, isActive: true, description: 'Procesador Apple Silicon', sortOrder: 1, updatedBy: users[0]._id.toString() },
    { categoryId: appleCategories[2]._id, name: 'Memoria', type: 'select', possibleValues: ['8GB', '16GB', '18GB', '24GB', '36GB', '64GB'], isRequired: true, isActive: true, description: 'Memoria RAM', sortOrder: 2, updatedBy: users[0]._id.toString() },
    { categoryId: appleCategories[2]._id, name: 'Almacenamiento', type: 'select', possibleValues: ['256GB', '512GB', '1TB', '2TB', '4TB'], isRequired: true, isActive: true, description: 'Almacenamiento SSD', sortOrder: 3, updatedBy: users[0]._id.toString() },
  ];

  for (const char of characteristics) {
    await categoryCharModel.updateOne(
      { categoryId: char.categoryId, name: char.name },
      { $set: char },
      { upsert: true }
    );
  }

  /* 5. PROVEEDORES - Distribuidores Apple */
  const suppliers = (await supplierModel.insertMany(
    Array.from({ length: 5 }, () => ({
      name: pick(['iStore Supply', 'Apple Distribution México', 'MacCenter Wholesale', 'iTech Suppliers', 'AppleCare Parts']),
      representative: faker.person.fullName(),
      contactEmail: faker.internet.email(),
      contactPhone: faker.phone.number(),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: 'México',
      },
      taxId: faker.string.alphanumeric(13),
      rfc: faker.string.alphanumeric(13),
      paymentTerms: '30 días',
      bankInfo: {
        accountNumber: faker.finance.accountNumber(),
        bankName: faker.company.name(),
      },
      isActive: true,
    })),
  )) as SupplierDocument[];

  /* 6. PRODUCTOS APPLE */
  const products: any[] = [];
  
  for (const category of appleCategories) {
    const categoryProducts = APPLE_PRODUCTS[category.name as keyof typeof APPLE_PRODUCTS] || [];
    
    for (const productTemplate of categoryProducts) {
      // Generar variaciones por capacidad/color
      const variations = generateProductVariations(productTemplate, category, appleBrand, users, suppliers);
      products.push(...variations);
    }
  }
  
  const createdProducts = await productModel.insertMany(products) as ProductDocument[];

  /* 7. CLIENTES */
  const customers = (await customerModel.insertMany(
    Array.from({ length: 20 }, (_, i) => ({
      // userId: i < 3 ? users[i]._id : null, // Solo algunos tienen userId
      fullName: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      taxId: faker.string.alphanumeric(13),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: 'México',
      },
      loyaltyPoints: faker.number.int({ min: 0, max: 1000 }),
      isActive: true,
      isDeleted: false,
      updatedBy: users[0]._id.toString(),
      isPublicGeneral: false,
    })),
  )) as CustomerDocument[];

  /* 8. DISPOSITIVOS DE CLIENTES */
  const customerDevices: any[] = [];
  
  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    const deviceCount = faker.number.int({ min: 1, max: 3 });
    
    for (let j = 0; j < deviceCount; j++) {
      const product = pick(createdProducts) as ProductDocument;
      const deviceType = getDeviceType(product.name);
      
      customerDevices.push({
        customerId: customer._id,
        type: deviceType,
        model: product.name,
        imei: deviceType === 'iPhone' || deviceType === 'iPad' ? generateIMEI() : null,
        serial: generateSerialNumber(),
        aestheticCondition: pick(['Excelente', 'Bueno', 'Regular', 'Con rayones']),
        accessoriesLeft: pick([['Cargador', 'Cable'], ['Caja', 'Cargador'], ['Caja', 'Cargador', 'Cable'], []]),
      });
    }
  }
  
  await customerDeviceModel.insertMany(customerDevices);

  /* 9. ÓRDENES DE SERVICIO */
  const serviceOrders: any[] = [];
  
  for (let i = 0; i < 15; i++) {
    const customer = pick(customers);
    const issue = pick(APPLE_ISSUES);
    
    serviceOrders.push({
      orderNumber: `OS-${String(i + 1).padStart(6, '0')}`,
      customerId: customer._id,
      device: {
        type: 'iPhone',
        model: 'iPhone 14',
        imei: generateIMEI(),
        serial: generateSerialNumber(),
        aestheticCondition: 'Bueno',
        accessoriesLeft: ['Cargador', 'Cable'],
      },
      symptom: issue.split(' - ')[0],
      description: issue,
      photos: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => faker.image.url()),
      items: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ({
        partName: pick(['Pantalla Original', 'Batería Original', 'Cámara Trasera', 'Puerto de Carga', 'Altavoz']),
        quantity: 1,
        unitCost: faker.number.int({ min: 500, max: 2000 }),
        unitPrice: faker.number.int({ min: 1000, max: 4000 }),
        notes: 'Pieza original Apple',
      })),
      laborCost: faker.number.int({ min: 300, max: 1500 }),
      totalCost: 0,
      status: pick(Object.values(ServiceOrderStatus)) as ServiceOrderStatusType,
      technicianId: pickId(users),
      diagnosisNotes: `Diagnóstico: ${issue}. Requiere reemplazo de piezas.`,
      repairNotes: faker.lorem.sentence(),
      testNotes: 'Dispositivo probado y funcionando correctamente',
      deliveryNotes: 'Entregado al cliente con garantía',
      warrantyMonths: faker.number.int({ min: 3, max: 12 }),
      isWarranty: pick([true, false]),
      saleId: null,
    });
  }
  
  await serviceOrderModel.insertMany(serviceOrders);

  /* 10. ÓRDENES DE COMPRA */
  const purchaseOrders: any[] = [];
  
  for (let i = 0; i < 10; i++) {
    const items: any[] = [];
    const itemCount = faker.number.int({ min: 3, max: 8 });
    
    for (let j = 0; j < itemCount; j++) {
      const product = pick(createdProducts) as ProductDocument;
      const quantity = faker.number.int({ min: 5, max: 20 });
      items.push({
        productId: product._id,
        quantity,
        unitCost: product.costPrice,
        subtotal: quantity * product.costPrice,
      });
    }

    purchaseOrders.push({
      supplierId: pickId(suppliers),
      orderDate: faker.date.past({ years: 1 }),
      status: pick(['pending', 'approved', 'completed']),
      items,
      totalAmount: 0,
      orderNumber: `OC-${String(i + 1).padStart(6, '0')}`,
      userId: pickId(users),
      notes: `Pedido de reposición de productos Apple - ${faker.lorem.sentence()}`,
      createdBy: pickId(users),
      isDeleted: false,
      updatedBy: pickId(users),
    });
  }
  
  await poModel.insertMany(purchaseOrders);

  /* 11. VENTAS */
  for (let i = 0; i < 15; i++) {
    const items: any[] = Array.from({ length: pick([1, 2, 3]) }, () => {
      const product = pick(createdProducts) as ProductDocument;
      const quantity = faker.number.int({ min: 1, max: 3 });
      return {
        productId: product._id,
        quantity,
        unitPrice: product.salePrice,
        unitCost: product.costPrice,
        discount: faker.number.int({ min: 0, max: 200 }),
        subtotal: quantity * product.salePrice,
      };
    });
    
    const subtotal = items.reduce((a, b) => a + b.subtotal, 0);
    const discount = items.reduce((a, b) => a + b.discount, 0);
    const tax = subtotal * 0.16;
    
    const sale = await saleModel.create({
      saleNumber: `SL-${String(i + 1).padStart(6, '0')}`,
      customerId: pickId(customers),
      salesPersonId: pickId(users).toString(),
      saleDate: faker.date.past({ years: 1 }),
      payment: {
        method: pick(Object.values(PaymentMethod)),
        status: pick(Object.values(PaymentStatus)),
        reference: faker.string.uuid(),
      },
      totals: {
        subtotal,
        taxAmount: tax,
        discountAmount: discount,
        totalAmount: subtotal + tax - discount,
      },
      status: pick(Object.values(SaleStatus)),
      isReturn: false,
      notes: `Venta de productos Apple - ${faker.lorem.sentence()}`,
      cancelledBy: null,
      cancelledAt: null,
    });
    
    await saleItemModel.insertMany(
      items.map((it) => ({ ...it, saleId: sale._id })),
    );
  }

  /* 12. MOVIMIENTOS DE STOCK */
  const stockMovements: any[] = [];
  for (let i = 0; i < 20; i++) {
    const product = pick(createdProducts) as ProductDocument;
    const qty = faker.number.int({ min: 1, max: 15 });
    const type = pick(['in', 'out', 'adjustment']);
    const reason = type === 'in' ? 'purchase' : type === 'out' ? 'sale' : 'manual';
    
    stockMovements.push({
      productId: product._id,
      type,
      quantity: type === 'out' ? -qty : qty,
      reason,
      reference: new Types.ObjectId(),
      referenceModel: type === 'in' ? 'PurchaseOrder' : 'Sale',
      previousStock: product.stockQuantity,
      newStock: type === 'out' ? product.stockQuantity - qty : product.stockQuantity + qty,
      userId: users[0]._id.toString(),
      timestamp: faker.date.past({ years: 1 }),
      notes: `Movimiento de stock: ${reason}`,
      reservedAtMovement: 0,
      unitCostAtMovement: product.costPrice,
    });
  }
  
  await stockModel.insertMany(stockMovements);

  /* 13. CAJA */
  const cashSessions: any[] = [];
  for (let i = 0; i < 10; i++) {
    const open = faker.number.int({ min: 500, max: 2000 });
    const sales = faker.number.int({ min: 1000, max: 15000 });
    const sessionId = `SEED-${dayjs().format('YYYYMMDDHHmmss')}-${i + 1}`;

    cashSessions.push({
      sessionId,
      openedBy: users[0].uid,
      closedBy: pickId(users),
      openedAt: faker.date.past({ years: 1 }),
      closedAt: faker.date.recent(),
      isClosed: true,
      closeType: pick(['X', 'Z']),
      openingBalance: open,
      cashSales: sales,
      cashRefunds: 0,
      cashInOut: 0,
      expectedCash: open + sales,
      actualCash: open + sales,
      medios: {
        efectivo: sales,
        tarjeta: 0,
        transfer: 0,
        deposito: 0,
      },
      sales: [],
      notes: '',
      discrepancy: null,
    });
  }
  
  await cashModel.insertMany(cashSessions);

  console.log('✅ Datos Apple realistas generados exitosamente');
  console.log(`📱 ${createdProducts.length} productos Apple creados`);
  console.log(`🔧 ${serviceOrders.length} órdenes de servicio creadas`);
  console.log(`📦 ${purchaseOrders.length} órdenes de compra creadas`);
  console.log(`👥 ${customers.length} clientes con dispositivos registrados`);
  
  await app.close();
}

/* ---------  FUNCIONES AUXILIARES  --------- */

function getDeviceType(productName: string): string {
  if (productName.includes('iPhone')) return 'iPhone';
  if (productName.includes('iPad')) return 'iPad';
  if (productName.includes('MacBook') || productName.includes('iMac')) return 'Mac';
  if (productName.includes('Watch')) return 'Apple Watch';
  if (productName.includes('AirPods')) return 'AirPods';
  return 'Accesorio';
}

function generateProductVariations(template: any, category: CategoryDocument, brand: BrandDocument, users: UserDocument[], suppliers: SupplierDocument[]) {
  const variations: any[] = [];
  const baseSpecs = template.specs;
  
  if (baseSpecs.capacity && baseSpecs.colors) {
    // Productos con capacidad y colores (iPhones, iPads)
    for (const capacity of baseSpecs.capacity) {
      for (const color of baseSpecs.colors) {
        const baseCost = getBaseCost(template.name, capacity);
        variations.push({
          sku: `APL-${category.slug.toUpperCase()}-${capacity.replace('GB', '')}-${color.substring(0, 3).toUpperCase()}-${faker.string.alphanumeric(4)}`,
          barcode: faker.string.numeric(13),
          name: `${template.name} ${capacity} ${color}`,
          description: `Producto Apple original - ${template.name} con ${capacity} en color ${color}`,
          categoryId: category._id,
          brandId: brand._id,
          supplierId: pickId(suppliers),
          createdBy: pickId(users),
          specifications: {
            capacity,
            color,
            model: template.name,
            warranty: '12 meses',
            ...baseSpecs
          },
          costPrice: baseCost,
          salePrice: baseCost * 1.4, // 40% margen
          warrantyMonths: 12,
          stockQuantity: faker.number.int({ min: 10, max: 50 }),
          minStock: faker.number.int({ min: 3, max: 8 }),
          maxStock: faker.number.int({ min: 50, max: 100 }),
          reservedQuantity: 0,
          location: `A-${faker.number.int({ min: 1, max: 5 })}-${faker.number.int({ min: 1, max: 20 })}`,
          isActive: true,
          isFeatured: pick([true, false]),
        });
      }
    }
  } else if (baseSpecs.memory && baseSpecs.storage) {
    // Macs con memoria y almacenamiento
    for (const memory of baseSpecs.memory) {
      for (const storage of baseSpecs.storage) {
        const baseCost = getMacCost(template.name, memory, storage);
        variations.push({
          sku: `APL-MAC-${memory.replace('GB', '')}-${storage.replace('GB', '')}-${faker.string.alphanumeric(4)}`,
          barcode: faker.string.numeric(13),
          name: `${template.name} ${memory} RAM ${storage}`,
          description: `Producto Apple original - ${template.name} con ${memory} de memoria y ${storage} de almacenamiento`,
          categoryId: category._id,
          brandId: brand._id,
          supplierId: pickId(suppliers),
          createdBy: pickId(users),
          specifications: {
            memory,
            storage,
            chip: pick(baseSpecs.chip || ['M1', 'M2']),
            model: template.name,
            warranty: '12 meses',
            ...baseSpecs
          },
          costPrice: baseCost,
          salePrice: baseCost * 1.3, // 30% margen
          warrantyMonths: 12,
          stockQuantity: faker.number.int({ min: 5, max: 20 }),
          minStock: faker.number.int({ min: 2, max: 5 }),
          maxStock: faker.number.int({ min: 20, max: 50 }),
          reservedQuantity: 0,
          location: `M-${faker.number.int({ min: 1, max: 3 })}-${faker.number.int({ min: 1, max: 15 })}`,
          isActive: true,
          isFeatured: pick([true, false]),
        });
      }
    }
  } else if (baseSpecs.size && baseSpecs.colors) {
    // Apple Watch
    for (const size of baseSpecs.size) {
      for (const color of baseSpecs.colors) {
        const baseCost = getWatchCost(template.name, size);
        variations.push({
          sku: `APL-WATCH-${size.replace('mm', '')}-${color.substring(0, 3).toUpperCase()}-${faker.string.alphanumeric(4)}`,
          barcode: faker.string.numeric(13),
          name: `${template.name} ${size} ${color}`,
          description: `Producto Apple original - ${template.name} de ${size} en color ${color}`,
          categoryId: category._id,
          brandId: brand._id,
          supplierId: pickId(suppliers),
          createdBy: pickId(users),
          specifications: {
            size,
            color,
            model: template.name,
            warranty: '12 meses',
            ...baseSpecs
          },
          costPrice: baseCost,
          salePrice: baseCost * 1.5, // 50% margen
          warrantyMonths: 12,
          stockQuantity: faker.number.int({ min: 8, max: 30 }),
          minStock: faker.number.int({ min: 2, max: 6 }),
          maxStock: faker.number.int({ min: 30, max: 80 }),
          reservedQuantity: 0,
          location: `W-${faker.number.int({ min: 1, max: 2 })}-${faker.number.int({ min: 1, max: 10 })}`,
          isActive: true,
          isFeatured: pick([true, false]),
        });
      }
    }
  } else {
    // Accesorios simples
    const baseCost = getAccessoryCost(template.name);
    variations.push({
      sku: `APL-ACC-${faker.string.alphanumeric(6)}`,
      barcode: faker.string.numeric(13),
      name: template.name,
      description: `Accesorio Apple original - ${template.name}`,
      categoryId: category._id,
      brandId: brand._id,
      supplierId: pickId(suppliers),
      createdBy: pickId(users),
      specifications: {
        ...baseSpecs,
        model: template.name,
        warranty: '12 meses'
      },
      costPrice: baseCost,
      salePrice: baseCost * 1.6, // 60% margen
      warrantyMonths: 6,
      stockQuantity: faker.number.int({ min: 20, max: 100 }),
      minStock: faker.number.int({ min: 5, max: 15 }),
      maxStock: faker.number.int({ min: 100, max: 200 }),
      reservedQuantity: 0,
      location: `ACC-${faker.number.int({ min: 1, max: 3 })}-${faker.number.int({ min: 1, max: 20 })}`,
      isActive: true,
      isFeatured: pick([true, false]),
    });
  }
  
  return variations;
}

function getBaseCost(model: string, capacity: string): number {
  const base = model.includes('Pro Max') ? 15000 : model.includes('Pro') ? 12000 : 8000;
  const capacityMultiplier = parseInt(capacity) / 128;
  return Math.round(base * capacityMultiplier);
}

function getMacCost(model: string, memory: string, storage: string): number {
  const base = model.includes('Pro 16') ? 25000 : model.includes('Pro 14') ? 20000 : model.includes('Air 15') ? 15000 : 12000;
  const memoryMultiplier = parseInt(memory) / 8;
  const storageMultiplier = parseInt(storage) / 256;
  return Math.round(base * memoryMultiplier * storageMultiplier);
}

function getWatchCost(model: string, size: string): number {
  const base = model.includes('Ultra') ? 18000 : 6000;
  const sizeMultiplier = parseInt(size) / 41;
  return Math.round(base * sizeMultiplier);
}

function getAccessoryCost(name: string): number {
  if (name.includes('MagSafe')) return 800;
  if (name.includes('Magic')) return 3000;
  if (name.includes('USB-C')) return 500;
  if (name.includes('Case')) return 800;
  return 1000;
}

function generateIMEI(): string {
  return `35${faker.string.numeric(12)}`;
}

function generateSerialNumber(): string {
  return faker.string.alphanumeric(12).toUpperCase();
}

seed().catch(console.error);