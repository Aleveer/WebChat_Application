import { MetricsInterceptor } from './metrics.interceptors';
import { ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from '../services/metrics.services';

describe('MetricsInterceptor', () => {
  let interceptor: MetricsInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: any;
  let mockMetricsService: jest.Mocked<MetricsService>;
  let loggerDebugMock: jest.SpyInstance;

  beforeEach(async () => {
    // Create mock MetricsService
    mockMetricsService = {
      startTimer: jest.fn(),
      endTimer: jest.fn().mockReturnValue(150),
      incrementCounter: jest.fn(),
      recordHistogram: jest.fn(),
    } as any;

    interceptor = new MetricsInterceptor(mockMetricsService);

    mockRequest = {
      method: 'GET',
      url: '/api/users',
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue({}),
      }),
      getType: jest.fn().mockReturnValue('http'),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    } as any;

    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of({ success: true })),
    } as any;

    loggerDebugMock = jest
      .spyOn((interceptor as any)['logger'] as Logger, 'debug')
      .mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('intercept - Timer management', () => {
    it('should start timer with sanitized URL', (done) => {
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
            'http_get__api_users',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should end timer on successful request', (done) => {
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.endTimer).toHaveBeenCalledWith(
            'http_get__api_users',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should end timer on failed request', (done) => {
      const error = new Error('Request failed');
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => error));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: () => {
          expect(mockMetricsService.endTimer).toHaveBeenCalledWith(
            'http_get__api_users',
          );
          done();
        },
      });
    });

    it('should start timer before calling handler', () => {
      const handleSpy = jest.spyOn(mockCallHandler, 'handle');

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockMetricsService.startTimer).toHaveBeenCalled();
      expect(handleSpy).toHaveBeenCalled();
    });
  });

  describe('intercept - Counter increments', () => {
    it('should increment total request counter on start', (done) => {
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith(
            'http_requests_total{method="GET",path="/api/users"}',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should increment success counter on successful request', (done) => {
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith(
            'http_requests_success',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should increment error counter on failed request', (done) => {
      const error = new Error('Test error');
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => error));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: () => {
          expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith(
            'http_requests_error',
          );
          done();
        },
      });
    });

    it('should increment both total and success counters for successful request', (done) => {
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.incrementCounter).toHaveBeenCalledTimes(2);
          expect(mockMetricsService.incrementCounter).toHaveBeenNthCalledWith(
            1,
            'http_requests_total{method="GET",path="/api/users"}',
          );
          expect(mockMetricsService.incrementCounter).toHaveBeenNthCalledWith(
            2,
            'http_requests_success',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should increment both total and error counters for failed request', (done) => {
      const error = new Error('Test error');
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => error));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: () => {
          expect(mockMetricsService.incrementCounter).toHaveBeenCalledTimes(2);
          expect(mockMetricsService.incrementCounter).toHaveBeenNthCalledWith(
            1,
            'http_requests_total{method="GET",path="/api/users"}',
          );
          expect(mockMetricsService.incrementCounter).toHaveBeenNthCalledWith(
            2,
            'http_requests_error',
          );
          done();
        },
      });
    });
  });

  describe('intercept - Histogram recording', () => {
    it('should record success histogram with duration', (done) => {
      mockMetricsService.endTimer.mockReturnValue(250);

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.recordHistogram).toHaveBeenCalledWith(
            'http_request_duration_ms',
            250,
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should record error histogram with duration', (done) => {
      mockMetricsService.endTimer.mockReturnValue(180);
      const error = new Error('Test error');
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => error));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: () => {
          expect(mockMetricsService.recordHistogram).toHaveBeenCalledWith(
            'http_request_error_duration_ms',
            180,
          );
          done();
        },
      });
    });

    it('should record different durations for different requests', (done) => {
      let callCount = 0;
      mockMetricsService.endTimer.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? 100 : 200;
      });

      const result1$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      const result2$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      let completed = 0;

      result1$.subscribe({
        next: () => {
          completed++;
          if (completed === 2) {
            const calls = mockMetricsService.recordHistogram.mock.calls;
            expect(calls[0][1]).toBe(100);
            expect(calls[1][1]).toBe(200);
            done();
          }
        },
      });

      result2$.subscribe({
        next: () => {
          completed++;
          if (completed === 2) {
            const calls = mockMetricsService.recordHistogram.mock.calls;
            expect(calls[0][1]).toBe(100);
            expect(calls[1][1]).toBe(200);
            done();
          }
        },
      });
    });
  });

  describe('intercept - Logging', () => {
    it('should log successful request completion', (done) => {
      mockMetricsService.endTimer.mockReturnValue(150);

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerDebugMock).toHaveBeenCalledWith(
            'Request completed: GET /api/users - 150ms',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log failed request', (done) => {
      mockMetricsService.endTimer.mockReturnValue(200);
      const error = new Error('Test error');
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => error));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: () => {
          expect(loggerDebugMock).toHaveBeenCalledWith(
            'Request failed: GET /api/users - 200ms',
          );
          done();
        },
      });
    });

    it('should log correct method and URL', (done) => {
      mockRequest.method = 'POST';
      mockRequest.url = '/api/posts';
      mockMetricsService.endTimer.mockReturnValue(100);

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerDebugMock).toHaveBeenCalledWith(
            expect.stringContaining('POST /api/posts'),
          );
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('intercept - Different HTTP methods', () => {
    it('should handle POST request', (done) => {
      mockRequest.method = 'POST';
      mockRequest.url = '/api/users';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
            'http_post__api_users',
          );
          expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith(
            'http_requests_total{method="POST",path="/api/users"}',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should handle PUT request', (done) => {
      mockRequest.method = 'PUT';
      mockRequest.url = '/api/users/1';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
            'http_put__api_users__id',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should handle DELETE request', (done) => {
      mockRequest.method = 'DELETE';
      mockRequest.url = '/api/users/123';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
            'http_delete__api_users__id',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should handle PATCH request', (done) => {
      mockRequest.method = 'PATCH';
      mockRequest.url = '/api/users/1';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
            'http_patch__api_users__id',
          );
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('sanitizeUrl - Query parameters', () => {
    it('should remove query parameters from URL', (done) => {
      mockRequest.url = '/api/users?page=1&limit=10';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
            'http_get__api_users',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should handle URL with multiple query parameters', (done) => {
      mockRequest.url = '/api/search?q=test&filter=active&sort=asc';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
            'http_get__api_search',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should handle URL with special characters in query', (done) => {
      mockRequest.url = '/api/users?name=John%20Doe&email=test@example.com';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
            'http_get__api_users',
          );
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('sanitizeUrl - Numeric IDs', () => {
    it('should replace single numeric ID with :id', (done) => {
      mockRequest.url = '/api/users/123';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
            'http_get__api_users__id',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should replace multiple numeric IDs', (done) => {
      mockRequest.url = '/api/users/123/posts/456';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
            'http_get__api_users__id_posts__id',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should handle long numeric IDs', (done) => {
      mockRequest.url = '/api/users/9876543210';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
            'http_get__api_users__id',
          );
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('sanitizeUrl - MongoDB ObjectIDs', () => {
    it('should replace MongoDB ObjectID with :id', (done) => {
      mockRequest.url = '/api/users/507f1f77bcf86cd799439011';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
            'http_get__api_users__id',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should replace multiple MongoDB ObjectIDs', (done) => {
      mockRequest.url =
        '/api/users/507f1f77bcf86cd799439011/posts/507f191e810c19729de860ea';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
            'http_get__api_users__id_posts__id',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should handle mixed ObjectID and numeric ID', (done) => {
      mockRequest.url = '/api/users/507f1f77bcf86cd799439011/comments/123';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
            'http_get__api_users__id_comments__id',
          );
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('sanitizeUrl - Special characters', () => {
    it('should replace slashes with underscores', (done) => {
      mockRequest.url = '/api/users';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
            'http_get__api_users',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should replace hyphens with underscores', (done) => {
      mockRequest.url = '/api/user-profiles';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
            'http_get__api_user_profiles',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should handle dots in URL', (done) => {
      mockRequest.url = '/api/v1.0/users';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
            'http_get__api_v1_0_users',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should convert to lowercase', (done) => {
      mockRequest.method = 'GET';
      mockRequest.url = '/API/Users';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
            'http_get__api_users',
          );
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('sanitizeUrl - Edge cases', () => {
    it('should handle root URL', (done) => {
      mockRequest.url = '/';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
            'http_get__',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should handle URL with trailing slash', (done) => {
      mockRequest.url = '/api/users/';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
            'http_get__api_users_',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should handle empty query parameter', (done) => {
      mockRequest.url = '/api/users?';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
            'http_get__api_users',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should handle very long URL', (done) => {
      mockRequest.url = '/api/' + 'segment/'.repeat(20) + '123';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.startTimer).toHaveBeenCalled();
          const timerName = mockMetricsService.startTimer.mock.calls[0][0];
          expect(timerName).toContain('__id');
          done();
        },
        error: done.fail,
      });
    });

    it('should handle URL with only query parameters', (done) => {
      mockRequest.url = '/?page=1';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
            'http_get__',
          );
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('intercept - Response handling', () => {
    it('should pass through response data', (done) => {
      const responseData = { id: 1, name: 'Test User' };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual(responseData);
          done();
        },
        error: done.fail,
      });
    });

    it('should propagate errors', (done) => {
      const error = { status: 404, message: 'Not Found' };
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => error));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });

    it('should handle null response', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of(null));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBeNull();
          expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith(
            'http_requests_success',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should handle undefined response', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of(undefined));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBeUndefined();
          expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith(
            'http_requests_success',
          );
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should track complete successful request flow', (done) => {
      mockRequest.method = 'POST';
      mockRequest.url = '/api/users';
      mockMetricsService.endTimer.mockReturnValue(250);

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          // Timer started and ended
          expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
            'http_post__api_users',
          );
          expect(mockMetricsService.endTimer).toHaveBeenCalledWith(
            'http_post__api_users',
          );

          // Counters incremented
          expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith(
            'http_requests_total{method="POST",path="/api/users"}',
          );
          expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith(
            'http_requests_success',
          );

          // Histogram recorded
          expect(mockMetricsService.recordHistogram).toHaveBeenCalledWith(
            'http_request_duration_ms',
            250,
          );

          // Logged
          expect(loggerDebugMock).toHaveBeenCalledWith(
            'Request completed: POST /api/users - 250ms',
          );

          done();
        },
        error: done.fail,
      });
    });

    it('should track complete failed request flow', (done) => {
      mockRequest.method = 'GET';
      mockRequest.url = '/api/users/999';
      mockMetricsService.endTimer.mockReturnValue(180);
      const error = new Error('User not found');
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => error));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: () => {
          // Timer started and ended
          expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
            'http_get__api_users__id',
          );
          expect(mockMetricsService.endTimer).toHaveBeenCalledWith(
            'http_get__api_users__id',
          );

          // Counters incremented
          expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith(
            'http_requests_total{method="GET",path="/api/users/999"}',
          );
          expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith(
            'http_requests_error',
          );

          // Error histogram recorded
          expect(mockMetricsService.recordHistogram).toHaveBeenCalledWith(
            'http_request_error_duration_ms',
            180,
          );

          // Logged
          expect(loggerDebugMock).toHaveBeenCalledWith(
            'Request failed: GET /api/users/999 - 180ms',
          );

          done();
        },
      });
    });

    it('should track file upload request', (done) => {
      mockRequest.method = 'POST';
      mockRequest.url = '/api/files/upload';
      mockMetricsService.endTimer.mockReturnValue(3000);

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.recordHistogram).toHaveBeenCalledWith(
            'http_request_duration_ms',
            3000,
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should track authentication request', (done) => {
      mockRequest.method = 'POST';
      mockRequest.url = '/api/auth/login';
      mockMetricsService.endTimer.mockReturnValue(120);

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
            'http_post__api_auth_login',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should track complex query request', (done) => {
      mockRequest.url = '/api/users?page=2&limit=50&sort=name&filter=active';
      mockMetricsService.endTimer.mockReturnValue(500);

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
            'http_get__api_users',
          );
          expect(mockMetricsService.recordHistogram).toHaveBeenCalledWith(
            'http_request_duration_ms',
            500,
          );
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('MetricsService dependency', () => {
    it('should have MetricsService injected', () => {
      expect((interceptor as any).metricsService).toBe(mockMetricsService);
    });

    it('should call all MetricsService methods for successful request', (done) => {
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.startTimer).toHaveBeenCalled();
          expect(mockMetricsService.endTimer).toHaveBeenCalled();
          expect(mockMetricsService.incrementCounter).toHaveBeenCalled();
          expect(mockMetricsService.recordHistogram).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('Logger instance', () => {
    it('should have logger with correct name', () => {
      const logger = (interceptor as any)['logger'];
      expect(logger).toBeInstanceOf(Logger);
      expect(logger.context).toBe('MetricsInterceptor');
    });

    it('should use debug level for logging', (done) => {
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerDebugMock).toHaveBeenCalledTimes(1);
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty URL', (done) => {
      mockRequest.url = '';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.startTimer).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should handle zero duration', (done) => {
      mockMetricsService.endTimer.mockReturnValue(0);

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.recordHistogram).toHaveBeenCalledWith(
            'http_request_duration_ms',
            0,
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should handle negative duration from service', (done) => {
      mockMetricsService.endTimer.mockReturnValue(-1);

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.recordHistogram).toHaveBeenCalledWith(
            'http_request_duration_ms',
            -1,
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should handle very large duration', (done) => {
      mockMetricsService.endTimer.mockReturnValue(999999);

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockMetricsService.recordHistogram).toHaveBeenCalledWith(
            'http_request_duration_ms',
            999999,
          );
          done();
        },
        error: done.fail,
      });
    });
  });
});
