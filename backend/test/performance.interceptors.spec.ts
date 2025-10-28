import 'reflect-metadata';
import { PerformanceInterceptor } from '../src/common/interceptors/performance.interceptors';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { Request } from 'express';
import type { InterceptorConfig } from '../src/common/config/interceptor.config';
import { DEFAULT_INTERCEPTOR_CONFIG } from '../src/common/config/interceptor.config';

describe('PerformanceInterceptor - White Box Testing (Input-Output)', () => {
  let interceptor: PerformanceInterceptor;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;
  let mockRequest: Partial<Request>;

  beforeEach(() => {
    // Mock Request
    mockRequest = {
      method: 'GET',
      url: '/api/users',
    };

    // Mock ExecutionContext
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => mockRequest,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as unknown as jest.Mocked<ExecutionContext>;

    // Mock CallHandler
    mockCallHandler = {
      handle: jest.fn(),
    } as jest.Mocked<CallHandler>;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Configuration Handling', () => {
    /**
     * Test Case 1: Kiểm tra default config
     * Input: No config provided
     * Expected Output: Use DEFAULT_INTERCEPTOR_CONFIG value (1000ms)
     * Path Coverage: config ?? DEFAULT_INTERCEPTOR_CONFIG
     */
    it('TC001: should use default threshold when no config provided', (done) => {
      interceptor = new PerformanceInterceptor();
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: 'test' });
            observer.complete();
          }, 1100); // Exceed default 1000ms
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Slow Request'),
        );
        done();
      });
    });

    /**
     * Test Case 2: Kiểm tra custom config
     * Input: Custom config with 500ms threshold
     * Expected Output: Use custom threshold
     * Path Coverage: this.config?.performance.slowRequestThreshold
     */
    it('TC002: should use custom threshold when config provided', (done) => {
      const customConfig: InterceptorConfig = {
        ...DEFAULT_INTERCEPTOR_CONFIG,
        performance: { slowRequestThreshold: 500 },
      };

      interceptor = new PerformanceInterceptor(customConfig);
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: 'test' });
            observer.complete();
          }, 600); // Exceed custom 500ms
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Slow Request'),
        );
        done();
      });
    });

    /**
     * Test Case 3: Kiểm tra undefined config
     * Input: undefined config
     * Expected Output: Use default threshold
     * Path Coverage: config === undefined
     */
    it('TC003: should use default threshold when config is undefined', (done) => {
      interceptor = new PerformanceInterceptor(undefined);
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: 'test' });
            observer.complete();
          }, 1100);
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).toHaveBeenCalled();
        done();
      });
    });

    /**
     * Test Case 4: Kiểm tra zero threshold
     * Input: Config with threshold = 0
     * Expected Output: All requests logged as slow (duration > 0)
     * Path Coverage: duration > 0
     */
    it('TC004: should log all requests when threshold is zero', (done) => {
      const customConfig: InterceptorConfig = {
        ...DEFAULT_INTERCEPTOR_CONFIG,
        performance: { slowRequestThreshold: 0 },
      };

      interceptor = new PerformanceInterceptor(customConfig);
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: 'test' });
            observer.complete();
          }, 10); // Small delay to ensure duration > 0
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).toHaveBeenCalled();
        done();
      });
    });

    /**
     * Test Case 5: Kiểm tra very high threshold
     * Input: Config with threshold = 10000ms
     * Expected Output: No warnings for normal requests
     * Path Coverage: duration <= threshold
     */
    it('TC005: should not log when threshold is very high', (done) => {
      const customConfig: InterceptorConfig = {
        ...DEFAULT_INTERCEPTOR_CONFIG,
        performance: { slowRequestThreshold: 10000 },
      };

      interceptor = new PerformanceInterceptor(customConfig);
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: 'test' });
            observer.complete();
          }, 100);
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).not.toHaveBeenCalled();
        done();
      });
    });
  });

  describe('Performance Tracking', () => {
    beforeEach(() => {
      interceptor = new PerformanceInterceptor();
    });

    /**
     * Test Case 6: Kiểm tra fast request
     * Input: Request completing < threshold
     * Expected Output: No warning logged
     * Path Coverage: duration <= slowRequestThreshold
     */
    it('TC006: should not warn for fast requests', (done) => {
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: 'test' });
            observer.complete();
          }, 500); // Below 1000ms threshold
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).not.toHaveBeenCalled();
        done();
      });
    });

    /**
     * Test Case 7: Kiểm tra slow request
     * Input: Request completing > threshold
     * Expected Output: Warning logged
     * Path Coverage: duration > slowRequestThreshold
     */
    it('TC007: should warn for slow requests', (done) => {
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: 'test' });
            observer.complete();
          }, 1100); // Exceed 1000ms threshold
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Slow Request'),
        );
        done();
      });
    });

    /**
     * Test Case 8: Kiểm tra request at threshold
     * Input: Request completing exactly at threshold
     * Expected Output: No warning (> not >=)
     * Path Coverage: duration === slowRequestThreshold
     */
    it('TC008: should not warn when duration equals threshold', (done) => {
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: 'test' });
            observer.complete();
          }, 980); // Slightly under 1000ms to account for overhead
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).not.toHaveBeenCalled();
        done();
      });
    }, 10000);

    /**
     * Test Case 9: Kiểm tra very slow request
     * Input: Request taking several seconds
     * Expected Output: Warning with correct duration
     * Path Coverage: High duration value
     */
    it('TC009: should warn for very slow requests', (done) => {
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: 'test' });
            observer.complete();
          }, 3000);
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringMatching(/Slow Request.*3\d{3}ms/),
        );
        done();
      });
    });

    /**
     * Test Case 10: Kiểm tra instant request
     * Input: Request completing immediately
     * Expected Output: No warning
     * Path Coverage: duration ≈ 0
     */
    it('TC010: should not warn for instant requests', (done) => {
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).not.toHaveBeenCalled();
        done();
      });
    });
  });

  describe('Warning Message Format', () => {
    beforeEach(() => {
      interceptor = new PerformanceInterceptor();
    });

    /**
     * Test Case 11: Kiểm tra warning includes method
     * Input: Slow GET request
     * Expected Output: Warning contains "GET"
     * Path Coverage: Warning message format
     */
    it('TC011: should include method in warning', (done) => {
      mockRequest.method = 'GET';
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: 'test' });
            observer.complete();
          }, 1100);
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('GET'));
        done();
      });
    });

    /**
     * Test Case 12: Kiểm tra warning includes URL
     * Input: Slow request to /api/users
     * Expected Output: Warning contains "/api/users"
     * Path Coverage: Warning message format
     */
    it('TC012: should include URL in warning', (done) => {
      mockRequest.url = '/api/users';
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: 'test' });
            observer.complete();
          }, 1100);
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('/api/users'),
        );
        done();
      });
    });

    /**
     * Test Case 13: Kiểm tra warning includes duration
     * Input: Slow request
     * Expected Output: Warning contains duration in ms
     * Path Coverage: Warning message format
     */
    it('TC013: should include duration in warning', (done) => {
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: 'test' });
            observer.complete();
          }, 1500);
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringMatching(/15\d{2}ms/),
        );
        done();
      });
    });

    /**
     * Test Case 14: Kiểm tra complete warning format
     * Input: Slow POST request
     * Expected Output: "Slow Request: POST /api/users took XXXms"
     * Path Coverage: Complete message format
     */
    it('TC014: should log complete warning message', (done) => {
      mockRequest.method = 'POST';
      mockRequest.url = '/api/users';
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: 'test' });
            observer.complete();
          }, 1200);
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringMatching(
            /Slow Request: POST \/api\/users took 12\d{2}ms/,
          ),
        );
        done();
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      interceptor = new PerformanceInterceptor();
    });

    /**
     * Test Case 15: Kiểm tra error doesn't trigger warning
     * Input: Request throws error after long time
     * Expected Output: No warning (tap only runs on success)
     * Path Coverage: Error path
     */
    it('TC015: should not warn when request errors', (done) => {
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');
      const error = new Error('Test error');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.error(error);
          }, 1500);
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: () => {
          expect(warnSpy).not.toHaveBeenCalled();
          done();
        },
      });
    });

    /**
     * Test Case 16: Kiểm tra error is propagated
     * Input: Handler throws error
     * Expected Output: Error propagated to subscriber
     * Path Coverage: Error propagation
     */
    it('TC016: should propagate errors', (done) => {
      const error = new Error('Test error');
      mockCallHandler.handle.mockReturnValue(throwError(() => error));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('Observable Behavior', () => {
    beforeEach(() => {
      interceptor = new PerformanceInterceptor();
    });

    /**
     * Test Case 17: Kiểm tra data passthrough
     * Input: Handler returns data
     * Expected Output: Data emitted unchanged
     * Path Coverage: Data flow
     */
    it('TC017: should pass through handler data', (done) => {
      const handlerData = { id: 1, name: 'Test' };
      mockCallHandler.handle.mockReturnValue(of(handlerData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data).toEqual(handlerData);
        done();
      });
    });

    /**
     * Test Case 18: Kiểm tra Observable completes
     * Input: Successful request
     * Expected Output: Observable completes
     * Path Coverage: Observable lifecycle
     */
    it('TC018: should complete Observable', (done) => {
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        complete: () => done(),
      });
    });

    /**
     * Test Case 19: Kiểm tra handler is called
     * Input: Any request
     * Expected Output: CallHandler.handle() called
     * Path Coverage: Handler invocation
     */
    it('TC019: should call handler', (done) => {
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockCallHandler.handle).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('Different HTTP Methods', () => {
    beforeEach(() => {
      interceptor = new PerformanceInterceptor();
    });

    /**
     * Test Case 20: Kiểm tra GET request
     * Input: Slow GET
     * Expected Output: Warning with GET
     * Path Coverage: GET method
     */
    it('TC020: should track GET requests', (done) => {
      mockRequest.method = 'GET';
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: 'test' });
            observer.complete();
          }, 1100);
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('GET'));
        done();
      });
    });

    /**
     * Test Case 21: Kiểm tra POST request
     * Input: Slow POST
     * Expected Output: Warning with POST
     * Path Coverage: POST method
     */
    it('TC021: should track POST requests', (done) => {
      mockRequest.method = 'POST';
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: 'test' });
            observer.complete();
          }, 1100);
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('POST'));
        done();
      });
    });

    /**
     * Test Case 22: Kiểm tra PUT request
     * Input: Slow PUT
     * Expected Output: Warning with PUT
     * Path Coverage: PUT method
     */
    it('TC022: should track PUT requests', (done) => {
      mockRequest.method = 'PUT';
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: 'test' });
            observer.complete();
          }, 1100);
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('PUT'));
        done();
      });
    });

    /**
     * Test Case 23: Kiểm tra DELETE request
     * Input: Slow DELETE
     * Expected Output: Warning with DELETE
     * Path Coverage: DELETE method
     */
    it('TC023: should track DELETE requests', (done) => {
      mockRequest.method = 'DELETE';
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: 'test' });
            observer.complete();
          }, 1100);
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('DELETE'));
        done();
      });
    });

    /**
     * Test Case 24: Kiểm tra PATCH request
     * Input: Slow PATCH
     * Expected Output: Warning with PATCH
     * Path Coverage: PATCH method
     */
    it('TC024: should track PATCH requests', (done) => {
      mockRequest.method = 'PATCH';
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: 'test' });
            observer.complete();
          }, 1100);
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('PATCH'));
        done();
      });
    });
  });

  describe('Real-world Scenarios', () => {
    beforeEach(() => {
      interceptor = new PerformanceInterceptor();
    });

    /**
     * Test Case 25: Kiểm tra database query simulation
     * Input: Slow database query (1.5s)
     * Expected Output: Warning logged
     * Path Coverage: Database scenario
     */
    it('TC025: should warn for slow database queries', (done) => {
      mockRequest.url = '/api/users/search';
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ results: [] });
            observer.complete();
          }, 1500);
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('/api/users/search'),
        );
        done();
      });
    });

    /**
     * Test Case 26: Kiểm tra file upload
     * Input: File upload taking 2s
     * Expected Output: Warning logged
     * Path Coverage: File upload scenario
     */
    it('TC026: should warn for slow file uploads', (done) => {
      mockRequest.method = 'POST';
      mockRequest.url = '/api/files/upload';
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ uploaded: true });
            observer.complete();
          }, 2000);
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringMatching(/20\d{2}ms/),
        );
        done();
      });
    });

    /**
     * Test Case 27: Kiểm tra API call
     * Input: Fast API call (500ms)
     * Expected Output: No warning
     * Path Coverage: Fast API scenario
     */
    it('TC027: should not warn for fast API calls', (done) => {
      mockRequest.url = '/api/health';
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ status: 'ok' });
            observer.complete();
          }, 500);
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).not.toHaveBeenCalled();
        done();
      });
    });

    /**
     * Test Case 28: Kiểm tra multiple requests
     * Input: Mixed fast and slow requests
     * Expected Output: Only slow ones warned
     * Path Coverage: Multiple requests
     */
    it('TC028: should warn only for slow requests in mixed batch', (done) => {
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');
      let completed = 0;

      // Fast request
      mockCallHandler.handle.mockReturnValueOnce(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: 'fast' });
            observer.complete();
          }, 500);
        }),
      );

      const result1 = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result1.subscribe(() => {
        completed++;
        if (completed === 1) {
          expect(warnSpy).not.toHaveBeenCalled();

          // Slow request
          mockCallHandler.handle.mockReturnValueOnce(
            new Observable((observer) => {
              setTimeout(() => {
                observer.next({ data: 'slow' });
                observer.complete();
              }, 1100);
            }),
          );

          const result2 = interceptor.intercept(
            mockExecutionContext,
            mockCallHandler,
          );

          result2.subscribe(() => {
            expect(warnSpy).toHaveBeenCalledTimes(1);
            done();
          });
        }
      });
    });

    /**
     * Test Case 29: Kiểm tra URL with query params
     * Input: Slow request with query params
     * Expected Output: Full URL in warning
     * Path Coverage: Query params
     */
    it('TC029: should include query params in warning', (done) => {
      mockRequest.url = '/api/users?page=1&limit=100';
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: 'test' });
            observer.complete();
          }, 1100);
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('/api/users?page=1&limit=100'),
        );
        done();
      });
    });

    /**
     * Test Case 30: Kiểm tra custom threshold scenario
     * Input: Custom 2000ms threshold, request takes 1500ms
     * Expected Output: No warning
     * Path Coverage: Custom config scenario
     */
    it('TC030: should respect custom threshold in production', (done) => {
      const customConfig: InterceptorConfig = {
        ...DEFAULT_INTERCEPTOR_CONFIG,
        performance: { slowRequestThreshold: 2000 },
      };

      interceptor = new PerformanceInterceptor(customConfig);
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: 'test' });
            observer.complete();
          }, 1500);
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).not.toHaveBeenCalled();
        done();
      });
    });

    /**
     * Test Case 31: Kiểm tra nested resource URL
     * Input: /api/users/123/posts/456
     * Expected Output: Full path in warning
     * Path Coverage: Nested paths
     */
    it('TC031: should handle nested resource paths', (done) => {
      mockRequest.url = '/api/users/123/posts/456';
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: 'test' });
            observer.complete();
          }, 1100);
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('/api/users/123/posts/456'),
        );
        done();
      });
    });

    /**
     * Test Case 32: Kiểm tra authentication endpoint
     * Input: Slow login request
     * Expected Output: Warning logged
     * Path Coverage: Auth scenario
     */
    it('TC032: should track authentication requests', (done) => {
      mockRequest.method = 'POST';
      mockRequest.url = '/auth/login';
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ token: 'abc123' });
            observer.complete();
          }, 1200);
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringMatching(/POST \/auth\/login.*12\d{2}ms/),
        );
        done();
      });
    });

    /**
     * Test Case 33: Kiểm tra pagination request
     * Input: Large dataset pagination
     * Expected Output: Warning if slow
     * Path Coverage: Pagination scenario
     */
    it('TC033: should track pagination requests', (done) => {
      mockRequest.url = '/api/posts?page=10&limit=50';
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: [], total: 1000 });
            observer.complete();
          }, 1300);
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).toHaveBeenCalled();
        done();
      });
    });

    /**
     * Test Case 34: Kiểm tra data aggregation
     * Input: Complex aggregation query
     * Expected Output: Warning for slow aggregation
     * Path Coverage: Aggregation scenario
     */
    it('TC034: should warn for slow aggregations', (done) => {
      mockRequest.url = '/api/analytics/report';
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ aggregations: {} });
            observer.complete();
          }, 2500);
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringMatching(/25\d{2}ms/),
        );
        done();
      });
    });

    /**
     * Test Case 35: Kiểm tra WebSocket upgrade simulation
     * Input: Fast WebSocket request
     * Expected Output: No warning
     * Path Coverage: WebSocket scenario
     */
    it('TC035: should handle WebSocket requests', (done) => {
      mockRequest.url = '/socket.io/';
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ upgraded: true });
            observer.complete();
          }, 100);
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).not.toHaveBeenCalled();
        done();
      });
    });

    /**
     * Test Case 36: Kiểm tra very fast request (< 10ms)
     * Input: Cached response
     * Expected Output: No warning
     * Path Coverage: Very fast path
     */
    it('TC036: should not warn for cached responses', (done) => {
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');
      mockCallHandler.handle.mockReturnValue(of({ cached: true }));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).not.toHaveBeenCalled();
        done();
      });
    });

    /**
     * Test Case 37: Kiểm tra threshold boundary (1001ms)
     * Input: Just over threshold
     * Expected Output: Warning logged
     * Path Coverage: Boundary condition
     */
    it('TC037: should warn for requests just over threshold', (done) => {
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: 'test' });
            observer.complete();
          }, 1001);
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).toHaveBeenCalled();
        done();
      });
    });

    /**
     * Test Case 38: Kiểm tra threshold boundary (999ms)
     * Input: Just under threshold
     * Expected Output: No warning
     * Path Coverage: Boundary condition
     */
    it('TC038: should not warn for requests just under threshold', (done) => {
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: 'test' });
            observer.complete();
          }, 950); // Well under threshold to account for overhead
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).not.toHaveBeenCalled();
        done();
      });
    }, 10000);

    /**
     * Test Case 39: Kiểm tra extreme slow request (10s)
     * Input: Very long timeout
     * Expected Output: Warning with high duration
     * Path Coverage: Extreme value
     */
    it('TC039: should warn for extremely slow requests', (done) => {
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: 'test' });
            observer.complete();
          }, 3000);
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/3\d{3}ms/));
        done();
      });
    }, 10000);

    /**
     * Test Case 40: Kiểm tra complete flow with config
     * Input: Custom config, slow request
     * Expected Output: All components working together
     * Path Coverage: Complete integration
     */
    it('TC040: should work end-to-end with custom config', (done) => {
      const customConfig: InterceptorConfig = {
        ...DEFAULT_INTERCEPTOR_CONFIG,
        performance: { slowRequestThreshold: 500 },
      };

      interceptor = new PerformanceInterceptor(customConfig);
      mockRequest.method = 'PUT';
      mockRequest.url = '/api/users/123?updated=true';
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ id: 123, updated: true });
            observer.complete();
          }, 600);
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: (data) => {
          expect(data).toEqual({ id: 123, updated: true });
        },
        complete: () => {
          expect(warnSpy).toHaveBeenCalledWith(
            expect.stringMatching(
              /Slow Request: PUT \/api\/users\/123\?updated=true took 6\d{2}ms/,
            ),
          );
          done();
        },
      });
    });
  });
});
