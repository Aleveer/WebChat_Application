import {
  InterceptorConfig,
  DEFAULT_INTERCEPTOR_CONFIG,
} from '../src/common/config/interceptor.config';

describe('InterceptorConfig - White Box Testing (Input-Output)', () => {
  describe('InterceptorConfig Interface', () => {
    /**
     * Test Case 1: Kiểm tra cấu trúc interface với object rỗng
     * Input: {}
     * Expected Output: Object hợp lệ với InterceptorConfig interface
     * Path Coverage: Kiểm tra tất cả thuộc tính là optional
     */
    it('TC001: should accept empty object (all properties are optional)', () => {
      const config: InterceptorConfig = {} as InterceptorConfig;

      expect(config).toBeDefined();
      expect(config.timeout).toBeUndefined();
      expect(config.rateLimit).toBeUndefined();
      expect(config.cache).toBeUndefined();
      expect(config.compression).toBeUndefined();
      expect(config.performance).toBeUndefined();
    });

    /**
     * Test Case 2: Kiểm tra timeout configuration với giá trị hợp lệ
     * Input: { timeout: { default: 30000, short: 5000, fileUpload: 300000 } }
     * Expected Output: Object với timeout configuration hợp lệ
     * Path Coverage: Branch timeout được định nghĩa
     */
    it('TC002: should accept valid timeout configuration', () => {
      const config: InterceptorConfig = {
        timeout: {
          default: 30000,
          short: 5000,
          fileUpload: 300000,
        },
      } as InterceptorConfig;

      expect(config.timeout).toBeDefined();
      expect(config.timeout.default).toBe(30000);
      expect(config.timeout.short).toBe(5000);
      expect(config.timeout.fileUpload).toBe(300000);
    });

    /**
     * Test Case 3: Kiểm tra timeout với giá trị số dương nhỏ
     * Input: { timeout: { default: 1, short: 1, fileUpload: 1 } }
     * Expected Output: Object với giá trị timeout = 1
     * Path Coverage: Boundary value analysis - giá trị nhỏ nhất
     */
    it('TC003: should accept minimum positive timeout values', () => {
      const config: InterceptorConfig = {
        timeout: {
          default: 1,
          short: 1,
          fileUpload: 1,
        },
      } as InterceptorConfig;

      expect(config.timeout.default).toBe(1);
      expect(config.timeout.short).toBe(1);
      expect(config.timeout.fileUpload).toBe(1);
    });

    /**
     * Test Case 4: Kiểm tra timeout với giá trị số lớn
     * Input: { timeout: { default: 999999, short: 999999, fileUpload: 999999 } }
     * Expected Output: Object với giá trị timeout lớn
     * Path Coverage: Boundary value analysis - giá trị lớn
     */
    it('TC004: should accept large timeout values', () => {
      const config: InterceptorConfig = {
        timeout: {
          default: 999999,
          short: 999999,
          fileUpload: 999999,
        },
      } as InterceptorConfig;

      expect(config.timeout.default).toBe(999999);
      expect(config.timeout.short).toBe(999999);
      expect(config.timeout.fileUpload).toBe(999999);
    });

    /**
     * Test Case 5: Kiểm tra timeout với giá trị số 0
     * Input: { timeout: { default: 0, short: 0, fileUpload: 0 } }
     * Expected Output: Object với giá trị timeout = 0
     * Path Coverage: Boundary value analysis - zero
     */
    it('TC005: should accept zero timeout values', () => {
      const config: InterceptorConfig = {
        timeout: {
          default: 0,
          short: 0,
          fileUpload: 0,
        },
      } as InterceptorConfig;

      expect(config.timeout.default).toBe(0);
      expect(config.timeout.short).toBe(0);
      expect(config.timeout.fileUpload).toBe(0);
    });

    /**
     * Test Case 6: Kiểm tra rateLimit configuration với giá trị hợp lệ
     * Input: { rateLimit: { windowMs: 900000, maxRequests: 100, cleanupIntervalMs: 300000 } }
     * Expected Output: Object với rateLimit configuration hợp lệ
     * Path Coverage: Branch rateLimit được định nghĩa
     */
    it('TC006: should accept valid rateLimit configuration', () => {
      const config: InterceptorConfig = {
        rateLimit: {
          windowMs: 900000,
          maxRequests: 100,
          cleanupIntervalMs: 300000,
        },
      } as InterceptorConfig;

      expect(config.rateLimit).toBeDefined();
      expect(config.rateLimit.windowMs).toBe(900000);
      expect(config.rateLimit.maxRequests).toBe(100);
      expect(config.rateLimit.cleanupIntervalMs).toBe(300000);
    });

    /**
     * Test Case 7: Kiểm tra rateLimit với maxRequests = 1
     * Input: { rateLimit: { windowMs: 1000, maxRequests: 1, cleanupIntervalMs: 1000 } }
     * Expected Output: Object với maxRequests = 1
     * Path Coverage: Boundary value - minimum requests
     */
    it('TC007: should accept minimum rateLimit maxRequests', () => {
      const config: InterceptorConfig = {
        rateLimit: {
          windowMs: 1000,
          maxRequests: 1,
          cleanupIntervalMs: 1000,
        },
      } as InterceptorConfig;

      expect(config.rateLimit.maxRequests).toBe(1);
    });

    /**
     * Test Case 8: Kiểm tra rateLimit với maxRequests lớn
     * Input: { rateLimit: { windowMs: 1000, maxRequests: 10000, cleanupIntervalMs: 1000 } }
     * Expected Output: Object với maxRequests = 10000
     * Path Coverage: Boundary value - large requests
     */
    it('TC008: should accept large rateLimit maxRequests', () => {
      const config: InterceptorConfig = {
        rateLimit: {
          windowMs: 1000,
          maxRequests: 10000,
          cleanupIntervalMs: 1000,
        },
      } as InterceptorConfig;

      expect(config.rateLimit.maxRequests).toBe(10000);
    });

    /**
     * Test Case 9: Kiểm tra cache configuration với giá trị hợp lệ
     * Input: { cache: { defaultTtl: 3600, maxTtl: 86400 } }
     * Expected Output: Object với cache configuration hợp lệ
     * Path Coverage: Branch cache được định nghĩa
     */
    it('TC009: should accept valid cache configuration', () => {
      const config: InterceptorConfig = {
        cache: {
          defaultTtl: 3600,
          maxTtl: 86400,
        },
      } as InterceptorConfig;

      expect(config.cache).toBeDefined();
      expect(config.cache.defaultTtl).toBe(3600);
      expect(config.cache.maxTtl).toBe(86400);
    });

    /**
     * Test Case 10: Kiểm tra cache với defaultTtl > maxTtl
     * Input: { cache: { defaultTtl: 100000, maxTtl: 50000 } }
     * Expected Output: Object chấp nhận giá trị (không validate logic)
     * Path Coverage: Edge case - invalid business logic
     */
    it('TC010: should accept cache with defaultTtl greater than maxTtl', () => {
      const config: InterceptorConfig = {
        cache: {
          defaultTtl: 100000,
          maxTtl: 50000,
        },
      } as InterceptorConfig;

      expect(config.cache.defaultTtl).toBe(100000);
      expect(config.cache.maxTtl).toBe(50000);
      expect(config.cache.defaultTtl).toBeGreaterThan(config.cache.maxTtl);
    });

    /**
     * Test Case 11: Kiểm tra cache với TTL = 0
     * Input: { cache: { defaultTtl: 0, maxTtl: 0 } }
     * Expected Output: Object với TTL = 0
     * Path Coverage: Boundary value - zero TTL
     */
    it('TC011: should accept zero cache TTL values', () => {
      const config: InterceptorConfig = {
        cache: {
          defaultTtl: 0,
          maxTtl: 0,
        },
      } as InterceptorConfig;

      expect(config.cache.defaultTtl).toBe(0);
      expect(config.cache.maxTtl).toBe(0);
    });

    /**
     * Test Case 12: Kiểm tra compression configuration với giá trị hợp lệ
     * Input: { compression: { threshold: 1024, level: 6 } }
     * Expected Output: Object với compression configuration hợp lệ
     * Path Coverage: Branch compression được định nghĩa
     */
    it('TC012: should accept valid compression configuration', () => {
      const config: InterceptorConfig = {
        compression: {
          threshold: 1024,
          level: 6,
        },
      } as InterceptorConfig;

      expect(config.compression).toBeDefined();
      expect(config.compression.threshold).toBe(1024);
      expect(config.compression.level).toBe(6);
    });

    /**
     * Test Case 13: Kiểm tra compression với level = 0 (minimum)
     * Input: { compression: { threshold: 1024, level: 0 } }
     * Expected Output: Object với compression level = 0
     * Path Coverage: Boundary value - minimum compression level
     */
    it('TC013: should accept minimum compression level (0)', () => {
      const config: InterceptorConfig = {
        compression: {
          threshold: 1024,
          level: 0,
        },
      } as InterceptorConfig;

      expect(config.compression.level).toBe(0);
    });

    /**
     * Test Case 14: Kiểm tra compression với level = 9 (maximum)
     * Input: { compression: { threshold: 1024, level: 9 } }
     * Expected Output: Object với compression level = 9
     * Path Coverage: Boundary value - maximum compression level
     */
    it('TC014: should accept maximum compression level (9)', () => {
      const config: InterceptorConfig = {
        compression: {
          threshold: 1024,
          level: 9,
        },
      } as InterceptorConfig;

      expect(config.compression.level).toBe(9);
    });

    /**
     * Test Case 15: Kiểm tra compression với threshold = 0
     * Input: { compression: { threshold: 0, level: 6 } }
     * Expected Output: Object với threshold = 0
     * Path Coverage: Boundary value - zero threshold
     */
    it('TC015: should accept zero compression threshold', () => {
      const config: InterceptorConfig = {
        compression: {
          threshold: 0,
          level: 6,
        },
      } as InterceptorConfig;

      expect(config.compression.threshold).toBe(0);
    });

    /**
     * Test Case 16: Kiểm tra performance configuration với giá trị hợp lệ
     * Input: { performance: { slowRequestThreshold: 1000 } }
     * Expected Output: Object với performance configuration hợp lệ
     * Path Coverage: Branch performance được định nghĩa
     */
    it('TC016: should accept valid performance configuration', () => {
      const config: InterceptorConfig = {
        performance: {
          slowRequestThreshold: 1000,
        },
      } as InterceptorConfig;

      expect(config.performance).toBeDefined();
      expect(config.performance.slowRequestThreshold).toBe(1000);
    });

    /**
     * Test Case 17: Kiểm tra performance với threshold = 0
     * Input: { performance: { slowRequestThreshold: 0 } }
     * Expected Output: Object với threshold = 0
     * Path Coverage: Boundary value - zero threshold
     */
    it('TC017: should accept zero performance threshold', () => {
      const config: InterceptorConfig = {
        performance: {
          slowRequestThreshold: 0,
        },
      } as InterceptorConfig;

      expect(config.performance.slowRequestThreshold).toBe(0);
    });

    /**
     * Test Case 18: Kiểm tra full configuration với tất cả thuộc tính
     * Input: Object đầy đủ với tất cả nested properties
     * Expected Output: Object hoàn chỉnh với tất cả giá trị
     * Path Coverage: Tất cả branches được định nghĩa
     */
    it('TC018: should accept full configuration with all properties', () => {
      const config: InterceptorConfig = {
        timeout: {
          default: 30000,
          short: 5000,
          fileUpload: 300000,
        },
        rateLimit: {
          windowMs: 900000,
          maxRequests: 100,
          cleanupIntervalMs: 300000,
        },
        cache: {
          defaultTtl: 3600,
          maxTtl: 86400,
        },
        compression: {
          threshold: 1024,
          level: 6,
        },
        performance: {
          slowRequestThreshold: 1000,
        },
      };

      expect(config.timeout).toBeDefined();
      expect(config.rateLimit).toBeDefined();
      expect(config.cache).toBeDefined();
      expect(config.compression).toBeDefined();
      expect(config.performance).toBeDefined();
    });

    /**
     * Test Case 19: Kiểm tra partial configuration - chỉ timeout
     * Input: { timeout: { default: 10000, short: 2000, fileUpload: 100000 } }
     * Expected Output: Object với chỉ timeout, phần còn lại undefined
     * Path Coverage: Single branch coverage
     */
    it('TC019: should accept partial configuration with only timeout', () => {
      const config: InterceptorConfig = {
        timeout: {
          default: 10000,
          short: 2000,
          fileUpload: 100000,
        },
      } as InterceptorConfig;

      expect(config.timeout).toBeDefined();
      expect(config.rateLimit).toBeUndefined();
      expect(config.cache).toBeUndefined();
      expect(config.compression).toBeUndefined();
      expect(config.performance).toBeUndefined();
    });

    /**
     * Test Case 20: Kiểm tra partial configuration - chỉ rateLimit
     * Input: { rateLimit: { windowMs: 60000, maxRequests: 50, cleanupIntervalMs: 30000 } }
     * Expected Output: Object với chỉ rateLimit
     * Path Coverage: Single branch coverage
     */
    it('TC020: should accept partial configuration with only rateLimit', () => {
      const config: InterceptorConfig = {
        rateLimit: {
          windowMs: 60000,
          maxRequests: 50,
          cleanupIntervalMs: 30000,
        },
      } as InterceptorConfig;

      expect(config.rateLimit).toBeDefined();
      expect(config.timeout).toBeUndefined();
    });

    /**
     * Test Case 21: Kiểm tra nested property types
     * Input: Full configuration
     * Expected Output: Tất cả nested properties là number
     * Path Coverage: Type validation
     */
    it('TC021: should have all nested properties as numbers', () => {
      const config: InterceptorConfig = {
        timeout: {
          default: 30000,
          short: 5000,
          fileUpload: 300000,
        },
        rateLimit: {
          windowMs: 900000,
          maxRequests: 100,
          cleanupIntervalMs: 300000,
        },
        cache: {
          defaultTtl: 3600,
          maxTtl: 86400,
        },
        compression: {
          threshold: 1024,
          level: 6,
        },
        performance: {
          slowRequestThreshold: 1000,
        },
      };

      expect(typeof config.timeout.default).toBe('number');
      expect(typeof config.timeout.short).toBe('number');
      expect(typeof config.timeout.fileUpload).toBe('number');
      expect(typeof config.rateLimit.windowMs).toBe('number');
      expect(typeof config.rateLimit.maxRequests).toBe('number');
      expect(typeof config.rateLimit.cleanupIntervalMs).toBe('number');
      expect(typeof config.cache.defaultTtl).toBe('number');
      expect(typeof config.cache.maxTtl).toBe('number');
      expect(typeof config.compression.threshold).toBe('number');
      expect(typeof config.compression.level).toBe('number');
      expect(typeof config.performance.slowRequestThreshold).toBe('number');
    });

    /**
     * Test Case 22: Kiểm tra combination - timeout + cache
     * Input: Object với timeout và cache
     * Expected Output: Object với 2 properties được định nghĩa
     * Path Coverage: Multiple branch combination
     */
    it('TC022: should accept combination of timeout and cache', () => {
      const config: InterceptorConfig = {
        timeout: {
          default: 20000,
          short: 3000,
          fileUpload: 200000,
        },
        cache: {
          defaultTtl: 1800,
          maxTtl: 7200,
        },
      } as InterceptorConfig;

      expect(config.timeout).toBeDefined();
      expect(config.cache).toBeDefined();
      expect(config.rateLimit).toBeUndefined();
      expect(config.compression).toBeUndefined();
      expect(config.performance).toBeUndefined();
    });

    /**
     * Test Case 23: Kiểm tra combination - rateLimit + compression + performance
     * Input: Object với 3 properties
     * Expected Output: Object với 3 properties được định nghĩa
     * Path Coverage: Multiple branch combination
     */
    it('TC023: should accept combination of rateLimit, compression and performance', () => {
      const config: InterceptorConfig = {
        rateLimit: {
          windowMs: 120000,
          maxRequests: 200,
          cleanupIntervalMs: 60000,
        },
        compression: {
          threshold: 2048,
          level: 7,
        },
        performance: {
          slowRequestThreshold: 2000,
        },
      } as InterceptorConfig;

      expect(config.rateLimit).toBeDefined();
      expect(config.compression).toBeDefined();
      expect(config.performance).toBeDefined();
      expect(config.timeout).toBeUndefined();
      expect(config.cache).toBeUndefined();
    });
  });

  describe('DEFAULT_INTERCEPTOR_CONFIG Constant', () => {
    /**
     * Test Case 24: Kiểm tra constant được định nghĩa
     * Input: N/A
     * Expected Output: Constant tồn tại
     * Path Coverage: Constant initialization
     */
    it('TC024: should be defined', () => {
      expect(DEFAULT_INTERCEPTOR_CONFIG).toBeDefined();
    });

    /**
     * Test Case 25: Kiểm tra timeout.default = 30000
     * Input: N/A
     * Expected Output: timeout.default = 30000
     * Path Coverage: Default value verification
     */
    it('TC025: should have timeout.default = 30000', () => {
      expect(DEFAULT_INTERCEPTOR_CONFIG.timeout.default).toBe(30000);
    });

    /**
     * Test Case 26: Kiểm tra timeout.short = 5000
     * Input: N/A
     * Expected Output: timeout.short = 5000
     * Path Coverage: Default value verification
     */
    it('TC026: should have timeout.short = 5000', () => {
      expect(DEFAULT_INTERCEPTOR_CONFIG.timeout.short).toBe(5000);
    });

    /**
     * Test Case 27: Kiểm tra timeout.fileUpload = 300000
     * Input: N/A
     * Expected Output: timeout.fileUpload = 300000
     * Path Coverage: Default value verification
     */
    it('TC027: should have timeout.fileUpload = 300000', () => {
      expect(DEFAULT_INTERCEPTOR_CONFIG.timeout.fileUpload).toBe(300000);
    });

    /**
     * Test Case 28: Kiểm tra rateLimit.windowMs = 900000
     * Input: N/A
     * Expected Output: rateLimit.windowMs = 900000 (15 minutes)
     * Path Coverage: Default value verification
     */
    it('TC028: should have rateLimit.windowMs = 900000 (15 minutes)', () => {
      expect(DEFAULT_INTERCEPTOR_CONFIG.rateLimit.windowMs).toBe(
        15 * 60 * 1000,
      );
      expect(DEFAULT_INTERCEPTOR_CONFIG.rateLimit.windowMs).toBe(900000);
    });

    /**
     * Test Case 29: Kiểm tra rateLimit.maxRequests = 100
     * Input: N/A
     * Expected Output: rateLimit.maxRequests = 100
     * Path Coverage: Default value verification
     */
    it('TC029: should have rateLimit.maxRequests = 100', () => {
      expect(DEFAULT_INTERCEPTOR_CONFIG.rateLimit.maxRequests).toBe(100);
    });

    /**
     * Test Case 30: Kiểm tra rateLimit.cleanupIntervalMs = 300000
     * Input: N/A
     * Expected Output: rateLimit.cleanupIntervalMs = 300000 (5 minutes)
     * Path Coverage: Default value verification
     */
    it('TC030: should have rateLimit.cleanupIntervalMs = 300000 (5 minutes)', () => {
      expect(DEFAULT_INTERCEPTOR_CONFIG.rateLimit.cleanupIntervalMs).toBe(
        5 * 60 * 1000,
      );
      expect(DEFAULT_INTERCEPTOR_CONFIG.rateLimit.cleanupIntervalMs).toBe(
        300000,
      );
    });

    /**
     * Test Case 31: Kiểm tra cache.defaultTtl = 3600
     * Input: N/A
     * Expected Output: cache.defaultTtl = 3600 (1 hour)
     * Path Coverage: Default value verification
     */
    it('TC031: should have cache.defaultTtl = 3600 (1 hour)', () => {
      expect(DEFAULT_INTERCEPTOR_CONFIG.cache.defaultTtl).toBe(3600);
    });

    /**
     * Test Case 32: Kiểm tra cache.maxTtl = 86400
     * Input: N/A
     * Expected Output: cache.maxTtl = 86400 (24 hours)
     * Path Coverage: Default value verification
     */
    it('TC032: should have cache.maxTtl = 86400 (24 hours)', () => {
      expect(DEFAULT_INTERCEPTOR_CONFIG.cache.maxTtl).toBe(86400);
    });

    /**
     * Test Case 33: Kiểm tra compression.threshold = 1024
     * Input: N/A
     * Expected Output: compression.threshold = 1024 (1KB)
     * Path Coverage: Default value verification
     */
    it('TC033: should have compression.threshold = 1024 (1KB)', () => {
      expect(DEFAULT_INTERCEPTOR_CONFIG.compression.threshold).toBe(1024);
    });

    /**
     * Test Case 34: Kiểm tra compression.level = 6
     * Input: N/A
     * Expected Output: compression.level = 6
     * Path Coverage: Default value verification
     */
    it('TC034: should have compression.level = 6', () => {
      expect(DEFAULT_INTERCEPTOR_CONFIG.compression.level).toBe(6);
    });

    /**
     * Test Case 35: Kiểm tra performance.slowRequestThreshold = 1000
     * Input: N/A
     * Expected Output: performance.slowRequestThreshold = 1000 (1 second)
     * Path Coverage: Default value verification
     */
    it('TC035: should have performance.slowRequestThreshold = 1000 (1 second)', () => {
      expect(DEFAULT_INTERCEPTOR_CONFIG.performance.slowRequestThreshold).toBe(
        1000,
      );
    });

    /**
     * Test Case 36: Kiểm tra tất cả top-level properties tồn tại
     * Input: N/A
     * Expected Output: 5 top-level properties (timeout, rateLimit, cache, compression, performance)
     * Path Coverage: Structure verification
     */
    it('TC036: should have all 5 top-level properties', () => {
      const keys = Object.keys(DEFAULT_INTERCEPTOR_CONFIG);

      expect(keys).toHaveLength(5);
      expect(keys).toContain('timeout');
      expect(keys).toContain('rateLimit');
      expect(keys).toContain('cache');
      expect(keys).toContain('compression');
      expect(keys).toContain('performance');
    });

    /**
     * Test Case 37: Kiểm tra timeout object có 3 properties
     * Input: N/A
     * Expected Output: timeout có 3 properties (default, short, fileUpload)
     * Path Coverage: Nested structure verification
     */
    it('TC037: should have timeout object with 3 properties', () => {
      const timeoutKeys = Object.keys(DEFAULT_INTERCEPTOR_CONFIG.timeout);

      expect(timeoutKeys).toHaveLength(3);
      expect(timeoutKeys).toContain('default');
      expect(timeoutKeys).toContain('short');
      expect(timeoutKeys).toContain('fileUpload');
    });

    /**
     * Test Case 38: Kiểm tra rateLimit object có 3 properties
     * Input: N/A
     * Expected Output: rateLimit có 3 properties
     * Path Coverage: Nested structure verification
     */
    it('TC038: should have rateLimit object with 3 properties', () => {
      const rateLimitKeys = Object.keys(DEFAULT_INTERCEPTOR_CONFIG.rateLimit);

      expect(rateLimitKeys).toHaveLength(3);
      expect(rateLimitKeys).toContain('windowMs');
      expect(rateLimitKeys).toContain('maxRequests');
      expect(rateLimitKeys).toContain('cleanupIntervalMs');
    });

    /**
     * Test Case 39: Kiểm tra cache object có 2 properties
     * Input: N/A
     * Expected Output: cache có 2 properties (defaultTtl, maxTtl)
     * Path Coverage: Nested structure verification
     */
    it('TC039: should have cache object with 2 properties', () => {
      const cacheKeys = Object.keys(DEFAULT_INTERCEPTOR_CONFIG.cache);

      expect(cacheKeys).toHaveLength(2);
      expect(cacheKeys).toContain('defaultTtl');
      expect(cacheKeys).toContain('maxTtl');
    });

    /**
     * Test Case 40: Kiểm tra compression object có 2 properties
     * Input: N/A
     * Expected Output: compression có 2 properties (threshold, level)
     * Path Coverage: Nested structure verification
     */
    it('TC040: should have compression object with 2 properties', () => {
      const compressionKeys = Object.keys(
        DEFAULT_INTERCEPTOR_CONFIG.compression,
      );

      expect(compressionKeys).toHaveLength(2);
      expect(compressionKeys).toContain('threshold');
      expect(compressionKeys).toContain('level');
    });

    /**
     * Test Case 41: Kiểm tra performance object có 1 property
     * Input: N/A
     * Expected Output: performance có 1 property (slowRequestThreshold)
     * Path Coverage: Nested structure verification
     */
    it('TC041: should have performance object with 1 property', () => {
      const performanceKeys = Object.keys(
        DEFAULT_INTERCEPTOR_CONFIG.performance,
      );

      expect(performanceKeys).toHaveLength(1);
      expect(performanceKeys).toContain('slowRequestThreshold');
    });

    /**
     * Test Case 42: Kiểm tra tất cả giá trị là số dương
     * Input: N/A
     * Expected Output: Tất cả giá trị > 0
     * Path Coverage: Value validation
     */
    it('TC042: should have all positive number values', () => {
      expect(DEFAULT_INTERCEPTOR_CONFIG.timeout.default).toBeGreaterThan(0);
      expect(DEFAULT_INTERCEPTOR_CONFIG.timeout.short).toBeGreaterThan(0);
      expect(DEFAULT_INTERCEPTOR_CONFIG.timeout.fileUpload).toBeGreaterThan(0);
      expect(DEFAULT_INTERCEPTOR_CONFIG.rateLimit.windowMs).toBeGreaterThan(0);
      expect(DEFAULT_INTERCEPTOR_CONFIG.rateLimit.maxRequests).toBeGreaterThan(
        0,
      );
      expect(
        DEFAULT_INTERCEPTOR_CONFIG.rateLimit.cleanupIntervalMs,
      ).toBeGreaterThan(0);
      expect(DEFAULT_INTERCEPTOR_CONFIG.cache.defaultTtl).toBeGreaterThan(0);
      expect(DEFAULT_INTERCEPTOR_CONFIG.cache.maxTtl).toBeGreaterThan(0);
      expect(DEFAULT_INTERCEPTOR_CONFIG.compression.threshold).toBeGreaterThan(
        0,
      );
      expect(
        DEFAULT_INTERCEPTOR_CONFIG.compression.level,
      ).toBeGreaterThanOrEqual(0);
      expect(
        DEFAULT_INTERCEPTOR_CONFIG.performance.slowRequestThreshold,
      ).toBeGreaterThan(0);
    });

    /**
     * Test Case 43: Kiểm tra logic business - timeout.short < timeout.default < timeout.fileUpload
     * Input: N/A
     * Expected Output: short < default < fileUpload
     * Path Coverage: Business logic validation
     */
    it('TC043: should have timeout values in logical order (short < default < fileUpload)', () => {
      const {
        short,
        default: defaultTimeout,
        fileUpload,
      } = DEFAULT_INTERCEPTOR_CONFIG.timeout;

      expect(short).toBeLessThan(defaultTimeout);
      expect(defaultTimeout).toBeLessThan(fileUpload);
    });

    /**
     * Test Case 44: Kiểm tra logic business - cache.defaultTtl < cache.maxTtl
     * Input: N/A
     * Expected Output: defaultTtl < maxTtl
     * Path Coverage: Business logic validation
     */
    it('TC044: should have cache defaultTtl less than maxTtl', () => {
      expect(DEFAULT_INTERCEPTOR_CONFIG.cache.defaultTtl).toBeLessThan(
        DEFAULT_INTERCEPTOR_CONFIG.cache.maxTtl,
      );
    });

    /**
     * Test Case 45: Kiểm tra compression level trong range 0-9
     * Input: N/A
     * Expected Output: 0 <= level <= 9
     * Path Coverage: Range validation
     */
    it('TC045: should have compression level between 0 and 9', () => {
      const level = DEFAULT_INTERCEPTOR_CONFIG.compression.level;

      expect(level).toBeGreaterThanOrEqual(0);
      expect(level).toBeLessThanOrEqual(9);
    });

    /**
     * Test Case 46: Kiểm tra type matching với InterceptorConfig
     * Input: DEFAULT_INTERCEPTOR_CONFIG
     * Expected Output: Phù hợp với InterceptorConfig interface
     * Path Coverage: Type compatibility
     */
    it('TC046: should match InterceptorConfig interface', () => {
      const config: InterceptorConfig = DEFAULT_INTERCEPTOR_CONFIG;

      expect(config).toBeDefined();
      expect(typeof config.timeout).toBe('object');
      expect(typeof config.rateLimit).toBe('object');
      expect(typeof config.cache).toBe('object');
      expect(typeof config.compression).toBe('object');
      expect(typeof config.performance).toBe('object');
    });

    /**
     * Test Case 47: Kiểm tra deep equality
     * Input: Object tương đương
     * Expected Output: Deep equal
     * Path Coverage: Full structure validation
     */
    it('TC047: should deep equal to expected default values', () => {
      const expectedDefaults: InterceptorConfig = {
        timeout: {
          default: 30000,
          short: 5000,
          fileUpload: 300000,
        },
        rateLimit: {
          windowMs: 900000,
          maxRequests: 100,
          cleanupIntervalMs: 300000,
        },
        cache: {
          defaultTtl: 3600,
          maxTtl: 86400,
        },
        compression: {
          threshold: 1024,
          level: 6,
        },
        performance: {
          slowRequestThreshold: 1000,
        },
      };

      expect(DEFAULT_INTERCEPTOR_CONFIG).toEqual(expectedDefaults);
    });

    /**
     * Test Case 48: Kiểm tra serialization/deserialization
     * Input: DEFAULT_INTERCEPTOR_CONFIG
     * Expected Output: Object giống sau khi JSON parse/stringify
     * Path Coverage: Serialization compatibility
     */
    it('TC048: should be serializable to JSON and back', () => {
      const serialized = JSON.stringify(DEFAULT_INTERCEPTOR_CONFIG);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual(DEFAULT_INTERCEPTOR_CONFIG);
    });

    /**
     * Test Case 49: Kiểm tra immutability reference
     * Input: N/A
     * Expected Output: Cùng reference
     * Path Coverage: Constant reference check
     */
    it('TC049: should maintain its reference (constant check)', () => {
      const reference1 = DEFAULT_INTERCEPTOR_CONFIG;
      const reference2 = DEFAULT_INTERCEPTOR_CONFIG;

      expect(reference1).toBe(reference2);
    });

    /**
     * Test Case 50: Kiểm tra tất cả nested values là number type
     * Input: N/A
     * Expected Output: Tất cả values là number
     * Path Coverage: Type validation
     */
    it('TC050: should have all nested values as number type', () => {
      const config = DEFAULT_INTERCEPTOR_CONFIG;

      // Timeout
      expect(typeof config.timeout.default).toBe('number');
      expect(typeof config.timeout.short).toBe('number');
      expect(typeof config.timeout.fileUpload).toBe('number');

      // RateLimit
      expect(typeof config.rateLimit.windowMs).toBe('number');
      expect(typeof config.rateLimit.maxRequests).toBe('number');
      expect(typeof config.rateLimit.cleanupIntervalMs).toBe('number');

      // Cache
      expect(typeof config.cache.defaultTtl).toBe('number');
      expect(typeof config.cache.maxTtl).toBe('number');

      // Compression
      expect(typeof config.compression.threshold).toBe('number');
      expect(typeof config.compression.level).toBe('number');

      // Performance
      expect(typeof config.performance.slowRequestThreshold).toBe('number');
    });

    /**
     * Test Case 51: Kiểm tra không có thuộc tính thừa ở top-level
     * Input: N/A
     * Expected Output: Chỉ có 5 properties
     * Path Coverage: Extra properties check
     */
    it('TC051: should not have extra top-level properties', () => {
      const allowedKeys = [
        'timeout',
        'rateLimit',
        'cache',
        'compression',
        'performance',
      ];
      const actualKeys = Object.keys(DEFAULT_INTERCEPTOR_CONFIG);

      expect(actualKeys.sort()).toEqual(allowedKeys.sort());
    });

    /**
     * Test Case 52: Kiểm tra rateLimit.cleanupIntervalMs < rateLimit.windowMs
     * Input: N/A
     * Expected Output: cleanupIntervalMs < windowMs
     * Path Coverage: Business logic validation
     */
    it('TC052: should have rateLimit cleanupIntervalMs less than windowMs', () => {
      expect(
        DEFAULT_INTERCEPTOR_CONFIG.rateLimit.cleanupIntervalMs,
      ).toBeLessThan(DEFAULT_INTERCEPTOR_CONFIG.rateLimit.windowMs);
    });
  });

  describe('Integration and Usage Scenarios', () => {
    /**
     * Test Case 53: Scenario - Override timeout với spread operator
     * Input: { ...DEFAULT_INTERCEPTOR_CONFIG, timeout: { ...timeout, default: 60000 } }
     * Expected Output: Merged config với timeout.default = 60000
     * Path Coverage: Override pattern
     */
    it('TC053: should allow overriding timeout with spread operator', () => {
      const customConfig: InterceptorConfig = {
        ...DEFAULT_INTERCEPTOR_CONFIG,
        timeout: {
          ...DEFAULT_INTERCEPTOR_CONFIG.timeout,
          default: 60000,
        },
      };

      expect(customConfig.timeout.default).toBe(60000);
      expect(customConfig.timeout.short).toBe(5000); // unchanged
      expect(customConfig.rateLimit).toEqual(
        DEFAULT_INTERCEPTOR_CONFIG.rateLimit,
      );
    });

    /**
     * Test Case 54: Scenario - Production config (stricter limits)
     * Input: Production configuration
     * Expected Output: Config với giá trị production
     * Path Coverage: Production use case
     */
    it('TC054: should support production configuration (stricter limits)', () => {
      const prodConfig: InterceptorConfig = {
        timeout: {
          default: 10000,
          short: 3000,
          fileUpload: 120000,
        },
        rateLimit: {
          windowMs: 60000,
          maxRequests: 50,
          cleanupIntervalMs: 30000,
        },
        cache: {
          defaultTtl: 1800,
          maxTtl: 43200,
        },
        compression: {
          threshold: 512,
          level: 9,
        },
        performance: {
          slowRequestThreshold: 500,
        },
      };

      expect(prodConfig.timeout.default).toBe(10000);
      expect(prodConfig.rateLimit.maxRequests).toBe(50);
      expect(prodConfig.compression.level).toBe(9);
    });

    /**
     * Test Case 55: Scenario - Development config (relaxed limits)
     * Input: Development configuration
     * Expected Output: Config với giá trị development
     * Path Coverage: Development use case
     */
    it('TC055: should support development configuration (relaxed limits)', () => {
      const devConfig: InterceptorConfig = {
        timeout: {
          default: 120000,
          short: 30000,
          fileUpload: 600000,
        },
        rateLimit: {
          windowMs: 900000,
          maxRequests: 1000,
          cleanupIntervalMs: 300000,
        },
        cache: {
          defaultTtl: 60,
          maxTtl: 300,
        },
        compression: {
          threshold: 10240,
          level: 1,
        },
        performance: {
          slowRequestThreshold: 5000,
        },
      };

      expect(devConfig.timeout.default).toBe(120000);
      expect(devConfig.rateLimit.maxRequests).toBe(1000);
      expect(devConfig.cache.defaultTtl).toBe(60);
    });

    /**
     * Test Case 56: Scenario - Partial override chỉ rateLimit
     * Input: Override only rateLimit
     * Expected Output: RateLimit changed, others unchanged
     * Path Coverage: Partial override pattern
     */
    it('TC056: should allow partial override of only rateLimit', () => {
      const customConfig: InterceptorConfig = {
        ...DEFAULT_INTERCEPTOR_CONFIG,
        rateLimit: {
          windowMs: 30000,
          maxRequests: 10,
          cleanupIntervalMs: 15000,
        },
      };

      expect(customConfig.rateLimit.maxRequests).toBe(10);
      expect(customConfig.timeout).toEqual(DEFAULT_INTERCEPTOR_CONFIG.timeout);
      expect(customConfig.cache).toEqual(DEFAULT_INTERCEPTOR_CONFIG.cache);
    });

    /**
     * Test Case 57: Scenario - Disable compression (threshold = Number.MAX_VALUE)
     * Input: compression.threshold = Number.MAX_VALUE
     * Expected Output: Compression effectively disabled
     * Path Coverage: Edge case - disable feature
     */
    it('TC057: should support disabling compression with max threshold', () => {
      const config: InterceptorConfig = {
        ...DEFAULT_INTERCEPTOR_CONFIG,
        compression: {
          threshold: Number.MAX_SAFE_INTEGER,
          level: 0,
        },
      };

      expect(config.compression.threshold).toBe(Number.MAX_SAFE_INTEGER);
      expect(config.compression.level).toBe(0);
    });

    /**
     * Test Case 58: Scenario - No cache (TTL = 0)
     * Input: cache with TTL = 0
     * Expected Output: Cache disabled
     * Path Coverage: Edge case - disable cache
     */
    it('TC058: should support disabling cache with zero TTL', () => {
      const config: InterceptorConfig = {
        ...DEFAULT_INTERCEPTOR_CONFIG,
        cache: {
          defaultTtl: 0,
          maxTtl: 0,
        },
      };

      expect(config.cache.defaultTtl).toBe(0);
      expect(config.cache.maxTtl).toBe(0);
    });

    /**
     * Test Case 59: Scenario - Aggressive rate limiting
     * Input: Very strict rate limit
     * Expected Output: Strict rate limit config
     * Path Coverage: Edge case - strict limits
     */
    it('TC059: should support aggressive rate limiting', () => {
      const config: InterceptorConfig = {
        ...DEFAULT_INTERCEPTOR_CONFIG,
        rateLimit: {
          windowMs: 10000,
          maxRequests: 1,
          cleanupIntervalMs: 5000,
        },
      };

      expect(config.rateLimit.windowMs).toBe(10000);
      expect(config.rateLimit.maxRequests).toBe(1);
    });

    /**
     * Test Case 60: Scenario - Maximum compression
     * Input: Maximum compression settings
     * Expected Output: Max compression config
     * Path Coverage: Edge case - max compression
     */
    it('TC060: should support maximum compression settings', () => {
      const config: InterceptorConfig = {
        ...DEFAULT_INTERCEPTOR_CONFIG,
        compression: {
          threshold: 0,
          level: 9,
        },
      };

      expect(config.compression.threshold).toBe(0);
      expect(config.compression.level).toBe(9);
    });
  });
});
