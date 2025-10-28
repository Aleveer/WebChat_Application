import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<Request>();
    const cacheKey = this.generateCacheKey(request);

    // Check cache first
    const cached = await this.getFromCache(cacheKey);
    if (cached !== null && cached !== undefined) {
      return new Observable((observer) => {
        observer.next(cached);
        observer.complete();
      });
    }

    return next.handle().pipe(
      tap(async (data) => {
        const ttl = this.getCacheTTL(context);
        if (ttl > 0) {
          await this.setCache(cacheKey, data, ttl);
        }
      }),
    );
  }

  private generateCacheKey(request: Request): string {
    const { method, url, query } = request;
    const queryString = JSON.stringify(query);
    return `cache:${method}:${url}:${queryString}`;
  }

  private getCacheTTL(context: ExecutionContext): number {
    // Get TTL from metadata or use default
    const cacheConfig = Reflect.getMetadata('cache', context.getHandler());
    return cacheConfig?.ttl || 0;
  }

  private async getFromCache(key: string): Promise<unknown> {
    try {
      const cached = await this.cacheManager.get<unknown>(key);
      if (cached) {
        this.logger.debug(`Cache HIT: ${key}`);
        return cached;
      }
      this.logger.debug(`Cache MISS: ${key}`);
      return null;
    } catch (error) {
      this.logger.error(`Failed to get from cache: ${key}`, error);
      return null;
    }
  }

  private async setCache(
    key: string,
    data: unknown,
    ttl: number,
  ): Promise<void> {
    try {
      await this.cacheManager.set(key, data, ttl);
      this.logger.debug(`Cached: ${key}, TTL: ${ttl}s`);
    } catch (error) {
      this.logger.error(`Failed to set cache: ${key}`, error);
    }
  }
}
