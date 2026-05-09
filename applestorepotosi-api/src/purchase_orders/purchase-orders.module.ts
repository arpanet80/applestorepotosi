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
    SuppliersModule,  // exporta SuppliersService + modelo Supplier
    UsersModule,      // exporta UsersService
    ProductsModule,   // exporta modelo Product (necesario para actualizar stock)
    // MongooseModule.forFeature de los módulos anteriores ya registra
    // los modelos Supplier y Product en el contexto — no es necesario re-registrarlos.
    // La Connection de Mongoose (usada para transacciones y la colección counters)
    // la provee MongooseModule.forRoot() en el módulo raíz; @InjectConnection() la obtiene
    // automáticamente sin necesidad de importar nada extra aquí.
  ],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
  exports: [PurchaseOrdersService, MongooseModule],
})
export class PurchaseOrdersModule {}