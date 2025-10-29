import {
  Injectable,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { CacheInterceptor as NestCacheInterceptor } from '@nestjs/cache-manager';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { CACHE_CONFIG_KEY } from '../decorators/cache.decorators';

/**
 * Custom Cache Interceptor extending @nestjs/cache-manager CacheInterceptor
 *
 * Provides additional features:
 * - Enhanced logging (cache HIT/MISS)
 * - User-specific cache keys
 * - Custom TTL from decorators
 * - Query parameter handling
 */
@Injectable()
export class CacheInterceptor extends NestCacheInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  /**
   * Generate cache key with enhanced context
   */
  protected trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest<Request>();
    const cacheConfig = this.reflector.get(
      CACHE_CONFIG_KEY,
      context.getHandler(),
    );

    // Skip caching if TTL is 0 or not configured
    if (!cacheConfig || cacheConfig.ttl === 0) {
      return undefined;
    }

    // Use custom cache key if provided
    if (cacheConfig.key) {
      return this.buildCacheKey(cacheConfig.key, request);
    }

    // Auto-generate cache key from route
    return this.generateCacheKey(request);
  }

  /**
   * Intercept with logging
   */
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const cacheKey = this.trackBy(context);

    if (!cacheKey) {
      return next.handle();
    }

    // Check if data is in cache
    const cachedValue = await this.cacheManager.get(cacheKey);

    if (cachedValue) {
      this.logger.debug(`Cache HIT: ${cacheKey}`);
      return new Observable((observer) => {
        observer.next(cachedValue);
        observer.complete();
      });
    }

    this.logger.debug(`Cache MISS: ${cacheKey}`);

    return next.handle().pipe(
      tap(async (response) => {
        if (response) {
          const cacheConfig = this.reflector.get(
            CACHE_CONFIG_KEY,
            context.getHandler(),
          );
          const ttl = cacheConfig?.ttl || 3600; // Default 1 hour

          try {
            await this.cacheManager.set(cacheKey, response, ttl * 1000); // Convert to ms
            this.logger.debug(`Cached: ${cacheKey}, TTL: ${ttl}s`);
          } catch (error) {
            this.logger.error(`Failed to cache: ${cacheKey}`, error);
          }
        }
      }),
    );
  }

  /**
   * Generate cache key from request
   */
  private generateCacheKey(request: Request): string {
    const { method, path, query } = request;
    const queryString =
      Object.keys(query).length > 0 ? `:${JSON.stringify(query)}` : '';

    // Include user ID for authenticated requests
    const user = request.user as { id?: string } | undefined;
    const userId = user?.id ? `:user:${user.id}` : '';

    return `cache:${method}:${path}${queryString}${userId}`;
  }

  /**
   * Build cache key with custom prefix and user context
   */
  private buildCacheKey(prefix: string, request: Request): string {
    const user = request.user as { id?: string } | undefined;
    const userId = user?.id ? `:${user.id}` : '';

    return `${prefix}${userId}`;
  }
}
