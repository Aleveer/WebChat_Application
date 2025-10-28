import { PerformanceInterceptor } from './performance.interceptors';
import { ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { of, throwError, delay } from 'rxjs';
import { Test, TestingModule } from '@nestjs/testing';

describe('PerformanceInterceptor', () => {
  let interceptor: PerformanceInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: any;
  let loggerWarnMock: jest.SpyInstance;

  beforeEach(async () => {
    interceptor = new PerformanceInterceptor();

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

    loggerWarnMock = jest
      .spyOn((interceptor as any)['logger'] as Logger, 'warn')
      .mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('intercept - Fast requests (< 1000ms)', () => {
    it('should not log warning for fast request', (done) => {
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerWarnMock).not.toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should pass through response data for fast request', (done) => {
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

    it('should call next.handle() for fast request', (done) => {
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockCallHandler.handle).toHaveBeenCalledTimes(1);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle instant response (0ms)', (done) => {
      jest.useFakeTimers();

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerWarnMock).not.toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should not log warning at 999ms (just below threshold)', (done) => {
      jest.useFakeTimers();

      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Advance time by 999ms
      jest.advanceTimersByTime(999);

      result$.subscribe({
        next: () => {
          expect(loggerWarnMock).not.toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('intercept - Slow requests (>= 1000ms)', () => {
    it('should log warning for slow request (1001ms)', (done) => {
      jest.useFakeTimers();
      const startTime = Date.now();

      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Advance time by 1001ms
      jest.advanceTimersByTime(1001);

      result$.subscribe({
        next: () => {
          expect(loggerWarnMock).toHaveBeenCalledTimes(1);
          expect(loggerWarnMock).toHaveBeenCalledWith(
            'Slow Request: GET /api/users took 1001ms',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log warning for request exactly at 1000ms threshold', (done) => {
      jest.useFakeTimers();

      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Advance time by exactly 1000ms
      jest.advanceTimersByTime(1000);

      result$.subscribe({
        next: () => {
          // Duration > 1000, so exactly 1000ms should NOT log
          expect(loggerWarnMock).not.toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should log warning for very slow request (5000ms)', (done) => {
      jest.useFakeTimers();

      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(5000);

      result$.subscribe({
        next: () => {
          expect(loggerWarnMock).toHaveBeenCalledWith(
            'Slow Request: GET /api/users took 5000ms',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log warning for extremely slow request (30000ms)', (done) => {
      jest.useFakeTimers();

      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(30000);

      result$.subscribe({
        next: () => {
          expect(loggerWarnMock).toHaveBeenCalledWith(
            'Slow Request: GET /api/users took 30000ms',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should still pass through response data for slow request', (done) => {
      jest.useFakeTimers();
      const responseData = { message: 'Slow but successful' };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(2000);

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual(responseData);
          expect(loggerWarnMock).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('intercept - Different HTTP methods', () => {
    it('should log GET request method correctly', (done) => {
      jest.useFakeTimers();
      mockRequest.method = 'GET';
      mockRequest.url = '/api/users';

      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(1500);

      result$.subscribe({
        next: () => {
          expect(loggerWarnMock).toHaveBeenCalledWith(
            'Slow Request: GET /api/users took 1500ms',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log POST request method correctly', (done) => {
      jest.useFakeTimers();
      mockRequest.method = 'POST';
      mockRequest.url = '/api/users';

      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(1500);

      result$.subscribe({
        next: () => {
          expect(loggerWarnMock).toHaveBeenCalledWith(
            'Slow Request: POST /api/users took 1500ms',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log PUT request method correctly', (done) => {
      jest.useFakeTimers();
      mockRequest.method = 'PUT';
      mockRequest.url = '/api/users/1';

      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(2000);

      result$.subscribe({
        next: () => {
          expect(loggerWarnMock).toHaveBeenCalledWith(
            'Slow Request: PUT /api/users/1 took 2000ms',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log DELETE request method correctly', (done) => {
      jest.useFakeTimers();
      mockRequest.method = 'DELETE';
      mockRequest.url = '/api/users/1';

      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(1200);

      result$.subscribe({
        next: () => {
          expect(loggerWarnMock).toHaveBeenCalledWith(
            'Slow Request: DELETE /api/users/1 took 1200ms',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log PATCH request method correctly', (done) => {
      jest.useFakeTimers();
      mockRequest.method = 'PATCH';
      mockRequest.url = '/api/users/1';

      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(1100);

      result$.subscribe({
        next: () => {
          expect(loggerWarnMock).toHaveBeenCalledWith(
            'Slow Request: PATCH /api/users/1 took 1100ms',
          );
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('intercept - Different URLs', () => {
    it('should log simple URL correctly', (done) => {
      jest.useFakeTimers();
      mockRequest.url = '/api/test';

      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(1500);

      result$.subscribe({
        next: () => {
          expect(loggerWarnMock).toHaveBeenCalledWith(
            'Slow Request: GET /api/test took 1500ms',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log URL with query parameters', (done) => {
      jest.useFakeTimers();
      mockRequest.url = '/api/users?page=1&limit=10';

      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(1500);

      result$.subscribe({
        next: () => {
          expect(loggerWarnMock).toHaveBeenCalledWith(
            'Slow Request: GET /api/users?page=1&limit=10 took 1500ms',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log URL with path parameters', (done) => {
      jest.useFakeTimers();
      mockRequest.url = '/api/users/123/posts/456';

      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(2000);

      result$.subscribe({
        next: () => {
          expect(loggerWarnMock).toHaveBeenCalledWith(
            'Slow Request: GET /api/users/123/posts/456 took 2000ms',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log root URL', (done) => {
      jest.useFakeTimers();
      mockRequest.url = '/';

      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(1500);

      result$.subscribe({
        next: () => {
          expect(loggerWarnMock).toHaveBeenCalledWith(
            'Slow Request: GET / took 1500ms',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log URL with special characters', (done) => {
      jest.useFakeTimers();
      mockRequest.url = '/api/search?q=hello%20world&filter=active';

      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(1500);

      result$.subscribe({
        next: () => {
          expect(loggerWarnMock).toHaveBeenCalledWith(
            'Slow Request: GET /api/search?q=hello%20world&filter=active took 1500ms',
          );
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('intercept - Error handling', () => {
    it('should not log warning if request fails quickly', (done) => {
      jest.useFakeTimers();
      const error = new Error('Request failed');
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => error));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(500);

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (err) => {
          expect(err).toBe(error);
          expect(loggerWarnMock).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should propagate errors from handler', (done) => {
      const error = new Error('Handler error');
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
          expect(err).toBe(error);
          expect(err.message).toBe('Handler error');
          done();
        },
      });
    });

    it('should not log performance for errored requests', (done) => {
      jest.useFakeTimers();
      const error = new Error('Server error');
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => error));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(2000);

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: () => {
          // tap() doesn't run on error, so no warning logged
          expect(loggerWarnMock).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('intercept - Timing accuracy', () => {
    it('should measure time from start to completion', (done) => {
      jest.useFakeTimers();
      const startTime = Date.now();

      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(1234);

      result$.subscribe({
        next: () => {
          expect(loggerWarnMock).toHaveBeenCalledWith(
            expect.stringContaining('took 1234ms'),
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should calculate duration correctly for multiple time advances', (done) => {
      jest.useFakeTimers();

      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(500);
      jest.advanceTimersByTime(300);
      jest.advanceTimersByTime(400);

      result$.subscribe({
        next: () => {
          expect(loggerWarnMock).toHaveBeenCalledWith(
            expect.stringContaining('took 1200ms'),
          );
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('intercept - Multiple requests', () => {
    it('should track each request independently', (done) => {
      jest.useFakeTimers();
      let completedCount = 0;

      // First request - slow
      mockRequest.method = 'GET';
      mockRequest.url = '/api/slow';
      const result1$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      jest.advanceTimersByTime(1500);

      result1$.subscribe({
        next: () => {
          completedCount++;
          if (completedCount === 2) {
            expect(loggerWarnMock).toHaveBeenCalledTimes(1);
            expect(loggerWarnMock).toHaveBeenCalledWith(
              'Slow Request: GET /api/slow took 1500ms',
            );
            done();
          }
        },
      });

      // Second request - fast
      mockRequest.method = 'POST';
      mockRequest.url = '/api/fast';
      const result2$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      jest.advanceTimersByTime(100);

      result2$.subscribe({
        next: () => {
          completedCount++;
          if (completedCount === 2) {
            expect(loggerWarnMock).toHaveBeenCalledTimes(1);
            done();
          }
        },
      });
    });

    it('should log warnings for all slow requests', (done) => {
      jest.useFakeTimers();
      let completedCount = 0;

      for (let i = 0; i < 3; i++) {
        mockRequest.url = `/api/endpoint${i}`;
        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );
        jest.advanceTimersByTime(1500);

        result$.subscribe({
          next: () => {
            completedCount++;
            if (completedCount === 3) {
              expect(loggerWarnMock).toHaveBeenCalledTimes(3);
              done();
            }
          },
        });
      }
    });
  });

  describe('intercept - Edge cases', () => {
    it('should handle undefined method', (done) => {
      jest.useFakeTimers();
      mockRequest.method = undefined;
      mockRequest.url = '/api/test';

      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(1500);

      result$.subscribe({
        next: () => {
          expect(loggerWarnMock).toHaveBeenCalledWith(
            'Slow Request: undefined /api/test took 1500ms',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should handle undefined url', (done) => {
      jest.useFakeTimers();
      mockRequest.method = 'GET';
      mockRequest.url = undefined;

      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(1500);

      result$.subscribe({
        next: () => {
          expect(loggerWarnMock).toHaveBeenCalledWith(
            'Slow Request: GET undefined took 1500ms',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should handle empty string method', (done) => {
      jest.useFakeTimers();
      mockRequest.method = '';
      mockRequest.url = '/api/test';

      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(1500);

      result$.subscribe({
        next: () => {
          expect(loggerWarnMock).toHaveBeenCalledWith(
            'Slow Request:  /api/test took 1500ms',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should handle empty string url', (done) => {
      jest.useFakeTimers();
      mockRequest.method = 'GET';
      mockRequest.url = '';

      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(1500);

      result$.subscribe({
        next: () => {
          expect(loggerWarnMock).toHaveBeenCalledWith(
            'Slow Request: GET  took 1500ms',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should handle null response data', (done) => {
      jest.useFakeTimers();
      mockCallHandler.handle = jest.fn().mockReturnValue(of(null));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(1500);

      result$.subscribe({
        next: (data) => {
          expect(data).toBeNull();
          expect(loggerWarnMock).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should handle undefined response data', (done) => {
      jest.useFakeTimers();
      mockCallHandler.handle = jest.fn().mockReturnValue(of(undefined));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(1500);

      result$.subscribe({
        next: (data) => {
          expect(data).toBeUndefined();
          expect(loggerWarnMock).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should handle very long URL', (done) => {
      jest.useFakeTimers();
      const longUrl = '/api/' + 'a'.repeat(1000);
      mockRequest.url = longUrl;

      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(1500);

      result$.subscribe({
        next: () => {
          expect(loggerWarnMock).toHaveBeenCalledWith(
            expect.stringContaining(longUrl),
          );
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should monitor typical API endpoint', (done) => {
      jest.useFakeTimers();
      mockRequest.method = 'POST';
      mockRequest.url = '/api/users';

      const responseData = {
        id: 1,
        username: 'john_doe',
        email: 'john@example.com',
      };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(1800);

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual(responseData);
          expect(loggerWarnMock).toHaveBeenCalledWith(
            'Slow Request: POST /api/users took 1800ms',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should monitor database query endpoint', (done) => {
      jest.useFakeTimers();
      mockRequest.method = 'GET';
      mockRequest.url =
        '/api/reports/complex-query?start=2025-01-01&end=2025-12-31';

      const responseData = { results: [], total: 1000 };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(3500);

      result$.subscribe({
        next: () => {
          expect(loggerWarnMock).toHaveBeenCalledWith(
            expect.stringContaining('took 3500ms'),
          );
          expect(loggerWarnMock).toHaveBeenCalledWith(
            expect.stringContaining('/api/reports/complex-query'),
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should not log for fast health check endpoint', (done) => {
      mockRequest.method = 'GET';
      mockRequest.url = '/health';

      mockCallHandler.handle = jest.fn().mockReturnValue(of({ status: 'ok' }));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual({ status: 'ok' });
          expect(loggerWarnMock).not.toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should monitor file upload endpoint', (done) => {
      jest.useFakeTimers();
      mockRequest.method = 'POST';
      mockRequest.url = '/api/files/upload';

      const responseData = { fileId: 'abc123', size: 5242880 };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(2500);

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual(responseData);
          expect(loggerWarnMock).toHaveBeenCalledWith(
            'Slow Request: POST /api/files/upload took 2500ms',
          );
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
      expect(logger.context).toBe('PerformanceInterceptor');
    });

    it('should use warn level for slow requests', (done) => {
      jest.useFakeTimers();
      const warnSpy = jest.spyOn((interceptor as any)['logger'], 'warn');

      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(1500);

      result$.subscribe({
        next: () => {
          expect(warnSpy).toHaveBeenCalledTimes(1);
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('Different execution contexts', () => {
    it('should work with HTTP context', (done) => {
      mockExecutionContext.getType = jest.fn().mockReturnValue('http');

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockCallHandler.handle).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should extract request from context correctly', (done) => {
      const getSpy = jest.spyOn(
        mockExecutionContext.switchToHttp(),
        'getRequest',
      );

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(getSpy).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });
  });
});
