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
      // Rethrow to allow caller to handle cache failure
      throw new Error(`Cache set failed for key ${key}: ${error.message}`);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.cacheManager.get<T>(key);
      // Use ?? instead of || to avoid false/0/empty string being converted to null
      return cached ?? null;
    } catch (error) {
      this.logger.error(`Failed to get cache for key ${key}:`, error);
      // Rethrow error instead of silently returning null to allow caller to handle
      throw new Error(`Cache retrieval failed for key ${key}: ${error.message}`);
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache deleted: ${key}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete cache for key ${key}:`, error);
      // Rethrow instead of returning false to distinguish between "not found" and "error"
      throw new Error(`Cache deletion failed for key ${key}: ${error.message}`);
    }
  }

  async clear(): Promise<void> {
    try {
      // Note: reset() method doesn't exist in cache-manager v6
      // For now, log that cache would be cleared
      this.logger.log('Cache clear requested (not implemented in v6)');
    } catch (error) {
      this.logger.error('Failed to clear cache:', error);
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
      // Rethrow error - cache check failure should not silently return false
      throw new Error(`Cache existence check failed for key ${key}: ${error.message}`);
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
