/* eslint-disable @typescript-eslint/no-explicit-any */
require('dotenv/config');
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { faker } from '@faker-js/faker';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import dayjs from 'dayjs';

/* ---------  TIPOS DE MONGOOSE  --------- */
import { UserDocument } from '../users/schemas/user.schema';
import { BrandDocument } from '../brands/schemas/brand.schema';
import { CategoryDocument } from '../categories/schemas/category.schema';
import { SupplierDocument } from '../suppliers/schemas/supplier.schema';
import { ProductDocument } from '../products/schemas/product.schema';
import { CustomerDocument } from '../customers/schemas/customer.schema';
import { UserRole } from '../users/schemas/user.schema';
import { PaymentMethod, PaymentStatus, SaleStatus } from '../sales/schemas/sale.schema';
import { PurchaseOrderDocument } from '../purchase_orders/schemas/purchase-order.schema';
import {AUDIT_ACTIONS,AUDIT_COLLECTIONS,} from '../audit_logs/schemas/audit-log.schema';

/////////////////////////////////////////////////////////////////////////////////////////
/////// Genera los registros de prueba de la DB                                        //
/////// EJECUTAR:                                                                      //
/////// npx ts-node -r tsconfig-paths/register src/scripts/seed.test-records.ts        //
/////////////////////////////////////////////////////////////////////////////////////////

/* ---------  HELPERS  --------- */

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pickId = <T extends { _id: Types.ObjectId }>(arr: T[]): Types.ObjectId =>
  arr[Math.floor(Math.random() * arr.length)]._id;

