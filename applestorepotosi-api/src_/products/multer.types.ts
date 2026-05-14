// src/products/multer.types.ts
/**
 * Subconjunto de Express.Multer.File necesario en este módulo.
 * Se define como clase (no interface) para que emitDecoratorMetadata
 * pueda emitir metadata de tipo en parámetros decorados con @UploadedFile()
 * cuando isolatedModules está activo.
 */
export class MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}