// src/products/images.controller.ts
import { Controller, Post, UseInterceptors, UploadedFile, Param, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductImage, ProductImageDocument } from './schemas/product-image.schema';
import { ImageKitService } from './imagekit.service';

@Controller('products/:id/images')
export class ImagesController {
  constructor(
    private readonly imageKitService: ImageKitService,
    @InjectModel(ProductImage.name) private productImageModel: Model<ProductImageDocument>,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadProductImage(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') productId: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');

    const { url } = await this.imageKitService.uploadFile(file);

    // Guarda en MongoDB
    const image = await this.productImageModel.create({
      productId,
      url,
      isPrimary: false,
      sortOrder: 0,
    });

    return image;
  }
}