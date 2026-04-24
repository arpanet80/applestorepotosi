// src/category-characteristics/category-characteristics.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryCharacteristicsService } from './category-characteristics.service';
import { CategoryCharacteristicsController } from './category-characteristics.controller';
import { 
  CategoryCharacteristic, 
  CategoryCharacteristicSchema 
} from './schemas/category-characteristic.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CategoryCharacteristic.name, schema: CategoryCharacteristicSchema }
    ])
  ],
  controllers: [CategoryCharacteristicsController],
  providers: [CategoryCharacteristicsService],
  exports: [CategoryCharacteristicsService, MongooseModule],
})
export class CategoryCharacteristicsModule {}