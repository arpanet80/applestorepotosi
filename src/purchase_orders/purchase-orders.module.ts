// src/purchase-orders/purchase-orders.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrder, PurchaseOrderSchema } from './schemas/purchase-order.schema';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { SuppliersService } from '../suppliers/suppliers.service';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PurchaseOrder.name, schema: PurchaseOrderSchema }]),
    SuppliersModule,UsersModule
  ],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService, SuppliersService, UsersService],
  exports: [PurchaseOrdersService, MongooseModule],
})
export class PurchaseOrdersModule {}