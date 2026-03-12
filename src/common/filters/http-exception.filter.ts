import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

/**
 * Categorías de error para diagnóstico:
 * - VALIDATION    → datos del cliente mal formateados (tipeo del front o usuario)
 * - AUTH          → token inválido/expirado, sin permisos
 * - BUSINESS      → regla de negocio violada (ej: stock insuficiente, estado inválido)
 * - DB_CONSTRAINT → unique, FK o check constraint violado en la DB
 * - NOT_FOUND     → recurso inexistente (posible ID erróneo del front)
 * - RATE_LIMIT    → exceso de requests
 * - INTERNAL      → error inesperado que requiere atención inmediata
 */
type ErrorCategory =
  | 'VALIDATION'
  | 'AUTH'
  | 'BUSINESS'
  | 'DB_CONSTRAINT'
  | 'NOT_FOUND'
  | 'RATE_LIMIT'
  | 'INTERNAL';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId: string =
      (request as Request & { requestId?: string })['requestId'] ??
      (response.getHeader('X-Request-Id') as string | undefined) ??
      '—';

    // ─── Prisma errors ───────────────────────────────────────────────
    const prismaResult = this.handlePrismaError(exception);
    if (prismaResult) {
      this.logError(
        prismaResult.category,
        prismaResult.statusCode,
        request,
        requestId,
        {
          prismaCode: prismaResult.prismaCode,
          target: prismaResult.target,
          message: prismaResult.message,
        } as Record<string, unknown>,
      );

      if (response.headersSent) return;
      return response.status(prismaResult.statusCode).json({
        success: false,
        error: {
          code: this.getErrorCode(prismaResult.statusCode),
          message: prismaResult.message,
          ...(prismaResult.field && { field: prismaResult.field }),
        },
        statusCode: prismaResult.statusCode,
        requestId,
        path: request.url,
        timestamp: new Date().toISOString(),
      });
    }

    // ─── HTTP exceptions (NestJS + nuestros throws) ──────────────────
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    let details: Array<{ message: string }> = [];

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        const respMessage = resp['message'];
        message =
          typeof respMessage === 'string' ? respMessage : exception.message;
        if (Array.isArray(respMessage)) {
          details = (respMessage as string[]).map((msg) => ({ message: msg }));
          message = 'Error de validación';
        }
      } else {
        message = String(exceptionResponse);
      }

      const category = this.categorizeHttpStatus(statusCode);
      this.logError(category, statusCode, request, String(requestId), {
        message,
        details: details.length > 0 ? details : undefined,
      } as Record<string, unknown>);
    } else if (exception instanceof Error) {
      // ─── Error inesperado — SIEMPRE loguear con stack completo ────
      this.logger.error(
        `🚨 [INTERNAL] ${request.method} ${request.url} [${requestId}] — ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error(
        `🚨 [INTERNAL] ${request.method} ${request.url} [${requestId}] — Error desconocido: ${String(exception)}`,
      );
    }

    if (response.headersSent) return;
    response.status(statusCode).json({
      success: false,
      error: {
        code: this.getErrorCode(statusCode),
        message,
        ...(details.length > 0 && { details }),
      },
      statusCode,
      requestId,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  // ─── Prisma error handling ─────────────────────────────────────────

  private handlePrismaError(exception: unknown): {
    statusCode: number;
    message: string;
    category: ErrorCategory;
    prismaCode: string;
    target?: string;
    field?: string;
  } | null {
    if (
      !exception ||
      typeof exception !== 'object' ||
      !('code' in exception) ||
      typeof (exception as { code: unknown }).code !== 'string' ||
      !(exception as { code: string }).code.startsWith('P')
    ) {
      return null;
    }

    const err = exception as {
      code: string;
      meta?: Record<string, unknown>;
      message?: string;
    };
    const rawTarget = err.meta?.target;
    let target: string | undefined;
    if (rawTarget != null) {
      if (Array.isArray(rawTarget)) {
        target = (rawTarget as string[]).join(', ');
      } else if (typeof rawTarget === 'string') {
        target = rawTarget;
      } else {
        target = JSON.stringify(rawTarget);
      }
    }

    switch (err.code) {
      // Unique constraint violation
      case 'P2002':
        return {
          statusCode: HttpStatus.CONFLICT,
          message: target
            ? `Ya existe un registro con ese valor de ${target}`
            : 'El registro ya existe (valor duplicado)',
          category: 'DB_CONSTRAINT',
          prismaCode: err.code,
          target,
          field: target,
        };

      // Foreign key constraint violation
      case 'P2003':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: target
            ? `Referencia inválida: no existe el registro relacionado (${target})`
            : 'Referencia inválida: el registro relacionado no existe',
          category: 'DB_CONSTRAINT',
          prismaCode: err.code,
          target,
          field: target,
        };

      // Record not found (findUniqueOrThrow, deleteMany, etc.)
      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'El registro no fue encontrado o ya fue eliminado',
          category: 'NOT_FOUND',
          prismaCode: err.code,
          target,
        };

      // Value too long for column
      case 'P2000':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: target
            ? `El valor del campo ${target} es demasiado largo`
            : 'Uno de los valores enviados excede el largo máximo permitido',
          category: 'VALIDATION',
          prismaCode: err.code,
          target,
          field: target,
        };

      // Required field missing
      case 'P2012':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: target
            ? `Falta el campo obligatorio: ${target}`
            : 'Falta un campo obligatorio',
          category: 'VALIDATION',
          prismaCode: err.code,
          target,
          field: target,
        };

      // Invalid value for field type
      case 'P2006':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: target
            ? `Valor inválido para el campo ${target}`
            : 'Valor inválido para uno de los campos',
          category: 'VALIDATION',
          prismaCode: err.code,
          target,
          field: target,
        };

      // Cannot delete — dependent records exist
      case 'P2014':
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'No se puede eliminar: existen registros dependientes',
          category: 'DB_CONSTRAINT',
          prismaCode: err.code,
          target,
        };

      // Connection pool timeout
      case 'P2024':
        return {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message:
            'Base de datos temporalmente no disponible, intente nuevamente',
          category: 'INTERNAL',
          prismaCode: err.code,
          target,
        };

      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error de base de datos inesperado',
          category: 'INTERNAL',
          prismaCode: err.code,
          target,
        };
    }
  }

  // ─── Logging por categoría ─────────────────────────────────────────

  private logError(
    category: ErrorCategory,
    status: number,
    request: Request,
    requestId: string,
    extra: Record<string, unknown>,
  ) {
    const user = (request as Request & { user?: JwtPayload })['user'];
    const userId = user?.sub ?? 'anon';
    const base = `[${category}] ${request.method} ${request.url} ${status} [${requestId}] user=${userId}`;
    const detail = Object.entries(extra)
      .filter(([, v]) => v !== undefined)
      .map(
        ([k, v]) =>
          `${k}=${typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)}`,
      )
      .join(' ');

    switch (category) {
      case 'INTERNAL':
      case 'DB_CONSTRAINT':
        this.logger.error(`🚨 ${base} ${detail}`);
        break;
      case 'VALIDATION':
        this.logger.warn(`⚠ ${base} ${detail}`);
        break;
      case 'AUTH':
        this.logger.warn(`🔒 ${base} ${detail}`);
        break;
      case 'BUSINESS':
        this.logger.warn(`📋 ${base} ${detail}`);
        break;
      case 'NOT_FOUND':
        this.logger.warn(`🔍 ${base} ${detail}`);
        break;
      case 'RATE_LIMIT':
        this.logger.warn(`🚦 ${base} ${detail}`);
        break;
      default:
        this.logger.error(`❓ ${base} ${detail}`);
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────

  private categorizeHttpStatus(status: number): ErrorCategory {
    if (status === 400) return 'VALIDATION';
    if (status === 401 || status === 403) return 'AUTH';
    if (status === 404) return 'NOT_FOUND';
    if (status === 409) return 'BUSINESS';
    if (status === 429) return 'RATE_LIMIT';
    if (status >= 500) return 'INTERNAL';
    return 'BUSINESS';
  }

  private getErrorCode(status: number): string {
    const codes: Record<number, string> = {
      400: 'VALIDATION_ERROR',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      503: 'SERVICE_UNAVAILABLE',
    };
    return codes[status] ?? 'ERROR';
  }
}
