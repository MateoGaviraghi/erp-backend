import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Response } from 'express';

interface WrappedResponse {
  success: boolean;
  data?: unknown;
  [key: string]: unknown;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  WrappedResponse
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<WrappedResponse> {
    const res = context.switchToHttp().getResponse<Response>();
    return next.handle().pipe(
      map((data: T): WrappedResponse => {
        // Si la respuesta ya fue enviada (ej: XLSX binary), no transformar
        if (res.headersSent) return data as unknown as WrappedResponse;
        if (data && typeof data === 'object' && 'data' in data) {
          return { success: true, ...(data as Record<string, unknown>) };
        }
        return { success: true, data };
      }),
    );
  }
}
