/**
 * Common Module Configuration Options
 * Allows consumers to customize which features they want to enable
 */
export interface CommonModuleOptions {
  /**
   * Enable global interceptors
   * Set to false to disable all global interceptors
   */
  enableGlobalInterceptors?: boolean;

  /**
   * Individual interceptor settings
   */
  interceptors?: {
    requestId?: boolean;
    sanitization?: boolean;
    securityHeaders?: boolean;
    logging?: boolean;
    metrics?: boolean;
    performance?: boolean;
  };

  /**
   * Enable global exception filters
   */
  enableGlobalFilters?: boolean;

  /**
   * Enable global guards
   */
  enableGlobalGuards?: boolean;
}

/**
 * Default configuration
 */
export const DEFAULT_COMMON_MODULE_OPTIONS: CommonModuleOptions = {
  enableGlobalInterceptors: true,
  interceptors: {
    requestId: true,
    sanitization: true,
    securityHeaders: true,
    logging: true,
    metrics: true,
    performance: true,
  },
  enableGlobalFilters: true,
  enableGlobalGuards: true,
};
