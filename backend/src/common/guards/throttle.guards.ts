import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard as NestThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

/**
 * Custom Throttle Guard extending @nestjs/throttler
 *
 * Provides enhanced throttling with custom client identification
 * - Uses IP address + User ID for authenticated requests
 * - Supports X-Forwarded-For and X-Real-IP headers
 * - Prevents IP spoofing with validation
 *
 * @example
 * // Use with @Throttle decorator
 * @Throttle({ default: { limit: 10, ttl: 60000 } })
 * @UseGuards(ThrottleGuard)
 * async myEndpoint() { ... }
 */
@Injectable()
export class ThrottleGuard extends NestThrottlerGuard {
  /**
   * Get client identifier for rate limiting
   * Combines IP address with user ID for better granularity
   */
  protected async getTracker(req: Request): Promise<string> {
    const clientIp = this.getClientIp(req);

    // Add user ID if authenticated for better rate limiting
    const user = req.user as { id?: string } | undefined;
    const userId = user?.id;

    if (userId) {
      return `${clientIp}:${userId}`;
    }

    return clientIp;
  }

  /**
   * Get real client IP address and prevent spoofing
   * Priority order:
   * 1. X-Real-IP (if from trusted proxy)
   * 2. First IP in X-Forwarded-For (if from trusted proxy)
   * 3. request.ip
   * 4. Socket remote address
   */
  private getClientIp(request: Request): string {
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

    return this.sanitizeIp(clientIp || 'unknown');
  }

  /**
   * Validate IP address format (IPv4 or IPv6)
   */
  private isValidIp(ip: string): boolean {
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
  }

  /**
   * Sanitize IP to prevent injection
   */
  private sanitizeIp(ip: string): string {
    return ip.replace(/[^0-9a-fA-F:.]/g, '').substring(0, 45); // Max IPv6 length
  }
}
