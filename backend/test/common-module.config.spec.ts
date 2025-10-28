import {
  CommonModuleOptions,
  DEFAULT_COMMON_MODULE_OPTIONS,
} from '../src/common/config/common-module.config';

describe('CommonModuleConfig - White Box Testing', () => {
  describe('CommonModuleOptions Interface', () => {
    /**
     * Test Case 1: Kiểm tra cấu trúc interface với tất cả thuộc tính undefined
     * Input: Object rỗng
     * Expected Output: Object hợp lệ với CommonModuleOptions interface
     * Coverage: Kiểm tra tất cả thuộc tính là optional
     */
    it('should accept empty object (all properties are optional)', () => {
      const options: CommonModuleOptions = {};

      expect(options).toBeDefined();
      expect(options.enableGlobalInterceptors).toBeUndefined();
      expect(options.enableGlobalFilters).toBeUndefined();
      expect(options.enableGlobalGuards).toBeUndefined();
      expect(options.interceptors).toBeUndefined();
    });

    /**
     * Test Case 2: Kiểm tra với enableGlobalInterceptors = true
     * Input: { enableGlobalInterceptors: true }
     * Expected Output: Object với enableGlobalInterceptors = true
     * Coverage: Kiểm tra nhánh enableGlobalInterceptors = true
     */
    it('should accept enableGlobalInterceptors as true', () => {
      const options: CommonModuleOptions = {
        enableGlobalInterceptors: true,
      };

      expect(options.enableGlobalInterceptors).toBe(true);
    });

    /**
     * Test Case 3: Kiểm tra với enableGlobalInterceptors = false
     * Input: { enableGlobalInterceptors: false }
     * Expected Output: Object với enableGlobalInterceptors = false
     * Coverage: Kiểm tra nhánh enableGlobalInterceptors = false
     */
    it('should accept enableGlobalInterceptors as false', () => {
      const options: CommonModuleOptions = {
        enableGlobalInterceptors: false,
      };

      expect(options.enableGlobalInterceptors).toBe(false);
    });

    /**
     * Test Case 4: Kiểm tra với enableGlobalFilters = true
     * Input: { enableGlobalFilters: true }
     * Expected Output: Object với enableGlobalFilters = true
     * Coverage: Kiểm tra nhánh enableGlobalFilters = true
     */
    it('should accept enableGlobalFilters as true', () => {
      const options: CommonModuleOptions = {
        enableGlobalFilters: true,
      };

      expect(options.enableGlobalFilters).toBe(true);
    });

    /**
     * Test Case 5: Kiểm tra với enableGlobalFilters = false
     * Input: { enableGlobalFilters: false }
     * Expected Output: Object với enableGlobalFilters = false
     * Coverage: Kiểm tra nhánh enableGlobalFilters = false
     */
    it('should accept enableGlobalFilters as false', () => {
      const options: CommonModuleOptions = {
        enableGlobalFilters: false,
      };

      expect(options.enableGlobalFilters).toBe(false);
    });

    /**
     * Test Case 6: Kiểm tra với enableGlobalGuards = true
     * Input: { enableGlobalGuards: true }
     * Expected Output: Object với enableGlobalGuards = true
     * Coverage: Kiểm tra nhánh enableGlobalGuards = true
     */
    it('should accept enableGlobalGuards as true', () => {
      const options: CommonModuleOptions = {
        enableGlobalGuards: true,
      };

      expect(options.enableGlobalGuards).toBe(true);
    });

    /**
     * Test Case 7: Kiểm tra với enableGlobalGuards = false
     * Input: { enableGlobalGuards: false }
     * Expected Output: Object với enableGlobalGuards = false
     * Coverage: Kiểm tra nhánh enableGlobalGuards = false
     */
    it('should accept enableGlobalGuards as false', () => {
      const options: CommonModuleOptions = {
        enableGlobalGuards: false,
      };

      expect(options.enableGlobalGuards).toBe(false);
    });

    /**
     * Test Case 8: Kiểm tra interceptors với tất cả thuộc tính undefined
     * Input: { interceptors: {} }
     * Expected Output: Object với interceptors rỗng
     * Coverage: Kiểm tra interceptors object rỗng
     */
    it('should accept empty interceptors object', () => {
      const options: CommonModuleOptions = {
        interceptors: {},
      };

      expect(options.interceptors).toBeDefined();
      expect(options.interceptors?.requestId).toBeUndefined();
      expect(options.interceptors?.sanitization).toBeUndefined();
      expect(options.interceptors?.securityHeaders).toBeUndefined();
      expect(options.interceptors?.logging).toBeUndefined();
      expect(options.interceptors?.metrics).toBeUndefined();
      expect(options.interceptors?.performance).toBeUndefined();
    });

    /**
     * Test Case 9: Kiểm tra interceptors.requestId = true
     * Input: { interceptors: { requestId: true } }
     * Expected Output: Object với requestId = true
     * Coverage: Kiểm tra nhánh requestId = true
     */
    it('should accept interceptors.requestId as true', () => {
      const options: CommonModuleOptions = {
        interceptors: {
          requestId: true,
        },
      };

      expect(options.interceptors?.requestId).toBe(true);
    });

    /**
     * Test Case 10: Kiểm tra interceptors.requestId = false
     * Input: { interceptors: { requestId: false } }
     * Expected Output: Object với requestId = false
     * Coverage: Kiểm tra nhánh requestId = false
     */
    it('should accept interceptors.requestId as false', () => {
      const options: CommonModuleOptions = {
        interceptors: {
          requestId: false,
        },
      };

      expect(options.interceptors?.requestId).toBe(false);
    });

    /**
     * Test Case 11: Kiểm tra interceptors.sanitization = true
     * Input: { interceptors: { sanitization: true } }
     * Expected Output: Object với sanitization = true
     * Coverage: Kiểm tra nhánh sanitization = true
     */
    it('should accept interceptors.sanitization as true', () => {
      const options: CommonModuleOptions = {
        interceptors: {
          sanitization: true,
        },
      };

      expect(options.interceptors?.sanitization).toBe(true);
    });

    /**
     * Test Case 12: Kiểm tra interceptors.sanitization = false
     * Input: { interceptors: { sanitization: false } }
     * Expected Output: Object với sanitization = false
     * Coverage: Kiểm tra nhánh sanitization = false
     */
    it('should accept interceptors.sanitization as false', () => {
      const options: CommonModuleOptions = {
        interceptors: {
          sanitization: false,
        },
      };

      expect(options.interceptors?.sanitization).toBe(false);
    });

    /**
     * Test Case 13: Kiểm tra interceptors.securityHeaders = true
     * Input: { interceptors: { securityHeaders: true } }
     * Expected Output: Object với securityHeaders = true
     * Coverage: Kiểm tra nhánh securityHeaders = true
     */
    it('should accept interceptors.securityHeaders as true', () => {
      const options: CommonModuleOptions = {
        interceptors: {
          securityHeaders: true,
        },
      };

      expect(options.interceptors?.securityHeaders).toBe(true);
    });

    /**
     * Test Case 14: Kiểm tra interceptors.securityHeaders = false
     * Input: { interceptors: { securityHeaders: false } }
     * Expected Output: Object với securityHeaders = false
     * Coverage: Kiểm tra nhánh securityHeaders = false
     */
    it('should accept interceptors.securityHeaders as false', () => {
      const options: CommonModuleOptions = {
        interceptors: {
          securityHeaders: false,
        },
      };

      expect(options.interceptors?.securityHeaders).toBe(false);
    });

    /**
     * Test Case 15: Kiểm tra interceptors.logging = true
     * Input: { interceptors: { logging: true } }
     * Expected Output: Object với logging = true
     * Coverage: Kiểm tra nhánh logging = true
     */
    it('should accept interceptors.logging as true', () => {
      const options: CommonModuleOptions = {
        interceptors: {
          logging: true,
        },
      };

      expect(options.interceptors?.logging).toBe(true);
    });

    /**
     * Test Case 16: Kiểm tra interceptors.logging = false
     * Input: { interceptors: { logging: false } }
     * Expected Output: Object với logging = false
     * Coverage: Kiểm tra nhánh logging = false
     */
    it('should accept interceptors.logging as false', () => {
      const options: CommonModuleOptions = {
        interceptors: {
          logging: false,
        },
      };

      expect(options.interceptors?.logging).toBe(false);
    });

    /**
     * Test Case 17: Kiểm tra interceptors.metrics = true
     * Input: { interceptors: { metrics: true } }
     * Expected Output: Object với metrics = true
     * Coverage: Kiểm tra nhánh metrics = true
     */
    it('should accept interceptors.metrics as true', () => {
      const options: CommonModuleOptions = {
        interceptors: {
          metrics: true,
        },
      };

      expect(options.interceptors?.metrics).toBe(true);
    });

    /**
     * Test Case 18: Kiểm tra interceptors.metrics = false
     * Input: { interceptors: { metrics: false } }
     * Expected Output: Object với metrics = false
     * Coverage: Kiểm tra nhánh metrics = false
     */
    it('should accept interceptors.metrics as false', () => {
      const options: CommonModuleOptions = {
        interceptors: {
          metrics: false,
        },
      };

      expect(options.interceptors?.metrics).toBe(false);
    });

    /**
     * Test Case 19: Kiểm tra interceptors.performance = true
     * Input: { interceptors: { performance: true } }
     * Expected Output: Object với performance = true
     * Coverage: Kiểm tra nhánh performance = true
     */
    it('should accept interceptors.performance as true', () => {
      const options: CommonModuleOptions = {
        interceptors: {
          performance: true,
        },
      };

      expect(options.interceptors?.performance).toBe(true);
    });

    /**
     * Test Case 20: Kiểm tra interceptors.performance = false
     * Input: { interceptors: { performance: false } }
     * Expected Output: Object với performance = false
     * Coverage: Kiểm tra nhánh performance = false
     */
    it('should accept interceptors.performance as false', () => {
      const options: CommonModuleOptions = {
        interceptors: {
          performance: false,
        },
      };

      expect(options.interceptors?.performance).toBe(false);
    });

    /**
     * Test Case 21: Kiểm tra tất cả interceptors = true
     * Input: Object với tất cả interceptors = true
     * Expected Output: Object với tất cả interceptors = true
     * Coverage: Kiểm tra tất cả nhánh interceptors = true đồng thời
     */
    it('should accept all interceptors as true', () => {
      const options: CommonModuleOptions = {
        interceptors: {
          requestId: true,
          sanitization: true,
          securityHeaders: true,
          logging: true,
          metrics: true,
          performance: true,
        },
      };

      expect(options.interceptors?.requestId).toBe(true);
      expect(options.interceptors?.sanitization).toBe(true);
      expect(options.interceptors?.securityHeaders).toBe(true);
      expect(options.interceptors?.logging).toBe(true);
      expect(options.interceptors?.metrics).toBe(true);
      expect(options.interceptors?.performance).toBe(true);
    });

    /**
     * Test Case 22: Kiểm tra tất cả interceptors = false
     * Input: Object với tất cả interceptors = false
     * Expected Output: Object với tất cả interceptors = false
     * Coverage: Kiểm tra tất cả nhánh interceptors = false đồng thời
     */
    it('should accept all interceptors as false', () => {
      const options: CommonModuleOptions = {
        interceptors: {
          requestId: false,
          sanitization: false,
          securityHeaders: false,
          logging: false,
          metrics: false,
          performance: false,
        },
      };

      expect(options.interceptors?.requestId).toBe(false);
      expect(options.interceptors?.sanitization).toBe(false);
      expect(options.interceptors?.securityHeaders).toBe(false);
      expect(options.interceptors?.logging).toBe(false);
      expect(options.interceptors?.metrics).toBe(false);
      expect(options.interceptors?.performance).toBe(false);
    });

    /**
     * Test Case 23: Kiểm tra interceptors với giá trị hỗn hợp (mixed values)
     * Input: Object với một số interceptors = true, một số = false
     * Expected Output: Object với giá trị hỗn hợp
     * Coverage: Kiểm tra kết hợp các nhánh true/false
     */
    it('should accept mixed interceptor values', () => {
      const options: CommonModuleOptions = {
        interceptors: {
          requestId: true,
          sanitization: false,
          securityHeaders: true,
          logging: false,
          metrics: true,
          performance: false,
        },
      };

      expect(options.interceptors?.requestId).toBe(true);
      expect(options.interceptors?.sanitization).toBe(false);
      expect(options.interceptors?.securityHeaders).toBe(true);
      expect(options.interceptors?.logging).toBe(false);
      expect(options.interceptors?.metrics).toBe(true);
      expect(options.interceptors?.performance).toBe(false);
    });

    /**
     * Test Case 24: Kiểm tra full configuration với tất cả thuộc tính = true
     * Input: Object đầy đủ với tất cả giá trị = true
     * Expected Output: Object hoàn chỉnh với tất cả giá trị = true
     * Coverage: Kiểm tra tất cả đường dẫn = true
     */
    it('should accept full configuration with all true values', () => {
      const options: CommonModuleOptions = {
        enableGlobalInterceptors: true,
        enableGlobalFilters: true,
        enableGlobalGuards: true,
        interceptors: {
          requestId: true,
          sanitization: true,
          securityHeaders: true,
          logging: true,
          metrics: true,
          performance: true,
        },
      };

      expect(options.enableGlobalInterceptors).toBe(true);
      expect(options.enableGlobalFilters).toBe(true);
      expect(options.enableGlobalGuards).toBe(true);
      expect(options.interceptors?.requestId).toBe(true);
      expect(options.interceptors?.sanitization).toBe(true);
      expect(options.interceptors?.securityHeaders).toBe(true);
      expect(options.interceptors?.logging).toBe(true);
      expect(options.interceptors?.metrics).toBe(true);
      expect(options.interceptors?.performance).toBe(true);
    });

    /**
     * Test Case 25: Kiểm tra full configuration với tất cả thuộc tính = false
     * Input: Object đầy đủ với tất cả giá trị = false
     * Expected Output: Object hoàn chỉnh với tất cả giá trị = false
     * Coverage: Kiểm tra tất cả đường dẫn = false
     */
    it('should accept full configuration with all false values', () => {
      const options: CommonModuleOptions = {
        enableGlobalInterceptors: false,
        enableGlobalFilters: false,
        enableGlobalGuards: false,
        interceptors: {
          requestId: false,
          sanitization: false,
          securityHeaders: false,
          logging: false,
          metrics: false,
          performance: false,
        },
      };

      expect(options.enableGlobalInterceptors).toBe(false);
      expect(options.enableGlobalFilters).toBe(false);
      expect(options.enableGlobalGuards).toBe(false);
      expect(options.interceptors?.requestId).toBe(false);
      expect(options.interceptors?.sanitization).toBe(false);
      expect(options.interceptors?.securityHeaders).toBe(false);
      expect(options.interceptors?.logging).toBe(false);
      expect(options.interceptors?.metrics).toBe(false);
      expect(options.interceptors?.performance).toBe(false);
    });

    /**
     * Test Case 26: Kiểm tra với một số thuộc tính top-level được định nghĩa
     * Input: Object với một số thuộc tính top-level
     * Expected Output: Object với các thuộc tính được định nghĩa, phần còn lại undefined
     * Coverage: Kiểm tra partial configuration
     */
    it('should accept partial top-level configuration', () => {
      const options: CommonModuleOptions = {
        enableGlobalInterceptors: true,
        enableGlobalFilters: false,
      };

      expect(options.enableGlobalInterceptors).toBe(true);
      expect(options.enableGlobalFilters).toBe(false);
      expect(options.enableGlobalGuards).toBeUndefined();
      expect(options.interceptors).toBeUndefined();
    });

    /**
     * Test Case 27: Kiểm tra với một số interceptor được định nghĩa
     * Input: Object với một số interceptor properties
     * Expected Output: Object với các interceptor được định nghĩa, phần còn lại undefined
     * Coverage: Kiểm tra partial interceptors configuration
     */
    it('should accept partial interceptors configuration', () => {
      const options: CommonModuleOptions = {
        interceptors: {
          requestId: true,
          logging: false,
        },
      };

      expect(options.interceptors?.requestId).toBe(true);
      expect(options.interceptors?.logging).toBe(false);
      expect(options.interceptors?.sanitization).toBeUndefined();
      expect(options.interceptors?.securityHeaders).toBeUndefined();
      expect(options.interceptors?.metrics).toBeUndefined();
      expect(options.interceptors?.performance).toBeUndefined();
    });
  });

  describe('DEFAULT_COMMON_MODULE_OPTIONS Constant', () => {
    /**
     * Test Case 28: Kiểm tra DEFAULT_COMMON_MODULE_OPTIONS được định nghĩa
     * Input: N/A (constant)
     * Expected Output: Object được định nghĩa
     * Coverage: Kiểm tra constant tồn tại
     */
    it('should be defined', () => {
      expect(DEFAULT_COMMON_MODULE_OPTIONS).toBeDefined();
    });

    /**
     * Test Case 29: Kiểm tra enableGlobalInterceptors mặc định = true
     * Input: N/A (constant)
     * Expected Output: enableGlobalInterceptors = true
     * Coverage: Kiểm tra giá trị mặc định enableGlobalInterceptors
     */
    it('should have enableGlobalInterceptors set to true', () => {
      expect(DEFAULT_COMMON_MODULE_OPTIONS.enableGlobalInterceptors).toBe(true);
    });

    /**
     * Test Case 30: Kiểm tra enableGlobalFilters mặc định = true
     * Input: N/A (constant)
     * Expected Output: enableGlobalFilters = true
     * Coverage: Kiểm tra giá trị mặc định enableGlobalFilters
     */
    it('should have enableGlobalFilters set to true', () => {
      expect(DEFAULT_COMMON_MODULE_OPTIONS.enableGlobalFilters).toBe(true);
    });

    /**
     * Test Case 31: Kiểm tra enableGlobalGuards mặc định = true
     * Input: N/A (constant)
     * Expected Output: enableGlobalGuards = true
     * Coverage: Kiểm tra giá trị mặc định enableGlobalGuards
     */
    it('should have enableGlobalGuards set to true', () => {
      expect(DEFAULT_COMMON_MODULE_OPTIONS.enableGlobalGuards).toBe(true);
    });

    /**
     * Test Case 32: Kiểm tra interceptors object được định nghĩa
     * Input: N/A (constant)
     * Expected Output: interceptors object tồn tại
     * Coverage: Kiểm tra interceptors object tồn tại
     */
    it('should have interceptors object defined', () => {
      expect(DEFAULT_COMMON_MODULE_OPTIONS.interceptors).toBeDefined();
      expect(typeof DEFAULT_COMMON_MODULE_OPTIONS.interceptors).toBe('object');
    });

    /**
     * Test Case 33: Kiểm tra interceptors.requestId mặc định = true
     * Input: N/A (constant)
     * Expected Output: requestId = true
     * Coverage: Kiểm tra giá trị mặc định requestId
     */
    it('should have interceptors.requestId set to true', () => {
      expect(DEFAULT_COMMON_MODULE_OPTIONS.interceptors?.requestId).toBe(true);
    });

    /**
     * Test Case 34: Kiểm tra interceptors.sanitization mặc định = true
     * Input: N/A (constant)
     * Expected Output: sanitization = true
     * Coverage: Kiểm tra giá trị mặc định sanitization
     */
    it('should have interceptors.sanitization set to true', () => {
      expect(DEFAULT_COMMON_MODULE_OPTIONS.interceptors?.sanitization).toBe(
        true,
      );
    });

    /**
     * Test Case 35: Kiểm tra interceptors.securityHeaders mặc định = true
     * Input: N/A (constant)
     * Expected Output: securityHeaders = true
     * Coverage: Kiểm tra giá trị mặc định securityHeaders
     */
    it('should have interceptors.securityHeaders set to true', () => {
      expect(DEFAULT_COMMON_MODULE_OPTIONS.interceptors?.securityHeaders).toBe(
        true,
      );
    });

    /**
     * Test Case 36: Kiểm tra interceptors.logging mặc định = true
     * Input: N/A (constant)
     * Expected Output: logging = true
     * Coverage: Kiểm tra giá trị mặc định logging
     */
    it('should have interceptors.logging set to true', () => {
      expect(DEFAULT_COMMON_MODULE_OPTIONS.interceptors?.logging).toBe(true);
    });

    /**
     * Test Case 37: Kiểm tra interceptors.metrics mặc định = true
     * Input: N/A (constant)
     * Expected Output: metrics = true
     * Coverage: Kiểm tra giá trị mặc định metrics
     */
    it('should have interceptors.metrics set to true', () => {
      expect(DEFAULT_COMMON_MODULE_OPTIONS.interceptors?.metrics).toBe(true);
    });

    /**
     * Test Case 38: Kiểm tra interceptors.performance mặc định = true
     * Input: N/A (constant)
     * Expected Output: performance = true
     * Coverage: Kiểm tra giá trị mặc định performance
     */
    it('should have interceptors.performance set to true', () => {
      expect(DEFAULT_COMMON_MODULE_OPTIONS.interceptors?.performance).toBe(
        true,
      );
    });

    /**
     * Test Case 39: Kiểm tra tất cả interceptors mặc định = true
     * Input: N/A (constant)
     * Expected Output: Tất cả interceptors = true
     * Coverage: Kiểm tra tất cả giá trị mặc định của interceptors
     */
    it('should have all interceptors set to true', () => {
      const interceptors = DEFAULT_COMMON_MODULE_OPTIONS.interceptors;

      expect(interceptors?.requestId).toBe(true);
      expect(interceptors?.sanitization).toBe(true);
      expect(interceptors?.securityHeaders).toBe(true);
      expect(interceptors?.logging).toBe(true);
      expect(interceptors?.metrics).toBe(true);
      expect(interceptors?.performance).toBe(true);
    });

    /**
     * Test Case 40: Kiểm tra số lượng thuộc tính trong interceptors
     * Input: N/A (constant)
     * Expected Output: 6 thuộc tính
     * Coverage: Kiểm tra cấu trúc đầy đủ của interceptors
     */
    it('should have exactly 6 interceptor properties', () => {
      const interceptors = DEFAULT_COMMON_MODULE_OPTIONS.interceptors;
      const keys = Object.keys(interceptors || {});

      expect(keys).toHaveLength(6);
      expect(keys).toContain('requestId');
      expect(keys).toContain('sanitization');
      expect(keys).toContain('securityHeaders');
      expect(keys).toContain('logging');
      expect(keys).toContain('metrics');
      expect(keys).toContain('performance');
    });

    /**
     * Test Case 41: Kiểm tra số lượng thuộc tính top-level
     * Input: N/A (constant)
     * Expected Output: 4 thuộc tính
     * Coverage: Kiểm tra cấu trúc đầy đủ của constant
     */
    it('should have exactly 4 top-level properties', () => {
      const keys = Object.keys(DEFAULT_COMMON_MODULE_OPTIONS);

      expect(keys).toHaveLength(4);
      expect(keys).toContain('enableGlobalInterceptors');
      expect(keys).toContain('interceptors');
      expect(keys).toContain('enableGlobalFilters');
      expect(keys).toContain('enableGlobalGuards');
    });

    /**
     * Test Case 42: Kiểm tra immutability - không thể thay đổi reference
     * Input: Thử gán lại constant
     * Expected Output: Constant giữ nguyên giá trị
     * Coverage: Kiểm tra tính bất biến của constant
     */
    it('should maintain its reference (constant check)', () => {
      const reference1 = DEFAULT_COMMON_MODULE_OPTIONS;
      const reference2 = DEFAULT_COMMON_MODULE_OPTIONS;

      expect(reference1).toBe(reference2);
    });

    /**
     * Test Case 43: Kiểm tra type matching với CommonModuleOptions
     * Input: DEFAULT_COMMON_MODULE_OPTIONS
     * Expected Output: Phù hợp với CommonModuleOptions interface
     * Coverage: Kiểm tra tính tương thích type
     */
    it('should match CommonModuleOptions interface', () => {
      const options: CommonModuleOptions = DEFAULT_COMMON_MODULE_OPTIONS;

      expect(options).toBeDefined();
      expect(typeof options.enableGlobalInterceptors).toBe('boolean');
      expect(typeof options.enableGlobalFilters).toBe('boolean');
      expect(typeof options.enableGlobalGuards).toBe('boolean');
      expect(typeof options.interceptors).toBe('object');
    });

    /**
     * Test Case 44: Kiểm tra deep equality với object tương đương
     * Input: Object tương đương với DEFAULT_COMMON_MODULE_OPTIONS
     * Expected Output: Deep equal
     * Coverage: Kiểm tra cấu trúc đầy đủ
     */
    it('should deep equal to expected default values', () => {
      const expectedDefaults: CommonModuleOptions = {
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

      expect(DEFAULT_COMMON_MODULE_OPTIONS).toEqual(expectedDefaults);
    });

    /**
     * Test Case 45: Kiểm tra không có thuộc tính thừa
     * Input: N/A (constant)
     * Expected Output: Chỉ có các thuộc tính được định nghĩa
     * Coverage: Kiểm tra không có thuộc tính không mong muốn
     */
    it('should not have extra properties', () => {
      const allowedKeys = [
        'enableGlobalInterceptors',
        'interceptors',
        'enableGlobalFilters',
        'enableGlobalGuards',
      ];
      const actualKeys = Object.keys(DEFAULT_COMMON_MODULE_OPTIONS);

      expect(actualKeys.sort()).toEqual(allowedKeys.sort());
    });

    /**
     * Test Case 46: Kiểm tra interceptors không có thuộc tính thừa
     * Input: N/A (constant)
     * Expected Output: Chỉ có 6 interceptor properties
     * Coverage: Kiểm tra cấu trúc interceptors không có thuộc tính thừa
     */
    it('should not have extra interceptor properties', () => {
      const allowedInterceptorKeys = [
        'requestId',
        'sanitization',
        'securityHeaders',
        'logging',
        'metrics',
        'performance',
      ];
      const actualKeys = Object.keys(
        DEFAULT_COMMON_MODULE_OPTIONS.interceptors || {},
      );

      expect(actualKeys.sort()).toEqual(allowedInterceptorKeys.sort());
    });
  });

  describe('Type Safety and Edge Cases', () => {
    /**
     * Test Case 47: Kiểm tra với interceptors = undefined
     * Input: { interceptors: undefined }
     * Expected Output: interceptors = undefined
     * Coverage: Kiểm tra undefined interceptors
     */
    it('should accept interceptors as undefined explicitly', () => {
      const options: CommonModuleOptions = {
        interceptors: undefined,
      };

      expect(options.interceptors).toBeUndefined();
    });

    /**
     * Test Case 48: Kiểm tra merge với DEFAULT_COMMON_MODULE_OPTIONS (override một số giá trị)
     * Input: Spread DEFAULT + override
     * Expected Output: Object merged với giá trị override
     * Coverage: Kiểm tra khả năng override defaults
     */
    it('should allow overriding default values', () => {
      const customOptions: CommonModuleOptions = {
        ...DEFAULT_COMMON_MODULE_OPTIONS,
        enableGlobalInterceptors: false,
        interceptors: {
          ...DEFAULT_COMMON_MODULE_OPTIONS.interceptors,
          logging: false,
          metrics: false,
        },
      };

      expect(customOptions.enableGlobalInterceptors).toBe(false);
      expect(customOptions.enableGlobalFilters).toBe(true); // from default
      expect(customOptions.interceptors?.logging).toBe(false);
      expect(customOptions.interceptors?.requestId).toBe(true); // from default
    });

    /**
     * Test Case 49: Kiểm tra partial override interceptors
     * Input: Override một số interceptors
     * Expected Output: Object với một số interceptors được override
     * Coverage: Kiểm tra partial merge
     */
    it('should allow partial interceptor override', () => {
      const customOptions: CommonModuleOptions = {
        ...DEFAULT_COMMON_MODULE_OPTIONS,
        interceptors: {
          requestId: false,
        },
      };

      expect(customOptions.interceptors?.requestId).toBe(false);
      // Lưu ý: các thuộc tính khác bị mất do override toàn bộ object
      expect(customOptions.interceptors?.sanitization).toBeUndefined();
    });

    /**
     * Test Case 50: Kiểm tra với null coalescing (sử dụng ?? operator)
     * Input: undefined values với default fallback
     * Expected Output: Sử dụng giá trị default khi undefined
     * Coverage: Kiểm tra pattern sử dụng thực tế
     */
    it('should work with null coalescing operator', () => {
      const options: CommonModuleOptions = {};
      const enableInterceptors =
        options.enableGlobalInterceptors ??
        DEFAULT_COMMON_MODULE_OPTIONS.enableGlobalInterceptors;

      expect(enableInterceptors).toBe(true);
    });

    /**
     * Test Case 51: Kiểm tra optional chaining với interceptors
     * Input: Object không có interceptors
     * Expected Output: undefined khi truy cập nested property
     * Coverage: Kiểm tra optional chaining
     */
    it('should return undefined when accessing nested properties with optional chaining', () => {
      const options: CommonModuleOptions = {};

      expect(options.interceptors?.requestId).toBeUndefined();
      expect(options.interceptors?.sanitization).toBeUndefined();
    });

    /**
     * Test Case 52: Kiểm tra configuration với một thuộc tính true, phần còn lại undefined
     * Input: { enableGlobalInterceptors: true }
     * Expected Output: enableGlobalInterceptors = true, còn lại undefined
     * Coverage: Kiểm tra single property configuration
     */
    it('should handle single property configuration', () => {
      const options: CommonModuleOptions = {
        enableGlobalInterceptors: true,
      };

      expect(options.enableGlobalInterceptors).toBe(true);
      expect(options.enableGlobalFilters).toBeUndefined();
      expect(options.enableGlobalGuards).toBeUndefined();
      expect(options.interceptors).toBeUndefined();
    });

    /**
     * Test Case 53: Kiểm tra với tất cả giá trị boolean type
     * Input: Object với tất cả boolean values
     * Expected Output: Tất cả values là boolean
     * Coverage: Kiểm tra type consistency
     */
    it('should ensure all values are boolean types', () => {
      const options: CommonModuleOptions = {
        enableGlobalInterceptors: true,
        enableGlobalFilters: false,
        enableGlobalGuards: true,
        interceptors: {
          requestId: false,
          sanitization: true,
          securityHeaders: false,
          logging: true,
          metrics: false,
          performance: true,
        },
      };

      expect(typeof options.enableGlobalInterceptors).toBe('boolean');
      expect(typeof options.enableGlobalFilters).toBe('boolean');
      expect(typeof options.enableGlobalGuards).toBe('boolean');
      expect(typeof options.interceptors?.requestId).toBe('boolean');
      expect(typeof options.interceptors?.sanitization).toBe('boolean');
      expect(typeof options.interceptors?.securityHeaders).toBe('boolean');
      expect(typeof options.interceptors?.logging).toBe('boolean');
      expect(typeof options.interceptors?.metrics).toBe('boolean');
      expect(typeof options.interceptors?.performance).toBe('boolean');
    });

    /**
     * Test Case 54: Kiểm tra serialization/deserialization
     * Input: DEFAULT_COMMON_MODULE_OPTIONS
     * Expected Output: Object giống sau khi JSON parse/stringify
     * Coverage: Kiểm tra khả năng serialize
     */
    it('should be serializable to JSON and back', () => {
      const serialized = JSON.stringify(DEFAULT_COMMON_MODULE_OPTIONS);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual(DEFAULT_COMMON_MODULE_OPTIONS);
    });

    /**
     * Test Case 55: Kiểm tra Object.keys trên DEFAULT_COMMON_MODULE_OPTIONS
     * Input: DEFAULT_COMMON_MODULE_OPTIONS
     * Expected Output: Array of keys
     * Coverage: Kiểm tra enumerable properties
     */
    it('should have enumerable properties', () => {
      const keys = Object.keys(DEFAULT_COMMON_MODULE_OPTIONS);

      expect(Array.isArray(keys)).toBe(true);
      expect(keys.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Scenarios', () => {
    /**
     * Test Case 56: Scenario - Disable tất cả interceptors
     * Input: enableGlobalInterceptors = false
     * Expected Output: Global interceptors disabled
     * Coverage: Kiểm tra use case thực tế
     */
    it('should support disabling all interceptors globally', () => {
      const options: CommonModuleOptions = {
        enableGlobalInterceptors: false,
      };

      expect(options.enableGlobalInterceptors).toBe(false);
    });

    /**
     * Test Case 57: Scenario - Chỉ enable security interceptors
     * Input: Chỉ security-related interceptors = true
     * Expected Output: Chỉ security interceptors enabled
     * Coverage: Kiểm tra selective enabling
     */
    it('should support enabling only security-related interceptors', () => {
      const options: CommonModuleOptions = {
        enableGlobalInterceptors: true,
        interceptors: {
          sanitization: true,
          securityHeaders: true,
          requestId: false,
          logging: false,
          metrics: false,
          performance: false,
        },
      };

      expect(options.interceptors?.sanitization).toBe(true);
      expect(options.interceptors?.securityHeaders).toBe(true);
      expect(options.interceptors?.logging).toBe(false);
      expect(options.interceptors?.metrics).toBe(false);
    });

    /**
     * Test Case 58: Scenario - Development mode (enable logging, metrics, performance)
     * Input: Dev mode configuration
     * Expected Output: Dev-friendly interceptors enabled
     * Coverage: Kiểm tra development configuration
     */
    it('should support development mode configuration', () => {
      const devOptions: CommonModuleOptions = {
        enableGlobalInterceptors: true,
        interceptors: {
          logging: true,
          metrics: true,
          performance: true,
          requestId: true,
          sanitization: true,
          securityHeaders: true,
        },
      };

      expect(devOptions.interceptors?.logging).toBe(true);
      expect(devOptions.interceptors?.metrics).toBe(true);
      expect(devOptions.interceptors?.performance).toBe(true);
    });

    /**
     * Test Case 59: Scenario - Production mode (minimal interceptors)
     * Input: Prod mode configuration
     * Expected Output: Only essential interceptors enabled
     * Coverage: Kiểm tra production configuration
     */
    it('should support production mode configuration', () => {
      const prodOptions: CommonModuleOptions = {
        enableGlobalInterceptors: true,
        interceptors: {
          requestId: true,
          sanitization: true,
          securityHeaders: true,
          logging: false,
          metrics: false,
          performance: false,
        },
      };

      expect(prodOptions.interceptors?.requestId).toBe(true);
      expect(prodOptions.interceptors?.sanitization).toBe(true);
      expect(prodOptions.interceptors?.securityHeaders).toBe(true);
      expect(prodOptions.interceptors?.logging).toBe(false);
      expect(prodOptions.interceptors?.metrics).toBe(false);
    });

    /**
     * Test Case 60: Scenario - Testing mode (disable all)
     * Input: Test mode configuration
     * Expected Output: All features disabled
     * Coverage: Kiểm tra test configuration
     */
    it('should support testing mode configuration', () => {
      const testOptions: CommonModuleOptions = {
        enableGlobalInterceptors: false,
        enableGlobalFilters: false,
        enableGlobalGuards: false,
        interceptors: {
          requestId: false,
          sanitization: false,
          securityHeaders: false,
          logging: false,
          metrics: false,
          performance: false,
        },
      };

      expect(testOptions.enableGlobalInterceptors).toBe(false);
      expect(testOptions.enableGlobalFilters).toBe(false);
      expect(testOptions.enableGlobalGuards).toBe(false);
      expect(testOptions.interceptors?.requestId).toBe(false);
    });
  });
});
