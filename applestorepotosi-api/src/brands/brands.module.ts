// src/brands/brands.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';
import { Brand, BrandSchema } from './schemas/brand.schema';
import { ProductsService } from 'src/products/products.service';
import { ProductsModule } from 'src/products/products.module';
import { Product, ProductSchema } from 'src/products/schemas/product.schema';
import { ImageKitService } from 'src/products/imagekit.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Brand.name, schema: BrandSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
    ProductsModule,
  ],
  controllers: [BrandsController],
  providers: [BrandsService, ProductsService, ImageKitService],
  exports: [BrandsService, MongooseModule],
})
export class BrandsModule {}