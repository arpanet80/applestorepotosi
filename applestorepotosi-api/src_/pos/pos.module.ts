// src/pos/pos.module.ts
import { Module } from '@nestjs/common';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { CashSessionsModule } from '../cash-sessions/cash-sessions.module';
import { SalesModule } from '../sales/sales.module';
import { StockMovementsModule } from '../stock_movements/stock-movements.module';
import { CustomersModule } from '../customers/customers.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [CashSessionsModule, SalesModule, StockMovementsModule, CustomersModule, ProductsModule ],
  controllers: [PosController],
  providers: [PosService],
  exports: [PosService],
})
export class PosModule {}