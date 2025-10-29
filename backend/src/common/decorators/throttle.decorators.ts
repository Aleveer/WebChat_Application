import { Throttle as NestThrottle } from '@nestjs/throttler';

/**
 * Custom Throttle Decorators for Rate Limiting
 *
 * Re-export and extend @nestjs/throttler decorators with common presets
 */

// Re-export the base decorators
export { SkipThrottle } from '@nestjs/throttler';

/**
 * Default throttle settings (100 requests per minute)
 * @example
 * @Throttle()
 * async myEndpoint() { ... }
 */
export const Throttle = (limit?: number, ttl?: number) => {
  const defaultLimit = limit || 100;
  const defaultTtl = ttl || 60000; // 60 seconds in milliseconds

  return NestThrottle({ default: { limit: defaultLimit, ttl: defaultTtl } });
};

/**
 * Strict throttle for sensitive operations (10 requests per minute)
 * @example
 * @StrictThrottle()
 * async sensitiveOperation() { ... }
 */
export const StrictThrottle = (limit?: number, ttl?: number) => {
  const strictLimit = limit || 10;
  const strictTtl = ttl || 60000;

  return NestThrottle({ default: { limit: strictLimit, ttl: strictTtl } });
};

/**
 * Relaxed throttle for read operations (300 requests per minute)
 * @example
 * @RelaxedThrottle()
 * async getItems() { ... }
 */
export const RelaxedThrottle = (limit?: number, ttl?: number) => {
  const relaxedLimit = limit || 300;
  const relaxedTtl = ttl || 60000;

  return NestThrottle({ default: { limit: relaxedLimit, ttl: relaxedTtl } });
};

/**
 * Auth throttle for authentication endpoints (5 attempts per 15 minutes)
 * @example
 * @AuthThrottle()
 * async login() { ... }
 */
export const AuthThrottle = (limit?: number, ttl?: number) => {
  const authLimit = limit || 5;
  const authTtl = ttl || 900000; // 15 minutes

  return NestThrottle({ default: { limit: authLimit, ttl: authTtl } });
};

/**
 * Upload throttle for file upload endpoints (10 uploads per hour)
 * @example
 * @UploadThrottle()
 * async uploadFile() { ... }
 */
export const UploadThrottle = (limit?: number, ttl?: number) => {
  const uploadLimit = limit || 10;
  const uploadTtl = ttl || 3600000; // 1 hour

  return NestThrottle({ default: { limit: uploadLimit, ttl: uploadTtl } });
};

/**
 * API throttle for external API calls (50 requests per minute)
 * @example
 * @ApiThrottle()
 * async callExternalApi() { ... }
 */
export const ApiThrottle = (limit?: number, ttl?: number) => {
  const apiLimit = limit || 50;
  const apiTtl = ttl || 60000;

  return NestThrottle({ default: { limit: apiLimit, ttl: apiTtl } });
};
