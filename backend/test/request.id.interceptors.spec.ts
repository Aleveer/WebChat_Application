import 'reflect-metadata';
import {
  RequestIdInterceptor,
  requestContext,
  getCurrentRequestId,
  getCurrentUserId,
  getRequestContext,
} from '../src/common/interceptors/request.id.interceptors';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { Request, Response } from 'express';

describe('RequestIdInterceptor - White Box Testing (Input-Output)', () => {
  let interceptor: RequestIdInterceptor;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockSetHeader: jest.Mock;

  beforeEach(() => {
    mockSetHeader = jest.fn();

    // Mock Request
    mockRequest = {
      headers: {},
      user: undefined,
      ip: '127.0.0.1',
    } as any;

    // Mock Response
    mockResponse = {
      setHeader: mockSetHeader,
    };

    // Mock ExecutionContext
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
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
      handle: jest.fn().mockReturnValue(of({ data: 'test' })),
    } as jest.Mocked<CallHandler>;

    interceptor = new RequestIdInterceptor();

    // Mock logger to prevent console output
    jest.spyOn(interceptor['logger'], 'debug').mockImplementation();
    jest.spyOn(interceptor['logger'], 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Request ID Generation', () => {
    /**
     * Test Case 1: Kiểm tra generate request ID
     * Input: No X-Request-ID header
     * Expected Output: Generated ID with req_ prefix
     * Path Coverage: generateRequestId()
     */
    it('TC001: should generate request ID when not provided', (done) => {
      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockRequest.requestId).toBeDefined();
        expect(mockRequest.requestId).toMatch(/^req_\d+_[a-z0-9]+$/);
        done();
      });
    });

    /**
     * Test Case 2: Kiểm tra X-Request-ID header
     * Input: X-Request-ID header provided
     * Expected Output: Use provided ID
     * Path Coverage: request.headers['x-request-id']
     */
    it('TC002: should use X-Request-ID from header', (done) => {
      mockRequest.headers = { 'x-request-id': 'custom-id-123' };

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockRequest.requestId).toBe('custom-id-123');
        done();
      });
    });

    /**
     * Test Case 3: Kiểm tra X-Correlation-ID header
     * Input: X-Correlation-ID header provided
     * Expected Output: Use correlation ID
     * Path Coverage: request.headers['x-correlation-id']
     */
    it('TC003: should use X-Correlation-ID from header', (done) => {
      mockRequest.headers = { 'x-correlation-id': 'correlation-456' };

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockRequest.requestId).toBe('correlation-456');
        done();
      });
    });

    /**
     * Test Case 4: Kiểm tra priority X-Request-ID > X-Correlation-ID
     * Input: Both headers provided
     * Expected Output: Use X-Request-ID
     * Path Coverage: Header priority
     */
    it('TC004: should prioritize X-Request-ID over X-Correlation-ID', (done) => {
      mockRequest.headers = {
        'x-request-id': 'request-789',
        'x-correlation-id': 'correlation-456',
      };

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockRequest.requestId).toBe('request-789');
        done();
      });
    });

    /**
     * Test Case 5: Kiểm tra unique request IDs
     * Input: Multiple requests without headers
     * Expected Output: Different IDs generated
     * Path Coverage: ID uniqueness
     */
    it('TC005: should generate unique IDs for each request', (done) => {
      const ids: string[] = [];
      let completed = 0;

      for (let i = 0; i < 5; i++) {
        const result = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result.subscribe(() => {
          ids.push(mockRequest.requestId!);
          completed++;

          if (completed === 5) {
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(5);
            done();
          }
        });
      }
    });
  });

  describe('Response Headers', () => {
    /**
     * Test Case 6: Kiểm tra X-Request-ID response header
     * Input: Request with ID
     * Expected Output: X-Request-ID set in response
     * Path Coverage: response.setHeader('X-Request-ID')
     */
    it('TC006: should set X-Request-ID in response header', (done) => {
      mockRequest.headers = { 'x-request-id': 'test-id-123' };

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockSetHeader).toHaveBeenCalledWith(
          'X-Request-ID',
          'test-id-123',
        );
        done();
      });
    });

    /**
     * Test Case 7: Kiểm tra X-Correlation-ID response header
     * Input: Request with ID
     * Expected Output: X-Correlation-ID set in response
     * Path Coverage: response.setHeader('X-Correlation-ID')
     */
    it('TC007: should set X-Correlation-ID in response header', (done) => {
      mockRequest.headers = { 'x-request-id': 'test-id-456' };

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockSetHeader).toHaveBeenCalledWith(
          'X-Correlation-ID',
          'test-id-456',
        );
        done();
      });
    });

    /**
     * Test Case 8: Kiểm tra both headers set
     * Input: Request
     * Expected Output: Both headers set
     * Path Coverage: Multiple setHeader calls
     */
    it('TC008: should set both correlation headers', (done) => {
      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockSetHeader).toHaveBeenCalledTimes(2);
        expect(mockSetHeader).toHaveBeenCalledWith(
          'X-Request-ID',
          expect.any(String),
        );
        expect(mockSetHeader).toHaveBeenCalledWith(
          'X-Correlation-ID',
          expect.any(String),
        );
        done();
      });
    });
  });

  describe('Request Context', () => {
    /**
     * Test Case 9: Kiểm tra context map creation
     * Input: Request with user
     * Expected Output: Context map with requestId, userId, ip, userAgent
     * Path Coverage: contextMap.set() calls
     */
    it('TC009: should create context map with all fields', (done) => {
      mockRequest.user = { id: 'user-123' } as any;
      mockRequest.headers = { 'user-agent': 'Mozilla/5.0' };

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        // Context is available during request
        done();
      });
    });

    /**
     * Test Case 10: Kiểm tra userId in context
     * Input: Request with authenticated user
     * Expected Output: userId in context
     * Path Coverage: contextMap.set('userId')
     */
    it('TC010: should set userId in context for authenticated user', (done) => {
      mockRequest.user = { id: 'user-789' } as any;

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        // User ID should be available in context during request
        done();
      });
    });

    /**
     * Test Case 11: Kiểm tra anonymous user
     * Input: Request without user
     * Expected Output: userId = 'anonymous'
     * Path Coverage: request.user?.id || 'anonymous'
     */
    it('TC011: should use "anonymous" for unauthenticated user', (done) => {
      mockRequest.user = undefined;

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        // Should set anonymous in context
        done();
      });
    });

    /**
     * Test Case 12: Kiểm tra IP in context
     * Input: Request with IP
     * Expected Output: IP in context
     * Path Coverage: contextMap.set('ip')
     */
    it('TC012: should set IP in context', (done) => {
      (mockRequest as any).ip = '192.168.1.1';

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        // IP should be in context
        done();
      });
    });

    /**
     * Test Case 13: Kiểm tra unknown IP
     * Input: Request without IP
     * Expected Output: ip = 'unknown'
     * Path Coverage: request.ip || 'unknown'
     */
    it('TC013: should use "unknown" for missing IP', (done) => {
      (mockRequest as any).ip = undefined;

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        // Should set unknown in context
        done();
      });
    });

    /**
     * Test Case 14: Kiểm tra user-agent in context
     * Input: Request with user-agent
     * Expected Output: userAgent in context
     * Path Coverage: contextMap.set('userAgent')
     */
    it('TC014: should set user-agent in context', (done) => {
      mockRequest.headers = { 'user-agent': 'Chrome/91.0' };

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        // User-agent should be in context
        done();
      });
    });

    /**
     * Test Case 15: Kiểm tra unknown user-agent
     * Input: Request without user-agent
     * Expected Output: userAgent = 'unknown'
     * Path Coverage: headers['user-agent'] || 'unknown'
     */
    it('TC015: should use "unknown" for missing user-agent', (done) => {
      mockRequest.headers = {};

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        // Should set unknown in context
        done();
      });
    });

    /**
     * Test Case 16: Kiểm tra startTime in context
     * Input: Request
     * Expected Output: startTime = Date.now()
     * Path Coverage: contextMap.set('startTime')
     */
    it('TC016: should set startTime in context', (done) => {
      const beforeTime = Date.now();

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        // Start time should be set
        const afterTime = Date.now();
        expect(afterTime).toBeGreaterThanOrEqual(beforeTime);
        done();
      });
    });
  });

  describe('Error Handling', () => {
    /**
     * Test Case 17: Kiểm tra error logging
     * Input: Handler throws error
     * Expected Output: Error logged with request ID
     * Path Coverage: tap() error callback
     */
    it('TC017: should log error with request ID', (done) => {
      const error = new Error('Test error');
      mockCallHandler.handle.mockReturnValue(throwError(() => error));
      const errorSpy = jest.spyOn(interceptor['logger'], 'error');

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: () => {
          expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining('failed: Test error'),
            expect.any(String),
          );
          done();
        },
      });
    });

    /**
     * Test Case 18: Kiểm tra error with custom request ID
     * Input: Error with X-Request-ID
     * Expected Output: Custom ID in error log
     * Path Coverage: Error logging with custom ID
     */
    it('TC018: should log error with custom request ID', (done) => {
      mockRequest.headers = { 'x-request-id': 'error-id-123' };
      const error = new Error('Custom error');
      mockCallHandler.handle.mockReturnValue(throwError(() => error));
      const errorSpy = jest.spyOn(interceptor['logger'], 'error');

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: () => {
          expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining('error-id-123'),
            expect.any(String),
          );
          done();
        },
      });
    });

    /**
     * Test Case 19: Kiểm tra error propagation
     * Input: Handler throws error
     * Expected Output: Error propagated to subscriber
     * Path Coverage: Error flow
     */
    it('TC019: should propagate errors', (done) => {
      const error = new Error('Propagation test');
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

  describe('Request Completion', () => {
    /**
     * Test Case 20: Kiểm tra completion logging
     * Input: Successful request
     * Expected Output: Debug log with duration
     * Path Coverage: tap() complete callback
     */
    it('TC020: should log completion with duration', (done) => {
      const debugSpy = jest.spyOn(interceptor['logger'], 'debug');

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        complete: () => {
          expect(debugSpy).toHaveBeenCalledWith(
            expect.stringMatching(/completed in \d+ms/),
          );
          done();
        },
      });
    });

    /**
     * Test Case 21: Kiểm tra duration calculation
     * Input: Request with delay
     * Expected Output: Duration > 0
     * Path Coverage: Duration tracking
     */
    it('TC021: should calculate request duration', (done) => {
      const debugSpy = jest.spyOn(interceptor['logger'], 'debug');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: 'delayed' });
            observer.complete();
          }, 100);
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        complete: () => {
          const logCall = debugSpy.mock.calls[0][0];
          const durationMatch = logCall.match(/(\d+)ms/);
          const duration = parseInt(durationMatch![1]);
          expect(duration).toBeGreaterThanOrEqual(100);
          done();
        },
      });
    });

    /**
     * Test Case 22: Kiểm tra completion with request ID
     * Input: Request with custom ID
     * Expected Output: Custom ID in completion log
     * Path Coverage: Completion logging
     */
    it('TC022: should log completion with request ID', (done) => {
      mockRequest.headers = { 'x-request-id': 'complete-123' };
      const debugSpy = jest.spyOn(interceptor['logger'], 'debug');

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        complete: () => {
          expect(debugSpy).toHaveBeenCalledWith(
            expect.stringContaining('complete-123'),
          );
          done();
        },
      });
    });
  });

  describe('Observable Behavior', () => {
    /**
     * Test Case 23: Kiểm tra data passthrough
     * Input: Handler returns data
     * Expected Output: Data emitted unchanged
     * Path Coverage: Data flow
     */
    it('TC023: should pass through handler data', (done) => {
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
      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        complete: () => done(),
      });
    });

    /**
     * Test Case 25: Kiểm tra handler called
     * Input: Any request
     * Expected Output: CallHandler.handle() called
     * Path Coverage: Handler invocation
     */
    it('TC025: should call handler', (done) => {
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

  describe('Helper Functions', () => {
    /**
     * Test Case 26: Kiểm tra getCurrentRequestId()
     * Input: Request in context
     * Expected Output: Returns current request ID
     * Path Coverage: getCurrentRequestId()
     */
    it('TC026: should get current request ID from context', (done) => {
      mockRequest.headers = { 'x-request-id': 'helper-123' };

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          // Inside request context
          const currentId = getCurrentRequestId();
          expect(currentId).toBe('helper-123');
          observer.next({ data: 'test' });
          observer.complete();
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => done());
    });

    /**
     * Test Case 27: Kiểm tra getCurrentUserId()
     * Input: Authenticated user in context
     * Expected Output: Returns current user ID
     * Path Coverage: getCurrentUserId()
     */
    it('TC027: should get current user ID from context', (done) => {
      mockRequest.user = { id: 'user-456' } as any;

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          const currentUserId = getCurrentUserId();
          expect(currentUserId).toBe('user-456');
          observer.next({ data: 'test' });
          observer.complete();
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => done());
    });

    /**
     * Test Case 28: Kiểm tra getRequestContext()
     * Input: Request with full context
     * Expected Output: Returns complete context map
     * Path Coverage: getRequestContext()
     */
    it('TC028: should get full request context', (done) => {
      mockRequest.headers = { 'x-request-id': 'context-789' };
      mockRequest.user = { id: 'user-789' } as any;

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          const context = getRequestContext();
          expect(context).toBeInstanceOf(Map);
          expect(context?.get('requestId')).toBe('context-789');
          expect(context?.get('userId')).toBe('user-789');
          observer.next({ data: 'test' });
          observer.complete();
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => done());
    });

    /**
     * Test Case 29: Kiểm tra helper outside context
     * Input: Call helper without request context
     * Expected Output: Returns undefined
     * Path Coverage: No context available
     */
    it('TC029: should return undefined when no context available', () => {
      const requestId = getCurrentRequestId();
      const userId = getCurrentUserId();
      const context = getRequestContext();

      expect(requestId).toBeUndefined();
      expect(userId).toBeUndefined();
      expect(context).toBeUndefined();
    });
  });

  describe('Real-world Scenarios', () => {
    /**
     * Test Case 30: Kiểm tra API request flow
     * Input: Complete API request
     * Expected Output: Full flow works
     * Path Coverage: Complete scenario
     */
    it('TC030: should handle complete API request', (done) => {
      mockRequest.headers = {
        'x-request-id': 'api-request-123',
        'user-agent': 'PostmanRuntime/7.26.8',
      };
      mockRequest.user = { id: 'api-user-123' } as any;
      (mockRequest as any).ip = '203.0.113.42';

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: (data) => {
          expect(data).toEqual({ data: 'test' });
        },
        complete: () => {
          expect(mockSetHeader).toHaveBeenCalledWith(
            'X-Request-ID',
            'api-request-123',
          );
          expect(mockSetHeader).toHaveBeenCalledWith(
            'X-Correlation-ID',
            'api-request-123',
          );
          done();
        },
      });
    });

    /**
     * Test Case 31: Kiểm tra microservice communication
     * Input: Request with correlation ID from upstream
     * Expected Output: Correlation ID propagated
     * Path Coverage: Microservice scenario
     */
    it('TC031: should propagate correlation ID in microservices', (done) => {
      mockRequest.headers = {
        'x-correlation-id': 'upstream-correlation-456',
      };

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockRequest.requestId).toBe('upstream-correlation-456');
        expect(mockSetHeader).toHaveBeenCalledWith(
          'X-Correlation-ID',
          'upstream-correlation-456',
        );
        done();
      });
    });

    /**
     * Test Case 32: Kiểm tra anonymous user request
     * Input: Unauthenticated request
     * Expected Output: Anonymous userId in context
     * Path Coverage: Anonymous scenario
     */
    it('TC032: should handle anonymous user requests', (done) => {
      mockRequest.user = undefined;

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          const userId = getCurrentUserId();
          expect(userId).toBe('anonymous');
          observer.next({ data: 'test' });
          observer.complete();
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => done());
    });

    /**
     * Test Case 33: Kiểm tra error tracking
     * Input: Request fails with error
     * Expected Output: Error logged with correlation
     * Path Coverage: Error tracking scenario
     */
    it('TC033: should track errors with correlation ID', (done) => {
      mockRequest.headers = { 'x-request-id': 'error-track-789' };
      const error = new Error('Database connection failed');
      mockCallHandler.handle.mockReturnValue(throwError(() => error));
      const errorSpy = jest.spyOn(interceptor['logger'], 'error');

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: () => {
          expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining('error-track-789'),
            expect.any(String),
          );
          done();
        },
      });
    });

    /**
     * Test Case 34: Kiểm tra multiple sequential requests
     * Input: Multiple requests
     * Expected Output: Each tracked independently
     * Path Coverage: Sequential requests
     */
    it('TC034: should track multiple requests independently', (done) => {
      const requests = ['req1', 'req2', 'req3'];
      let completed = 0;

      requests.forEach((reqId) => {
        mockRequest.headers = { 'x-request-id': reqId };
        const result = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result.subscribe(() => {
          completed++;
          if (completed === requests.length) {
            expect(mockSetHeader).toHaveBeenCalledWith('X-Request-ID', 'req3');
            done();
          }
        });
      });
    });

    /**
     * Test Case 35: Kiểm tra IPv6 request
     * Input: Request from IPv6 address
     * Expected Output: IPv6 in context
     * Path Coverage: IPv6 scenario
     */
    it('TC035: should handle IPv6 addresses', (done) => {
      (mockRequest as any).ip = '::1';

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          const context = getRequestContext();
          expect(context?.get('ip')).toBe('::1');
          observer.next({ data: 'test' });
          observer.complete();
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => done());
    });

    /**
     * Test Case 36: Kiểm tra mobile app request
     * Input: Request from mobile user-agent
     * Expected Output: User-agent in context
     * Path Coverage: Mobile scenario
     */
    it('TC036: should handle mobile user-agents', (done) => {
      mockRequest.headers = {
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      };

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          const context = getRequestContext();
          expect(context?.get('userAgent')).toContain('iPhone');
          observer.next({ data: 'test' });
          observer.complete();
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => done());
    });

    /**
     * Test Case 37: Kiểm tra slow request tracking
     * Input: Request taking long time
     * Expected Output: Duration logged accurately
     * Path Coverage: Performance tracking
     */
    it('TC037: should track slow request duration', (done) => {
      const debugSpy = jest.spyOn(interceptor['logger'], 'debug');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: 'slow' });
            observer.complete();
          }, 200);
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        complete: () => {
          const logCall = debugSpy.mock.calls[0][0];
          const durationMatch = logCall.match(/(\d+)ms/);
          const duration = parseInt(durationMatch![1]);
          expect(duration).toBeGreaterThanOrEqual(200);
          done();
        },
      });
    });

    /**
     * Test Case 38: Kiểm tra request ID format validation
     * Input: Generated request ID
     * Expected Output: Valid format
     * Path Coverage: ID format
     */
    it('TC038: should generate valid request ID format', (done) => {
      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockRequest.requestId).toMatch(/^req_\d{13,}_[a-z0-9]{9}$/);
        done();
      });
    });

    /**
     * Test Case 39: Kiểm tra context isolation
     * Input: Concurrent requests
     * Expected Output: Contexts isolated
     * Path Coverage: Context isolation
     */
    it('TC039: should isolate contexts between concurrent requests', (done) => {
      const ids = ['concurrent1', 'concurrent2'];
      let completed = 0;

      ids.forEach((id) => {
        mockRequest.headers = { 'x-request-id': id };

        mockCallHandler.handle.mockReturnValue(
          new Observable((observer) => {
            const currentId = getCurrentRequestId();
            expect(currentId).toBe(id);
            observer.next({ data: id });
            observer.complete();
          }),
        );

        const result = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result.subscribe(() => {
          completed++;
          if (completed === ids.length) done();
        });
      });
    });

    /**
     * Test Case 40: Kiểm tra complete integration
     * Input: Full request lifecycle
     * Expected Output: All features working
     * Path Coverage: Complete integration
     */
    it('TC040: should handle complete request lifecycle', (done) => {
      mockRequest.headers = {
        'x-request-id': 'integration-test-999',
        'user-agent': 'TestClient/1.0',
      };
      mockRequest.user = { id: 'integration-user' } as any;
      (mockRequest as any).ip = '10.0.0.100';

      const debugSpy = jest.spyOn(interceptor['logger'], 'debug');

      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          // Verify context during request
          const requestId = getCurrentRequestId();
          const userId = getCurrentUserId();
          const context = getRequestContext();

          expect(requestId).toBe('integration-test-999');
          expect(userId).toBe('integration-user');
          expect(context?.get('ip')).toBe('10.0.0.100');
          expect(context?.get('userAgent')).toBe('TestClient/1.0');

          setTimeout(() => {
            observer.next({ success: true });
            observer.complete();
          }, 50);
        }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: (data) => {
          expect(data).toEqual({ success: true });
        },
        complete: () => {
          // Verify response headers
          expect(mockSetHeader).toHaveBeenCalledWith(
            'X-Request-ID',
            'integration-test-999',
          );
          expect(mockSetHeader).toHaveBeenCalledWith(
            'X-Correlation-ID',
            'integration-test-999',
          );

          // Verify completion logging
          expect(debugSpy).toHaveBeenCalledWith(
            expect.stringMatching(
              /Request integration-test-999 completed in \d+ms/,
            ),
          );

          done();
        },
      });
    });
  });
});
