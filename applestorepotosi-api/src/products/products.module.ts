// src/products/products.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product, ProductSchema } from './schemas/product.schema';
import { ProductImage, ProductImageSchema } from './schemas/product-image.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ImagesController } from './images.controller';
import { ImageKitService } from './imagekit.service';
import { StockMovementsModule } from '../stock_movements/stock-movements.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: ProductImage.name, schema: ProductImageSchema },
      { name: User.name, schema: UserSchema },
    ]),
    // ✅ FIX #5: StockMovementsModule ya exporta StockMovementsService.
    // Registrarlo además en providers[] causaba una instancia duplicada con
    // su propio árbol de dependencias sin resolver → errores en runtime.
    forwardRef(() => StockMovementsModule),
  ],
  controllers: [ProductsController, ImagesController],
  providers: [ProductsService, ImageKitService],  // ← StockMovementsService removido
  exports: [ProductsService, MongooseModule],
})
export class ProductsModule {}