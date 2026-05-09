// src/products/images.controller.ts
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Param,
  BadRequestException,
  UseGuards,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProductImage, ProductImageDocument } from './schemas/product-image.schema';
import { ImageKitService } from './imagekit.service';
import { MulterFile } from './multer.types';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { IsOptional, IsNumber, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

// FIX: DTO con decoradores de class-validator para pasar el whitelist del ValidationPipe
class UploadImageBodyDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  altText?: string;
}

@Controller('products/:id/upload')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class ImagesController {
  constructor(
    private readonly imageKitService: ImageKitService,
    @InjectModel(ProductImage.name)
    private productImageModel: Model<ProductImageDocument>,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SALES)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: parseInt(process.env['UPLOAD_MAX_SIZE'] || '5242880', 10),
      },
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Solo se permiten imágenes (jpeg, png, webp, gif)',
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadProductImage(
    @UploadedFile() file: MulterFile,
    @Param('id') productId: string,
    @Body() body: UploadImageBodyDto,
  ) {
    if (!file) throw new BadRequestException('No se adjuntó ningún archivo');

    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('ID de producto inválido');
    }

    const { url, fileId } = await this.imageKitService.uploadFile(file);

    const sortOrder =
      body.sortOrder !== undefined ? Number(body.sortOrder) : 0;

    const image = await this.productImageModel.create({
      productId: new Types.ObjectId(productId),
      url,
      fileId,
      isPrimary: false,
      sortOrder: isNaN(sortOrder) ? 0 : Math.max(0, sortOrder),
      altText: body.altText || undefined,
    });

    return image;
  }
}