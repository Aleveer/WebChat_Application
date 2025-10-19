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
