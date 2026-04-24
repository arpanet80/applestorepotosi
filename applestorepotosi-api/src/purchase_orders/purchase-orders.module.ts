// src/purchase-orders/purchase-orders.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrder, PurchaseOrderSchema } from './schemas/purchase-order.schema';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { UsersModule } from '../users/users.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PurchaseOrder.name, schema: PurchaseOrderSchema },
    ]),
    SuppliersModule,  // exporta SuppliersService + MongooseModule (Supplier schema)
    UsersModule,      // exporta UsersService
    ProductsModule,   // ✅ FIX #2: necesitamos Product model para actualizar stock
  ],
  controllers: [PurchaseOrdersController],
  // ✅ FIX #7: SuppliersService y UsersService removidos de providers[]
  // ya los provee sus respectivos módulos — registrarlos aquí crea instancias duplicadas
  providers: [PurchaseOrdersService],
  exports: [PurchaseOrdersService, MongooseModule],
})
export class PurchaseOrdersModule {}