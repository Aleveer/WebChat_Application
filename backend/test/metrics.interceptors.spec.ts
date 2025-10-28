import 'reflect-metadata';
import { MetricsInterceptor } from '../src/common/interceptors/metrics.interceptors';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { Request } from 'express';
import { MetricsService } from '../src/common/services/metrics.services';

describe('MetricsInterceptor - White Box Testing (Input-Output)', () => {
  let interceptor: MetricsInterceptor;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;
  let mockRequest: Partial<Request>;
  let mockMetricsService: jest.Mocked<MetricsService>;

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

    // Mock MetricsService
    mockMetricsService = {
      startTimer: jest.fn().mockReturnValue('timer_key_123'),
      endTimer: jest.fn().mockReturnValue(100),
      incrementCounter: jest.fn(),
      recordHistogram: jest.fn(),
    } as any;

    interceptor = new MetricsInterceptor(mockMetricsService);

    // Mock logger to prevent console output
    jest.spyOn(interceptor['logger'], 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Timer Management', () => {
    /**
     * Test Case 1: Kiểm tra timer start
     * Input: GET /api/users
     * Expected Output: startTimer called with sanitized name
     * Path Coverage: Timer initialization
     */
    it('TC001: should start timer on request', (done) => {
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
          expect.stringContaining('http_get_'),
        );
        done();
      });
    });

    /**
     * Test Case 2: Kiểm tra timer end on success
     * Input: Successful request
     * Expected Output: endTimer called with timer name
     * Path Coverage: tap() next callback
     */
    it('TC002: should end timer on successful response', (done) => {
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockMetricsService.endTimer).toHaveBeenCalledWith(
          expect.stringContaining('http_get_'),
        );
        done();
      });
    });

    /**
     * Test Case 3: Kiểm tra timer end on error
     * Input: Request throws error
     * Expected Output: endTimer called in error callback
     * Path Coverage: tap() error callback
     */
    it('TC003: should end timer on error', (done) => {
      const error = new Error('Test error');
      mockCallHandler.handle.mockReturnValue(throwError(() => error));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: () => {
          expect(mockMetricsService.endTimer).toHaveBeenCalledWith(
            expect.stringContaining('http_get_'),
          );
          done();
        },
      });
    });

    /**
     * Test Case 4: Kiểm tra timer name format
     * Input: POST /api/users
     * Expected Output: Timer name = http_post_...
     * Path Coverage: Timer naming
     */
    it('TC004: should create correct timer name format', (done) => {
      mockRequest.method = 'POST';
      mockRequest.url = '/api/users';
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
          'http_post__api_users',
        );
        done();
      });
    });
  });

  describe('Counter Tracking', () => {
    /**
     * Test Case 5: Kiểm tra request counter
     * Input: Any request
     * Expected Output: incrementCounter with method and path
     * Path Coverage: Request counter
     */
    it('TC005: should increment request counter', (done) => {
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith(
          'http_requests_total{method="GET",path="/api/users"}',
        );
        done();
      });
    });

    /**
     * Test Case 6: Kiểm tra success counter
     * Input: Successful request
     * Expected Output: incrementCounter for success
     * Path Coverage: Success counter in tap() next
     */
    it('TC006: should increment success counter', (done) => {
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith(
          'http_requests_success',
        );
        done();
      });
    });

    /**
     * Test Case 7: Kiểm tra error counter
     * Input: Request throws error
     * Expected Output: incrementCounter for error
     * Path Coverage: Error counter in tap() error
     */
    it('TC007: should increment error counter', (done) => {
      const error = new Error('Test error');
      mockCallHandler.handle.mockReturnValue(throwError(() => error));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: () => {
          expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith(
            'http_requests_error',
          );
          done();
        },
      });
    });

    /**
     * Test Case 8: Kiểm tra counter with different methods
     * Input: Various HTTP methods
     * Expected Output: Correct method in counter
     * Path Coverage: Method variations
     */
    it('TC008: should track different HTTP methods', (done) => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      let completed = 0;

      methods.forEach((method) => {
        mockRequest.method = method;
        mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

        const result = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result.subscribe(() => {
          expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith(
            expect.stringContaining(`method="${method}"`),
          );
          completed++;
          if (completed === methods.length) done();
        });
      });
    });

    /**
     * Test Case 9: Kiểm tra counter with different paths
     * Input: Various URL paths
     * Expected Output: Correct path in counter
     * Path Coverage: Path variations
     */
    it('TC009: should track different paths', (done) => {
      const paths = ['/api/users', '/api/posts', '/auth/login'];
      let completed = 0;

      paths.forEach((path) => {
        mockRequest.url = path;
        mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

        const result = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result.subscribe(() => {
          expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith(
            expect.stringContaining(`path="${path}"`),
          );
          completed++;
          if (completed === paths.length) done();
        });
      });
    });
  });

  describe('Histogram Recording', () => {
    /**
     * Test Case 10: Kiểm tra histogram for success
     * Input: Successful request
     * Expected Output: recordHistogram with duration
     * Path Coverage: Success histogram
     */
    it('TC010: should record success duration histogram', (done) => {
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));
      mockMetricsService.endTimer.mockReturnValue(150);

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockMetricsService.recordHistogram).toHaveBeenCalledWith(
          'http_request_duration_ms',
          150,
        );
        done();
      });
    });

    /**
     * Test Case 11: Kiểm tra histogram for error
     * Input: Request throws error
     * Expected Output: recordHistogram for error duration
     * Path Coverage: Error histogram
     */
    it('TC011: should record error duration histogram', (done) => {
      const error = new Error('Test error');
      mockCallHandler.handle.mockReturnValue(throwError(() => error));
      mockMetricsService.endTimer.mockReturnValue(200);

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: () => {
          expect(mockMetricsService.recordHistogram).toHaveBeenCalledWith(
            'http_request_error_duration_ms',
            200,
          );
          done();
        },
      });
    });

    /**
     * Test Case 12: Kiểm tra histogram with various durations
     * Input: Different request durations
     * Expected Output: Correct durations recorded
     * Path Coverage: Duration variations
     */
    it('TC012: should record various durations', (done) => {
      const durations = [50, 100, 200, 500, 1000];
      let completed = 0;

      durations.forEach((duration) => {
        mockMetricsService.endTimer.mockReturnValue(duration);
        mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

        const result = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result.subscribe(() => {
          expect(mockMetricsService.recordHistogram).toHaveBeenCalledWith(
            'http_request_duration_ms',
            duration,
          );
          completed++;
          if (completed === durations.length) done();
        });
      });
    });
  });

  describe('URL Sanitization', () => {
    /**
     * Test Case 13: Kiểm tra query params removal
     * Input: /api/users?page=1&limit=10
     * Expected Output: /api/users (query removed)
     * Path Coverage: sanitizeUrl() - split('?')[0]
     */
    it('TC013: should remove query parameters', (done) => {
      mockRequest.url = '/api/users?page=1&limit=10';
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
          'http_get__api_users',
        );
        done();
      });
    });

    /**
     * Test Case 14: Kiểm tra MongoDB ObjectId replacement
     * Input: /api/users/507f1f77bcf86cd799439011
     * Expected Output: /api/users/:id
     * Path Coverage: sanitizeUrl() - replace(/\/[a-f0-9]{24}/g)
     */
    it('TC014: should replace MongoDB ObjectId with :id', (done) => {
      mockRequest.url = '/api/users/507f1f77bcf86cd799439011';
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
          'http_get__api_users__id',
        );
        done();
      });
    });

    /**
     * Test Case 15: Kiểm tra numeric ID replacement
     * Input: /api/users/123
     * Expected Output: /api/users/:id
     * Path Coverage: sanitizeUrl() - replace(/\/\d+/g)
     */
    it('TC015: should replace numeric IDs with :id', (done) => {
      mockRequest.url = '/api/users/123';
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
          'http_get__api_users__id',
        );
        done();
      });
    });

    /**
     * Test Case 16: Kiểm tra special character replacement
     * Input: /api/users-list
     * Expected Output: Special chars replaced with _
     * Path Coverage: sanitizeUrl() - replace(/[^a-zA-Z0-9_]/g)
     */
    it('TC016: should replace special characters', (done) => {
      mockRequest.url = '/api/users-list';
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
          'http_get__api_users_list',
        );
        done();
      });
    });

    /**
     * Test Case 17: Kiểm tra lowercase conversion
     * Input: /API/Users
     * Expected Output: Lowercase version
     * Path Coverage: sanitizeUrl() - toLowerCase()
     */
    it('TC017: should convert to lowercase', (done) => {
      mockRequest.url = '/API/Users';
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
          'http_get__api_users',
        );
        done();
      });
    });

    /**
     * Test Case 18: Kiểm tra multiple IDs replacement
     * Input: /api/users/123/posts/456
     * Expected Output: All IDs replaced
     * Path Coverage: Multiple ID replacements
     */
    it('TC018: should replace multiple numeric IDs', (done) => {
      mockRequest.url = '/api/users/123/posts/456';
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
          'http_get__api_users__id_posts__id',
        );
        done();
      });
    });

    /**
     * Test Case 19: Kiểm tra complex URL
     * Input: /api/users/507f1f77bcf86cd799439011?filter=active
     * Expected Output: Sanitized version
     * Path Coverage: Combined sanitization
     */
    it('TC019: should sanitize complex URLs', (done) => {
      mockRequest.url = '/api/users/507f1f77bcf86cd799439011?filter=active';
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
          'http_get__api_users__id',
        );
        done();
      });
    });
  });

  describe('Logging Behavior', () => {
    /**
     * Test Case 20: Kiểm tra success logging
     * Input: Successful request
     * Expected Output: Debug log with completion message
     * Path Coverage: logger.debug() in tap() next
     */
    it('TC020: should log successful request completion', (done) => {
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));
      mockMetricsService.endTimer.mockReturnValue(120);
      const debugSpy = jest.spyOn(interceptor['logger'], 'debug');

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(debugSpy).toHaveBeenCalledWith(
          expect.stringContaining('Request completed'),
        );
        expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('120ms'));
        done();
      });
    });

    /**
     * Test Case 21: Kiểm tra error logging
     * Input: Request throws error
     * Expected Output: Debug log with failure message
     * Path Coverage: logger.debug() in tap() error
     */
    it('TC021: should log failed request', (done) => {
      const error = new Error('Test error');
      mockCallHandler.handle.mockReturnValue(throwError(() => error));
      mockMetricsService.endTimer.mockReturnValue(80);
      const debugSpy = jest.spyOn(interceptor['logger'], 'debug');

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: () => {
          expect(debugSpy).toHaveBeenCalledWith(
            expect.stringContaining('Request failed'),
          );
          expect(debugSpy).toHaveBeenCalledWith(
            expect.stringContaining('80ms'),
          );
          done();
        },
      });
    });

    /**
     * Test Case 22: Kiểm tra log includes method and URL
     * Input: POST /api/users
     * Expected Output: Log contains method and URL
     * Path Coverage: Log content verification
     */
    it('TC022: should include method and URL in logs', (done) => {
      mockRequest.method = 'POST';
      mockRequest.url = '/api/users';
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));
      const debugSpy = jest.spyOn(interceptor['logger'], 'debug');

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('POST'));
        expect(debugSpy).toHaveBeenCalledWith(
          expect.stringContaining('/api/users'),
        );
        done();
      });
    });
  });

  describe('Observable Behavior', () => {
    /**
     * Test Case 23: Kiểm tra Observable emits data
     * Input: Handler returns data
     * Expected Output: Data emitted unchanged
     * Path Coverage: Data passthrough
     */
    it('TC023: should emit handler data', (done) => {
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
     * Test Case 24: Kiểm tra Observable completes
     * Input: Successful request
     * Expected Output: Observable completes
     * Path Coverage: Observable lifecycle
     */
    it('TC024: should complete Observable on success', (done) => {
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
     * Test Case 25: Kiểm tra Observable errors
     * Input: Handler throws error
     * Expected Output: Observable errors
     * Path Coverage: Error flow
     */
    it('TC025: should error Observable on error', (done) => {
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

  describe('Real-world Scenarios', () => {
    /**
     * Test Case 26: Kiểm tra GET user list
     * Input: GET /api/users?page=1
     * Expected Output: Complete metrics tracking
     * Path Coverage: Complete GET scenario
     */
    it('TC026: should track GET user list request', (done) => {
      mockRequest.method = 'GET';
      mockRequest.url = '/api/users?page=1';
      mockCallHandler.handle.mockReturnValue(of([{ id: 1 }]));
      mockMetricsService.endTimer.mockReturnValue(75);

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockMetricsService.startTimer).toHaveBeenCalled();
        expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith(
          expect.stringContaining('http_requests_total'),
        );
        expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith(
          'http_requests_success',
        );
        expect(mockMetricsService.recordHistogram).toHaveBeenCalledWith(
          'http_request_duration_ms',
          75,
        );
        done();
      });
    });

    /**
     * Test Case 27: Kiểm tra POST create user
     * Input: POST /api/users
     * Expected Output: POST metrics tracked
     * Path Coverage: POST scenario
     */
    it('TC027: should track POST create user request', (done) => {
      mockRequest.method = 'POST';
      mockRequest.url = '/api/users';
      mockCallHandler.handle.mockReturnValue(of({ id: 1, created: true }));
      mockMetricsService.endTimer.mockReturnValue(120);

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
          'http_post__api_users',
        );
        expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith(
          'http_requests_total{method="POST",path="/api/users"}',
        );
        expect(mockMetricsService.recordHistogram).toHaveBeenCalledWith(
          'http_request_duration_ms',
          120,
        );
        done();
      });
    });

    /**
     * Test Case 28: Kiểm tra PUT update user
     * Input: PUT /api/users/123
     * Expected Output: ID sanitized, metrics tracked
     * Path Coverage: PUT with ID
     */
    it('TC028: should track PUT update user request', (done) => {
      mockRequest.method = 'PUT';
      mockRequest.url = '/api/users/123';
      mockCallHandler.handle.mockReturnValue(of({ id: 123, updated: true }));
      mockMetricsService.endTimer.mockReturnValue(95);

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
          'http_put__api_users__id',
        );
        expect(mockMetricsService.recordHistogram).toHaveBeenCalledWith(
          'http_request_duration_ms',
          95,
        );
        done();
      });
    });

    /**
     * Test Case 29: Kiểm tra DELETE user
     * Input: DELETE /api/users/507f1f77bcf86cd799439011
     * Expected Output: MongoDB ID sanitized
     * Path Coverage: DELETE with MongoDB ID
     */
    it('TC029: should track DELETE user request', (done) => {
      mockRequest.method = 'DELETE';
      mockRequest.url = '/api/users/507f1f77bcf86cd799439011';
      mockCallHandler.handle.mockReturnValue(of({ deleted: true }));
      mockMetricsService.endTimer.mockReturnValue(60);

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
          'http_delete__api_users__id',
        );
        expect(mockMetricsService.recordHistogram).toHaveBeenCalledWith(
          'http_request_duration_ms',
          60,
        );
        done();
      });
    });

    /**
     * Test Case 30: Kiểm tra 404 error
     * Input: Request for non-existent resource
     * Expected Output: Error metrics tracked
     * Path Coverage: 404 error
     */
    it('TC030: should track 404 error', (done) => {
      const error = new Error('Not found');
      mockCallHandler.handle.mockReturnValue(throwError(() => error));
      mockMetricsService.endTimer.mockReturnValue(25);

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: () => {
          expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith(
            'http_requests_error',
          );
          expect(mockMetricsService.recordHistogram).toHaveBeenCalledWith(
            'http_request_error_duration_ms',
            25,
          );
          done();
        },
      });
    });

    /**
     * Test Case 31: Kiểm tra validation error
     * Input: Bad request
     * Expected Output: Error metrics tracked
     * Path Coverage: Validation error
     */
    it('TC031: should track validation error', (done) => {
      const error = new Error('Validation failed');
      mockCallHandler.handle.mockReturnValue(throwError(() => error));
      mockMetricsService.endTimer.mockReturnValue(30);

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: () => {
          expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith(
            'http_requests_error',
          );
          expect(mockMetricsService.recordHistogram).toHaveBeenCalledWith(
            'http_request_error_duration_ms',
            30,
          );
          done();
        },
      });
    });

    /**
     * Test Case 32: Kiểm tra nested resource
     * Input: GET /api/users/123/posts/456
     * Expected Output: All IDs sanitized
     * Path Coverage: Nested resources
     */
    it('TC032: should track nested resource requests', (done) => {
      mockRequest.method = 'GET';
      mockRequest.url = '/api/users/123/posts/456';
      mockCallHandler.handle.mockReturnValue(of({ id: 456 }));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
          'http_get__api_users__id_posts__id',
        );
        done();
      });
    });

    /**
     * Test Case 33: Kiểm tra search endpoint
     * Input: GET /api/search?q=test&filter=active
     * Expected Output: Query params removed
     * Path Coverage: Search scenario
     */
    it('TC033: should track search requests', (done) => {
      mockRequest.method = 'GET';
      mockRequest.url = '/api/search?q=test&filter=active';
      mockCallHandler.handle.mockReturnValue(of({ results: [] }));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
          'http_get__api_search',
        );
        expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith(
          'http_requests_total{method="GET",path="/api/search?q=test&filter=active"}',
        );
        done();
      });
    });

    /**
     * Test Case 34: Kiểm tra slow request
     * Input: Request taking long time
     * Expected Output: Duration tracked accurately
     * Path Coverage: Slow request
     */
    it('TC034: should track slow request duration', (done) => {
      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: 'test' });
            observer.complete();
          }, 100);
        }),
      );
      mockMetricsService.endTimer.mockReturnValue(1500);

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockMetricsService.recordHistogram).toHaveBeenCalledWith(
          'http_request_duration_ms',
          1500,
        );
        done();
      });
    });

    /**
     * Test Case 35: Kiểm tra multiple sequential requests
     * Input: Multiple requests
     * Expected Output: Each tracked independently
     * Path Coverage: Multiple invocations
     */
    it('TC035: should track multiple requests independently', (done) => {
      let completed = 0;

      for (let i = 0; i < 3; i++) {
        mockCallHandler.handle.mockReturnValue(of({ request: i }));
        const result = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result.subscribe(() => {
          completed++;
          if (completed === 3) {
            expect(mockMetricsService.startTimer).toHaveBeenCalledTimes(3);
            expect(mockMetricsService.endTimer).toHaveBeenCalledTimes(3);
            expect(mockMetricsService.incrementCounter).toHaveBeenCalledTimes(
              6,
            ); // 3 total + 3 success
            done();
          }
        });
      }
    });

    /**
     * Test Case 36: Kiểm tra PATCH request
     * Input: PATCH /api/users/123
     * Expected Output: PATCH metrics tracked
     * Path Coverage: PATCH method
     */
    it('TC036: should track PATCH request', (done) => {
      mockRequest.method = 'PATCH';
      mockRequest.url = '/api/users/123';
      mockCallHandler.handle.mockReturnValue(of({ patched: true }));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
          'http_patch__api_users__id',
        );
        expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith(
          'http_requests_total{method="PATCH",path="/api/users/123"}',
        );
        done();
      });
    });

    /**
     * Test Case 37: Kiểm tra special characters in path
     * Input: /api/users-active
     * Expected Output: Special chars replaced
     * Path Coverage: Special character handling
     */
    it('TC037: should sanitize special characters in path', (done) => {
      mockRequest.url = '/api/users-active';
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
          'http_get__api_users_active',
        );
        done();
      });
    });

    /**
     * Test Case 38: Kiểm tra uppercase path
     * Input: /API/USERS
     * Expected Output: Converted to lowercase
     * Path Coverage: Case conversion
     */
    it('TC038: should convert path to lowercase', (done) => {
      mockRequest.url = '/API/USERS';
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
          'http_get__api_users',
        );
        done();
      });
    });

    /**
     * Test Case 39: Kiểm tra error with zero duration
     * Input: Immediate error
     * Expected Output: Zero duration tracked
     * Path Coverage: Zero duration
     */
    it('TC039: should track zero duration errors', (done) => {
      const error = new Error('Immediate error');
      mockCallHandler.handle.mockReturnValue(throwError(() => error));
      mockMetricsService.endTimer.mockReturnValue(0);

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: () => {
          expect(mockMetricsService.recordHistogram).toHaveBeenCalledWith(
            'http_request_error_duration_ms',
            0,
          );
          done();
        },
      });
    });

    /**
     * Test Case 40: Kiểm tra complete flow
     * Input: Complete request lifecycle
     * Expected Output: All metrics operations called
     * Path Coverage: Complete flow
     */
    it('TC040: should execute complete metrics tracking flow', (done) => {
      mockRequest.method = 'POST';
      mockRequest.url = '/api/users/507f1f77bcf86cd799439011?include=profile';
      mockCallHandler.handle.mockReturnValue(of({ id: 1, success: true }));
      mockMetricsService.endTimer.mockReturnValue(135);

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: (data) => {
          expect(data).toEqual({ id: 1, success: true });
        },
        complete: () => {
          // Verify all metrics operations
          expect(mockMetricsService.startTimer).toHaveBeenCalledWith(
            'http_post__api_users__id',
          );
          expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith(
            'http_requests_total{method="POST",path="/api/users/507f1f77bcf86cd799439011?include=profile"}',
          );
          expect(mockMetricsService.endTimer).toHaveBeenCalled();
          expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith(
            'http_requests_success',
          );
          expect(mockMetricsService.recordHistogram).toHaveBeenCalledWith(
            'http_request_duration_ms',
            135,
          );

          // Verify call counts
          expect(mockMetricsService.startTimer).toHaveBeenCalledTimes(1);
          expect(mockMetricsService.endTimer).toHaveBeenCalledTimes(1);
          expect(mockMetricsService.incrementCounter).toHaveBeenCalledTimes(2);
          expect(mockMetricsService.recordHistogram).toHaveBeenCalledTimes(1);

          done();
        },
      });
    });
  });
});
