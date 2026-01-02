import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FirebaseModule } from './firebase/firebase.module';
import { CategoriesModule } from './categories/categories.module';
import { CategoryCharacteristicsModule } from './category-characteristics/category-characteristics.module';
import { BrandsModule } from './brands/brands.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { ProductsModule } from './products/products.module';
import { CustomersModule } from './customers/customers.module';
import { SalesModule } from './sales/sales.module';
import { PurchaseOrdersModule } from './purchase_orders/purchase-orders.module';
import { StockMovementsModule } from './stock_movements/stock-movements.module';
import { SettingsModule } from './settings/settings.module';
import { CashSessionsModule } from './cash-sessions/cash-sessions.module';
import { AuditLogsModule } from './audit_logs/audit-logs.module';
import { PosModule } from './pos/pos.module';
import { ServiceOrdersModule } from './service-orders/service-orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    FirebaseModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    CategoryCharacteristicsModule,
    BrandsModule,
    SuppliersModule,
    ProductsModule,
    CustomersModule,
    SalesModule,
    CashSessionsModule,
    AuditLogsModule,
    ServiceOrdersModule,

    PurchaseOrdersModule,
    StockMovementsModule,
    SettingsModule,
    PosModule,
  ],
})
export class AppModule {}


