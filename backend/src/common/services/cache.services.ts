import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Cron, CronExpression } from '@nestjs/schedule';

// Cache Service with native NestJS in-memory cache
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async set<T>(key: string, data: T, ttl: number = 3600): Promise<void> {
    try {
      await this.cacheManager.set(key, data, ttl);
      this.logger.debug(`Cache set: ${key}, TTL: ${ttl}s`);
    } catch (error) {
      this.logger.error(`Failed to set cache for key ${key}:`, error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.cacheManager.get<T>(key);
      // Use ?? instead of || to avoid false/0/empty string being converted to null
      return cached ?? null;
    } catch (error) {
      this.logger.error(`Failed to get cache for key ${key}:`, error);
      // This allows the application to continue and fetch data from source
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache deleted: ${key}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete cache for key ${key}:`, error);
      // Allows graceful degradation - app continues even if cache delete fails
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      // Type assertion needed as reset() is available in cache-manager v7+ but not in type definitions
      await (this.cacheManager as any).reset();
      this.logger.log('Cache cleared successfully');
    } catch (error) {
      this.logger.error('Failed to clear cache:', error);
      throw error;
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const value = await this.cacheManager.get(key);
      return value !== undefined && value !== null;
    } catch (error) {
      this.logger.error(
        `Failed to check cache existence for key ${key}:`,
        error,
      );
      // Prevents cache errors from breaking application logic
      return false;
    }
  }

  // Clean expired entries daily
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  cleanExpiredEntries(): void {
    this.logger.log(
      'Cache cleanup completed (handled automatically by cache-manager)',
    );
  }
}
