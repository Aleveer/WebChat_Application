import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Request, Response } from 'express';

// Logging Interceptor
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    this.logger.log(
      `Incoming Request: ${method} ${url} - ${ip} - ${userAgent}`,
    );

    return next.handle().pipe(
      tap(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        const { statusCode } = response;

        this.logger.log(
          `Outgoing Response: ${method} ${url} - ${statusCode} - ${duration}ms`,
        );
      }),
      catchError((error) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        this.logger.error(
          `Request Error: ${method} ${url} - ${error.status || 500} - ${duration}ms - ${error.message}`,
        );

        return throwError(() => error);
      }),
    );
  }
}

// Response Transformation Interceptor
@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // If data is already formatted, return as is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Transform to standard response format
        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}

// Cache Interceptor
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly cache = new Map<string, { data: any; expiry: number }>();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const cacheKey = this.generateCacheKey(request);
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiry > Date.now()) {
      return new Observable((observer) => {
        observer.next(cached.data);
        observer.complete();
      });
    }

    return next.handle().pipe(
      tap((data) => {
        const ttl = this.getCacheTTL(context);
        if (ttl > 0) {
          this.cache.set(cacheKey, {
            data,
            expiry: Date.now() + ttl,
          });
        }
      }),
    );
  }

  private generateCacheKey(request: Request): string {
    const { method, url, query } = request;
    const queryString = JSON.stringify(query);
    return `${method}:${url}:${queryString}`;
  }

  private getCacheTTL(context: ExecutionContext): number {
    // Get TTL from metadata or use default
    const cacheConfig = Reflect.getMetadata('cache', context.getHandler());
    return cacheConfig?.ttl || 0;
  }
}

// Performance Interceptor
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const startTime = Date.now();
    const { method, url } = request;

    return next.handle().pipe(
      tap(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        if (duration > 1000) {
          this.logger.warn(`Slow Request: ${method} ${url} took ${duration}ms`);
        }
      }),
    );
  }
}

// Request ID Interceptor
@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId =
      (request.headers['x-request-id'] as string) ||
      (request.headers['x-correlation-id'] as string) ||
      this.generateRequestId();

    // Add request ID to request object
    request.requestId = requestId;

    return next.handle().pipe(
      tap((data) => {
        // Add request ID to response headers
        const response = context.switchToHttp().getResponse<Response>();
        response.setHeader('X-Request-ID', requestId);
      }),
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Timeout Interceptor
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(private readonly timeout: number = 30000) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(() => {
        // Set timeout for the request
        const request = context.switchToHttp().getRequest<Request>();
        request.setTimeout(this.timeout);
      }),
    );
  }
}

// Compression Interceptor
@Injectable()
export class CompressionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<Response>();

    // Set compression headers
    response.setHeader('Content-Encoding', 'gzip');
    response.setHeader('Vary', 'Accept-Encoding');

    return next.handle();
  }
}

// Security Headers Interceptor
@Injectable()
export class SecurityHeadersInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<Response>();

    // Set security headers
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('X-XSS-Protection', '1; mode=block');
    response.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('Content-Security-Policy', "default-src 'self'");

    return next.handle();
  }
}

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

// Data Sanitization Interceptor
@Injectable()
export class SanitizationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    // Sanitize request body
    if (request.body) {
      request.body = this.sanitizeObject(request.body);
    }

    // Sanitize query parameters
    if (request.query) {
      request.query = this.sanitizeObject(request.query);
    }

    return next.handle();
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Remove potentially dangerous characters
        sanitized[key] = value.replace(
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
          '',
        );
      } else {
        sanitized[key] = this.sanitizeObject(value);
      }
    }

    return sanitized;
  }
}
