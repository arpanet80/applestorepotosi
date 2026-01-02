import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🔧 CONFIGURAR CORS - Esto permite requests desde tu frontend
  app.enableCors({
    origin: [
      'http://localhost:4200',  // Angular dev server
      'http://localhost:3000',  // NestJS mismo (por si acaso)
      'http://127.0.0.1:4200',
      'http://localhost:8080'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    credentials: true,
  });
    
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true, // ← también
    },
  }));

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Backend running on: http://localhost:${port}`);
  console.log(`🌐 CORS enabled for: http://localhost:4200`);
}
bootstrap();
