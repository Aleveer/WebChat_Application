import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { MetricsService } from '../services/metrics.services';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MetricsInterceptor.name);

  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;

    const timerName = `http_${method.toLowerCase()}_${this.sanitizeUrl(url)}`;

    // Start timer and save the returned timerKey
    const timerKey = this.metricsService.startTimer(timerName);

    // Increment request counter
    this.metricsService.incrementCounter(
      `http_requests_total{method="${method}",path="${url}"}`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = this.metricsService.endTimer(timerKey);
          this.metricsService.incrementCounter('http_requests_success');
          this.metricsService.recordHistogram(
            'http_request_duration_ms',
            duration,
          );
          this.logger.debug(
            `Request completed: ${method} ${url} - ${duration}ms`,
          );
        },
        error: () => {
          const duration = this.metricsService.endTimer(timerKey);
          this.metricsService.incrementCounter('http_requests_error');
          this.metricsService.recordHistogram(
            'http_request_error_duration_ms',
            duration,
          );
          this.logger.debug(`Request failed: ${method} ${url} - ${duration}ms`);
        },
      }),
    );
  }

  private sanitizeUrl(url: string): string {
    // Remove query parameters and replace variable parts
    return url
      .split('?')[0]
      .replace(/\/[a-f0-9]{24}/g, '/:id') // MongoDB ObjectId
      .replace(/\/\d+/g, '/:id') // Numeric IDs
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .toLowerCase();
  }
}
