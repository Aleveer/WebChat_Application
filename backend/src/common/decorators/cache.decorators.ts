import { SetMetadata } from '@nestjs/common';

/**
 * Custom Cache Decorators for @nestjs/cache-manager
 *
 * Re-export and extend @nestjs/cache-manager decorators with common presets
 */

// Re-export base decorators
export { CacheKey, CacheTTL } from '@nestjs/cache-manager';

/**
 * Metadata key for cache configuration
 */
export const CACHE_CONFIG_KEY = 'cache_config';

/**
 * Cache configuration interface
 */
export interface CacheConfig {
  key?: string;
  ttl?: number;
}

/**
 * Custom decorator to configure caching with key and TTL
 *
 * @example
 * @Cache({ key: 'users', ttl: 3600 })
 * @Get()
 * async getUsers() { ... }
 *
 * @example
 * @Cache({ ttl: 1800 }) // Auto-generate key from route
 * @Get('posts')
 * async getPosts() { ... }
 */
export const Cache = (config: CacheConfig = {}) => {
  return SetMetadata(CACHE_CONFIG_KEY, config);
};

/**
 * Short cache (5 minutes) - for frequently changing data
 *
 * @example
 * @ShortCache()
 * @Get('notifications')
 * async getNotifications() { ... }
 */
export const ShortCache = (key?: string) => {
  return Cache({ key, ttl: 300 }); // 5 minutes
};

/**
 * Medium cache (1 hour) - default for most data
 *
 * @example
 * @MediumCache()
 * @Get('posts')
 * async getPosts() { ... }
 */
export const MediumCache = (key?: string) => {
  return Cache({ key, ttl: 3600 }); // 1 hour
};

/**
 * Long cache (24 hours) - for static/rarely changing data
 *
 * @example
 * @LongCache()
 * @Get('categories')
 * async getCategories() { ... }
 */
export const LongCache = (key?: string) => {
  return Cache({ key, ttl: 86400 }); // 24 hours
};

/**
 * User-specific cache (30 minutes)
 * Automatically includes user ID in cache key
 *
 * @example
 * @UserCache()
 * @Get('profile')
 * async getProfile(@User() user) { ... }
 */
export const UserCache = (ttl: number = 1800) => {
  return Cache({ ttl }); // 30 minutes default
};

/**
 * Query cache (15 minutes) - for search/filter results
 *
 * @example
 * @QueryCache()
 * @Get('search')
 * async search(@Query() query) { ... }
 */
export const QueryCache = (ttl: number = 900) => {
  return Cache({ ttl }); // 15 minutes default
};

/**
 * No cache - explicitly skip caching for this endpoint
 *
 * @example
 * @NoCache()
 * @Post()
 * async create() { ... }
 */
export const NoCache = () => {
  return SetMetadata(CACHE_CONFIG_KEY, { ttl: 0 });
};
