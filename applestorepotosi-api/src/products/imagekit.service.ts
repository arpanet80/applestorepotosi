// src/products/services/imagekit.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ImageKit from 'imagekit';

@Injectable()
export class ImageKitService {
  private ik: ImageKit;

  constructor(private configService: ConfigService) {
    this.ik = new ImageKit({
      publicKey: this.configService.getOrThrow<string>('IMAGEKIT_PUBLIC_KEY'),
      privateKey: this.configService.getOrThrow<string>('IMAGEKIT_PRIVATE_KEY'),
      urlEndpoint: this.configService.getOrThrow<string>('IMAGEKIT_URL_ENDPOINT'),
    });
  }
  
  // private ik = new ImageKit({
  //   publicKey: 'public_nK7iuy3zHFXEr4kDvLeXWEtqBqo=',
  //   privateKey: 'private_Vn8XlvWP67hOji4PdcbVLTsG/hg=',
  //   urlEndpoint: 'https://ik.imagekit.io/arpanet80',
  // });

  async uploadFile(file: Express.Multer.File): Promise<{ url: string; fileId: string }> {
    const result = await this.ik.upload({
      file: file.buffer,
      fileName: `${Date.now()}-${file.originalname}`,
      folder: '/products',
    });
    return { url: result.url, fileId: result.fileId };
  }
}