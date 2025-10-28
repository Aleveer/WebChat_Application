import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

//TODO: fix các lỗi từ file spec
@Injectable()
export class SanitizationInterceptor implements NestInterceptor {
  // Cache for sanitized strings to avoid re-sanitizing
  private readonly sanitizationCache = new Map<string, string>();
  private readonly MAX_CACHE_SIZE = 1000;

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    // Sanitize request body
    if (request.body) {
      request.body = this.sanitizeObject(request.body);
    }

    // Sanitize query parameters
    if (request.query) {
      request.query = this.sanitizeObject(request.query);
    }

    return next.handle();
  }

  private sanitizeObject(obj: any): any {
    // Handle strings directly
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    // Handle non-objects (null, undefined, numbers, booleans)
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else {
        sanitized[key] = this.sanitizeObject(value);
      }
    }

    return sanitized;
  }

  private sanitizeString(input: string): string {
    // Check cache first
    if (this.sanitizationCache.has(input)) {
      return this.sanitizationCache.get(input)!;
    }

    // Early return for safe strings
    if (input.length === 0) {
      return input;
    }

    // Quick check for dangerous characters
    if (!this.hasDangerousContent(input)) {
      this.cacheResult(input, input);
      return input;
    }

    let sanitized = input.trim();

    // First, handle encoded script tags (preserve content)
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

    // Cache the result
    this.cacheResult(input, sanitized);

    return sanitized;
  }

  /**
   * Quick check for dangerous content
   * Avoids expensive regex operations on safe strings
   */
  private hasDangerousContent(input: string): boolean {
    // Check for common dangerous patterns
    const dangerousChars = [
      '<',
      '>',
      'javascript:',
      'onerror',
      'onclick',
      'onload',
    ];
    return dangerousChars.some((char) => input.toLowerCase().includes(char));
  }

  /**
   *  Cache sanitization results with size limit
   */
  private cacheResult(original: string, sanitized: string): void {
    // Only cache strings under 1KB to avoid memory bloat
    if (original.length > 1024) {
      return;
    }

    // Implement LRU-like behavior
    if (this.sanitizationCache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entries (first 10%)
      const keysToDelete = Array.from(this.sanitizationCache.keys()).slice(
        0,
        100,
      );
      keysToDelete.forEach((key) => this.sanitizationCache.delete(key));
    }

    this.sanitizationCache.set(original, sanitized);
  }
}
