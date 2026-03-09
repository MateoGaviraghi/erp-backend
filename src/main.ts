import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL'),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('ERP System API')
    .setDescription('API REST del sistema ERP')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth')
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

  const port = configService.get<number>('PORT') ?? 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Backend corriendo en: http://0.0.0.0:${port}`);
  console.log(`� Swagger: http://localhost:${port}/api/docs`);
}
bootstrap();
