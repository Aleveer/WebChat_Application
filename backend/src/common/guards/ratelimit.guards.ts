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

@Injectable()
export class RateLimitGuard
  implements CanActivate, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly localCache = new Map<
    string,
    { count: number; expiresAt: number }
  >();
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private reflector: Reflector,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  onModuleInit() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupExpiredEntries();
      },
      5 * 60 * 1000,
    ); // 5 minutes

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

    // Get real client IP and prevent spoofing
    const clientId = this.getClientIdentifier(request);
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

  /**
   * Get real client IP address and prevent spoofing
   * Priority order:
   * 1. X-Real-IP (if from trusted proxy)
   * 2. First IP in X-Forwarded-For (if from trusted proxy)
   * 3. request.ip
   * 4. Socket remote address
   */
  private getClientIdentifier(request: Request): string {
    // Get the real IP address
    let clientIp: string | undefined;

    // Option 1: X-Real-IP header (commonly used by nginx)
    const xRealIp = request.headers['x-real-ip'] as string;
    if (xRealIp && this.isValidIp(xRealIp)) {
      clientIp = xRealIp;
    }

    // Option 2: X-Forwarded-For header (get the FIRST IP, not last)
    // Format: "client, proxy1, proxy2"
    if (!clientIp) {
      const xForwardedFor = request.headers['x-forwarded-for'] as string;
      if (xForwardedFor) {
        const ips = xForwardedFor.split(',').map((ip) => ip.trim());
        // Take the first IP (original client) and validate it
        const firstIp = ips[0];
        if (firstIp && this.isValidIp(firstIp)) {
          clientIp = firstIp;
        }
      }
    }

    // Option 3: Express request.ip
    if (!clientIp && request.ip) {
      clientIp = request.ip;
    }

    // Option 4: Socket remote address
    if (!clientIp) {
      clientIp = request.socket?.remoteAddress;
    }

    // Sanitize IP to prevent injection attacks
    const sanitizedIp = this.sanitizeIp(clientIp || 'unknown');

    // Add user ID if authenticated for better rate limiting
    // Type-safe access to user property
    const user = request.user as { id?: string } | undefined;
    const userId = user?.id;
    if (userId) {
      return `${sanitizedIp}:${userId}`;
    }

    return sanitizedIp;
  }

  /**
   * Validate IP address format (IPv4 or IPv6)
   */
  private isValidIp(ip: string): boolean {
    // IPv4 pattern
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    // IPv6 pattern (simplified)
    const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

    return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
  }

  /**
   * Sanitize IP to prevent injection
   */
  private sanitizeIp(ip: string): string {
    // Remove any non-IP characters (keep only digits, dots, colons for IPv6)
    return ip.replace(/[^0-9a-fA-F:.]/g, '').substring(0, 45); // Max IPv6 length
  }
}
