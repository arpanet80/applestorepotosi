// src/products/services/imagekit.service.ts
import { Injectable } from '@nestjs/common';
import ImageKit from 'imagekit';

@Injectable()
export class ImageKitService {
  private ik = new ImageKit({
    publicKey: 'public_nK7iuy3zHFXEr4kDvLeXWEtqBqo=',
    privateKey: 'private_Vn8XlvWP67hOji4PdcbVLTsG/hg=',
    urlEndpoint: 'https://ik.imagekit.io/arpanet80',
  });

  async uploadFile(file: Express.Multer.File): Promise<{ url: string; fileId: string }> {
    const result = await this.ik.upload({
      file: file.buffer,
      fileName: `${Date.now()}-${file.originalname}`,
      folder: '/products',
    });
    return { url: result.url, fileId: result.fileId };
  }
}