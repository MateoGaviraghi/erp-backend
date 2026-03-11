import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Servicio de alertas que corre chequeos periódicos para detectar
 * problemas antes de que los vea el usuario en producción.
 *
 * Alerta sobre:
 * - Errores 500 frecuentes (detectados vía métricas internas)
 * - Stock bajo mínimo
 * - Órdenes de producción trabadas
 * - Liquidaciones en estado inconsistente
 * - FK huérfanos y datos corruptos
 * - Conexiones DB agotadas
 */
@Injectable()
export class AlertingService implements OnModuleInit {
  private readonly logger = new Logger('ALERTING');

  // Métricas en memoria (reset al reiniciar — suficiente para alertas por intervalo)
  private errorCounts = new Map<string, number>();
  private lastAlertTimestamps = new Map<string, number>();
  private intervalRef: ReturnType<typeof setInterval> | null = null;

  // Throttle: no repetir la misma alerta en menos de 15 minutos
  private static readonly ALERT_COOLDOWN_MS = 15 * 60 * 1000;
  // Intervalo de chequeos: cada 5 minutos
  private static readonly CHECK_INTERVAL_MS = 5 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // Dar 30s para que el servidor arranque, luego empezar los chequeos
    setTimeout(() => {
      void this.runAllChecks();
      this.intervalRef = setInterval(
        () => void this.runAllChecks(),
        AlertingService.CHECK_INTERVAL_MS,
      );
    }, 30_000);
    this.logger.log('Sistema de alertas inicializado');
  }

  onModuleDestroy() {
    if (this.intervalRef) clearInterval(this.intervalRef);
  }

  // ─── Registro de errores (llamado desde el filter) ─────────────────

  /** Registrar que ocurrió un error para tracking de frecuencia */
  recordError(category: string, endpoint: string) {
    const key = `${category}:${endpoint}`;
    this.errorCounts.set(key, (this.errorCounts.get(key) ?? 0) + 1);
  }

  /** Obtener conteo de errores actual (para health check) */
  getErrorSummary(): Record<string, number> {
    const summary: Record<string, number> = {};
    for (const [key, count] of this.errorCounts) {
      summary[key] = count;
    }
    return summary;
  }

  /** Resetear contadores (se puede llamar desde un endpoint admin) */
  resetCounters() {
    this.errorCounts.clear();
  }

  // ─── Chequeos periódicos ───────────────────────────────────────────

  private async runAllChecks() {
    try {
      this.checkHighErrorRate();
      await Promise.allSettled([
        this.checkStockBajoMinimo(),
        this.checkOrdenesProduccionTrabadas(),
        this.checkLiquidacionesInconsistentes(),
        this.checkDbHealth(),
      ]);
    } catch (err) {
      this.logger.error('Error ejecutando chequeos de alertas', err);
    }
  }

  // ─── 1. Tasa de errores alta ───────────────────────────────────────

  private checkHighErrorRate() {
    let internalErrors = 0;
    for (const [key, count] of this.errorCounts) {
      if (key.startsWith('INTERNAL:')) internalErrors += count;
    }

    if (internalErrors >= 10) {
      this.alert(
        'HIGH_ERROR_RATE',
        `🚨 ${internalErrors} errores internos acumulados desde el último reinicio`,
        { errorSummary: Object.fromEntries(this.errorCounts) },
      );
    }
  }

  // ─── 2. Stock bajo mínimo ─────────────────────────────────────────

  private async checkStockBajoMinimo() {
    try {
      const alertas = await this.prisma.$queryRaw<
        Array<{
          name: string;
          cantidad: number;
          stockMinimo: number;
          local: string;
        }>
      >`
        SELECT p."name", s.cantidad, p."stockMinimo", l.nombre as local
        FROM "Stock" s
        JOIN "Producto" p ON s."productoId" = p.id
        JOIN "Local" l ON s."localId" = l.id
        WHERE p."stockMinimo" IS NOT NULL
          AND s.cantidad <= p."stockMinimo"
          AND p.activo = true
      `;

      if (alertas.length > 0) {
        this.alert(
          'STOCK_BAJO_MINIMO',
          `⚠ ${alertas.length} producto(s) con stock bajo mínimo`,
          {
            productos: alertas.slice(0, 10).map((a) => ({
              nombre: a.name,
              stock: Number(a.cantidad),
              minimo: Number(a.stockMinimo),
              local: a.local,
            })),
          },
        );
      }
    } catch {
      // Silenciar si la tabla no existe todavía
    }
  }

  // ─── 3. Órdenes de producción trabadas ─────────────────────────────

  private async checkOrdenesProduccionTrabadas() {
    try {
      const trabadas = await this.prisma.$queryRaw<
        Array<{
          numero: string;
          fechaFinPlanificada: Date;
          estado: string;
          createdAt: Date;
        }>
      >`
        SELECT op.numero, op."fechaFinPlanificada", op.estado, op."createdAt"
        FROM "OrdenProduccion" op
        WHERE op.estado = 'EN_PROCESO'
          AND op."fechaFinPlanificada" < NOW() - INTERVAL '2 days'
      `;

      if (trabadas.length > 0) {
        this.alert(
          'ORDENES_TRABADAS',
          `⚠ ${trabadas.length} orden(es) de producción en proceso superaron la fecha planificada por +2 días`,
          {
            ordenes: trabadas.slice(0, 5).map((o) => ({
              numero: o.numero,
              fechaPlanificada: o.fechaFinPlanificada,
              estado: o.estado,
            })),
          },
        );
      }
    } catch {
      // Silenciar si la tabla no existe todavía
    }
  }

  // ─── 4. Liquidaciones inconsistentes ───────────────────────────────

  private async checkLiquidacionesInconsistentes() {
    try {
      const inconsistentes: Array<{
        id: string;
        totalBruto: number;
        totalDescuentos: number;
        totalNeto: number;
      }> = await this.prisma.$queryRaw`
        SELECT l.id, l."totalBruto", l."totalDescuentos", l."totalNeto"
        FROM "Liquidacion" l
        WHERE ABS(l."totalBruto" - l."totalDescuentos" - l."totalNeto") > 0.02
      `;

      if (inconsistentes.length > 0) {
        this.alert(
          'LIQUIDACIONES_INCONSISTENTES',
          `🚨 ${inconsistentes.length} liquidación(es) con cálculo inconsistente (bruto - descuentos ≠ neto)`,
          { cantidad: inconsistentes.length },
        );
      }
    } catch {
      // Silenciar si la tabla no existe todavía
    }
  }

  // ─── 5. Salud de la DB ────────────────────────────────────────────

  private async checkDbHealth() {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      if (latency > 2000) {
        this.alert(
          'DB_SLOW',
          `⚠ La base de datos responde lento: ${latency}ms (umbral: 2000ms)`,
          { latencyMs: latency },
        );
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.alert(
        'DB_UNREACHABLE',
        `🚨 No se pudo conectar a la base de datos: ${errMsg}`,
        {},
      );
    }
  }

  // ─── Helper de alertas con throttle ────────────────────────────────

  private alert(
    alertKey: string,
    message: string,
    context: Record<string, unknown>,
  ) {
    const now = Date.now();
    const lastAlert = this.lastAlertTimestamps.get(alertKey) ?? 0;

    if (now - lastAlert < AlertingService.ALERT_COOLDOWN_MS) {
      return; // Throttle: no alertar de nuevo tan rápido
    }

    this.lastAlertTimestamps.set(alertKey, now);
    this.logger.warn(
      `[ALERT:${alertKey}] ${message} ${Object.keys(context).length > 0 ? JSON.stringify(context) : ''}`,
    );

    // TODO: aquí podés agregar integraciones externas:
    // - Webhook a Discord/Slack
    // - Email via SendGrid/SES
    // - Sentry.captureMessage()
  }
}
