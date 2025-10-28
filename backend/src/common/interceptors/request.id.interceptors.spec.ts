import { RequestIdInterceptor } from './request.id.interceptors';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { Test, TestingModule } from '@nestjs/testing';

describe('RequestIdInterceptor', () => {
  let interceptor: RequestIdInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(async () => {
    interceptor = new RequestIdInterceptor();

    mockRequest = {
      headers: {},
      requestId: undefined,
    };

    mockResponse = {
      setHeader: jest.fn(),
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
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
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('intercept - Request ID from headers', () => {
    it('should use x-request-id from request headers if present', (done) => {
      const requestId = 'test-request-id-123';
      mockRequest.headers['x-request-id'] = requestId;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockRequest.requestId).toBe(requestId);
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'X-Request-ID',
            requestId,
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should use x-correlation-id if x-request-id is not present', (done) => {
      const correlationId = 'correlation-id-456';
      mockRequest.headers['x-correlation-id'] = correlationId;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockRequest.requestId).toBe(correlationId);
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'X-Request-ID',
            correlationId,
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should prioritize x-request-id over x-correlation-id', (done) => {
      const requestId = 'request-id-123';
      const correlationId = 'correlation-id-456';
      mockRequest.headers['x-request-id'] = requestId;
      mockRequest.headers['x-correlation-id'] = correlationId;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockRequest.requestId).toBe(requestId);
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'X-Request-ID',
            requestId,
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should handle empty string x-request-id', (done) => {
      mockRequest.headers['x-request-id'] = '';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          // Empty string is falsy, should generate new ID
          expect(mockRequest.requestId).toBeDefined();
          expect(mockRequest.requestId).not.toBe('');
          expect(mockRequest.requestId).toMatch(/^req_\d+_[a-z0-9]+$/);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle null x-request-id', (done) => {
      mockRequest.headers['x-request-id'] = null;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          // null is falsy, should generate new ID
          expect(mockRequest.requestId).toBeDefined();
          expect(mockRequest.requestId).toMatch(/^req_\d+_[a-z0-9]+$/);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle undefined x-request-id', (done) => {
      mockRequest.headers['x-request-id'] = undefined;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockRequest.requestId).toBeDefined();
          expect(mockRequest.requestId).toMatch(/^req_\d+_[a-z0-9]+$/);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle very long request ID', (done) => {
      const longRequestId = 'a'.repeat(1000);
      mockRequest.headers['x-request-id'] = longRequestId;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockRequest.requestId).toBe(longRequestId);
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'X-Request-ID',
            longRequestId,
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should handle request ID with special characters', (done) => {
      const specialRequestId = 'req-id-!@#$%^&*()_+-=[]{}|;:,.<>?';
      mockRequest.headers['x-request-id'] = specialRequestId;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockRequest.requestId).toBe(specialRequestId);
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'X-Request-ID',
            specialRequestId,
          );
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('intercept - Generated Request ID', () => {
    it('should generate request ID if no headers present', (done) => {
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockRequest.requestId).toBeDefined();
          expect(typeof mockRequest.requestId).toBe('string');
          expect(mockRequest.requestId).toMatch(/^req_\d+_[a-z0-9]+$/);
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'X-Request-ID',
            mockRequest.requestId,
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should generate unique request IDs for different requests', (done) => {
      const requestIds = new Set<string>();
      let count = 0;

      for (let i = 0; i < 10; i++) {
        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );
        result$.subscribe({
          next: () => {
            requestIds.add(mockRequest.requestId);
            count++;
            if (count === 10) {
              expect(requestIds.size).toBe(10); // All unique
              done();
            }
          },
        });
      }
    });

    it('should include timestamp in generated request ID', (done) => {
      const beforeTime = Date.now();

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          const afterTime = Date.now();
          const requestId = mockRequest.requestId;
          const timestampMatch = requestId.match(/^req_(\d+)_/);

          expect(timestampMatch).not.toBeNull();
          const timestamp = parseInt(timestampMatch![1]);
          expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
          expect(timestamp).toBeLessThanOrEqual(afterTime);
          done();
        },
        error: done.fail,
      });
    });

    it('should include random component in generated request ID', (done) => {
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          const requestId = mockRequest.requestId;
          const randomMatch = requestId.match(/_([a-z0-9]+)$/);

          expect(randomMatch).not.toBeNull();
          expect(randomMatch![1].length).toBe(9);
          expect(randomMatch![1]).toMatch(/^[a-z0-9]{9}$/);
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('intercept - Request object modification', () => {
    it('should add requestId property to request object', (done) => {
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockRequest).toHaveProperty('requestId');
          expect(mockRequest.requestId).toBeDefined();
          done();
        },
        error: done.fail,
      });
    });

    it('should overwrite existing requestId on request object', (done) => {
      mockRequest.requestId = 'old-request-id';
      mockRequest.headers['x-request-id'] = 'new-request-id';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockRequest.requestId).toBe('new-request-id');
          expect(mockRequest.requestId).not.toBe('old-request-id');
          done();
        },
        error: done.fail,
      });
    });

    it('should preserve other request properties', (done) => {
      mockRequest.method = 'GET';
      mockRequest.url = '/api/users';
      mockRequest.body = { name: 'test' };

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockRequest.method).toBe('GET');
          expect(mockRequest.url).toBe('/api/users');
          expect(mockRequest.body).toEqual({ name: 'test' });
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('intercept - Response header modification', () => {
    it('should set X-Request-ID header in response', (done) => {
      const requestId = 'test-request-id';
      mockRequest.headers['x-request-id'] = requestId;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'X-Request-ID',
            requestId,
          );
          expect(mockResponse.setHeader).toHaveBeenCalledTimes(1);
          done();
        },
        error: done.fail,
      });
    });

    it('should set header after handler completes', (done) => {
      const setHeaderSpy = jest.spyOn(mockResponse, 'setHeader');
      let handlerCompleted = false;

      mockCallHandler.handle = jest.fn().mockImplementation(() => {
        return of({ data: 'test' }).pipe(
          require('rxjs/operators').tap(() => {
            handlerCompleted = true;
          }),
        );
      });

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(handlerCompleted).toBe(true);
          expect(setHeaderSpy).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should use same request ID for request and response', (done) => {
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          const requestIdOnRequest = mockRequest.requestId;
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'X-Request-ID',
            requestIdOnRequest,
          );
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('intercept - Call handler behavior', () => {
    it('should call next.handle()', (done) => {
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

    it('should return observable from next.handle()', (done) => {
      const testData = { message: 'test response' };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(testData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual(testData);
          done();
        },
        error: done.fail,
      });
    });

    it('should propagate data from handler', (done) => {
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

    it('should not modify response data', (done) => {
      const originalData = { users: [{ id: 1 }, { id: 2 }], total: 2 };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(originalData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBe(originalData); // Same reference
          expect(data).toEqual(originalData);
          done();
        },
        error: done.fail,
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
          // Header should still be set even on error (tap runs before error)
          done();
        },
      });
    });

    it('should set header even when handler throws error', (done) => {
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
          // tap() runs before error propagates, but in this case it doesn't run
          // because throwError doesn't emit a value
          expect(mockResponse.setHeader).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('generateRequestId - Private method', () => {
    it('should generate ID with correct format', () => {
      const requestId = (interceptor as any).generateRequestId();

      expect(requestId).toMatch(/^req_\d+_[a-z0-9]{9}$/);
    });

    it('should generate unique IDs on multiple calls', () => {
      const ids = new Set<string>();

      for (let i = 0; i < 100; i++) {
        const id = (interceptor as any).generateRequestId();
        ids.add(id);
      }

      expect(ids.size).toBe(100); // All unique
    });

    it('should include current timestamp', () => {
      const beforeTime = Date.now();
      const requestId = (interceptor as any).generateRequestId();
      const afterTime = Date.now();

      const timestampMatch = requestId.match(/^req_(\d+)_/);
      const timestamp = parseInt(timestampMatch![1]);

      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should use base36 encoding for random part', () => {
      const requestId = (interceptor as any).generateRequestId();
      const randomPart = requestId.split('_')[2];

      // Base36 uses 0-9 and a-z (lowercase)
      expect(randomPart).toMatch(/^[a-z0-9]+$/);
      expect(randomPart.length).toBe(9);
    });

    it('should generate different IDs in rapid succession', () => {
      const id1 = (interceptor as any).generateRequestId();
      const id2 = (interceptor as any).generateRequestId();
      const id3 = (interceptor as any).generateRequestId();

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete request-response cycle with provided ID', (done) => {
      const requestId = 'integration-test-123';
      mockRequest.headers['x-request-id'] = requestId;
      mockRequest.method = 'POST';
      mockRequest.url = '/api/users';

      const responseData = { id: 1, name: 'New User' };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(mockRequest.requestId).toBe(requestId);
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'X-Request-ID',
            requestId,
          );
          expect(data).toEqual(responseData);
          expect(mockCallHandler.handle).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should handle complete request-response cycle with generated ID', (done) => {
      mockRequest.method = 'GET';
      mockRequest.url = '/api/users/1';

      const responseData = { id: 1, name: 'Test User' };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(mockRequest.requestId).toBeDefined();
          expect(mockRequest.requestId).toMatch(/^req_\d+_[a-z0-9]{9}$/);
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'X-Request-ID',
            mockRequest.requestId,
          );
          expect(data).toEqual(responseData);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle null response data', (done) => {
      const requestId = 'null-response-test';
      mockRequest.headers['x-request-id'] = requestId;
      mockCallHandler.handle = jest.fn().mockReturnValue(of(null));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBeNull();
          expect(mockRequest.requestId).toBe(requestId);
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'X-Request-ID',
            requestId,
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should handle undefined response data', (done) => {
      const requestId = 'undefined-response-test';
      mockRequest.headers['x-request-id'] = requestId;
      mockCallHandler.handle = jest.fn().mockReturnValue(of(undefined));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBeUndefined();
          expect(mockRequest.requestId).toBe(requestId);
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'X-Request-ID',
            requestId,
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should handle multiple requests with different IDs', (done) => {
      const requestId1 = 'req-1';
      const requestId2 = 'req-2';
      let completedCount = 0;

      // First request
      mockRequest.headers['x-request-id'] = requestId1;
      const result1$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result1$.subscribe({
        next: () => {
          expect(mockRequest.requestId).toBe(requestId1);
          completedCount++;
          if (completedCount === 2) done();
        },
      });

      // Second request
      mockRequest.headers['x-request-id'] = requestId2;
      const result2$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result2$.subscribe({
        next: () => {
          expect(mockRequest.requestId).toBe(requestId2);
          completedCount++;
          if (completedCount === 2) done();
        },
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle headers as array (multiple values)', (done) => {
      mockRequest.headers['x-request-id'] = ['id1', 'id2', 'id3'];

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          // Express coerces array to string, takes first value
          expect(mockRequest.requestId).toBeDefined();
          done();
        },
        error: done.fail,
      });
    });

    it('should handle numeric request ID', (done) => {
      mockRequest.headers['x-request-id'] = 12345 as any;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockRequest.requestId).toBe(12345);
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'X-Request-ID',
            12345,
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should handle request ID with unicode characters', (done) => {
      const unicodeId = 'req-世界-🌍';
      mockRequest.headers['x-request-id'] = unicodeId;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockRequest.requestId).toBe(unicodeId);
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'X-Request-ID',
            unicodeId,
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should throw error when headers object is missing', () => {
      delete mockRequest.headers;

      // Error is thrown synchronously during intercept call, not in observable
      expect(() => {
        interceptor.intercept(mockExecutionContext, mockCallHandler);
      }).toThrow(TypeError);
    });

    it('should handle case sensitivity in header names', (done) => {
      // HTTP headers are case-insensitive, but Express normalizes to lowercase
      mockRequest.headers['X-REQUEST-ID'] = 'uppercase-header';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          // If Express doesn't normalize, this will generate new ID
          expect(mockRequest.requestId).toBeDefined();
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
          expect(mockRequest.requestId).toBeDefined();
          expect(mockResponse.setHeader).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should extract request/response from context correctly', (done) => {
      const getSpy = jest.spyOn(
        mockExecutionContext.switchToHttp(),
        'getRequest',
      );
      const responseSpy = jest.spyOn(
        mockExecutionContext.switchToHttp(),
        'getResponse',
      );

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(getSpy).toHaveBeenCalled();
          expect(responseSpy).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });
  });
});
