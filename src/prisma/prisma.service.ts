import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    super({
      adapter,
      log: isProduction
        ? [
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'query' },
          ]
        : [
            { emit: 'stdout', level: 'error' },
            { emit: 'stdout', level: 'warn' },
          ],
    });
  }

  async onModuleInit() {
    // Loguear queries lentas (>1s) en producción
    if (process.env.NODE_ENV === 'production') {
      (this as any).$on('query', (e: any) => {
        const duration = Number(e.duration);
        if (duration > 1000) {
          this.logger.warn(
            `🐢 SLOW QUERY (${duration}ms): ${String(e.query).slice(0, 200)}`,
          );
        }
      });

      (this as any).$on('error', (e: any) => {
        this.logger.error(`DB ERROR: ${e.message}`);
      });

      (this as any).$on('warn', (e: any) => {
        this.logger.warn(`DB WARN: ${e.message}`);
      });
    }

    await this.$connect();
    this.logger.log('✅ Conectado a la base de datos Neon');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🔌 Desconectado de la base de datos');
  }
}
