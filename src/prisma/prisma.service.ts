import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

interface PrismaQueryEvent {
  duration: number;
  query: string;
}

interface PrismaLogEvent {
  message: string;
}

type PrismaWithEvents = PrismaClient & {
  $on(event: 'query', callback: (e: PrismaQueryEvent) => void): void;
  $on(event: 'error' | 'warn', callback: (e: PrismaLogEvent) => void): void;
};

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
      const prismaWithEvents = this as unknown as PrismaWithEvents;

      prismaWithEvents.$on('query', (e) => {
        const duration = Number(e.duration);
        if (duration > 1000) {
          this.logger.warn(
            `🐢 SLOW QUERY (${duration}ms): ${String(e.query).slice(0, 200)}`,
          );
        }
      });

      prismaWithEvents.$on('error', (e) => {
        this.logger.error(`DB ERROR: ${e.message}`);
      });

      prismaWithEvents.$on('warn', (e) => {
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
