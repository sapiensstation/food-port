import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseData<T> {
  success: boolean;
  data: T;
  meta?: unknown;
}

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, ResponseData<T>> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ResponseData<T>> {
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
          return { success: true, data: (data as { data: T }).data, meta: (data as { meta: unknown }).meta };
        }
        return { success: true, data };
      }),
    );
  }
}
