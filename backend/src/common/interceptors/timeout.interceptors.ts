import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
  Inject,
  Optional,
} from '@nestjs/common';
import { Observable, timeout, catchError, TimeoutError } from 'rxjs';
import type { InterceptorConfig } from '../config/interceptor.config';
import { DEFAULT_INTERCEPTOR_CONFIG } from '../config/interceptor.config';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly timeoutMs: number;

  constructor(
    @Optional()
    @Inject('INTERCEPTOR_CONFIG')
    private readonly config?: InterceptorConfig,
  ) {
    // Use injected config or fall back to default
    this.timeoutMs =
      this.config?.timeout.default ??
      DEFAULT_INTERCEPTOR_CONFIG.timeout.default;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(this.timeoutMs),
      catchError((error) => {
        if (error instanceof TimeoutError) {
          throw new RequestTimeoutException('Request timeout');
        }
        throw error;
      }),
    );
  }
}
