import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';

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
    // AuthModule,       ← Fase 4
    // UsuariosModule,   ← Fase 5
    // EmpresasModule,   ← Fase 5
    // LocalesModule,    ← Fase 5
    // InventarioModule, ← Fase 6
    // VentasModule,     ← Fase 7
    // ComprasModule,    ← Fase 8
    // FinanzasModule,   ← Fase 9
    // RrhhModule,       ← Fase 10
    // ProduccionModule, ← Fase 11
    // ReportesModule,   ← Fase 12
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
