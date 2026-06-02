import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export interface ResponseData<T> {
    success: boolean;
    data: T;
    meta?: unknown;
}
export declare class ResponseTransformInterceptor<T> implements NestInterceptor<T, ResponseData<T>> {
    intercept(_context: ExecutionContext, next: CallHandler): Observable<ResponseData<T>>;
}
