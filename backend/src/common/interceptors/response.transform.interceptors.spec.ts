import { ResponseTransformInterceptor } from './response.transform.interceptors';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { Test, TestingModule } from '@nestjs/testing';

describe('ResponseTransformInterceptor', () => {
  let interceptor: ResponseTransformInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;

  beforeEach(async () => {
    interceptor = new ResponseTransformInterceptor();

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({}),
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
      handle: jest.fn(),
    } as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('intercept - Basic transformation', () => {
    it('should transform plain object response to standard format', (done) => {
      const responseData = { id: 1, name: 'Test' };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.success).toBe(true);
          expect(data.data).toEqual(responseData);
          expect(data.timestamp).toBeDefined();
          expect(typeof data.timestamp).toBe('string');
          expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
          done();
        },
        error: done.fail,
      });
    });

    it('should transform string response to standard format', (done) => {
      const responseData = 'Hello World';
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.success).toBe(true);
          expect(data.data).toBe(responseData);
          expect(data.timestamp).toBeDefined();
          done();
        },
        error: done.fail,
      });
    });

    it('should transform number response to standard format', (done) => {
      const responseData = 42;
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.success).toBe(true);
          expect(data.data).toBe(42);
          expect(data.timestamp).toBeDefined();
          done();
        },
        error: done.fail,
      });
    });

    it('should transform boolean response to standard format', (done) => {
      const responseData = true;
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.success).toBe(true);
          expect(data.data).toBe(true);
          expect(data.timestamp).toBeDefined();
          done();
        },
        error: done.fail,
      });
    });

    it('should transform array response to standard format', (done) => {
      const responseData = [1, 2, 3, 4, 5];
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.success).toBe(true);
          expect(data.data).toEqual([1, 2, 3, 4, 5]);
          expect(data.timestamp).toBeDefined();
          done();
        },
        error: done.fail,
      });
    });

    it('should transform null response to standard format', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of(null));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.success).toBe(true);
          expect(data.data).toBeNull();
          expect(data.timestamp).toBeDefined();
          done();
        },
        error: done.fail,
      });
    });

    it('should transform undefined response to standard format', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of(undefined));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.success).toBe(true);
          expect(data.data).toBeUndefined();
          expect(data.timestamp).toBeDefined();
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('intercept - Already formatted responses', () => {
    it('should return already formatted response with success field as is', (done) => {
      const formattedResponse = {
        success: true,
        data: { id: 1, name: 'Test' },
        timestamp: '2025-01-01T00:00:00.000Z',
      };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(formattedResponse));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual(formattedResponse);
          expect(data.timestamp).toBe('2025-01-01T00:00:00.000Z'); // Original timestamp preserved
          done();
        },
        error: done.fail,
      });
    });

    it('should return response with success=false as is', (done) => {
      const errorResponse = {
        success: false,
        error: 'Something went wrong',
        code: 'ERROR_CODE',
      };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(errorResponse));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual(errorResponse);
          expect(data.success).toBe(false);
          done();
        },
        error: done.fail,
      });
    });

    it('should return response with success and additional fields as is', (done) => {
      const customResponse = {
        success: true,
        data: { message: 'OK' },
        meta: { page: 1, total: 100 },
        extra: 'custom field',
      };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(customResponse));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual(customResponse);
          expect(data.meta).toEqual({ page: 1, total: 100 });
          expect(data.extra).toBe('custom field');
          done();
        },
        error: done.fail,
      });
    });

    it('should detect success field in nested objects and transform', (done) => {
      const responseData = {
        user: {
          success: true, // This is data, not the wrapper
          name: 'John',
        },
      };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          // Should NOT transform since 'success' is not at root level
          expect(data.success).toBe(true);
          expect(data.data).toEqual(responseData);
          expect(data.timestamp).toBeDefined();
          done();
        },
        error: done.fail,
      });
    });

    it('should handle response with success=null as already formatted', (done) => {
      const responseData = {
        success: null,
        data: 'test',
      };
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

    it('should handle response with success=undefined as already formatted', (done) => {
      const responseData = {
        success: undefined,
        data: 'test',
      };
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

    it('should handle response with success=0 (falsy) as already formatted', (done) => {
      const responseData = {
        success: 0,
        data: 'test',
      };
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

    it('should handle response with success="" (empty string) as already formatted', (done) => {
      const responseData = {
        success: '',
        data: 'test',
      };
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
  });

  describe('intercept - Timestamp validation', () => {
    it('should generate valid ISO 8601 timestamp', (done) => {
      const responseData = { message: 'test' };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.timestamp).toMatch(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should generate different timestamps for sequential calls', (done) => {
      const responseData = { message: 'test' };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result1$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      let timestamp1: string;

      result1$.subscribe({
        next: (data1) => {
          timestamp1 = data1.timestamp;

          // Small delay to ensure different timestamp
          setTimeout(() => {
            const result2$ = interceptor.intercept(
              mockExecutionContext,
              mockCallHandler,
            );
            result2$.subscribe({
              next: (data2) => {
                expect(data2.timestamp).not.toBe(timestamp1);
                done();
              },
              error: done.fail,
            });
          }, 10);
        },
        error: done.fail,
      });
    });

    it('should generate timestamp close to current time', (done) => {
      const beforeTime = new Date();
      const responseData = { message: 'test' };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          const afterTime = new Date();
          const timestamp = new Date(data.timestamp);

          expect(timestamp.getTime()).toBeGreaterThanOrEqual(
            beforeTime.getTime(),
          );
          expect(timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('intercept - Complex data structures', () => {
    it('should transform nested object response', (done) => {
      const responseData = {
        user: {
          id: 1,
          profile: {
            name: 'John',
            settings: {
              theme: 'dark',
            },
          },
        },
      };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.success).toBe(true);
          expect(data.data).toEqual(responseData);
          expect(data.data.user.profile.settings.theme).toBe('dark');
          done();
        },
        error: done.fail,
      });
    });

    it('should transform array of objects response', (done) => {
      const responseData = [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' },
        { id: 3, name: 'User 3' },
      ];
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.success).toBe(true);
          expect(data.data).toEqual(responseData);
          expect(Array.isArray(data.data)).toBe(true);
          expect(data.data.length).toBe(3);
          done();
        },
        error: done.fail,
      });
    });

    it('should transform empty array response', (done) => {
      const responseData: any[] = [];
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.success).toBe(true);
          expect(data.data).toEqual([]);
          expect(Array.isArray(data.data)).toBe(true);
          done();
        },
        error: done.fail,
      });
    });

    it('should transform empty object response', (done) => {
      const responseData = {};
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.success).toBe(true);
          expect(data.data).toEqual({});
          done();
        },
        error: done.fail,
      });
    });

    it('should transform response with Date objects', (done) => {
      const date = new Date('2025-01-01');
      const responseData = {
        createdAt: date,
        updatedAt: date,
      };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.success).toBe(true);
          expect(data.data.createdAt).toEqual(date);
          expect(data.data.updatedAt).toEqual(date);
          done();
        },
        error: done.fail,
      });
    });

    it('should transform response with special characters', (done) => {
      const responseData = {
        message: 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?',
        emoji: '😀😃😄',
        unicode: 'Hello 世界',
      };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.success).toBe(true);
          expect(data.data).toEqual(responseData);
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('intercept - Edge cases', () => {
    it('should handle zero as response', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of(0));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.success).toBe(true);
          expect(data.data).toBe(0);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle false as response', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of(false));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.success).toBe(true);
          expect(data.data).toBe(false);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle empty string as response', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of(''));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.success).toBe(true);
          expect(data.data).toBe('');
          done();
        },
        error: done.fail,
      });
    });

    it('should handle NaN as response', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of(NaN));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.success).toBe(true);
          expect(data.data).toBeNaN();
          done();
        },
        error: done.fail,
      });
    });

    it('should handle Infinity as response', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of(Infinity));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.success).toBe(true);
          expect(data.data).toBe(Infinity);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle very large object response', (done) => {
      const largeData: any = {};
      for (let i = 0; i < 1000; i++) {
        largeData[`field${i}`] = `value${i}`;
      }
      mockCallHandler.handle = jest.fn().mockReturnValue(of(largeData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.success).toBe(true);
          expect(Object.keys(data.data).length).toBe(1000);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle circular reference-like structure', (done) => {
      const obj: any = { a: { b: { c: {} } } };
      obj.a.b.c = obj.a; // Not true circular, but deep reference
      mockCallHandler.handle = jest.fn().mockReturnValue(of(obj));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.success).toBe(true);
          expect(data.data).toEqual(obj);
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('intercept - Call handler behavior', () => {
    it('should call next.handle() once', (done) => {
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(of({ message: 'test' }));

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

    it('should return observable', (done) => {
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(of({ message: 'test' }));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      expect(result$.subscribe).toBeDefined();
      result$.subscribe({
        next: () => done(),
        error: done.fail,
      });
    });

    it('should propagate errors from handler', (done) => {
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
        error: (err) => {
          expect(err).toBe(error);
          expect(err.message).toBe('Test error');
          done();
        },
      });
    });

    it('should handle multiple sequential calls', (done) => {
      let callCount = 0;
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValueOnce(of({ data: 'first' }))
        .mockReturnValueOnce(of({ data: 'second' }))
        .mockReturnValueOnce(of({ data: 'third' }));

      const result1$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      result1$.subscribe({
        next: (data) => {
          expect(data.data.data).toBe('first');
          callCount++;

          if (callCount === 3) done();
        },
      });

      const result2$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      result2$.subscribe({
        next: (data) => {
          expect(data.data.data).toBe('second');
          callCount++;

          if (callCount === 3) done();
        },
      });

      const result3$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      result3$.subscribe({
        next: (data) => {
          expect(data.data.data).toBe('third');
          callCount++;

          if (callCount === 3) done();
        },
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should transform typical API success response', (done) => {
      const responseData = {
        id: 1,
        username: 'john_doe',
        email: 'john@example.com',
        createdAt: new Date(),
      };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.success).toBe(true);
          expect(data.data.username).toBe('john_doe');
          expect(data.data.email).toBe('john@example.com');
          expect(data.timestamp).toBeDefined();
          done();
        },
        error: done.fail,
      });
    });

    it('should transform paginated list response', (done) => {
      const responseData = {
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
        total: 100,
        page: 1,
        limit: 10,
      };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.success).toBe(true);
          expect(data.data.items.length).toBe(2);
          expect(data.data.total).toBe(100);
          expect(data.timestamp).toBeDefined();
          done();
        },
        error: done.fail,
      });
    });

    it('should not transform pre-formatted error response', (done) => {
      const errorResponse = {
        success: false,
        error: 'User not found',
        statusCode: 404,
        timestamp: '2025-01-01T00:00:00.000Z',
      };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(errorResponse));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual(errorResponse);
          expect(data.success).toBe(false);
          expect(data.timestamp).toBe('2025-01-01T00:00:00.000Z');
          done();
        },
        error: done.fail,
      });
    });

    it('should transform simple success message', (done) => {
      const message = 'Operation completed successfully';
      mockCallHandler.handle = jest.fn().mockReturnValue(of(message));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.success).toBe(true);
          expect(data.data).toBe(message);
          expect(data.timestamp).toBeDefined();
          done();
        },
        error: done.fail,
      });
    });

    it('should preserve already formatted success response with metadata', (done) => {
      const formattedResponse = {
        success: true,
        data: { id: 1, name: 'Test' },
        meta: {
          requestId: 'abc-123',
          processingTime: 45,
        },
        timestamp: '2025-01-01T12:00:00.000Z',
      };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(formattedResponse));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual(formattedResponse);
          expect(data.meta.requestId).toBe('abc-123');
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('Different execution contexts', () => {
    it('should work with HTTP context', (done) => {
      const responseData = { message: 'HTTP response' };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      mockExecutionContext.getType = jest.fn().mockReturnValue('http');

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.success).toBe(true);
          expect(data.data.message).toBe('HTTP response');
          done();
        },
        error: done.fail,
      });
    });

    it('should work with WebSocket context', (done) => {
      const responseData = { message: 'WebSocket response' };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      mockExecutionContext.getType = jest.fn().mockReturnValue('ws');

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.success).toBe(true);
          expect(data.data.message).toBe('WebSocket response');
          done();
        },
        error: done.fail,
      });
    });

    it('should work with RPC context', (done) => {
      const responseData = { message: 'RPC response' };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      mockExecutionContext.getType = jest.fn().mockReturnValue('rpc');

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.success).toBe(true);
          expect(data.data.message).toBe('RPC response');
          done();
        },
        error: done.fail,
      });
    });
  });
});
