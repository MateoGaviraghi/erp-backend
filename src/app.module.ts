import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';
import { EmpresasModule } from './empresas/empresas.module.js';
import { LocalesModule } from './locales/locales.module.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsuariosModule,
    EmpresasModule,
    LocalesModule,
    // InventarioModule, ← Fase 6
    // VentasModule,     ← Fase 7
    // ComprasModule,    ← Fase 8
    // FinanzasModule,   ← Fase 9
    // RrhhModule,       ← Fase 10
    // ProduccionModule, ← Fase 11
    // ReportesModule,   ← Fase 12
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // autenticación global — use @Public() para endpoints públicos
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // roles global
    },
  ],
})
export class AppModule {}
