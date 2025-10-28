import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import type { InterceptorConfig } from '../config/interceptor.config';
import { DEFAULT_INTERCEPTOR_CONFIG } from '../config/interceptor.config';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);
  private readonly slowRequestThreshold: number;

  constructor(
    @Optional()
    @Inject('INTERCEPTOR_CONFIG')
    private readonly config?: InterceptorConfig,
  ) {
    this.slowRequestThreshold =
      this.config?.performance.slowRequestThreshold ??
      DEFAULT_INTERCEPTOR_CONFIG.performance.slowRequestThreshold;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const startTime = Date.now();
    const { method, url } = request;

    return next.handle().pipe(
      tap(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        if (duration > this.slowRequestThreshold) {
          this.logger.warn(`Slow Request: ${method} ${url} took ${duration}ms`);
        }
      }),
    );
  }
}
