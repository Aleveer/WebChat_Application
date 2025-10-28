/**
 * Common Module Configuration Options
 * Allows consumers to customize which features they want to enable
 */
export interface CommonModuleOptions {
  enableGlobalInterceptors?: boolean;

  interceptors?: {
    requestId?: boolean;
    sanitization?: boolean;
    securityHeaders?: boolean;
    logging?: boolean;
    metrics?: boolean;
    performance?: boolean;
  };

  enableGlobalFilters?: boolean;
  enableGlobalGuards?: boolean;
}

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
