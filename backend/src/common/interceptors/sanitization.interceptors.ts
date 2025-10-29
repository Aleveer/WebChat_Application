import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { z } from 'zod';

/**
 * Schema để sanitize XSS attacks
 * Loại bỏ các HTML tags, scripts, và event handlers nguy hiểm
 */
export const XssSafeStringSchema = z.string().transform((val) => {
  if (!val || val.length === 0) {
    return val;
  }

  let sanitized = val.trim();

  // Handle encoded script tags (preserve content)
  sanitized = sanitized.replace(
    /&lt;script[^&]*&gt;([^&]*)&lt;\/script&gt;/gi,
    '$1',
  );
  sanitized = sanitized.replace(
    /&lt;iframe[^&]*&gt;([^&]*)&lt;\/iframe&gt;/gi,
    '$1',
  );

  // Handle dangerous HTML tags - extract content between tags
  sanitized = sanitized.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*>(.*?)<\/script>/gis,
    '$1',
  );
  sanitized = sanitized.replace(
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*>(.*?)<\/style>/gis,
    '$1',
  );
  sanitized = sanitized.replace(
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*>(.*?)<\/iframe>/gis,
    '$1',
  );
  sanitized = sanitized.replace(
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*>(.*?)<\/object>/gis,
    '$1',
  );
  sanitized = sanitized.replace(/<embed\b[^>]*>/gi, '');

  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove dangerous protocols
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  // Remove special patterns
  sanitized = sanitized.replace(/expression\s*\(/gi, '');
  sanitized = sanitized.replace(/@import\s+/gi, '');

  // Final cleanup - only if needed
  if (sanitized.includes('<') || sanitized.includes('>')) {
    sanitized = sanitized.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return sanitized;
});

/**
 * Schema để sanitize objects recursively
 * Áp dụng XSS protection cho tất cả string values
 */
export const SanitizedObjectSchema = z.any().transform((val) => {
  return sanitizeValue(val);
});

/**
 * Helper function để sanitize bất kỳ value nào
 */
function sanitizeValue(val: any): any {
  // Handle strings
  if (typeof val === 'string') {
    try {
      return XssSafeStringSchema.parse(val);
    } catch {
      return val; // Fallback to original if parsing fails
    }
  }

  // Handle non-objects (null, undefined, numbers, booleans)
  if (typeof val !== 'object' || val === null) {
    return val;
  }

  // Handle arrays
  if (Array.isArray(val)) {
    return val.map((item) => sanitizeValue(item));
  }

  // Handle objects
  const sanitized: any = {};
  for (const [key, value] of Object.entries(val)) {
    sanitized[key] = sanitizeValue(value);
  }

  return sanitized;
}

@Injectable()
export class SanitizationInterceptor implements NestInterceptor {
  // Cache for sanitized strings để tránh re-sanitizing
  private readonly sanitizationCache = new Map<string, string>();
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly MAX_STRING_LENGTH = 1024; // Chỉ cache strings < 1KB

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    try {
      // Sanitize request body
      if (request.body) {
        request.body = this.sanitizeWithCache(request.body);
      }

      // Sanitize query parameters
      if (request.query) {
        request.query = this.sanitizeWithCache(request.query);
      }

      // Sanitize URL params
      if (request.params) {
        request.params = this.sanitizeWithCache(request.params);
      }

      return next.handle();
    } catch (error) {
      throw new BadRequestException(
        'Dữ liệu đầu vào không hợp lệ: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
      );
    }
  }

  /**
   * Sanitize với cache support
   */
  private sanitizeWithCache(obj: any): any {
    // Handle strings với cache
    if (typeof obj === 'string') {
      return this.sanitizeStringWithCache(obj);
    }

    // Handle non-objects
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeWithCache(item));
    }

    // Handle objects
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = this.sanitizeWithCache(value);
    }

    return sanitized;
  }

  /**
   * Sanitize string với cache support
   */
  private sanitizeStringWithCache(input: string): string {
    // Check cache first
    if (this.sanitizationCache.has(input)) {
      return this.sanitizationCache.get(input)!;
    }

    // Early return for empty strings
    if (input.length === 0) {
      return input;
    }

    // Quick check for dangerous characters
    if (!this.hasDangerousContent(input)) {
      this.cacheResult(input, input);
      return input;
    }

    // Sanitize using Zod schema
    try {
      const sanitized = XssSafeStringSchema.parse(input);
      this.cacheResult(input, sanitized);
      return sanitized;
    } catch (error) {
      // Fallback: return original input if Zod parsing fails
      this.cacheResult(input, input);
      return input;
    }
  }

  /**
   * Quick check for dangerous content
   * Tránh expensive regex operations trên safe strings
   */
  private hasDangerousContent(input: string): boolean {
    const lowerInput = input.toLowerCase();

    // Check for common dangerous patterns
    const dangerousPatterns = [
      '<script',
      '<iframe',
      '<object',
      '<embed',
      '<style',
      'javascript:',
      'vbscript:',
      'data:text/html',
      'onerror',
      'onclick',
      'onload',
      'onmouseover',
      'onfocus',
      'onblur',
    ];

    return dangerousPatterns.some((pattern) => lowerInput.includes(pattern));
  }

  /**
   * Cache sanitization results với size limit
   */
  private cacheResult(original: string, sanitized: string): void {
    // Chỉ cache strings nhỏ hơn 1KB để tránh memory bloat
    if (original.length > this.MAX_STRING_LENGTH) {
      return;
    }

    // Implement LRU-like behavior
    if (this.sanitizationCache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entries (first 10%)
      const keysToDelete = Array.from(this.sanitizationCache.keys()).slice(
        0,
        Math.floor(this.MAX_CACHE_SIZE * 0.1),
      );
      keysToDelete.forEach((key) => this.sanitizationCache.delete(key));
    }

    this.sanitizationCache.set(original, sanitized);
  }

  /**
   * Clear cache manually (useful for testing hoặc memory management)
   */
  clearCache(): void {
    this.sanitizationCache.clear();
  }

  /**
   * Get cache statistics (useful for monitoring)
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
  } {
    return {
      size: this.sanitizationCache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hitRate: 0, // TODO: Implement hit rate tracking if needed
    };
  }
}

export type XssSafeString = z.infer<typeof XssSafeStringSchema>;
