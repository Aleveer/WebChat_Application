import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { throwError } from 'rxjs';
import { Request } from 'express';

// Rate Limiting Interceptor
@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private readonly requests = new Map<
    string,
    { count: number; resetTime: number }
  >();

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
}
