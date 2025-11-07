import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { User } from '../types';

// AsyncLocalStorage for request context propagation
import { AsyncLocalStorage } from 'async_hooks';

// Global request context storage
export const requestContext = new AsyncLocalStorage<Map<string, any>>();

// Request ID Interceptor with context propagation
@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestIdInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId =
      (request.headers['x-request-id'] as string) ||
      (request.headers['x-correlation-id'] as string) ||
      this.generateRequestId();

    // Add request ID to request object
    request.requestId = requestId;

    // Create request context map for correlation ID propagation
    const contextMap = new Map<string, any>();
    contextMap.set('requestId', requestId);
    contextMap.set('userId', (request.user as User)?.id || 'anonymous');
    contextMap.set('ip', request.ip || 'unknown');
    contextMap.set('userAgent', request.headers['user-agent'] || 'unknown');
    contextMap.set('startTime', Date.now());

    // Run the entire request handler within the async context
    return new Observable((subscriber) => {
      requestContext.run(contextMap, () => {
        next
          .handle()
          .pipe(
            tap({
              next: (data) => {
                // Add request ID to response headers
                const response = context.switchToHttp().getResponse<Response>();
                response.setHeader('X-Request-ID', requestId);
                response.setHeader('X-Correlation-ID', requestId);
              },
              error: (error) => {
                // Add correlation ID to error logs
                this.logger.error(
                  `Request ${requestId} failed: ${error.message}`,
                  error.stack,
                );
              },
              complete: () => {
                const duration =
                  Date.now() - (contextMap.get('startTime') || Date.now());
                this.logger.debug(
                  `Request ${requestId} completed in ${duration}ms`,
                );
              },
            }),
          )
          .subscribe(subscriber);
      });
    });
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Helper function to get current request ID from anywhere in the app
export function getCurrentRequestId(): string | undefined {
  const store = requestContext.getStore();
  return store?.get('requestId');
}

// Helper function to get current user ID from context
export function getCurrentUserId(): string | undefined {
  const store = requestContext.getStore();
  return store?.get('userId');
}

// Helper function to get full request context
export function getRequestContext(): Map<string, any> | undefined {
  return requestContext.getStore();
}
