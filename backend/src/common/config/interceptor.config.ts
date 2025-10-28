/**
 * Interceptor Configuration
 * Centralized configuration for all interceptors
 */
export interface InterceptorConfig {
  timeout: {
    default: number;
    short: number;
    fileUpload: number;
  };

  rateLimit: {
    windowMs: number;
    maxRequests: number;
    cleanupIntervalMs: number;
  };

  cache: {
    defaultTtl: number;
    maxTtl: number;
  };

  compression: {
    threshold: number;
    level: number;
  };

  performance: {
    slowRequestThreshold: number;
  };
}

export const DEFAULT_INTERCEPTOR_CONFIG: InterceptorConfig = {
  timeout: {
    default: 30000, // 30 seconds
    short: 5000, // 5 seconds
    fileUpload: 300000, // 5 minutes
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    cleanupIntervalMs: 5 * 60 * 1000, // 5 minutes
  },
  cache: {
    defaultTtl: 3600, // 1 hour
    maxTtl: 86400, // 24 hours
  },
  compression: {
    threshold: 1024, // 1KB
    level: 6, // Compression level (0-9)
  },
  performance: {
    slowRequestThreshold: 1000, // 1 second
  },
};
