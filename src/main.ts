import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const isProduction = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create(AppModule, {
    logger: isProduction
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');
  app.use(helmet());

  const corsOrigins = (
    configService.get<string>('CORS_ORIGINS') ?? 'http://localhost:3000'
  ).split(',');
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('ERP System API')
      .setDescription('API REST del sistema ERP')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'JWT-auth',
      )
      .addTag('health', 'Estado del servidor')
      .addTag('auth', 'Autenticación')
      .addTag('usuarios', 'Gestión de usuarios')
      .addTag('empresas', 'Gestión de empresas')
      .addTag('locales', 'Gestión de sucursales')
      .addTag('clientes', 'Gestión de clientes')
      .addTag('proveedores', 'Gestión de proveedores')
      .addTag('productos', 'Gestión de productos')
      .addTag('inventario', 'Control de stock')
      .addTag('ventas', 'Módulo de ventas')
      .addTag('compras', 'Módulo de compras')
      .addTag('finanzas', 'Módulo de finanzas')
      .addTag('rrhh', 'Recursos humanos')
      .addTag('produccion', 'Módulo de producción')
      .addTag('reportes', 'Reportes y exportaciones')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    logger.log('Swagger disponible en /api/docs');
  }

  const port = configService.get<number>('PORT') ?? 3001;
  await app.listen(port, '0.0.0.0');
  logger.log(`Servidor corriendo en puerto ${port} [${process.env.NODE_ENV}]`);
}
void bootstrap();
