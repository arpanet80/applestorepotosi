// src/products/imagekit.service.ts
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ImageKit from 'imagekit';
import { MulterFile } from './multer.types';

// Re-exportar para que otros archivos puedan importar desde aquí si lo prefieren
export { MulterFile };

export interface UploadResult {
  url: string;
  fileId: string;
}

@Injectable()
export class ImageKitService {
  private readonly logger = new Logger(ImageKitService.name);
  private readonly ik: ImageKit;

  constructor(private readonly configService: ConfigService) {
    this.ik = new ImageKit({
      publicKey:   this.configService.getOrThrow<string>('IMAGEKIT_PUBLIC_KEY'),
      privateKey:  this.configService.getOrThrow<string>('IMAGEKIT_PRIVATE_KEY'),
      urlEndpoint: this.configService.getOrThrow<string>('IMAGEKIT_URL_ENDPOINT'),
    });
  }

  async uploadFile(
    file: MulterFile,
    folder = '/products',
  ): Promise<UploadResult> {
    try {
      const result = await this.ik.upload({
        file: file.buffer,
        fileName: `${Date.now()}-${file.originalname}`,
        folder,
      });
      this.logger.log(`Archivo subido exitosamente: ${result.fileId}`);
      return { url: result.url, fileId: result.fileId };
    } catch (err) {
      this.logger.error(
        `Error al subir imagen a ImageKit: ${(err as Error).message}`,
        (err as Error).stack,
      );
      throw new InternalServerErrorException(
        `Error al subir la imagen a ImageKit: ${(err as Error).message}`,
      );
    }
  }

  async deleteFile(fileId: string): Promise<boolean> {
    if (!fileId) {
      this.logger.warn('deleteFile llamado sin fileId');
      return false;
    }
    try {
      await this.ik.deleteFile(fileId);
      this.logger.log(`Archivo eliminado de ImageKit: ${fileId}`);
      return true;
    } catch (err) {
      // ImageKit lanza 404 si el archivo ya no existe; no es un error crítico
      const errorMessage = (err as Error).message || '';
      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        this.logger.warn(`Archivo ${fileId} no encontrado en ImageKit (ya eliminado)`);
        return true; // Consideramos éxito si ya no existe
      }
      this.logger.error(
        `ImageKit deleteFile falló para fileId ${fileId}: ${errorMessage}`,
        (err as Error).stack,
      );
      return false;
    }
  }

  /**
   * Elimina múltiples archivos de ImageKit en paralelo.
   * Retorna un mapa de fileId → éxito/fracaso.
   */
  async deleteFiles(fileIds: string[]): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    await Promise.all(
      fileIds.map(async (fileId) => {
        const success = await this.deleteFile(fileId);
        results.set(fileId, success);
      }),
    );
    return results;
  }
}