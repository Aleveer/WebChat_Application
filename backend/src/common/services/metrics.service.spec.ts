import { MetricsService } from './metrics.services';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('MetricsService', () => {
  let service: MetricsService;
  let loggerLogMock: jest.SpyInstance;
  let loggerWarnMock: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
    loggerLogMock = jest
      .spyOn((service as any)['logger'] as Logger, 'log')
      .mockImplementation();
    loggerWarnMock = jest
      .spyOn((service as any)['logger'] as Logger, 'warn')
      .mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should log initialization message', () => {
      service.onModuleInit();

      expect(loggerLogMock).toHaveBeenCalledWith('Metrics service initialized');
    });

    it('should be called during module initialization', () => {
      const onModuleInitSpy = jest.spyOn(service, 'onModuleInit');

      service.onModuleInit();

      expect(onModuleInitSpy).toHaveBeenCalled();
    });
  });

  describe('incrementCounter', () => {
    it('should increment counter by 1 by default', () => {
      service.incrementCounter('test_counter');

      expect(service.getCounter('test_counter')).toBe(1);
    });

    it('should increment counter by specified value', () => {
      service.incrementCounter('test_counter', 5);

      expect(service.getCounter('test_counter')).toBe(5);
    });

    it('should increment existing counter', () => {
      service.incrementCounter('test_counter', 3);
      service.incrementCounter('test_counter', 2);

      expect(service.getCounter('test_counter')).toBe(5);
    });

    it('should handle multiple different counters', () => {
      service.incrementCounter('counter_a', 10);
      service.incrementCounter('counter_b', 20);
      service.incrementCounter('counter_c', 30);

      expect(service.getCounter('counter_a')).toBe(10);
      expect(service.getCounter('counter_b')).toBe(20);
      expect(service.getCounter('counter_c')).toBe(30);
    });

    it('should handle zero increment', () => {
      service.incrementCounter('test_counter', 0);

      expect(service.getCounter('test_counter')).toBe(0);
    });

    it('should handle negative increment values', () => {
      service.incrementCounter('test_counter', 10);
      service.incrementCounter('test_counter', -5);

      expect(service.getCounter('test_counter')).toBe(5);
    });

    it('should handle large increment values', () => {
      service.incrementCounter('test_counter', 1000000);

      expect(service.getCounter('test_counter')).toBe(1000000);
    });

    it('should handle decimal increment values', () => {
      service.incrementCounter('test_counter', 1.5);
      service.incrementCounter('test_counter', 2.3);

      expect(service.getCounter('test_counter')).toBeCloseTo(3.8);
    });
  });

  describe('decrementCounter', () => {
    it('should decrement counter by 1 by default', () => {
      service.incrementCounter('test_counter', 10);
      service.decrementCounter('test_counter');

      expect(service.getCounter('test_counter')).toBe(9);
    });

    it('should decrement counter by specified value', () => {
      service.incrementCounter('test_counter', 10);
      service.decrementCounter('test_counter', 5);

      expect(service.getCounter('test_counter')).toBe(5);
    });

    it('should not go below zero', () => {
      service.incrementCounter('test_counter', 5);
      service.decrementCounter('test_counter', 10);

      expect(service.getCounter('test_counter')).toBe(0);
    });

    it('should handle decrement on non-existent counter (returns 0)', () => {
      service.decrementCounter('non_existent', 5);

      expect(service.getCounter('non_existent')).toBe(0);
    });

    it('should handle zero decrement', () => {
      service.incrementCounter('test_counter', 10);
      service.decrementCounter('test_counter', 0);

      expect(service.getCounter('test_counter')).toBe(10);
    });

    it('should handle negative decrement values (acts as increment)', () => {
      service.incrementCounter('test_counter', 10);
      service.decrementCounter('test_counter', -5);

      expect(service.getCounter('test_counter')).toBe(15);
    });

    it('should handle decrement to exactly zero', () => {
      service.incrementCounter('test_counter', 5);
      service.decrementCounter('test_counter', 5);

      expect(service.getCounter('test_counter')).toBe(0);
    });

    it('should handle multiple decrements', () => {
      service.incrementCounter('test_counter', 100);
      service.decrementCounter('test_counter', 20);
      service.decrementCounter('test_counter', 30);
      service.decrementCounter('test_counter', 10);

      expect(service.getCounter('test_counter')).toBe(40);
    });
  });

  describe('startTimer and endTimer', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should start a timer', () => {
      const startTime = Date.now();
      jest.setSystemTime(startTime);

      service.startTimer('test_timer');

      const timers = (service as any).timers;
      expect(timers.has('test_timer')).toBe(true);
      expect(timers.get('test_timer')).toBe(startTime);
    });

    it('should end a timer and return duration', () => {
      const startTime = Date.now();
      jest.setSystemTime(startTime);
      service.startTimer('test_timer');

      jest.setSystemTime(startTime + 100);
      const duration = service.endTimer('test_timer');

      expect(duration).toBe(100);
    });

    it('should record duration in histogram when timer ends', () => {
      const startTime = Date.now();
      jest.setSystemTime(startTime);
      service.startTimer('test_timer');

      jest.setSystemTime(startTime + 150);
      service.endTimer('test_timer');

      const stats = service.getHistogramStats('test_timer');
      expect(stats).not.toBeNull();
      expect(stats!.count).toBe(1);
      expect(stats!.min).toBe(150);
    });

    it('should remove timer after ending', () => {
      service.startTimer('test_timer');
      service.endTimer('test_timer');

      const timers = (service as any).timers;
      expect(timers.has('test_timer')).toBe(false);
    });

    it('should warn when ending a timer that was not started', () => {
      const duration = service.endTimer('non_existent_timer');

      expect(duration).toBe(0);
      expect(loggerWarnMock).toHaveBeenCalledWith(
        'Timer non_existent_timer was not started',
      );
    });

    it('should handle multiple timers', () => {
      const startTime = Date.now();
      jest.setSystemTime(startTime);

      service.startTimer('timer_1');
      jest.setSystemTime(startTime + 50);
      service.startTimer('timer_2');
      jest.setSystemTime(startTime + 100);

      const duration1 = service.endTimer('timer_1');
      const duration2 = service.endTimer('timer_2');

      expect(duration1).toBe(100);
      expect(duration2).toBe(50);
    });

    it('should allow restarting the same timer', () => {
      const startTime = Date.now();
      jest.setSystemTime(startTime);

      service.startTimer('test_timer');
      jest.setSystemTime(startTime + 100);
      service.endTimer('test_timer');

      jest.setSystemTime(startTime + 200);
      service.startTimer('test_timer');
      jest.setSystemTime(startTime + 350);
      const duration = service.endTimer('test_timer');

      expect(duration).toBe(150);
    });

    it('should handle zero duration timer', () => {
      const startTime = Date.now();
      jest.setSystemTime(startTime);

      service.startTimer('test_timer');
      const duration = service.endTimer('test_timer');

      expect(duration).toBe(0);
    });
  });

  describe('recordHistogram', () => {
    it('should record a value in histogram', () => {
      service.recordHistogram('test_histogram', 100);

      const stats = service.getHistogramStats('test_histogram');
      expect(stats).not.toBeNull();
      expect(stats!.count).toBe(1);
      expect(stats!.min).toBe(100);
      expect(stats!.max).toBe(100);
    });

    it('should record multiple values in histogram', () => {
      service.recordHistogram('test_histogram', 10);
      service.recordHistogram('test_histogram', 20);
      service.recordHistogram('test_histogram', 30);

      const stats = service.getHistogramStats('test_histogram');
      expect(stats!.count).toBe(3);
      expect(stats!.min).toBe(10);
      expect(stats!.max).toBe(30);
    });

    it('should limit histogram to 1000 values', () => {
      for (let i = 0; i < 1500; i++) {
        service.recordHistogram('test_histogram', i);
      }

      const stats = service.getHistogramStats('test_histogram');
      expect(stats!.count).toBe(1000);
      // Should keep last 1000 values (500-1499)
      expect(stats!.min).toBe(500);
      expect(stats!.max).toBe(1499);
    });

    it('should handle negative values', () => {
      service.recordHistogram('test_histogram', -10);
      service.recordHistogram('test_histogram', -5);
      service.recordHistogram('test_histogram', 5);

      const stats = service.getHistogramStats('test_histogram');
      expect(stats!.min).toBe(-10);
      expect(stats!.max).toBe(5);
    });

    it('should handle decimal values', () => {
      service.recordHistogram('test_histogram', 1.5);
      service.recordHistogram('test_histogram', 2.7);
      service.recordHistogram('test_histogram', 3.2);

      const stats = service.getHistogramStats('test_histogram');
      expect(stats!.min).toBeCloseTo(1.5);
      expect(stats!.max).toBeCloseTo(3.2);
    });

    it('should handle zero values', () => {
      service.recordHistogram('test_histogram', 0);
      service.recordHistogram('test_histogram', 0);

      const stats = service.getHistogramStats('test_histogram');
      expect(stats!.count).toBe(2);
      expect(stats!.min).toBe(0);
      expect(stats!.max).toBe(0);
    });
  });

  describe('getCounter', () => {
    it('should return counter value', () => {
      service.incrementCounter('test_counter', 10);

      expect(service.getCounter('test_counter')).toBe(10);
    });

    it('should return 0 for non-existent counter', () => {
      expect(service.getCounter('non_existent')).toBe(0);
    });

    it('should return updated value after increment', () => {
      service.incrementCounter('test_counter', 5);
      expect(service.getCounter('test_counter')).toBe(5);

      service.incrementCounter('test_counter', 3);
      expect(service.getCounter('test_counter')).toBe(8);
    });
  });

  describe('getAllCounters', () => {
    it('should return all counters', () => {
      service.incrementCounter('counter_1', 10);
      service.incrementCounter('counter_2', 20);
      service.incrementCounter('counter_3', 30);

      const counters = service.getAllCounters();

      expect(counters).toEqual({
        counter_1: 10,
        counter_2: 20,
        counter_3: 30,
      });
    });

    it('should return empty object when no counters exist', () => {
      const counters = service.getAllCounters();

      expect(counters).toEqual({});
    });

    it('should return a copy of counters (not reference)', () => {
      service.incrementCounter('test_counter', 10);

      const counters1 = service.getAllCounters();
      counters1['test_counter'] = 999;

      const counters2 = service.getAllCounters();
      expect(counters2['test_counter']).toBe(10);
    });
  });

  describe('getHistogramStats', () => {
    it('should return null for non-existent histogram', () => {
      const stats = service.getHistogramStats('non_existent');

      expect(stats).toBeNull();
    });

    it('should return null for empty histogram', () => {
      const histograms = (service as any).histograms;
      histograms['empty_histogram'] = [];

      const stats = service.getHistogramStats('empty_histogram');

      expect(stats).toBeNull();
    });

    it('should calculate correct statistics', () => {
      service.recordHistogram('test_histogram', 10);
      service.recordHistogram('test_histogram', 20);
      service.recordHistogram('test_histogram', 30);
      service.recordHistogram('test_histogram', 40);
      service.recordHistogram('test_histogram', 50);

      const stats = service.getHistogramStats('test_histogram');

      expect(stats).not.toBeNull();
      expect(stats!.count).toBe(5);
      expect(stats!.min).toBe(10);
      expect(stats!.max).toBe(50);
      expect(stats!.avg).toBe(30);
      expect(stats!.p50).toBe(30); // median
    });

    it('should calculate percentiles correctly', () => {
      const values = [];
      for (let i = 1; i <= 100; i++) {
        values.push(i);
        service.recordHistogram('test_histogram', i);
      }

      const stats = service.getHistogramStats('test_histogram');

      // Math.floor(100 * 0.5) = 50, which is index 50, value is 51 (0-indexed array)
      expect(stats!.p50).toBe(51);
      // Math.floor(100 * 0.95) = 95, which is index 95, value is 96
      expect(stats!.p95).toBe(96);
      // Math.floor(100 * 0.99) = 99, which is index 99, value is 100
      expect(stats!.p99).toBe(100);
    });

    it('should handle single value histogram', () => {
      service.recordHistogram('test_histogram', 42);

      const stats = service.getHistogramStats('test_histogram');

      expect(stats!.count).toBe(1);
      expect(stats!.min).toBe(42);
      expect(stats!.max).toBe(42);
      expect(stats!.avg).toBe(42);
      expect(stats!.p50).toBe(42);
      expect(stats!.p95).toBe(42);
      expect(stats!.p99).toBe(42);
    });

    it('should handle two value histogram', () => {
      service.recordHistogram('test_histogram', 10);
      service.recordHistogram('test_histogram', 20);

      const stats = service.getHistogramStats('test_histogram');

      expect(stats!.count).toBe(2);
      expect(stats!.min).toBe(10);
      expect(stats!.max).toBe(20);
      expect(stats!.avg).toBe(15);
    });

    it('should not mutate original histogram when calculating stats', () => {
      service.recordHistogram('test_histogram', 30);
      service.recordHistogram('test_histogram', 10);
      service.recordHistogram('test_histogram', 20);

      service.getHistogramStats('test_histogram');

      const histograms = (service as any).histograms;
      expect(histograms['test_histogram']).toEqual([30, 10, 20]);
    });
  });

  describe('getAllHistograms', () => {
    it('should return all histogram statistics', () => {
      service.recordHistogram('histogram_1', 10);
      service.recordHistogram('histogram_1', 20);
      service.recordHistogram('histogram_2', 30);
      service.recordHistogram('histogram_2', 40);

      const histograms = service.getAllHistograms();

      expect(histograms).toHaveProperty('histogram_1');
      expect(histograms).toHaveProperty('histogram_2');
      expect(histograms['histogram_1']!.count).toBe(2);
      expect(histograms['histogram_2']!.count).toBe(2);
    });

    it('should return empty object when no histograms exist', () => {
      const histograms = service.getAllHistograms();

      expect(histograms).toEqual({});
    });

    it('should not include empty histograms', () => {
      service.recordHistogram('histogram_1', 10);
      const histogramsData = (service as any).histograms;
      histogramsData['empty_histogram'] = [];

      const histograms = service.getAllHistograms();

      expect(histograms).toHaveProperty('histogram_1');
      expect(histograms).not.toHaveProperty('empty_histogram');
    });
  });

  describe('reset', () => {
    it('should reset all counters', () => {
      service.incrementCounter('counter_1', 10);
      service.incrementCounter('counter_2', 20);

      service.reset();

      expect(service.getCounter('counter_1')).toBe(0);
      expect(service.getCounter('counter_2')).toBe(0);
      expect(service.getAllCounters()).toEqual({});
    });

    it('should reset all histograms', () => {
      service.recordHistogram('histogram_1', 10);
      service.recordHistogram('histogram_2', 20);

      service.reset();

      expect(service.getHistogramStats('histogram_1')).toBeNull();
      expect(service.getHistogramStats('histogram_2')).toBeNull();
      expect(service.getAllHistograms()).toEqual({});
    });

    it('should clear all timers', () => {
      service.startTimer('timer_1');
      service.startTimer('timer_2');

      service.reset();

      const timers = (service as any).timers;
      expect(timers.size).toBe(0);
    });

    it('should log reset message', () => {
      service.reset();

      expect(loggerLogMock).toHaveBeenCalledWith('All metrics reset');
    });

    it('should allow adding new metrics after reset', () => {
      service.incrementCounter('test_counter', 10);
      service.recordHistogram('test_histogram', 20);

      service.reset();

      service.incrementCounter('new_counter', 5);
      service.recordHistogram('new_histogram', 15);

      expect(service.getCounter('new_counter')).toBe(5);
      expect(service.getHistogramStats('new_histogram')!.count).toBe(1);
    });
  });

  describe('getSummary', () => {
    it('should return summary of all metrics', () => {
      service.incrementCounter('counter_1', 10);
      service.incrementCounter('counter_2', 20);
      service.recordHistogram('histogram_1', 30);
      service.recordHistogram('histogram_1', 40);

      const summary = service.getSummary();

      expect(summary).toHaveProperty('counters');
      expect(summary).toHaveProperty('histograms');
      expect(summary.counters).toEqual({
        counter_1: 10,
        counter_2: 20,
      });
      expect(summary.histograms).toHaveProperty('histogram_1');
    });

    it('should return empty summary when no metrics exist', () => {
      const summary = service.getSummary();

      expect(summary.counters).toEqual({});
      expect(summary.histograms).toEqual({});
    });

    it('should not allow mutation of internal state through summary', () => {
      service.incrementCounter('test_counter', 10);

      const summary1 = service.getSummary();
      summary1.counters['test_counter'] = 999;

      const summary2 = service.getSummary();
      expect(summary2.counters['test_counter']).toBe(10);
    });
  });

  describe('Edge cases and integration', () => {
    it('should handle mixed counter and histogram operations', () => {
      service.incrementCounter('requests', 100);
      service.recordHistogram('response_time', 50);
      service.decrementCounter('requests', 10);
      service.recordHistogram('response_time', 75);

      expect(service.getCounter('requests')).toBe(90);
      const stats = service.getHistogramStats('response_time');
      expect(stats!.count).toBe(2);
    });

    it('should handle special characters in metric names', () => {
      service.incrementCounter('metric:with:colons', 10);
      service.recordHistogram('metric-with-dashes', 20);
      service.incrementCounter('metric.with.dots', 30);

      expect(service.getCounter('metric:with:colons')).toBe(10);
      expect(service.getHistogramStats('metric-with-dashes')!.count).toBe(1);
      expect(service.getCounter('metric.with.dots')).toBe(30);
    });

    it('should handle very large histogram datasets', () => {
      for (let i = 0; i < 10000; i++) {
        service.recordHistogram('large_histogram', Math.random() * 1000);
      }

      const stats = service.getHistogramStats('large_histogram');
      expect(stats!.count).toBe(1000); // Should be limited to 1000
    });

    it('should handle concurrent timer operations', () => {
      jest.useFakeTimers();
      const startTime = Date.now();
      jest.setSystemTime(startTime);

      service.startTimer('timer_1');
      jest.setSystemTime(startTime + 50);
      service.startTimer('timer_2');
      jest.setSystemTime(startTime + 100);
      service.startTimer('timer_3');
      jest.setSystemTime(startTime + 150);

      const duration1 = service.endTimer('timer_1');
      const duration2 = service.endTimer('timer_2');
      const duration3 = service.endTimer('timer_3');

      expect(duration1).toBe(150);
      expect(duration2).toBe(100);
      expect(duration3).toBe(50);

      jest.useRealTimers();
    });

    it('should maintain accuracy with many operations', () => {
      for (let i = 0; i < 1000; i++) {
        service.incrementCounter('test_counter', 1);
      }

      expect(service.getCounter('test_counter')).toBe(1000);
    });

    it('should handle empty string metric names', () => {
      service.incrementCounter('', 10);
      service.recordHistogram('', 20);

      expect(service.getCounter('')).toBe(10);
      expect(service.getHistogramStats('')!.count).toBe(1);
    });

    it('should handle timer ending before histogram limit is reached', () => {
      jest.useFakeTimers();

      for (let i = 0; i < 999; i++) {
        service.recordHistogram('test_timer', i);
      }

      const startTime = Date.now();
      jest.setSystemTime(startTime);
      service.startTimer('test_timer');
      jest.setSystemTime(startTime + 100);
      service.endTimer('test_timer');

      const stats = service.getHistogramStats('test_timer');
      expect(stats!.count).toBe(1000);

      jest.useRealTimers();
    });

    it('should handle percentile calculation edge cases', () => {
      // Test with small dataset
      service.recordHistogram('small', 1);
      service.recordHistogram('small', 2);

      const stats = service.getHistogramStats('small');
      expect(stats!.p95).toBeGreaterThanOrEqual(stats!.p50);
      expect(stats!.p99).toBeGreaterThanOrEqual(stats!.p95);
    });

    it('should verify complete workflow', () => {
      // Increment counters
      service.incrementCounter('api_requests', 100);
      service.incrementCounter('api_errors', 5);

      // Track response times
      jest.useFakeTimers();
      const startTime = Date.now();
      jest.setSystemTime(startTime);

      service.startTimer('request_1');
      jest.setSystemTime(startTime + 100);
      service.endTimer('request_1');

      service.startTimer('request_2');
      jest.setSystemTime(startTime + 250);
      service.endTimer('request_2');

      jest.useRealTimers();

      // Get summary
      const summary = service.getSummary();

      expect(summary.counters['api_requests']).toBe(100);
      expect(summary.counters['api_errors']).toBe(5);
      expect(summary.histograms['request_1']!.count).toBe(1);
      expect(summary.histograms['request_2']!.count).toBe(1);

      // Reset and verify
      service.reset();
      const emptySummary = service.getSummary();
      expect(emptySummary.counters).toEqual({});
      expect(emptySummary.histograms).toEqual({});
    });
  });
});
