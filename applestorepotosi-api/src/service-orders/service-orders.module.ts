// src/service-orders/service-orders.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServiceOrdersController } from './service-orders.controller';
import { ServiceOrdersService } from './service-orders.service';
import { ServiceOrder, ServiceOrderSchema } from './schemas/service-order.schema';
import { ServiceItem, ServiceItemSchema } from './schemas/service-item.schema';
import { CustomerDevice, CustomerDeviceSchema } from './schemas/customer-device.schema';

// Importa los módulos que exportan los servicios que necesitas
import { CustomersModule } from '../customers/customers.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServiceOrder.name, schema: ServiceOrderSchema },
      { name: ServiceItem.name, schema: ServiceItemSchema },
      { name: CustomerDevice.name, schema: CustomerDeviceSchema },
    ]),
    CustomersModule, // proporciona CustomersService
    UsersModule,     // proporciona UsersService
  ],
  controllers: [ServiceOrdersController],
  providers: [ServiceOrdersService],
  exports: [ServiceOrdersService],
})
export class ServiceOrdersModule {}