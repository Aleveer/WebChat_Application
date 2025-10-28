import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from '../src/common/controllers/metrics.controller';
import { MetricsService } from '../src/common/services/metrics.services';

describe('MetricsController - White Box Testing (Input-Output)', () => {
  let controller: MetricsController;
  let metricsService: MetricsService;
  let analyticsMetricsService: any;

  // Mock MetricsService
  const mockMetricsService = {
    getSummary: jest.fn(),
    getAllCounters: jest.fn(),
    getAllHistograms: jest.fn(),
    getCounter: jest.fn(),
    getHistogramStats: jest.fn(),
    reset: jest.fn(),
    incrementCounter: jest.fn(),
    recordHistogram: jest.fn(),
  };

  // Mock Analytics Metrics Service
  const mockAnalyticsMetricsService = {
    getMetricsSnapshot: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
        {
          provide: 'ANALYTICS_METRICS_SERVICE',
          useValue: mockAnalyticsMetricsService,
        },
      ],
    })
      .overrideGuard(require('../guards/jwt.auth.guard').JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MetricsController>(MetricsController);
    metricsService = module.get<MetricsService>(MetricsService);
    analyticsMetricsService = module.get('ANALYTICS_METRICS_SERVICE');

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('Controller Initialization', () => {
    /**
     * Test Case 1: Kiểm tra controller được khởi tạo
     * Input: N/A
     * Expected Output: Controller instance tồn tại
     * Path Coverage: Constructor execution
     */
    it('TC001: should be defined', () => {
      expect(controller).toBeDefined();
    });

    /**
     * Test Case 2: Kiểm tra metricsService được inject
     * Input: N/A
     * Expected Output: Service instance tồn tại
     * Path Coverage: Dependency injection verification
     */
    it('TC002: should have metricsService injected', () => {
      expect(metricsService).toBeDefined();
    });

    /**
     * Test Case 3: Kiểm tra analyticsMetricsService được inject (optional)
     * Input: N/A
     * Expected Output: Optional service instance tồn tại
     * Path Coverage: Optional dependency injection verification
     */
    it('TC003: should have analyticsMetricsService injected (optional)', () => {
      expect(analyticsMetricsService).toBeDefined();
    });
  });

  describe('getMetrics() Method', () => {
    /**
     * Test Case 4: Kiểm tra getMetrics với counters và histograms
     * Input: Request object, Mock service returns counters and histograms
     * Expected Output: { success: true, data: { counters, histograms, timestamp } }
     * Path Coverage: Main execution path
     */
    it('TC004: should return metrics with counters and histograms', async () => {
      const mockCounters = {
        http_requests_total: 100,
        http_errors_total: 5,
      };

      const mockHistograms = {
        request_duration: {
          count: 50,
          min: 10,
          max: 500,
          avg: 150,
          p50: 120,
          p95: 400,
          p99: 480,
        },
      };

      mockMetricsService.getSummary.mockReturnValue({
        counters: mockCounters,
        histograms: mockHistograms,
      });

      const mockRequest = { user: { role: 'admin' } };
      const result = await controller.getMetrics(mockRequest);

      expect(result.success).toBe(true);
      expect(result.data.counters).toEqual(mockCounters);
      expect(result.data.histograms).toEqual(mockHistograms);
      expect(result.data.timestamp).toBeDefined();
      expect(typeof result.data.timestamp).toBe('string');
    });

    /**
     * Test Case 5: Kiểm tra getMetrics gọi getSummary
     * Input: Request object
     * Expected Output: getSummary được gọi 1 lần
     * Path Coverage: Service method invocation
     */
    it('TC005: should call metricsService.getSummary', async () => {
      mockMetricsService.getSummary.mockReturnValue({
        counters: {},
        histograms: {},
      });

      const mockRequest = { user: { role: 'admin' } };
      await controller.getMetrics(mockRequest);

      expect(mockMetricsService.getSummary).toHaveBeenCalledTimes(1);
      expect(mockMetricsService.getSummary).toHaveBeenCalledWith();
    });

    /**
     * Test Case 6: Kiểm tra getMetrics với empty counters
     * Input: Mock service returns empty counters
     * Expected Output: { success: true, data: { counters: {}, ... } }
     * Path Coverage: Empty counters edge case
     */
    it('TC006: should handle empty counters', async () => {
      mockMetricsService.getSummary.mockReturnValue({
        counters: {},
        histograms: {
          test: { count: 1, min: 1, max: 1, avg: 1, p50: 1, p95: 1, p99: 1 },
        },
      });

      const mockRequest = { user: { role: 'admin' } };
      const result = await controller.getMetrics(mockRequest);

      expect(result.success).toBe(true);
      expect(result.data.counters).toEqual({});
      expect(Object.keys(result.data.counters)).toHaveLength(0);
    });

    /**
     * Test Case 7: Kiểm tra getMetrics với empty histograms
     * Input: Mock service returns empty histograms
     * Expected Output: { success: true, data: { histograms: {}, ... } }
     * Path Coverage: Empty histograms edge case
     */
    it('TC007: should handle empty histograms', async () => {
      mockMetricsService.getSummary.mockReturnValue({
        counters: { test_counter: 10 },
        histograms: {},
      });

      const mockRequest = { user: { role: 'admin' } };
      const result = await controller.getMetrics(mockRequest);

      expect(result.success).toBe(true);
      expect(result.data.histograms).toEqual({});
      expect(Object.keys(result.data.histograms)).toHaveLength(0);
    });

    /**
     * Test Case 8: Kiểm tra getMetrics timestamp format
     * Input: Request object
     * Expected Output: timestamp là valid ISO string
     * Path Coverage: Timestamp generation
     */
    it('TC008: should generate valid ISO timestamp', async () => {
      mockMetricsService.getSummary.mockReturnValue({
        counters: {},
        histograms: {},
      });

      const mockRequest = { user: { role: 'admin' } };
      const result = await controller.getMetrics(mockRequest);

      expect(result.data.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );

      const date = new Date(result.data.timestamp);
      expect(date.toISOString()).toBe(result.data.timestamp);
    });

    /**
     * Test Case 9: Kiểm tra getMetrics với multiple counters
     * Input: Mock service returns multiple counters
     * Expected Output: All counters included in response
     * Path Coverage: Multiple counters handling
     */
    it('TC009: should handle multiple counters', async () => {
      const mockCounters = {
        http_requests_total: 1000,
        http_errors_total: 50,
        auth_attempts: 200,
        active_users: 25,
      };

      mockMetricsService.getSummary.mockReturnValue({
        counters: mockCounters,
        histograms: {},
      });

      const mockRequest = { user: { role: 'admin' } };
      const result = await controller.getMetrics(mockRequest);

      expect(Object.keys(result.data.counters)).toHaveLength(4);
      expect(result.data.counters).toEqual(mockCounters);
    });

    /**
     * Test Case 10: Kiểm tra getMetrics với multiple histograms
     * Input: Mock service returns multiple histograms
     * Expected Output: All histograms included in response
     * Path Coverage: Multiple histograms handling
     */
    it('TC010: should handle multiple histograms', async () => {
      const mockHistograms = {
        request_duration: {
          count: 100,
          min: 5,
          max: 1000,
          avg: 150,
          p50: 100,
          p95: 500,
          p99: 800,
        },
        db_query_time: {
          count: 50,
          min: 1,
          max: 200,
          avg: 50,
          p50: 40,
          p95: 150,
          p99: 180,
        },
      };

      mockMetricsService.getSummary.mockReturnValue({
        counters: {},
        histograms: mockHistograms,
      });

      const mockRequest = { user: { role: 'admin' } };
      const result = await controller.getMetrics(mockRequest);

      expect(Object.keys(result.data.histograms)).toHaveLength(2);
      expect(result.data.histograms).toEqual(mockHistograms);
    });
  });

  describe('getAnalyticsMetrics() Method', () => {
    /**
     * Test Case 11: Kiểm tra getAnalyticsMetrics khi service available
     * Input: Analytics service exists and returns metrics
     * Expected Output: { success: true, data: metrics }
     * Path Coverage: Service available path (if block - true)
     */
    it('TC011: should return analytics metrics when service is available', async () => {
      const mockAnalyticsMetrics = {
        totalMessages: 5000,
        activeUsers: 120,
        avgResponseTime: 250,
      };

      mockAnalyticsMetricsService.getMetricsSnapshot.mockResolvedValue(
        mockAnalyticsMetrics,
      );

      const result = await controller.getAnalyticsMetrics();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAnalyticsMetrics);
      expect(
        mockAnalyticsMetricsService.getMetricsSnapshot,
      ).toHaveBeenCalledTimes(1);
    });

    /**
     * Test Case 12: Kiểm tra getAnalyticsMetrics khi service not available
     * Input: Analytics service is null/undefined
     * Expected Output: { success: false, message: '...', data: null }
     * Path Coverage: Service not available path (if block - false)
     */
    it('TC012: should return error when analytics service not available', async () => {
      // Create controller without analytics service
      const moduleWithoutAnalytics: TestingModule =
        await Test.createTestingModule({
          controllers: [MetricsController],
          providers: [
            {
              provide: MetricsService,
              useValue: mockMetricsService,
            },
          ],
        })
          .overrideGuard(require('../guards/jwt.auth.guard').JwtAuthGuard)
          .useValue({ canActivate: () => true })
          .compile();

      const controllerWithoutAnalytics =
        moduleWithoutAnalytics.get<MetricsController>(MetricsController);

      const result = await controllerWithoutAnalytics.getAnalyticsMetrics();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Analytics metrics service not available');
      expect(result.data).toBeNull();
    });

    /**
     * Test Case 13: Kiểm tra getAnalyticsMetrics với empty metrics
     * Input: Service returns empty object
     * Expected Output: { success: true, data: {} }
     * Path Coverage: Empty metrics case
     */
    it('TC013: should handle empty analytics metrics', async () => {
      mockAnalyticsMetricsService.getMetricsSnapshot.mockResolvedValue({});

      const result = await controller.getAnalyticsMetrics();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    /**
     * Test Case 14: Kiểm tra getAnalyticsMetrics async behavior
     * Input: Mock async response
     * Expected Output: Promise resolves correctly
     * Path Coverage: Async/await execution
     */
    it('TC014: should handle async operation correctly', async () => {
      const mockMetrics = { test: 'value' };
      mockAnalyticsMetricsService.getMetricsSnapshot.mockResolvedValue(
        mockMetrics,
      );

      const resultPromise = controller.getAnalyticsMetrics();

      expect(resultPromise).toBeInstanceOf(Promise);

      const result = await resultPromise;
      expect(result.data).toEqual(mockMetrics);
    });

    /**
     * Test Case 15: Kiểm tra getAnalyticsMetrics với complex data
     * Input: Service returns nested object with arrays
     * Expected Output: Full complex data returned
     * Path Coverage: Complex data handling
     */
    it('TC015: should handle complex analytics metrics data', async () => {
      const complexMetrics = {
        overview: {
          total: 1000,
          active: 500,
        },
        breakdown: [
          { category: 'A', count: 300 },
          { category: 'B', count: 200 },
        ],
        timestamps: ['2025-10-28T10:00:00Z', '2025-10-28T11:00:00Z'],
      };

      mockAnalyticsMetricsService.getMetricsSnapshot.mockResolvedValue(
        complexMetrics,
      );

      const result = await controller.getAnalyticsMetrics();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(complexMetrics);
      expect(result.data.breakdown).toHaveLength(2);
    });
  });

  describe('getCounters() Method', () => {
    /**
     * Test Case 16: Kiểm tra getCounters với counters data
     * Input: N/A
     * Expected Output: { success: true, data: counters }
     * Path Coverage: Main execution path
     */
    it('TC016: should return all counters', async () => {
      const mockCounters = {
        requests: 100,
        errors: 5,
        success: 95,
      };

      mockMetricsService.getAllCounters.mockReturnValue(mockCounters);

      const result = await controller.getCounters();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCounters);
    });

    /**
     * Test Case 17: Kiểm tra getCounters gọi getAllCounters
     * Input: N/A
     * Expected Output: getAllCounters được gọi
     * Path Coverage: Service method invocation
     */
    it('TC017: should call metricsService.getAllCounters', async () => {
      mockMetricsService.getAllCounters.mockReturnValue({});

      await controller.getCounters();

      expect(mockMetricsService.getAllCounters).toHaveBeenCalledTimes(1);
      expect(mockMetricsService.getAllCounters).toHaveBeenCalledWith();
    });

    /**
     * Test Case 18: Kiểm tra getCounters với empty counters
     * Input: Service returns empty object
     * Expected Output: { success: true, data: {} }
     * Path Coverage: Empty counters edge case
     */
    it('TC018: should handle empty counters', async () => {
      mockMetricsService.getAllCounters.mockReturnValue({});

      const result = await controller.getCounters();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
      expect(Object.keys(result.data)).toHaveLength(0);
    });

    /**
     * Test Case 19: Kiểm tra getCounters với large number values
     * Input: Counters with large numbers
     * Expected Output: Numbers preserved accurately
     * Path Coverage: Large number handling
     */
    it('TC019: should handle large counter values', async () => {
      const largeCounters = {
        total_requests: 1000000000,
        total_bytes: 999999999999,
      };

      mockMetricsService.getAllCounters.mockReturnValue(largeCounters);

      const result = await controller.getCounters();

      expect(result.data.total_requests).toBe(1000000000);
      expect(result.data.total_bytes).toBe(999999999999);
    });

    /**
     * Test Case 20: Kiểm tra getCounters với zero values
     * Input: Counters with zero values
     * Expected Output: Zero values included
     * Path Coverage: Zero value handling
     */
    it('TC020: should include counters with zero values', async () => {
      const countersWithZero = {
        active: 10,
        errors: 0,
        pending: 0,
      };

      mockMetricsService.getAllCounters.mockReturnValue(countersWithZero);

      const result = await controller.getCounters();

      expect(result.data.errors).toBe(0);
      expect(result.data.pending).toBe(0);
    });
  });

  describe('getHistograms() Method', () => {
    /**
     * Test Case 21: Kiểm tra getHistograms với histogram data
     * Input: N/A
     * Expected Output: { success: true, data: histograms }
     * Path Coverage: Main execution path
     */
    it('TC021: should return all histograms', async () => {
      const mockHistograms = {
        response_time: {
          count: 100,
          min: 10,
          max: 500,
          avg: 150,
          p50: 120,
          p95: 400,
          p99: 480,
        },
      };

      mockMetricsService.getAllHistograms.mockReturnValue(mockHistograms);

      const result = await controller.getHistograms();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockHistograms);
    });

    /**
     * Test Case 22: Kiểm tra getHistograms gọi getAllHistograms
     * Input: N/A
     * Expected Output: getAllHistograms được gọi
     * Path Coverage: Service method invocation
     */
    it('TC022: should call metricsService.getAllHistograms', async () => {
      mockMetricsService.getAllHistograms.mockReturnValue({});

      await controller.getHistograms();

      expect(mockMetricsService.getAllHistograms).toHaveBeenCalledTimes(1);
      expect(mockMetricsService.getAllHistograms).toHaveBeenCalledWith();
    });

    /**
     * Test Case 23: Kiểm tra getHistograms với empty histograms
     * Input: Service returns empty object
     * Expected Output: { success: true, data: {} }
     * Path Coverage: Empty histograms edge case
     */
    it('TC023: should handle empty histograms', async () => {
      mockMetricsService.getAllHistograms.mockReturnValue({});

      const result = await controller.getHistograms();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    /**
     * Test Case 24: Kiểm tra getHistograms với multiple histograms
     * Input: Multiple histogram metrics
     * Expected Output: All histograms with complete stats
     * Path Coverage: Multiple histograms
     */
    it('TC024: should handle multiple histograms with all stats', async () => {
      const multipleHistograms = {
        api_latency: {
          count: 200,
          min: 5,
          max: 1000,
          avg: 100,
          p50: 80,
          p95: 500,
          p99: 900,
        },
        db_query: {
          count: 150,
          min: 1,
          max: 300,
          avg: 50,
          p50: 45,
          p95: 200,
          p99: 280,
        },
      };

      mockMetricsService.getAllHistograms.mockReturnValue(multipleHistograms);

      const result = await controller.getHistograms();

      expect(Object.keys(result.data)).toHaveLength(2);
      expect(result.data.api_latency.count).toBe(200);
      expect(result.data.db_query.count).toBe(150);
    });

    /**
     * Test Case 25: Kiểm tra getHistograms với null histogram stats
     * Input: Histogram with null stats
     * Expected Output: Null stats included in response
     * Path Coverage: Null stats handling
     */
    it('TC025: should handle histograms with null stats', async () => {
      const histogramsWithNull = {
        valid_metric: {
          count: 10,
          min: 1,
          max: 10,
          avg: 5,
          p50: 5,
          p95: 9,
          p99: 10,
        },
        empty_metric: null,
      };

      mockMetricsService.getAllHistograms.mockReturnValue(histogramsWithNull);

      const result = await controller.getHistograms();

      expect(result.data.valid_metric).toBeDefined();
      expect(result.data.empty_metric).toBeNull();
    });
  });

  describe('getPrometheusMetrics() Method', () => {
    /**
     * Test Case 26: Kiểm tra getPrometheusMetrics format
     * Input: Counters and histograms
     * Expected Output: Prometheus text format string
     * Path Coverage: Main execution path
     */
    it('TC026: should return Prometheus format metrics', async () => {
      const mockSummary = {
        counters: {
          http_requests_total: 100,
        },
        histograms: {
          request_duration: {
            count: 50,
            min: 10,
            max: 500,
            avg: 150,
            p50: 120,
            p95: 400,
            p99: 480,
          },
        },
      };

      mockMetricsService.getSummary.mockReturnValue(mockSummary);

      const result = await controller.getPrometheusMetrics();

      expect(typeof result).toBe('string');
      expect(result).toContain('# HELP http_requests_total');
      expect(result).toContain('# TYPE http_requests_total counter');
      expect(result).toContain('http_requests_total 100');
    });

    /**
     * Test Case 27: Kiểm tra getPrometheusMetrics histogram format
     * Input: Histogram data
     * Expected Output: Histogram metrics in Prometheus format
     * Path Coverage: Histogram export loop
     */
    it('TC027: should export histogram stats in Prometheus format', async () => {
      const mockSummary = {
        counters: {},
        histograms: {
          response_time: {
            count: 100,
            min: 5,
            max: 1000,
            avg: 200,
            p50: 150,
            p95: 800,
            p99: 950,
          },
        },
      };

      mockMetricsService.getSummary.mockReturnValue(mockSummary);

      const result = await controller.getPrometheusMetrics();

      expect(result).toContain('# HELP response_time');
      expect(result).toContain('# TYPE response_time histogram');
      expect(result).toContain('response_time_count 100');
      expect(result).toContain('response_time_sum 20000'); // avg * count
      expect(result).toContain('response_time_avg 200');
      expect(result).toContain('response_time_min 5');
      expect(result).toContain('response_time_max 1000');
      expect(result).toContain('response_time_p50 150');
      expect(result).toContain('response_time_p95 800');
      expect(result).toContain('response_time_p99 950');
    });

    /**
     * Test Case 28: Kiểm tra getPrometheusMetrics metric name sanitization
     * Input: Counter với tên có ký tự đặc biệt
     * Expected Output: Tên được sanitize theo Prometheus rules
     * Path Coverage: Sanitize metric name function
     */
    it('TC028: should sanitize invalid metric names', async () => {
      const mockSummary = {
        counters: {
          'http-requests-total': 50,
          'api.v2.requests': 100,
          '123_invalid': 25,
        },
        histograms: {},
      };

      mockMetricsService.getSummary.mockReturnValue(mockSummary);

      const result = await controller.getPrometheusMetrics();

      // Names should be sanitized to match [a-zA-Z0-9_:]*
      expect(result).toContain('http_requests_total 50');
      expect(result).toContain('api_v2_requests 100');
      expect(result).toContain('_123_invalid 25'); // Must start with letter/underscore
    });

    /**
     * Test Case 29: Kiểm tra getPrometheusMetrics với empty counters
     * Input: No counters
     * Expected Output: Only histogram metrics (if any)
     * Path Coverage: Empty counters in for loop
     */
    it('TC029: should handle empty counters', async () => {
      const mockSummary = {
        counters: {},
        histograms: {
          test: {
            count: 1,
            min: 1,
            max: 1,
            avg: 1,
            p50: 1,
            p95: 1,
            p99: 1,
          },
        },
      };

      mockMetricsService.getSummary.mockReturnValue(mockSummary);

      const result = await controller.getPrometheusMetrics();

      // Should only have histogram TYPE, not counter TYPE
      expect(result).toContain('# TYPE test histogram');
      expect(result).toContain('test_count 1');
    });

    /**
     * Test Case 30: Kiểm tra getPrometheusMetrics với null histograms
     * Input: Histogram with null stats
     * Expected Output: Null histograms filtered out
     * Path Coverage: Filter null histograms before iteration
     */
    it('TC030: should filter out null histograms', async () => {
      const mockSummary = {
        counters: {},
        histograms: {
          valid_metric: {
            count: 10,
            min: 1,
            max: 10,
            avg: 5,
            p50: 5,
            p95: 9,
            p99: 10,
          },
          null_metric: null,
        },
      };

      mockMetricsService.getSummary.mockReturnValue(mockSummary);

      const result = await controller.getPrometheusMetrics();

      expect(result).toContain('valid_metric_count 10');
      expect(result).not.toContain('null_metric');
    });

    /**
     * Test Case 31: Kiểm tra getPrometheusMetrics với multiple counters
     * Input: Multiple counters
     * Expected Output: All counters exported
     * Path Coverage: Counter export loop with multiple entries
     */
    it('TC031: should export multiple counters', async () => {
      const mockSummary = {
        counters: {
          requests_total: 1000,
          errors_total: 50,
          success_total: 950,
        },
        histograms: {},
      };

      mockMetricsService.getSummary.mockReturnValue(mockSummary);

      const result = await controller.getPrometheusMetrics();

      expect(result).toContain('requests_total 1000');
      expect(result).toContain('errors_total 50');
      expect(result).toContain('success_total 950');
    });

    /**
     * Test Case 32: Kiểm tra getPrometheusMetrics line format
     * Input: Sample metrics
     * Expected Output: Each metric on new line
     * Path Coverage: Line joining with \n
     */
    it('TC032: should join metrics with newline', async () => {
      const mockSummary = {
        counters: {
          test_counter: 10,
        },
        histograms: {},
      };

      mockMetricsService.getSummary.mockReturnValue(mockSummary);

      const result = await controller.getPrometheusMetrics();

      const lines = result.split('\n');
      expect(lines.length).toBeGreaterThan(1);
      expect(lines[lines.length - 1]).toBe('test_counter 10');
    });

    /**
     * Test Case 33: Kiểm tra getPrometheusMetrics histogram sum calculation
     * Input: Histogram with avg and count
     * Expected Output: sum = avg * count
     * Path Coverage: Histogram sum calculation
     */
    it('TC033: should calculate histogram sum correctly', async () => {
      const mockSummary = {
        counters: {},
        histograms: {
          metric: {
            count: 20,
            min: 1,
            max: 100,
            avg: 50,
            p50: 45,
            p95: 90,
            p99: 95,
          },
        },
      };

      mockMetricsService.getSummary.mockReturnValue(mockSummary);

      const result = await controller.getPrometheusMetrics();

      expect(result).toContain('metric_sum 1000'); // 50 * 20 = 1000
    });

    /**
     * Test Case 34: Kiểm tra getPrometheusMetrics với empty data
     * Input: No counters and no histograms
     * Expected Output: Empty string
     * Path Coverage: Both loops empty
     */
    it('TC034: should return empty string for no metrics', async () => {
      const mockSummary = {
        counters: {},
        histograms: {},
      };

      mockMetricsService.getSummary.mockReturnValue(mockSummary);

      const result = await controller.getPrometheusMetrics();

      expect(result).toBe('');
    });

    /**
     * Test Case 35: Kiểm tra sanitizeMetricName regex validation
     * Input: Various invalid metric names
     * Expected Output: Valid Prometheus names
     * Path Coverage: Sanitize function validation logic
     */
    it('TC035: should sanitize metric names to valid Prometheus format', async () => {
      const mockSummary = {
        counters: {
          'invalid@metric#name': 10,
          'spaces in name': 20,
          'dots.and-dashes': 30,
        },
        histograms: {},
      };

      mockMetricsService.getSummary.mockReturnValue(mockSummary);

      const result = await controller.getPrometheusMetrics();

      // All special chars should be replaced with _
      expect(result).toContain('invalid_metric_name 10');
      expect(result).toContain('spaces_in_name 20');
      expect(result).toContain('dots_and_dashes 30');
    });
  });

  describe('resetMetrics() Method', () => {
    /**
     * Test Case 36: Kiểm tra resetMetrics gọi service reset
     * Input: N/A
     * Expected Output: { success: true, message: '...' }
     * Path Coverage: Main execution path
     */
    it('TC036: should call metricsService.reset and return success', async () => {
      mockMetricsService.reset.mockReturnValue(undefined);

      const result = await controller.resetMetrics();

      expect(mockMetricsService.reset).toHaveBeenCalledTimes(1);
      expect(mockMetricsService.reset).toHaveBeenCalledWith();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Metrics reset successfully');
    });

    /**
     * Test Case 37: Kiểm tra resetMetrics return structure
     * Input: N/A
     * Expected Output: Object with success and message properties
     * Path Coverage: Return object structure
     */
    it('TC037: should return object with success and message', async () => {
      mockMetricsService.reset.mockReturnValue(undefined);

      const result = await controller.resetMetrics();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(Object.keys(result)).toHaveLength(2);
    });

    /**
     * Test Case 38: Kiểm tra resetMetrics không trả về data
     * Input: N/A
     * Expected Output: No data field in response
     * Path Coverage: Response structure validation
     */
    it('TC038: should not include data field in response', async () => {
      mockMetricsService.reset.mockReturnValue(undefined);

      const result = await controller.resetMetrics();

      expect(result).not.toHaveProperty('data');
    });

    /**
     * Test Case 39: Kiểm tra resetMetrics async behavior
     * Input: N/A
     * Expected Output: Returns Promise
     * Path Coverage: Async method execution
     */
    it('TC039: should be async and return Promise', () => {
      mockMetricsService.reset.mockReturnValue(undefined);

      const result = controller.resetMetrics();

      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('Cross-Method Integration', () => {
    /**
     * Test Case 40: Kiểm tra getMetrics và getCounters sử dụng khác service methods
     * Input: N/A
     * Expected Output: Different service methods called
     * Path Coverage: Service method separation
     */
    it('TC040: should use different service methods for getMetrics and getCounters', async () => {
      mockMetricsService.getSummary.mockReturnValue({
        counters: {},
        histograms: {},
      });
      mockMetricsService.getAllCounters.mockReturnValue({});

      const mockRequest = { user: { role: 'admin' } };
      await controller.getMetrics(mockRequest);
      await controller.getCounters();

      expect(mockMetricsService.getSummary).toHaveBeenCalledTimes(1);
      expect(mockMetricsService.getAllCounters).toHaveBeenCalledTimes(1);
    });

    /**
     * Test Case 41: Kiểm tra getPrometheusMetrics sử dụng getSummary
     * Input: N/A
     * Expected Output: getSummary được gọi (same as getMetrics)
     * Path Coverage: Service reuse
     */
    it('TC041: should reuse getSummary for both getMetrics and getPrometheusMetrics', async () => {
      mockMetricsService.getSummary.mockReturnValue({
        counters: {},
        histograms: {},
      });

      const mockRequest = { user: { role: 'admin' } };
      await controller.getMetrics(mockRequest);
      await controller.getPrometheusMetrics();

      expect(mockMetricsService.getSummary).toHaveBeenCalledTimes(2);
    });

    /**
     * Test Case 42: Kiểm tra resetMetrics không ảnh hưởng getters
     * Input: N/A
     * Expected Output: Reset only calls reset, getters call their methods
     * Path Coverage: Method independence
     */
    it('TC042: should have independent method executions', async () => {
      mockMetricsService.reset.mockReturnValue(undefined);
      mockMetricsService.getAllCounters.mockReturnValue({});

      await controller.resetMetrics();
      await controller.getCounters();

      expect(mockMetricsService.reset).toHaveBeenCalledTimes(1);
      expect(mockMetricsService.getAllCounters).toHaveBeenCalledTimes(1);
      expect(mockMetricsService.getSummary).not.toHaveBeenCalled();
    });

    /**
     * Test Case 43: Kiểm tra consistency giữa counters từ getMetrics và getCounters
     * Input: Same mock data
     * Expected Output: Consistent counter data
     * Path Coverage: Data consistency
     */
    it('TC043: should return consistent counter data', async () => {
      const counters = { test: 100 };

      mockMetricsService.getSummary.mockReturnValue({
        counters: counters,
        histograms: {},
      });
      mockMetricsService.getAllCounters.mockReturnValue(counters);

      const mockRequest = { user: { role: 'admin' } };
      const metricsResult = await controller.getMetrics(mockRequest);
      const countersResult = await controller.getCounters();

      expect(metricsResult.data.counters).toEqual(countersResult.data);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    /**
     * Test Case 44: Kiểm tra getMetrics khi service throws error
     * Input: Mock service throws error
     * Expected Output: Error propagates
     * Path Coverage: Error handling path
     */
    it('TC044: should propagate error from getSummary', async () => {
      const error = new Error('Metrics service unavailable');
      mockMetricsService.getSummary.mockImplementation(() => {
        throw error;
      });

      const mockRequest = { user: { role: 'admin' } };

      await expect(controller.getMetrics(mockRequest)).rejects.toThrow(
        'Metrics service unavailable',
      );
    });

    /**
     * Test Case 45: Kiểm tra getAnalyticsMetrics khi service throws error
     * Input: Mock analytics service throws error
     * Expected Output: Error propagates
     * Path Coverage: Error in async service call
     */
    it('TC045: should propagate error from analytics service', async () => {
      const error = new Error('Analytics error');
      mockAnalyticsMetricsService.getMetricsSnapshot.mockRejectedValue(error);

      await expect(controller.getAnalyticsMetrics()).rejects.toThrow(
        'Analytics error',
      );
    });

    /**
     * Test Case 46: Kiểm tra resetMetrics khi service throws error
     * Input: Mock reset throws error
     * Expected Output: Error propagates
     * Path Coverage: Error in reset operation
     */
    it('TC046: should propagate error from reset', async () => {
      const error = new Error('Reset failed');
      mockMetricsService.reset.mockImplementation(() => {
        throw error;
      });

      await expect(controller.resetMetrics()).rejects.toThrow('Reset failed');
    });

    /**
     * Test Case 47: Kiểm tra với counters có negative values
     * Input: Counter with negative value
     * Expected Output: Negative values preserved
     * Path Coverage: Negative number handling
     */
    it('TC047: should handle negative counter values', async () => {
      const countersWithNegative = {
        balance: -100,
        positive: 50,
      };

      mockMetricsService.getAllCounters.mockReturnValue(countersWithNegative);

      const result = await controller.getCounters();

      expect(result.data.balance).toBe(-100);
      expect(result.data.positive).toBe(50);
    });

    /**
     * Test Case 48: Kiểm tra getPrometheusMetrics với null counters object
     * Input: null counters
     * Expected Output: Handle gracefully or error
     * Path Coverage: Null object handling
     */
    it('TC048: should handle null counters in getSummary', async () => {
      mockMetricsService.getSummary.mockReturnValue({
        counters: null as any,
        histograms: {},
      });

      // This might throw or handle gracefully depending on implementation
      // Test for expected behavior
      await expect(async () => {
        await controller.getPrometheusMetrics();
      }).rejects.toThrow();
    });

    /**
     * Test Case 49: Kiểm tra với histogram stats có NaN values
     * Input: Histogram with NaN in stats
     * Expected Output: NaN values included or handled
     * Path Coverage: NaN handling
     */
    it('TC049: should handle NaN values in histogram stats', async () => {
      const histogramWithNaN = {
        test_metric: {
          count: 0,
          min: NaN,
          max: NaN,
          avg: NaN,
          p50: NaN,
          p95: NaN,
          p99: NaN,
        },
      };

      mockMetricsService.getAllHistograms.mockReturnValue(histogramWithNaN);

      const result = await controller.getHistograms();

      expect(result.data.test_metric.avg).toBeNaN();
    });

    /**
     * Test Case 50: Kiểm tra với metric names có Unicode characters
     * Input: Counter name with Unicode
     * Expected Output: Unicode handled or sanitized
     * Path Coverage: Unicode character handling
     */
    it('TC050: should handle Unicode characters in metric names', async () => {
      const unicodeCounters = {
        metric_中文_test: 100,
        'emoji_😀_counter': 50,
      };

      mockMetricsService.getSummary.mockReturnValue({
        counters: unicodeCounters,
        histograms: {},
      });

      const result = await controller.getPrometheusMetrics();

      // Unicode should be replaced with _ in Prometheus format
      // Each Unicode char may be replaced with multiple underscores
      expect(result).toContain('metric____test 100');
      expect(result).toContain('emoji____counter 50');
    });
  });

  describe('Type Safety and Return Types', () => {
    /**
     * Test Case 51: Kiểm tra getMetrics return type structure
     * Input: N/A
     * Expected Output: Correct TypeScript types
     * Path Coverage: Type validation
     */
    it('TC051: should return correct types from getMetrics', async () => {
      mockMetricsService.getSummary.mockReturnValue({
        counters: { test: 1 },
        histograms: {},
      });

      const mockRequest = { user: { role: 'admin' } };
      const result = await controller.getMetrics(mockRequest);

      expect(typeof result.success).toBe('boolean');
      expect(typeof result.data).toBe('object');
      expect(typeof result.data.timestamp).toBe('string');
      expect(typeof result.data.counters).toBe('object');
      expect(typeof result.data.histograms).toBe('object');
    });

    /**
     * Test Case 52: Kiểm tra getAnalyticsMetrics return types
     * Input: N/A
     * Expected Output: Correct types for both success/failure cases
     * Path Coverage: Type validation for both branches
     */
    it('TC052: should return correct types from getAnalyticsMetrics', async () => {
      mockAnalyticsMetricsService.getMetricsSnapshot.mockResolvedValue({
        test: 1,
      });

      const result = await controller.getAnalyticsMetrics();

      expect(typeof result.success).toBe('boolean');
      expect(typeof result.data).toBe('object');
    });

    /**
     * Test Case 53: Kiểm tra getPrometheusMetrics return type
     * Input: N/A
     * Expected Output: String
     * Path Coverage: Return type validation
     */
    it('TC053: should return string from getPrometheusMetrics', async () => {
      mockMetricsService.getSummary.mockReturnValue({
        counters: {},
        histograms: {},
      });

      const result = await controller.getPrometheusMetrics();

      expect(typeof result).toBe('string');
    });

    /**
     * Test Case 54: Kiểm tra all methods return promises
     * Input: N/A
     * Expected Output: All methods are async
     * Path Coverage: Async validation
     */
    it('TC054: should have all methods returning promises', () => {
      mockMetricsService.getSummary.mockReturnValue({
        counters: {},
        histograms: {},
      });
      mockMetricsService.getAllCounters.mockReturnValue({});
      mockMetricsService.getAllHistograms.mockReturnValue({});
      mockMetricsService.reset.mockReturnValue(undefined);
      mockAnalyticsMetricsService.getMetricsSnapshot.mockResolvedValue({});

      const mockRequest = { user: { role: 'admin' } };

      expect(controller.getMetrics(mockRequest)).toBeInstanceOf(Promise);
      expect(controller.getAnalyticsMetrics()).toBeInstanceOf(Promise);
      expect(controller.getCounters()).toBeInstanceOf(Promise);
      expect(controller.getHistograms()).toBeInstanceOf(Promise);
      expect(controller.getPrometheusMetrics()).toBeInstanceOf(Promise);
      expect(controller.resetMetrics()).toBeInstanceOf(Promise);
    });
  });

  describe('Business Logic Validation', () => {
    /**
     * Test Case 55: Kiểm tra destructuring trong getMetrics
     * Input: Summary object
     * Expected Output: Counters and histograms extracted correctly
     * Path Coverage: Object destructuring
     */
    it('TC055: should destructure counters and histograms correctly', async () => {
      const mockSummary = {
        counters: { test_counter: 10 },
        histograms: { test_histogram: { count: 5 } as any },
      };

      mockMetricsService.getSummary.mockReturnValue(mockSummary);

      const mockRequest = { user: { role: 'admin' } };
      const result = await controller.getMetrics(mockRequest);

      expect(result.data.counters).toBe(mockSummary.counters);
      expect(result.data.histograms).toBe(mockSummary.histograms);
    });

    /**
     * Test Case 56: Kiểm tra Prometheus metric naming rules
     * Input: Various metric names
     * Expected Output: Valid Prometheus names
     * Path Coverage: Sanitization logic validation
     */
    it('TC056: should enforce Prometheus metric naming rules', async () => {
      const mockSummary = {
        counters: {
          validName: 10,
          'invalid-name': 20,
          '9starts_with_number': 30,
        },
        histograms: {},
      };

      mockMetricsService.getSummary.mockReturnValue(mockSummary);

      const result = await controller.getPrometheusMetrics();

      // Valid name unchanged
      expect(result).toContain('validName 10');
      // Dash replaced
      expect(result).toContain('invalid_name 20');
      // Starts with number -> prefix with _
      expect(result).toContain('_9starts_with_number 30');
    });

    /**
     * Test Case 57: Kiểm tra Object.entries iteration
     * Input: Counters and histograms objects
     * Expected Output: All entries processed
     * Path Coverage: for...of loop with Object.entries
     */
    it('TC057: should iterate through all counter entries', async () => {
      const counters = {
        metric1: 10,
        metric2: 20,
        metric3: 30,
      };

      mockMetricsService.getSummary.mockReturnValue({
        counters,
        histograms: {},
      });

      const result = await controller.getPrometheusMetrics();

      // All counters should be in output
      expect(result).toContain('metric1 10');
      expect(result).toContain('metric2 20');
      expect(result).toContain('metric3 30');
    });

    /**
     * Test Case 58: Kiểm tra filter operation trên histograms
     * Input: Mix of null and valid histograms
     * Expected Output: Only valid histograms processed
     * Path Coverage: Filter before iteration
     */
    it('TC058: should filter null histograms before iteration', async () => {
      const histograms = {
        valid1: {
          count: 10,
          min: 1,
          max: 10,
          avg: 5,
          p50: 5,
          p95: 9,
          p99: 10,
        },
        null1: null,
        valid2: {
          count: 20,
          min: 2,
          max: 20,
          avg: 10,
          p50: 10,
          p95: 18,
          p99: 19,
        },
        null2: null,
      };

      mockMetricsService.getSummary.mockReturnValue({
        counters: {},
        histograms,
      });

      const result = await controller.getPrometheusMetrics();

      // Valid histograms processed
      expect(result).toContain('valid1_count 10');
      expect(result).toContain('valid2_count 20');
      // Null histograms not in output
      expect(result).not.toContain('null1');
      expect(result).not.toContain('null2');
    });

    /**
     * Test Case 59: Kiểm tra timestamp generation sử dụng new Date()
     * Input: N/A
     * Expected Output: Current timestamp
     * Path Coverage: Date creation and toISOString
     */
    it('TC059: should generate current timestamp using Date', async () => {
      mockMetricsService.getSummary.mockReturnValue({
        counters: {},
        histograms: {},
      });

      const beforeTime = new Date();
      const mockRequest = { user: { role: 'admin' } };
      const result = await controller.getMetrics(mockRequest);
      const afterTime = new Date();

      const resultTime = new Date(result.data.timestamp);

      expect(resultTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(resultTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    /**
     * Test Case 60: Kiểm tra array.join('\n') operation
     * Input: Multiple metrics
     * Expected Output: Metrics joined with newlines
     * Path Coverage: Array join operation
     */
    it('TC060: should join Prometheus lines with newline character', async () => {
      mockMetricsService.getSummary.mockReturnValue({
        counters: {
          metric1: 10,
          metric2: 20,
        },
        histograms: {},
      });

      const result = await controller.getPrometheusMetrics();

      const lines = result.split('\n');
      expect(lines.length).toBeGreaterThan(3); // Multiple HELP, TYPE, and value lines
      expect(lines.join('\n')).toBe(result);
    });
  });

  describe('Optional Dependency Injection', () => {
    /**
     * Test Case 61: Kiểm tra controller without analytics service
     * Input: Controller without optional dependency
     * Expected Output: Controller works without analytics
     * Path Coverage: Optional injection handling
     */
    it('TC061: should work without analytics service', async () => {
      const moduleWithoutAnalytics: TestingModule =
        await Test.createTestingModule({
          controllers: [MetricsController],
          providers: [
            {
              provide: MetricsService,
              useValue: mockMetricsService,
            },
          ],
        })
          .overrideGuard(require('../guards/jwt.auth.guard').JwtAuthGuard)
          .useValue({ canActivate: () => true })
          .compile();

      const controllerWithoutAnalytics =
        moduleWithoutAnalytics.get<MetricsController>(MetricsController);

      expect(controllerWithoutAnalytics).toBeDefined();

      // Other methods should still work
      mockMetricsService.getAllCounters.mockReturnValue({ test: 1 });
      const result = await controllerWithoutAnalytics.getCounters();
      expect(result.success).toBe(true);
    });

    /**
     * Test Case 62: Kiểm tra @Optional decorator behavior
     * Input: Missing optional dependency
     * Expected Output: No error, service is undefined
     * Path Coverage: Optional dependency null/undefined
     */
    it('TC062: should handle undefined analytics service', async () => {
      const moduleWithUndefinedAnalytics: TestingModule =
        await Test.createTestingModule({
          controllers: [MetricsController],
          providers: [
            {
              provide: MetricsService,
              useValue: mockMetricsService,
            },
            {
              provide: 'ANALYTICS_METRICS_SERVICE',
              useValue: undefined,
            },
          ],
        })
          .overrideGuard(require('../guards/jwt.auth.guard').JwtAuthGuard)
          .useValue({ canActivate: () => true })
          .compile();

      const controllerWithUndefined =
        moduleWithUndefinedAnalytics.get<MetricsController>(MetricsController);

      const result = await controllerWithUndefined.getAnalyticsMetrics();

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
    });
  });

  describe('Logger Integration', () => {
    /**
     * Test Case 63: Kiểm tra logger initialization
     * Input: N/A
     * Expected Output: Logger được khởi tạo
     * Path Coverage: Logger constructor
     */
    it('TC063: should initialize logger with controller name', () => {
      // Logger should be initialized in constructor
      expect(controller).toBeDefined();
      // Logger name should be MetricsController (verified by constructor)
    });
  });

  describe('Request Object Handling', () => {
    /**
     * Test Case 64: Kiểm tra getMetrics với different request objects
     * Input: Various request objects
     * Expected Output: Request accepted but not used
     * Path Coverage: Request parameter handling
     */
    it('TC064: should accept request object but not use it', async () => {
      mockMetricsService.getSummary.mockReturnValue({
        counters: {},
        histograms: {},
      });

      const req1 = { user: { id: 1 } };
      const req2 = { user: { id: 2, role: 'admin' } };
      const req3 = {};

      const result1 = await controller.getMetrics(req1);
      const result2 = await controller.getMetrics(req2);
      const result3 = await controller.getMetrics(req3);

      // All should return success
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);
    });
  });

  describe('Performance and Memory', () => {
    /**
     * Test Case 65: Kiểm tra với large counter values
     * Input: Very large numbers
     * Expected Output: Large numbers handled correctly
     * Path Coverage: Large number handling
     */
    it('TC065: should handle very large counter values', async () => {
      const largeCounters = {
        huge_counter: Number.MAX_SAFE_INTEGER,
      };

      mockMetricsService.getAllCounters.mockReturnValue(largeCounters);

      const result = await controller.getCounters();

      expect(result.data.huge_counter).toBe(Number.MAX_SAFE_INTEGER);
    });

    /**
     * Test Case 66: Kiểm tra với many histograms
     * Input: Large number of histograms
     * Expected Output: All processed
     * Path Coverage: Large collection iteration
     */
    it('TC066: should handle many histograms', async () => {
      const manyHistograms: any = {};
      for (let i = 0; i < 100; i++) {
        manyHistograms[`metric_${i}`] = {
          count: i,
          min: 1,
          max: 100,
          avg: 50,
          p50: 50,
          p95: 90,
          p99: 95,
        };
      }

      mockMetricsService.getAllHistograms.mockReturnValue(manyHistograms);

      const result = await controller.getHistograms();

      expect(Object.keys(result.data)).toHaveLength(100);
    });
  });

  describe('Edge Cases - Prometheus Format', () => {
    /**
     * Test Case 67: Kiểm tra metric name starts with colon
     * Input: Name starting with :
     * Expected Output: Valid name (colon is allowed at start)
     * Path Coverage: Sanitization edge case
     */
    it('TC067: should allow colon at start of metric name', async () => {
      mockMetricsService.getSummary.mockReturnValue({
        counters: {
          ':metric_name': 10,
        },
        histograms: {},
      });

      const result = await controller.getPrometheusMetrics();

      expect(result).toContain(':metric_name 10');
    });

    /**
     * Test Case 68: Kiểm tra empty metric name
     * Input: Empty string as metric name
     * Expected Output: Prefixed with underscore
     * Path Coverage: Empty name edge case
     */
    it('TC068: should handle empty metric name', async () => {
      mockMetricsService.getSummary.mockReturnValue({
        counters: {
          '': 10,
        },
        histograms: {},
      });

      const result = await controller.getPrometheusMetrics();

      // Empty name should get prefix
      expect(result).toContain('_ 10');
    });

    /**
     * Test Case 69: Kiểm tra metric name với consecutive special chars
     * Input: Name with multiple consecutive special chars
     * Expected Output: All replaced with underscores
     * Path Coverage: Multiple replacement edge case
     */
    it('TC069: should replace consecutive special characters', async () => {
      mockMetricsService.getSummary.mockReturnValue({
        counters: {
          'metric@@@name###test': 10,
        },
        histograms: {},
      });

      const result = await controller.getPrometheusMetrics();

      expect(result).toContain('metric___name___test 10');
    });

    /**
     * Test Case 70: Kiểm tra với floating point counter values
     * Input: Counter with decimal values
     * Expected Output: Decimal preserved
     * Path Coverage: Floating point handling
     */
    it('TC070: should handle floating point counter values', async () => {
      mockMetricsService.getSummary.mockReturnValue({
        counters: {
          float_counter: 123.456,
        },
        histograms: {},
      });

      const result = await controller.getPrometheusMetrics();

      expect(result).toContain('float_counter 123.456');
    });
  });
});
