import 'reflect-metadata';
import { LoggingInterceptor } from '../src/common/interceptors/logging.interceptors';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { Request, Response } from 'express';

describe('LoggingInterceptor - White Box Testing (Input-Output)', () => {
  let interceptor: LoggingInterceptor;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Mock Request
    mockRequest = {
      method: 'GET',
      url: '/api/users',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'Mozilla/5.0',
      },
    };

    // Mock Response
    mockResponse = {
      statusCode: 200,
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
      handle: jest.fn(),
    } as jest.Mocked<CallHandler>;

    interceptor = new LoggingInterceptor();

    // Mock logger to prevent console output
    jest.spyOn(interceptor['logger'], 'log').mockImplementation();
    jest.spyOn(interceptor['logger'], 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Incoming Request Logging', () => {
    /**
     * Test Case 1: Kiểm tra log incoming request
     * Input: GET /api/users
     * Expected Output: Log with method, url, ip, user-agent
     * Path Coverage: Initial logging
     */
    it('TC001: should log incoming request', () => {
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Incoming Request'),
      );
    });

    /**
     * Test Case 2: Kiểm tra log includes method
     * Input: GET request
     * Expected Output: Log contains GET
     * Path Coverage: Method logging
     */
    it('TC002: should include method in incoming log', () => {
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('GET'));
    });

    /**
     * Test Case 3: Kiểm tra log includes URL
     * Input: /api/users URL
     * Expected Output: Log contains /api/users
     * Path Coverage: URL logging
     */
    it('TC003: should include URL in incoming log', () => {
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/users'),
      );
    });

    /**
     * Test Case 4: Kiểm tra log includes IP
     * Input: IP 127.0.0.1
     * Expected Output: Log contains IP
     * Path Coverage: IP logging
     */
    it('TC004: should include IP in incoming log', () => {
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('127.0.0.1'));
    });

    /**
     * Test Case 5: Kiểm tra log includes user-agent
     * Input: User-agent header
     * Expected Output: Log contains user-agent
     * Path Coverage: User-agent logging
     */
    it('TC005: should include user-agent in incoming log', () => {
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Mozilla/5.0'),
      );
    });

    /**
     * Test Case 6: Kiểm tra log without user-agent
     * Input: No user-agent header
     * Expected Output: Empty string used
     * Path Coverage: Missing user-agent
     */
    it('TC006: should handle missing user-agent', () => {
      mockRequest.headers = {};
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Incoming Request'),
      );
    });

    /**
     * Test Case 7: Kiểm tra different HTTP methods
     * Input: Various HTTP methods
     * Expected Output: Correct method logged
     * Path Coverage: Different methods
     */
    it('TC007: should log different HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      methods.forEach((method) => {
        mockRequest.method = method;
        mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

        interceptor.intercept(mockExecutionContext, mockCallHandler);

        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(method));
      });
    });
  });

  describe('Outgoing Response Logging', () => {
    /**
     * Test Case 8: Kiểm tra log outgoing response
     * Input: Successful response
     * Expected Output: Log with method, url, status, duration
     * Path Coverage: Success logging in tap()
     */
    it('TC008: should log outgoing response', (done) => {
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining('Outgoing Response'),
        );
        done();
      });
    });

    /**
     * Test Case 9: Kiểm tra log includes status code
     * Input: Response with status 200
     * Expected Output: Log contains 200
     * Path Coverage: Status code logging
     */
    it('TC009: should include status code in outgoing log', (done) => {
      mockResponse.statusCode = 200;
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('200'));
        done();
      });
    });

    /**
     * Test Case 10: Kiểm tra log includes duration
     * Input: Request processing
     * Expected Output: Log contains duration in ms
     * Path Coverage: Duration calculation
     */
    it('TC010: should include duration in outgoing log', (done) => {
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('ms'));
        done();
      });
    });

    /**
     * Test Case 11: Kiểm tra different status codes
     * Input: Various status codes
     * Expected Output: Correct status logged
     * Path Coverage: Different status codes
     */
    it('TC011: should log different status codes', (done) => {
      const statusCodes = [200, 201, 204, 400, 404, 500];
      const logSpy = jest.spyOn(interceptor['logger'], 'log');
      let completed = 0;

      statusCodes.forEach((statusCode) => {
        mockResponse.statusCode = statusCode;
        mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

        const result = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result.subscribe(() => {
          expect(logSpy).toHaveBeenCalledWith(
            expect.stringContaining(statusCode.toString()),
          );
          completed++;
          if (completed === statusCodes.length) done();
        });
      });
    });

    /**
     * Test Case 12: Kiểm tra duration is non-negative
     * Input: Any request
     * Expected Output: Duration >= 0
     * Path Coverage: Duration validation
     */
    it('TC012: should calculate non-negative duration', (done) => {
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        const logCall = logSpy.mock.calls.find((call) =>
          call[0].includes('Outgoing Response'),
        );
        expect(logCall).toBeDefined();
        const durationMatch = logCall![0].match(/(\d+)ms/);
        expect(durationMatch).toBeDefined();
        const duration = parseInt(durationMatch![1]);
        expect(duration).toBeGreaterThanOrEqual(0);
        done();
      });
    });
  });

  describe('Error Logging', () => {
    /**
     * Test Case 13: Kiểm tra error logging
     * Input: Handler throws error
     * Expected Output: Error logged with details
     * Path Coverage: catchError() block
     */
    it('TC013: should log errors', (done) => {
      const error = new Error('Test error');
      (error as any).status = 500;
      mockCallHandler.handle.mockReturnValue(throwError(() => error));
      const errorSpy = jest.spyOn(interceptor['logger'], 'error');

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: () => {
          expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining('Request Error'),
          );
          done();
        },
      });
    });

    /**
     * Test Case 14: Kiểm tra error log includes status
     * Input: Error with status code
     * Expected Output: Status in error log
     * Path Coverage: Error status logging
     */
    it('TC014: should include error status in log', (done) => {
      const error = new Error('Test error');
      (error as any).status = 404;
      mockCallHandler.handle.mockReturnValue(throwError(() => error));
      const errorSpy = jest.spyOn(interceptor['logger'], 'error');

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: () => {
          expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('404'));
          done();
        },
      });
    });

    /**
     * Test Case 15: Kiểm tra error without status
     * Input: Error without status property
     * Expected Output: Default 500 status used
     * Path Coverage: error.status || 500
     */
    it('TC015: should use 500 for errors without status', (done) => {
      const error = new Error('Test error');
      mockCallHandler.handle.mockReturnValue(throwError(() => error));
      const errorSpy = jest.spyOn(interceptor['logger'], 'error');

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: () => {
          expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('500'));
          done();
        },
      });
    });

    /**
     * Test Case 16: Kiểm tra error log includes message
     * Input: Error with message
     * Expected Output: Message in error log
     * Path Coverage: Error message logging
     */
    it('TC016: should include error message in log', (done) => {
      const error = new Error('Custom error message');
      (error as any).status = 400;
      mockCallHandler.handle.mockReturnValue(throwError(() => error));
      const errorSpy = jest.spyOn(interceptor['logger'], 'error');

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: () => {
          expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining('Custom error message'),
          );
          done();
        },
      });
    });

    /**
     * Test Case 17: Kiểm tra error log includes duration
     * Input: Error after processing time
     * Expected Output: Duration in error log
     * Path Coverage: Error duration logging
     */
    it('TC017: should include duration in error log', (done) => {
      const error = new Error('Test error');
      mockCallHandler.handle.mockReturnValue(throwError(() => error));
      const errorSpy = jest.spyOn(interceptor['logger'], 'error');

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: () => {
          expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('ms'));
          done();
        },
      });
    });

    /**
     * Test Case 18: Kiểm tra error is re-thrown
     * Input: Handler throws error
     * Expected Output: Error propagated
     * Path Coverage: throwError(() => error)
     */
    it('TC018: should re-throw error after logging', (done) => {
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

    /**
     * Test Case 19: Kiểm tra error log includes method and URL
     * Input: Error during request
     * Expected Output: Method and URL in error log
     * Path Coverage: Error context logging
     */
    it('TC019: should include method and URL in error log', (done) => {
      const error = new Error('Test error');
      mockCallHandler.handle.mockReturnValue(throwError(() => error));
      const errorSpy = jest.spyOn(interceptor['logger'], 'error');

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: () => {
          expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('GET'));
          expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining('/api/users'),
          );
          done();
        },
      });
    });
  });

  describe('Request Context', () => {
    /**
     * Test Case 20: Kiểm tra different URLs
     * Input: Various URL paths
     * Expected Output: Correct URL logged
     * Path Coverage: URL variations
     */
    it('TC020: should log different URLs', () => {
      const urls = ['/api/users', '/api/posts', '/auth/login'];
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      urls.forEach((url) => {
        mockRequest.url = url;
        mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

        interceptor.intercept(mockExecutionContext, mockCallHandler);

        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(url));
      });
    });

    /**
     * Test Case 21: Kiểm tra different IP addresses
     * Input: Various IP addresses
     * Expected Output: Correct IP logged
     * Path Coverage: IP variations
     */
    it('TC021: should log different IP addresses', () => {
      const ips = ['127.0.0.1', '192.168.1.1', '::1', '10.0.0.1'];
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      ips.forEach((ip) => {
        (mockRequest as any).ip = ip;
        mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

        interceptor.intercept(mockExecutionContext, mockCallHandler);

        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(ip));
      });
    });

    /**
     * Test Case 22: Kiểm tra different user-agents
     * Input: Various user-agent strings
     * Expected Output: Correct user-agent logged
     * Path Coverage: User-agent variations
     */
    it('TC022: should log different user-agents', () => {
      const userAgents = ['Chrome', 'Firefox', 'Safari', 'Postman'];
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      userAgents.forEach((ua) => {
        mockRequest.headers = { 'user-agent': ua };
        mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

        interceptor.intercept(mockExecutionContext, mockCallHandler);

        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(ua));
      });
    });
  });

  describe('Observable Behavior', () => {
    /**
     * Test Case 23: Kiểm tra Observable emits data
     * Input: Handler returns data
     * Expected Output: Data emitted
     * Path Coverage: Data flow
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
        error: () => done(),
      });
    });
  });

  describe('Real-world Scenarios', () => {
    /**
     * Test Case 26: Kiểm tra GET request flow
     * Input: GET /api/users
     * Expected Output: Complete logging flow
     * Path Coverage: Complete GET scenario
     */
    it('TC026: should log complete GET request flow', (done) => {
      mockRequest.method = 'GET';
      mockRequest.url = '/api/users';
      mockResponse.statusCode = 200;
      mockCallHandler.handle.mockReturnValue(of([{ id: 1 }]));
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(logSpy).toHaveBeenCalledTimes(2); // Incoming + Outgoing
        expect(logSpy).toHaveBeenNthCalledWith(
          1,
          expect.stringContaining('Incoming Request'),
        );
        expect(logSpy).toHaveBeenNthCalledWith(
          2,
          expect.stringContaining('Outgoing Response'),
        );
        done();
      });
    });

    /**
     * Test Case 27: Kiểm tra POST request flow
     * Input: POST /api/users
     * Expected Output: Complete logging with 201
     * Path Coverage: POST scenario
     */
    it('TC027: should log POST request flow', (done) => {
      mockRequest.method = 'POST';
      mockRequest.url = '/api/users';
      mockResponse.statusCode = 201;
      mockCallHandler.handle.mockReturnValue(of({ id: 1, created: true }));
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('POST'));
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('201'));
        done();
      });
    });

    /**
     * Test Case 28: Kiểm tra 404 error scenario
     * Input: Request for non-existent resource
     * Expected Output: Error logged with 404
     * Path Coverage: 404 error
     */
    it('TC028: should log 404 error', (done) => {
      const error = new Error('Not found');
      (error as any).status = 404;
      mockCallHandler.handle.mockReturnValue(throwError(() => error));
      const errorSpy = jest.spyOn(interceptor['logger'], 'error');

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: () => {
          expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('404'));
          done();
        },
      });
    });

    /**
     * Test Case 29: Kiểm tra 500 error scenario
     * Input: Internal server error
     * Expected Output: Error logged with 500
     * Path Coverage: 500 error
     */
    it('TC029: should log 500 error', (done) => {
      const error = new Error('Internal server error');
      (error as any).status = 500;
      mockCallHandler.handle.mockReturnValue(throwError(() => error));
      const errorSpy = jest.spyOn(interceptor['logger'], 'error');

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: () => {
          expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('500'));
          done();
        },
      });
    });

    /**
     * Test Case 30: Kiểm tra validation error (400)
     * Input: Bad request
     * Expected Output: Error logged with 400
     * Path Coverage: 400 error
     */
    it('TC030: should log validation error', (done) => {
      const error = new Error('Validation failed');
      (error as any).status = 400;
      mockCallHandler.handle.mockReturnValue(throwError(() => error));
      const errorSpy = jest.spyOn(interceptor['logger'], 'error');

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: () => {
          expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('400'));
          done();
        },
      });
    });

    /**
     * Test Case 31: Kiểm tra slow request
     * Input: Request taking time
     * Expected Output: Duration tracked
     * Path Coverage: Duration tracking
     */
    it('TC031: should track slow request duration', (done) => {
      mockCallHandler.handle.mockReturnValue(
        new Observable((observer) => {
          setTimeout(() => {
            observer.next({ data: 'test' });
            observer.complete();
          }, 100);
        }),
      );
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        const logCall = logSpy.mock.calls.find((call) =>
          call[0].includes('Outgoing Response'),
        );
        const durationMatch = logCall![0].match(/(\d+)ms/);
        const duration = parseInt(durationMatch![1]);
        expect(duration).toBeGreaterThanOrEqual(100);
        done();
      });
    });

    /**
     * Test Case 32: Kiểm tra URL with query params
     * Input: /api/users?page=1&limit=10
     * Expected Output: Full URL logged
     * Path Coverage: Query params
     */
    it('TC032: should log URL with query parameters', () => {
      mockRequest.url = '/api/users?page=1&limit=10';
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/users?page=1&limit=10'),
      );
    });

    /**
     * Test Case 33: Kiểm tra API endpoint with ID
     * Input: /api/users/123
     * Expected Output: Full path logged
     * Path Coverage: Resource ID
     */
    it('TC033: should log endpoint with resource ID', () => {
      mockRequest.url = '/api/users/123';
      mockCallHandler.handle.mockReturnValue(of({ id: 123 }));
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/123'),
      );
    });

    /**
     * Test Case 34: Kiểm tra multiple sequential requests
     * Input: Multiple requests
     * Expected Output: Each logged separately
     * Path Coverage: Multiple invocations
     */
    it('TC034: should log multiple requests independently', (done) => {
      const logSpy = jest.spyOn(interceptor['logger'], 'log');
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
            expect(logSpy).toHaveBeenCalledTimes(6); // 3 requests × 2 logs
            done();
          }
        });
      }
    });

    /**
     * Test Case 35: Kiểm tra IPv6 address
     * Input: IPv6 address
     * Expected Output: IPv6 logged
     * Path Coverage: IPv6
     */
    it('TC035: should log IPv6 address', () => {
      (mockRequest as any).ip = '::1';
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('::1'));
    });

    /**
     * Test Case 36: Kiểm tra special characters in URL
     * Input: URL with special chars
     * Expected Output: URL preserved in log
     * Path Coverage: Special chars
     */
    it('TC036: should handle special characters in URL', () => {
      mockRequest.url = '/api/search?q=hello%20world&filter=test%2Bvalue';
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('hello%20world'),
      );
    });

    /**
     * Test Case 37: Kiểm tra long user-agent string
     * Input: Long user-agent
     * Expected Output: Full user-agent logged
     * Path Coverage: Long strings
     */
    it('TC037: should handle long user-agent strings', () => {
      const longUA =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      mockRequest.headers = { 'user-agent': longUA };
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));
      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(longUA));
    });

    /**
     * Test Case 38: Kiểm tra error with long message
     * Input: Error with long message
     * Expected Output: Full message logged
     * Path Coverage: Long error messages
     */
    it('TC038: should log long error messages', (done) => {
      const longMessage = 'Error: ' + 'x'.repeat(200);
      const error = new Error(longMessage);
      mockCallHandler.handle.mockReturnValue(throwError(() => error));
      const errorSpy = jest.spyOn(interceptor['logger'], 'error');

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: () => {
          expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining(longMessage),
          );
          done();
        },
      });
    });

    /**
     * Test Case 39: Kiểm tra unauthorized error (401)
     * Input: 401 error
     * Expected Output: Error logged with 401
     * Path Coverage: 401 error
     */
    it('TC039: should log unauthorized error', (done) => {
      const error = new Error('Unauthorized');
      (error as any).status = 401;
      mockCallHandler.handle.mockReturnValue(throwError(() => error));
      const errorSpy = jest.spyOn(interceptor['logger'], 'error');

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: () => {
          expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('401'));
          done();
        },
      });
    });

    /**
     * Test Case 40: Kiểm tra complete flow with all logging
     * Input: Successful request
     * Expected Output: Incoming + Outgoing logs
     * Path Coverage: Complete flow
     */
    it('TC040: should execute complete logging flow', (done) => {
      mockRequest.method = 'GET';
      mockRequest.url = '/api/test';
      (mockRequest as any).ip = '192.168.1.100';
      mockRequest.headers = { 'user-agent': 'TestAgent/1.0' };
      mockResponse.statusCode = 200;
      mockCallHandler.handle.mockReturnValue(of({ success: true }));

      const logSpy = jest.spyOn(interceptor['logger'], 'log');

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: (data) => {
          expect(data).toEqual({ success: true });
        },
        complete: () => {
          expect(logSpy).toHaveBeenCalledTimes(2);

          // Incoming request log
          expect(logSpy).toHaveBeenCalledWith(
            expect.stringMatching(
              /Incoming Request.*GET.*\/api\/test.*192\.168\.1\.100.*TestAgent/,
            ),
          );

          // Outgoing response log
          expect(logSpy).toHaveBeenCalledWith(
            expect.stringMatching(
              /Outgoing Response.*GET.*\/api\/test.*200.*\d+ms/,
            ),
          );

          done();
        },
      });
    });
  });
});
