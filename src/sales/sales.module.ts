// src/sales/sales.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { Sale, SaleSchema } from './schemas/sale.schema';
import { SaleItem, SaleItemSchema } from './schemas/sale-item.schema';
import { ProductsModule } from '../products/products.module';
import { StockMovementsModule } from '../stock_movements/stock-movements.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sale.name, schema: SaleSchema },
      { name: SaleItem.name, schema: SaleItemSchema }
    ]),
    ProductsModule,
    StockMovementsModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService, MongooseModule],
})
export class SalesModule {}