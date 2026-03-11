import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { AlertingService } from './common/services/alerting.service';

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alerting: AlertingService,
  ) {}

  async getHealth() {
    let dbStatus = 'ok';
    let dbLatencyMs = 0;

    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - start;
    } catch {
      dbStatus = 'error';
    }

    const errorSummary = this.alerting.getErrorSummary();
    const totalErrors = Object.values(errorSummary).reduce((a, b) => a + b, 0);

    return {
      status: dbStatus === 'ok' && totalErrors < 50 ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version ?? '1.0.0',
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      errors: {
        total: totalErrors,
        ...(Object.keys(errorSummary).length > 0 && {
          breakdown: errorSummary,
        }),
      },
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    };
  }
}
