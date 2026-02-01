import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  // Logger condicional para producción (menos verbose en Render)
  const isProduction = process.env.NODE_ENV === 'production';
  const app = await NestFactory.create(AppModule, {
    logger: isProduction ? ['error', 'warn', 'log'] : ['error', 'warn', 'log', 'debug', 'verbose'],
    bufferLogs: true, // Buffer logs hasta que Logger esté listo
  });

  const configService = app.get(ConfigService);

  // 🔒 Seguridad básica (Helmet)
  app.use(helmet({
    contentSecurityPolicy: false, // Deshabilitar si manejas CSP en frontend
    crossOriginEmbedderPolicy: false,
  }));

  // 📦 Compresión gzip (reduce data transfer - crucial para tier gratuito)
  app.use(compression({
    filter: () => true, // Comprimir todas las respuestas
    level: 6, // Balance entre CPU y compresión
  }));

  // 🌐 CORS Optimizado para Render
  const corsOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:4200', 'http://localhost:3000'];

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (mobile apps, postman, etc.)
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`Blocked CORS request from: ${origin}`);
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-CSRF-Token'
    ],
    credentials: true,
    maxAge: 86400, // Cache preflight requests por 24 horas
  });

  // ✅ Global Validation Pipe (tu config actual está perfecta)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    disableErrorMessages: isProduction, // Menos info de errores en prod (seguridad)
  }));

  // 🏥 HEALTH CHECK ENDPOINT (CRÍTICO para Render)
  // Render usa esto para saber si tu app está lista para recibir tráfico
  app.getHttpAdapter().get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // 🔍 Readiness check para MongoDB (opcional pero recomendado)
  app.getHttpAdapter().get('/ready', async (req, res) => {
    try {
      // Verificar conexión a MongoDB si es necesario
      // const isDbConnected = await checkDatabaseConnection();
      res.status(200).json({ 
        status: 'ready', 
        database: 'connected' // o estado real
      });
    } catch (error) {
      res.status(503).json({ 
        status: 'not ready', 
        database: 'disconnected' 
      });
    }
  });

  // Configurar timeouts para el tier gratuito de Render
  const port = process.env.PORT || 3000;
  const server = await app.listen(port, '0.0.0.0');
  // const server = await app.listen(process.env.PORT || 3000, '0.0.0.0');
  
  // ⏱️ Timeouts optimizados (Render mata conexiones inactivas después de cierto tiempo)
  server.timeout = 30000; // 30 segundos timeout general
  server.keepAliveTimeout = 7000; // Menor que el timeout de Render (10000ms por defecto)
  server.headersTimeout = 8000; // Debe ser mayor que keepAliveTimeout

  logger.log(`🚀 Backend corriendo en: ${await app.getUrl()}`);
  logger.log(`🌐 CORS habilitado para: ${corsOrigins.join(', ')}`);
  logger.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);

  // 🛑 GRACEFUL SHUTDOWN (Crítico para MongoDB en Render)
  // Render envía SIGTERM cuando hace deploy o apaga el servicio (sleep)
  const signals = ['SIGTERM', 'SIGINT'];
  
  signals.forEach((signal) => {
    process.on(signal, async () => {
      logger.log(`Recibida señal ${signal}. Cerrando servidor gracefully...`);
      
      try {
        // Cerrar conexiones de NestJS (incluye MongoDB)
        await app.close();
        logger.log('✅ Conexiones cerradas correctamente');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error durante shutdown:', error);
        process.exit(1);
      }
    });
  });
  
  console.log(`🚀 Backend running on: http://localhost:${port}`);
  
}

bootstrap().catch((error) => {
  console.error('Error fatal en bootstrap:', error);
  process.exit(1);
});