import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import * as cacheManaget from 'cache-manager';
import { Request } from 'express';

type Cache = cacheManaget.Cache;

// FIXED: Added cleanup mechanism to prevent memory leak
@Injectable()
export class RateLimitGuard implements CanActivate, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly localCache = new Map<string, { count: number; expiresAt: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private reflector: Reflector,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  onModuleInit() {
    // FIXED: Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000); // 5 minutes
    
    this.logger.log('RateLimitGuard initialized with cleanup mechanism');
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.localCache.clear();
    this.logger.log('RateLimitGuard cleanup completed');
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.localCache.entries()) {
      if (value.expiresAt < now) {
        this.localCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired rate limit entries`);
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitConfig = this.reflector.getAllAndOverride<{
      limit: number;
      windowMs: number;
    }>('rateLimit', [context.getHandler(), context.getClass()]);

    if (!rateLimitConfig) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const clientId = request.ip || 'unknown';
    const key = `rate_limit:${clientId}`;

    const now = Date.now();
    const windowMs = rateLimitConfig.windowMs;
    const limit = rateLimitConfig.limit;
    const expiresAt = now + windowMs;

    // Try local cache first (faster)
    const localEntry = this.localCache.get(key);
    if (localEntry) {
      if (localEntry.expiresAt < now) {
        // Expired, remove it
        this.localCache.delete(key);
      } else if (localEntry.count >= limit) {
        throw new ForbiddenException('Rate limit exceeded');
      } else {
        // Increment local count
        localEntry.count++;
        return true;
      }
    }

    // Not in local cache, check cache manager
    const currentCount = await this.getCurrentCount(key);

    if (limit > 0 && currentCount >= limit) {
      throw new ForbiddenException('Rate limit exceeded');
    }

    // Increment counter in both local cache and cache manager
    this.localCache.set(key, { count: currentCount + 1, expiresAt });
    await this.incrementCount(key, windowMs);
    
    return true;
  }

  private async getCurrentCount(key: string): Promise<number> {
    try {
      const count = await this.cacheManager.get<number>(key);
      return count || 0;
    } catch (error) {
      this.logger.error('Cache error:', error);
      return 0;
    }
  }

  private async incrementCount(key: string, ttl: number): Promise<void> {
    try {
      const currentCount = await this.getCurrentCount(key);
      const newCount = currentCount + 1;
      await this.cacheManager.set(key, newCount, ttl);
    } catch (error) {
      this.logger.error('Cache error:', error);
    }
  }
}
