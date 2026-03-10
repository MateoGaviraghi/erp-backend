import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface WrappedResponse {
  success: boolean;
  data?: unknown;
  [key: string]: unknown;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, WrappedResponse> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<WrappedResponse> {
    return next.handle().pipe(
      map((data: T): WrappedResponse => {
        if (data && typeof data === 'object' && 'data' in data) {
          return { success: true, ...(data as Record<string, unknown>) };
        }
        return { success: true, data };
      }),
    );
  }
}
