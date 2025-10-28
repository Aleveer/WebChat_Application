import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { throwError } from 'rxjs';
import { Request } from 'express';

// Rate Limiting Interceptor
@Injectable()
export class RateLimitInterceptor implements NestInterceptor, OnModuleInit {
  private readonly logger = new Logger(RateLimitInterceptor.name);
  private readonly requests = new Map<
    string,
    { count: number; resetTime: number }
  >();
  private cleanupInterval: NodeJS.Timeout;

  onModuleInit() {
    // FIXED: Cleanup expired entries every 5 minutes to prevent memory leak
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000); // 5 minutes
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const clientId = request.ip || 'unknown';
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const limit = 100; // requests per window

    const clientRequests = this.requests.get(clientId);

    if (!clientRequests || now > clientRequests.resetTime) {
      this.requests.set(clientId, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next.handle();
    }

    if (clientRequests.count >= limit) {
      return throwError(() => new Error('Rate limit exceeded'));
    }

    clientRequests.count++;
    return next.handle();
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [clientId, data] of this.requests.entries()) {
      if (now > data.resetTime) {
        this.requests.delete(clientId);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      this.logger.debug(
        `Cleaned up ${expiredCount} expired rate limit entries`,
      );
    }
  }
}