/* ---------  SEED  --------- */
async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  /* Modelos */
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

  console.log('🧹 Limpiando colecciones...');
  await Promise.all([
    userModel.deleteMany({}),
    brandModel.deleteMany({}),
    categoryModel.deleteMany({}),
    supplierModel.deleteMany({}),
    productModel.deleteMany({}),
    poModel.deleteMany({}),
    stockModel.deleteMany({}),
    customerModel.deleteMany({}),
    saleModel.deleteMany({}),
    saleItemModel.deleteMany({}),
    cashModel.deleteMany({}),
    settingModel.deleteMany({}),
    auditModel.deleteMany({}),
  ]);

  console.log('📝 Insertando 15 registros por colección...');

  /* 1. USUARIOS */
  const users = (await userModel.insertMany(
    Array.from({ length: 15 }, () => ({
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
      specialization: [faker.commerce.department()],
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

  /* 2. MARCAS */
  const brands = (await brandModel.insertMany(
    Array.from({ length: 15 }, () => ({
      name: faker.company.name(),
      description: faker.commerce.productDescription(),
      logoUrl: faker.image.url(),
      website: faker.internet.url(),
      country: faker.location.country(),
      supportUrl: faker.internet.url(),
      warrantyInfo: faker.lorem.sentence(),
      isActive: true,
    })),
  )) as BrandDocument[];

  /* 3. CATEGORÍAS */
  const cats: CategoryDocument[] = [];
  for (let i = 0; i < 15; i++) {
    const parent = i < 5 ? null : pickId(cats);
    const doc = await categoryModel.create({
      name: faker.commerce.department(),
      slug: faker.lorem.slug(),
      parentId: parent,
      imageUrl: faker.image.url(),
      isActive: true,
      updatedBy: pickId(users),
    });
    cats.push(doc);
  }

  /* 4. PROVEEDORES */
  const suppliers = (await supplierModel.insertMany(
    Array.from({ length: 15 }, () => ({
      name: faker.company.name(),
      representative: faker.person.fullName(),
      contactEmail: faker.internet.email(),
      contactPhone: faker.phone.number(),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country(),
      },
      taxId: faker.string.alphanumeric(13),
      rfc: faker.string.alphanumeric(13),
      paymentTerms: faker.lorem.sentence(),
      bankInfo: {
        accountNumber: faker.finance.accountNumber(),
        bankName: faker.company.name(),
      },
      isActive: true,
    })),
  )) as SupplierDocument[];

  /* 5. PRODUCTOS */
  const products = (await productModel.insertMany(
    Array.from({ length: 15 }, () => ({
      sku: faker.string.alphanumeric(8),
      barcode: faker.string.alphanumeric(10),
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      categoryId: pickId(cats),
      brandId: pickId(brands),
      supplierId: pickId(suppliers),
      createdBy: pickId(users),
      specifications: {},
      costPrice: faker.number.int({ min: 100, max: 500 }),
      salePrice: faker.number.int({ min: 600, max: 1200 }),
      warrantyMonths: faker.number.int({ min: 0, max: 24 }),
      stockQuantity: faker.number.int({ min: 5, max: 50 }),
      minStock: faker.number.int({ min: 2, max: 10 }),
      maxStock: faker.number.int({ min: 50, max: 100 }),
      reservedQuantity: 0,
      location: faker.location.buildingNumber(),
      isActive: true,
      isFeatured: pick([true, false]),
    })),
  )) as ProductDocument[];

  /* 6. ÓRDENES DE COMPRA */
  const purchaseOrders = (await poModel.insertMany(
    Array.from({ length: 15 }, (_, i) => {
      const items = Array.from({ length: pick([1, 2, 3]) }, () => {
        const p = pick(products);
        const q = faker.number.int({ min: 2, max: 20 });
        return {
          productId: p._id,
          quantity: q,
          unitCost: p.costPrice,
          subtotal: 0,
        };
      });

      const seq = i + 1;
      const orderNumber = `OC-${String(seq).padStart(6, '0')}`;

      return {
        orderNumber, // ✅ campo nuevo y obligatorio
        supplierId: pickId(suppliers),
        orderDate: faker.date.past(),
        status: pick(['pending', 'approved', 'rejected', 'completed', 'cancelled']),
        items,
        totalAmount: 0, // se calcula en pre-save
        userId: pickId(users),
        notes: faker.lorem.sentence(),
        createdBy: pickId(users),
        isDeleted: false,
      };
    }),
  )) as PurchaseOrderDocument[];

  /* 7. STOCK MOVEMENTS */
  await stockModel.insertMany(
    Array.from({ length: 15 }, () => {
      const p = pick(products);
      const qty = faker.number.int({ min: 1, max: 10 });
      const prev = p.stockQuantity;
      return {
        productId: p._id,
        type: pick(['in', 'out', 'adjustment']) as 'in' | 'out' | 'adjustment',
        quantity: qty,
        reason: pick(['sale', 'purchase', 'manual', 'return', 'damaged', 'expired']),
        reference: new Types.ObjectId(),
        referenceModel: pick(['Sale', 'PurchaseOrder', 'StockAdjustment']),
        previousStock: prev,
        newStock: prev + qty,
        userId: pickId(users),
        notes: faker.lorem.sentence(),
        reservedAtMovement: 0,
        unitCostAtMovement: p.costPrice,
        timestamp: faker.date.past(),
      }; // ← sin 'as StockMovementDocument'
    }),
  );

  /* 8. CLIENTES */
  const customers = (await customerModel.insertMany(
    Array.from({ length: 15 }, (_, i) => ({   // ← añade "{ length: 15 }"
      userId: i < users.length ? users[i]._id : null,
      fullName: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      taxId: faker.string.alphanumeric(13),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country(),
      },
      loyaltyPoints: faker.number.int({ min: 0, max: 500 }),
      isActive: true,
      isDeleted: false,
      updatedBy: pickId(users),
    })),
  )) as CustomerDocument[];

  /* 9. VENTAS + ITEMS */
  for (let i = 0; i < 15; i++) {
    const items = Array.from({ length: pick([1, 2, 3]) }, () => {
      const p = pick(products);
      const q = faker.number.int({ min: 1, max: 5 });
      return {
        productId: p._id,
        quantity: q,
        unitPrice: p.salePrice,
        unitCost: p.costPrice,
        discount: 0,
        subtotal: q * p.salePrice,
      };
    });
    const sub = items.reduce((a, b) => a + b.subtotal, 0);
    const sale = await saleModel.create({
      saleNumber: `SL-${String(i + 1).padStart(6, '0')}`,
      customerId: pickId(customers),
      salesPersonId: pickId(users),
      saleDate: faker.date.past(),
      payment: {
        method: pick(Object.values(PaymentMethod)),
        status: pick(Object.values(PaymentStatus)),
        reference: faker.string.uuid(),
      },
      totals: {
        subtotal: sub,
        taxAmount: sub * 0.16,
        discountAmount: 0,
        totalAmount: sub * 1.16,
      },
      status: pick(Object.values(SaleStatus)),
      isReturn: false,
      notes: faker.lorem.sentence(),
    });
    await saleItemModel.insertMany(
      items.map((it) => ({ ...it, saleId: sale._id })),
    );
  }

  /* 10. CAJA */
  await cashModel.insertMany(
    Array.from({ length: 15 }, (_, i) => {
      const open = faker.number.int({ min: 500, max: 2000 });
      const sales = faker.number.int({ min: 1000, max: 15000 });
      const sessionId = `SEED-${dayjs().format('YYYYMMDDHHmmss')}-${i + 1}`;

      return {
        sessionId,
        openedBy: pickId(users),
        closedBy: pickId(users),
        openedAt: faker.date.past(),
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
      };
    }),
  );

/* ---------  INTERFAZ PLANA (opcional)  --------- */
interface CashSessionDto {
  sessionId: string;
  openedBy: Types.ObjectId;
  closedBy: Types.ObjectId;
  openedAt: Date;
  closedAt: Date;
  isClosed: boolean;
  closeType: 'X' | 'Z';
  openingBalance: number;
  cashSales: number;
  cashRefunds: number;
  cashInOut: number;
  expectedCash: number;
  actualCash?: number;
  medios: {
    efectivo: number;
    tarjeta: number;
    transfer: number;
    deposito: number;
  };
  sales: Types.ObjectId[];
  notes?: string;
}


  /* 11. SETTINGS */
  await settingModel.insertMany(
    Array.from({ length: 15 }, () => ({
      key: faker.lorem.word() + '-' + faker.string.uuid(),
      value: faker.lorem.word(),
      category: pick(['general', 'inventory', 'sales', 'system', 'notifications', 'security', 'appearance']),
      description: faker.lorem.sentence(),
      type: pick(['string', 'number', 'boolean', 'object', 'array']),
      defaultValue: null,
      options: null,
      isEditable: true,
      isPublic: pick([true, false]),
      version: 0,
    })),
  );

  /* 12. AUDITORÍA */
  await auditModel.insertMany(
    Array.from({ length: 15 }, () => ({
      userId: pickId(users),
      collectionName: pick(AUDIT_COLLECTIONS), // ✅ array de strings
      documentId: new Types.ObjectId(),
      action: pick(AUDIT_ACTIONS),         // ✅ array de strings
      before: {},
      after: {},
      notes: faker.lorem.sentence(),
      ipAddress: faker.internet.ip(),
      userAgent: faker.internet.userAgent(),
      timestamp: new Date(),
      isSensitive: false,
      severity: pick(['low', 'medium', 'high']),
    })),
  );

  console.log('✅ 15 registros por colección creados');
  await app.close();
}

seed().catch(console.error);