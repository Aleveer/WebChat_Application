import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

// Cache Service
@Injectable()
export class CacheService {
  private readonly cache = new Map<string, { data: any; expiry: number }>();
  private readonly logger = new Logger(CacheService.name);

  set(key: string, data: any, ttl: number = 3600000): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
    });
  }

  get(key: string): any {
    const cached = this.cache.get(key);
    if (!cached || cached.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return cached.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached || cached.expiry < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  // Clean expired entries every hour
  @Cron(CronExpression.EVERY_HOUR)
  cleanExpiredEntries(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.cache.entries()) {
      if (value.expiry < now) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`Cleaned ${cleaned} expired cache entries`);
    }
  }
}
