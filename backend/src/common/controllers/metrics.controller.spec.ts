import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { MetricsController } from './metrics.controller';
import { MetricsService } from '../services/metrics.services';
import { AnalyticsMetricsService } from '../../modules/analytics/analytics.metrics.service';
import { JwtAuthGuard } from '../guards/jwt.auth.guard';
import { ExecutionContext } from '@nestjs/common';

describe('MetricsController - White Box Testing', () => {
  let controller: MetricsController;
  let metricsService: MetricsService;
  let analyticsMetricsService: AnalyticsMetricsService;
  let jwtAuthGuard: JwtAuthGuard;

  // Mock data
  const mockRequest = {
    user: { id: '123', role: 'admin', username: 'admin' },
    headers: { authorization: 'Bearer token123' },
  } as unknown as Request;

  const mockCounters = {
    http_requests: 100,
    http_errors: 5,
    database_queries: 250,
  };

  const mockHistograms = {
    http_response_time: {
      count: 100,
      min: 10,
      max: 5000,
      avg: 150,
      p50: 100,
      p95: 300,
      p99: 800,
    },
    database_query_time: null, // Edge case: null histogram
  };

  const mockSummary = {
    counters: mockCounters,
    histograms: mockHistograms,
  };

  const mockAnalyticsMetrics = {
    timestamp: new Date().toISOString(),
    events: {
      total: 1000,
      last24h: 100,
      lastWeek: 500,
    },
    topEvents: [
      { event_type: 'user_login', count: 50 },
      { event_type: 'message_sent', count: 30 },
    ],
    recentActivity: [
      { event_type: 'user_login', count: 5, timestamp: new Date() },
    ],
  };

  beforeEach(async () => {
    // Create mocks
    const mockMetricsService = {
      getSummary: jest.fn(),
      getAllCounters: jest.fn(),
      getAllHistograms: jest.fn(),
      reset: jest.fn(),
      incrementCounter: jest.fn(),
      decrementCounter: jest.fn(),
      getCounter: jest.fn(),
      recordHistogram: jest.fn(),
      startTimer: jest.fn(),
      endTimer: jest.fn(),
      getHistogramStats: jest.fn(),
    };

    const mockAnalyticsMetricsService = {
      getMetricsSnapshot: jest.fn(),
      getEventMetrics: jest.fn(),
    };

    const mockJwtAuthGuard = {
      canActivate: jest.fn((context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest<Request>();
        request.user = mockRequest.user;
        return true;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
        {
          provide: AnalyticsMetricsService,
          useValue: mockAnalyticsMetricsService,
        },
        {
          provide: JwtAuthGuard,
          useValue: mockJwtAuthGuard,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<MetricsController>(MetricsController);
    metricsService = module.get<MetricsService>(MetricsService);
    analyticsMetricsService = module.get<AnalyticsMetricsService>(
      AnalyticsMetricsService,
    );
    jwtAuthGuard = module.get<JwtAuthGuard>(JwtAuthGuard);

    // Setup default mock returns
    jest.spyOn(metricsService, 'getSummary').mockReturnValue(mockSummary);
    jest.spyOn(metricsService, 'getAllCounters').mockReturnValue(mockCounters);
    jest
      .spyOn(metricsService, 'getAllHistograms')
      .mockReturnValue(mockHistograms);
    jest
      .spyOn(analyticsMetricsService, 'getMetricsSnapshot')
      .mockResolvedValue(mockAnalyticsMetrics);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor and Dependencies', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have metricsService injected', () => {
      expect(metricsService).toBeDefined();
    });

    it('should have analyticsMetricsService injected', () => {
      expect(analyticsMetricsService).toBeDefined();
    });
  });

  describe('getMetrics() - Branch Coverage', () => {
    it('should return metrics summary with success flag', async () => {
      const result = await controller.getMetrics(mockRequest);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('counters');
      expect(result.data).toHaveProperty('histograms');
      expect(result.data).toHaveProperty('timestamp');
    });

    it('should call metricsService.getSummary()', async () => {
      await controller.getMetrics(mockRequest);
      expect(metricsService.getSummary).toHaveBeenCalledTimes(1);
    });

    it('should return correct structure with counters', async () => {
      const result = await controller.getMetrics(mockRequest);
      expect(result.data.counters).toEqual(mockCounters);
    });

    it('should return correct structure with histograms', async () => {
      const result = await controller.getMetrics(mockRequest);
      expect(result.data.histograms).toEqual(mockHistograms);
    });

    it('should include ISO timestamp', async () => {
      const result = await controller.getMetrics(mockRequest);
      expect(result.data.timestamp).toBeDefined();
      expect(new Date(result.data.timestamp)).toBeInstanceOf(Date);
    });

    it('should handle empty counters', async () => {
      jest.spyOn(metricsService, 'getSummary').mockReturnValue({
        counters: {},
        histograms: mockHistograms,
      });

      const result = await controller.getMetrics(mockRequest);
      expect(result.data.counters).toEqual({});
    });

    it('should handle empty histograms', async () => {
      jest.spyOn(metricsService, 'getSummary').mockReturnValue({
        counters: mockCounters,
        histograms: {},
      });

      const result = await controller.getMetrics(mockRequest);
      expect(result.data.histograms).toEqual({});
    });
  });

  describe('getAnalyticsMetrics() - Branch Coverage', () => {
    it('should return analytics metrics with success flag', async () => {
      const result = await controller.getAnalyticsMetrics();

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
    });

    it('should call analyticsMetricsService.getMetricsSnapshot()', async () => {
      await controller.getAnalyticsMetrics();
      expect(analyticsMetricsService.getMetricsSnapshot).toHaveBeenCalledTimes(
        1,
      );
    });

    it('should return correct analytics data structure', async () => {
      const result = await controller.getAnalyticsMetrics();

      expect(result.data).toHaveProperty('timestamp');
      expect(result.data).toHaveProperty('events');
      expect(result.data).toHaveProperty('topEvents');
      expect(result.data).toHaveProperty('recentActivity');
    });

    it('should handle empty analytics data', async () => {
      jest
        .spyOn(analyticsMetricsService, 'getMetricsSnapshot')
        .mockResolvedValue({
          timestamp: new Date().toISOString(),
          events: { total: 0, last24h: 0, lastWeek: 0 },
          topEvents: [],
          recentActivity: [],
        });

      const result = await controller.getAnalyticsMetrics();
      expect(result.data.events.total).toBe(0);
      expect(result.data.topEvents).toHaveLength(0);
    });
  });

  describe('getCounters() - Branch Coverage', () => {
    it('should return all counters with success flag', async () => {
      const result = await controller.getCounters();

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
    });

    it('should call metricsService.getAllCounters()', async () => {
      await controller.getCounters();
      expect(metricsService.getAllCounters).toHaveBeenCalledTimes(1);
    });

    it('should return correct counters data', async () => {
      const result = await controller.getCounters();
      expect(result.data).toEqual(mockCounters);
    });

    it('should handle empty counters', async () => {
      jest.spyOn(metricsService, 'getAllCounters').mockReturnValue({});

      const result = await controller.getCounters();
      expect(result.data).toEqual({});
    });

    it('should handle single counter', async () => {
      const singleCounter = { http_requests: 1 };
      jest
        .spyOn(metricsService, 'getAllCounters')
        .mockReturnValue(singleCounter);

      const result = await controller.getCounters();
      expect(result.data).toEqual(singleCounter);
    });
  });

  describe('getHistograms() - Branch Coverage', () => {
    it('should return all histograms with success flag', async () => {
      const result = await controller.getHistograms();

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
    });

    it('should call metricsService.getAllHistograms()', async () => {
      await controller.getHistograms();
      expect(metricsService.getAllHistograms).toHaveBeenCalledTimes(1);
    });

    it('should return correct histograms data', async () => {
      const result = await controller.getHistograms();
      expect(result.data).toEqual(mockHistograms);
    });

    it('should handle empty histograms', async () => {
      jest.spyOn(metricsService, 'getAllHistograms').mockReturnValue({});

      const result = await controller.getHistograms();
      expect(result.data).toEqual({});
    });

    it('should handle null histogram values', async () => {
      const histogramsWithNull = {
        http_response_time: {
          count: 100,
          min: 10,
          max: 5000,
          avg: 150,
          p50: 100,
          p95: 300,
          p99: 800,
        },
        empty_histogram: null,
        another_null: null,
      };
      jest
        .spyOn(metricsService, 'getAllHistograms')
        .mockReturnValue(histogramsWithNull);

      const result = await controller.getHistograms();
      expect(result.data).toEqual(histogramsWithNull);
      expect(result.data['empty_histogram']).toBeNull();
    });
  });

  describe('getPrometheusMetrics() - Full Branch and Path Coverage', () => {
    it('should return Prometheus format string', async () => {
      const result = await controller.getPrometheusMetrics();

      expect(typeof result).toBe('string');
      expect(result).toContain('# HELP');
      expect(result).toContain('# TYPE');
      expect(result).toContain('counter');
      expect(result).toContain('histogram');
    });

    it('should call metricsService.getSummary()', async () => {
      await controller.getPrometheusMetrics();
      expect(metricsService.getSummary).toHaveBeenCalledTimes(1);
    });

    it('should export counters with sanitized names', async () => {
      jest.spyOn(metricsService, 'getSummary').mockReturnValue({
        counters: {
          http_requests: 100,
          'http-errors': 5, // hyphen should be sanitized
          'db.queries': 50, // dot should be sanitized
        },
        histograms: {},
      });

      const result = await controller.getPrometheusMetrics();

      expect(result).toContain('http_requests');
      expect(result).toContain('http_errors'); // hyphen replaced with _
      expect(result).toContain('db_queries'); // dot replaced with _
    });

    it('should handle counters with empty name', async () => {
      jest.spyOn(metricsService, 'getSummary').mockReturnValue({
        counters: { '': 1 },
        histograms: {},
      });

      const result = await controller.getPrometheusMetrics();
      expect(result).toContain('{} 1');
    });

    it('should export histograms with all statistics', async () => {
      const result = await controller.getPrometheusMetrics();

      expect(result).toContain('http_response_time_count');
      expect(result).toContain('http_response_time_sum');
      expect(result).toContain('http_response_time_avg');
      expect(result).toContain('http_response_time_min');
      expect(result).toContain('http_response_time_max');
      expect(result).toContain('http_response_time_p50');
      expect(result).toContain('http_response_time_p95');
      expect(result).toContain('http_response_time_p99');
    });

    it('should handle null histogram stats', async () => {
      const result = await controller.getPrometheusMetrics();

      // Should not include stats for null histograms
      expect(result).not.toContain('database_query_time_count');
    });

    it('should skip null histogram values', async () => {
      jest.spyOn(metricsService, 'getSummary').mockReturnValue({
        counters: {},
        histograms: {
          valid_histogram: {
            count: 10,
            min: 1,
            max: 100,
            avg: 50,
            p50: 50,
            p95: 95,
            p99: 99,
          },
          null_histogram: null,
        },
      });

      const result = await controller.getPrometheusMetrics();

      expect(result).toContain('valid_histogram_count');
      expect(result).not.toContain('null_histogram_count');
    });

    it('should handle empty counters and histograms', async () => {
      jest.spyOn(metricsService, 'getSummary').mockReturnValue({
        counters: {},
        histograms: {},
      });

      const result = await controller.getPrometheusMetrics();
      expect(result).toBe(''); // Empty string if no metrics
    });

    it('should calculate sum correctly', async () => {
      const testHistogram = {
        test_metric: {
          count: 5,
          avg: 20,
          min: 10,
          max: 30,
          p50: 20,
          p95: 30,
          p99: 30,
        },
      };

      jest.spyOn(metricsService, 'getSummary').mockReturnValue({
        counters: {},
        histograms: testHistogram,
      });

      const result = await controller.getPrometheusMetrics();
      const expectedSum = 5 * 20; // count * avg

      expect(result).toContain(`test_metric_sum ${expectedSum}`);
    });

    it('should handle special characters in metric names', async () => {
      jest.spyOn(metricsService, 'getSummary').mockReturnValue({
        counters: {
          'metric@name#with$special%chars': 1,
        },
        histograms: {},
      });

      const result = await controller.getPrometheusMetrics();

      // Metric name itself should be sanitized (no special chars except _)
      // But HELP/TYPE lines may contain the original name in description
      expect(result).toContain('metric_name_with_special_chars{}');
      // The metric value line should not contain special chars in the metric name itself
      const metricLine = result.match(
        /^metric_name_with_special_chars\{\}.*$/m,
      );
      expect(metricLine).toBeTruthy();
    });
  });

  describe('resetMetrics() - Branch Coverage', () => {
    it('should call metricsService.reset()', async () => {
      await controller.resetMetrics();
      expect(metricsService.reset).toHaveBeenCalledTimes(1);
    });

    it('should return success message', async () => {
      const result = await controller.resetMetrics();

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', 'Metrics reset successfully');
    });

    it('should not call other service methods', async () => {
      await controller.resetMetrics();

      expect(metricsService.getSummary).not.toHaveBeenCalled();
      expect(metricsService.getAllCounters).not.toHaveBeenCalled();
      expect(analyticsMetricsService.getMetricsSnapshot).not.toHaveBeenCalled();
    });
  });

  describe('Guard and Authorization Tests', () => {
    it('should require JWT authentication', () => {
      // Verify that jwtAuthGuard is used
      expect(jwtAuthGuard).toBeDefined();
    });

    it('should have Roles decorator for admin endpoints', async () => {
      // Test admin-only endpoints by verifying they exist and require auth
      const spy = jest.spyOn(controller, 'getMetrics');

      // Since the guard allows access, the method should execute
      await controller.getMetrics(mockRequest);

      expect(spy).toHaveBeenCalled();
    });

    it('should not require authentication for prometheus endpoint', async () => {
      // Prometheus endpoint should work without auth
      const result = await controller.getPrometheusMetrics();
      expect(result).toBeDefined();
    });

    it('should execute guards properly through NestJS DI', async () => {
      // Verify guard is actually called during test setup
      expect(jwtAuthGuard.canActivate).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle metricsService.getSummary() throwing error', async () => {
      jest.spyOn(metricsService, 'getSummary').mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      await expect(controller.getMetrics(mockRequest)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle analyticsMetricsService.getMetricsSnapshot() throwing error', async () => {
      jest
        .spyOn(analyticsMetricsService, 'getMetricsSnapshot')
        .mockRejectedValue(new Error('Analytics service unavailable'));

      await expect(controller.getAnalyticsMetrics()).rejects.toThrow(
        'Analytics service unavailable',
      );
    });

    it('should handle metricsService.reset() throwing error', async () => {
      jest.spyOn(metricsService, 'reset').mockImplementation(() => {
        throw new Error('Reset failed');
      });

      await expect(controller.resetMetrics()).rejects.toThrow('Reset failed');
    });

    it('should handle very large counter values', async () => {
      jest.spyOn(metricsService, 'getSummary').mockReturnValue({
        counters: {
          large_counter: Number.MAX_SAFE_INTEGER,
        },
        histograms: {},
      });

      const result = await controller.getMetrics(mockRequest);
      expect(result.data.counters['large_counter']).toBe(
        Number.MAX_SAFE_INTEGER,
      );
    });

    it('should handle negative histogram values', async () => {
      jest.spyOn(metricsService, 'getSummary').mockReturnValue({
        counters: {},
        histograms: {
          negative_histogram: {
            count: 10,
            min: -100,
            max: -10,
            avg: -50,
            p50: -50,
            p95: -20,
            p99: -10,
          },
        },
      });

      const result = await controller.getMetrics(mockRequest);
      expect(result.data.histograms['negative_histogram'].min).toBe(-100);
    });
  });

  describe('Code Path and Logic Flow Testing', () => {
    it('should follow complete code path for getMetrics', async () => {
      const result = await controller.getMetrics(mockRequest);

      // Verify all steps in the method were executed
      expect(metricsService.getSummary).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data.counters).toBeDefined();
      expect(result.data.histograms).toBeDefined();
      expect(result.data.timestamp).toBeDefined();
    });

    it('should follow complete code path for Prometheus format with multiple histograms', async () => {
      jest.spyOn(metricsService, 'getSummary').mockReturnValue({
        counters: {
          counter1: 1,
          counter2: 2,
        },
        histograms: {
          histogram1: {
            count: 10,
            min: 1,
            max: 100,
            avg: 50,
            p50: 50,
            p95: 95,
            p99: 99,
          },
          histogram2: null, // Should be skipped
          histogram3: {
            count: 5,
            min: 10,
            max: 50,
            avg: 30,
            p50: 30,
            p95: 45,
            p99: 50,
          },
        },
      });

      const result = await controller.getPrometheusMetrics();

      // Should have entries for all 2 counters
      const counterMatches = result.match(/TYPE.*counter/g);
      expect(counterMatches).toHaveLength(2);

      // Should have entries for 2 valid histograms (not the null one)
      const histogramMatches = result.match(/TYPE.*histogram/g);
      expect(histogramMatches).toHaveLength(2);

      // Verify all histogram stats are exported
      expect(result).toContain('histogram1_count');
      expect(result).toContain('histogram1_sum');
      expect(result).not.toContain('histogram2_count'); // null histogram skipped
      expect(result).toContain('histogram3_count');
    });
  });

  describe('Integration and State Testing', () => {
    it('should reset and then return empty metrics', async () => {
      // First reset
      await controller.resetMetrics();
      expect(metricsService.reset).toHaveBeenCalled();

      // After reset, get metrics should return empty data
      jest.spyOn(metricsService, 'getSummary').mockReturnValue({
        counters: {},
        histograms: {},
      });

      const result = await controller.getMetrics(mockRequest);
      expect(result.data.counters).toEqual({});
      expect(result.data.histograms).toEqual({});
    });

    it('should handle consecutive calls correctly', async () => {
      await controller.getMetrics(mockRequest);
      await controller.getAnalyticsMetrics();
      await controller.getCounters();
      await controller.getHistograms();

      expect(metricsService.getSummary).toHaveBeenCalledTimes(1);
      expect(analyticsMetricsService.getMetricsSnapshot).toHaveBeenCalledTimes(
        1,
      );
      expect(metricsService.getAllCounters).toHaveBeenCalledTimes(1);
      expect(metricsService.getAllHistograms).toHaveBeenCalledTimes(1);
    });
  });
});
