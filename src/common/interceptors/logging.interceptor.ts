import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';
import { randomUUID } from 'crypto';

/**
 * Interceptor que:
 * 1. Genera un requestId único para correlación
 * 2. Loguea cada request entrante (método, ruta, user, body size)
 * 3. Loguea cada response (status, duración)
 * 4. Alerta requests lentos (>3s)
 * 5. Loguea errores no capturados con contexto completo
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  private static readonly SLOW_REQUEST_MS = 3000;
  private static readonly BODY_FIELDS_TO_REDACT = new Set([
    'password',
    'contrasena',
    'token',
    'refreshToken',
    'accessToken',
    'secret',
  ]);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const requestId = randomUUID().slice(0, 8);
    const startTime = Date.now();

    // Inyectar requestId en headers para correlación
    req['requestId'] = requestId;
    res.setHeader('X-Request-Id', requestId);

    const { method, originalUrl } = req;
    const user = req['user'] as JwtPayload | undefined;
    const userId = user?.sub ?? 'anon';
    const empresaId = user?.empresaId ?? '—';
    const bodySize = req.body ? JSON.stringify(req.body).length : 0;

    this.logger.log(
      `→ ${method} ${originalUrl} [${requestId}] user=${userId} empresa=${empresaId} body=${bodySize}b`,
    );

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const status = res.statusCode;
        const level =
          duration > LoggingInterceptor.SLOW_REQUEST_MS ? 'warn' : 'log';

        this.logger[level](
          `← ${method} ${originalUrl} ${status} [${requestId}] ${duration}ms` +
            (duration > LoggingInterceptor.SLOW_REQUEST_MS ? ' ⚠ SLOW' : ''),
        );
      }),
      catchError((err: unknown) => {
        const duration = Date.now() - startTime;
        const errMessage = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `✗ ${method} ${originalUrl} [${requestId}] ${duration}ms — ${errMessage}`,
        );
        // Agregar requestId al error para que el filter lo incluya en la respuesta
        if (err && typeof err === 'object') {
          (err as Record<string, unknown>)['requestId'] = requestId;
        }
        return throwError(() => err);
      }),
    );
  }

  /** Redactar campos sensibles del body para no loguear contraseñas */
  static redactBody(body: Record<string, unknown>): Record<string, unknown> {
    if (!body || typeof body !== 'object') return body;
    const redacted = { ...body };
    for (const key of Object.keys(redacted)) {
      if (LoggingInterceptor.BODY_FIELDS_TO_REDACT.has(key)) {
        redacted[key] = '[REDACTED]';
      }
    }
    return redacted;
  }
}
