import { CompressionInterceptor } from './compression.interceptors';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { Test, TestingModule } from '@nestjs/testing';

describe('CompressionInterceptor', () => {
  let interceptor: CompressionInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockResponse: any;
  let setHeaderSpy: jest.SpyInstance;

  beforeEach(async () => {
    interceptor = new CompressionInterceptor();

    mockResponse = {
      setHeader: jest.fn(),
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({}),
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

    setHeaderSpy = jest.spyOn(mockResponse, 'setHeader');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('intercept - Header setting', () => {
    it('should set Content-Encoding header to gzip', (done) => {
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(setHeaderSpy).toHaveBeenCalledWith('Content-Encoding', 'gzip');
          done();
        },
        error: done.fail,
      });
    });

    it('should set Vary header to Accept-Encoding', (done) => {
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(setHeaderSpy).toHaveBeenCalledWith('Vary', 'Accept-Encoding');
          done();
        },
        error: done.fail,
      });
    });

    it('should set both headers', (done) => {
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(setHeaderSpy).toHaveBeenCalledTimes(2);
          expect(setHeaderSpy).toHaveBeenNthCalledWith(
            1,
            'Content-Encoding',
            'gzip',
          );
          expect(setHeaderSpy).toHaveBeenNthCalledWith(
            2,
            'Vary',
            'Accept-Encoding',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should set headers before calling handler', () => {
      const handleSpy = jest.spyOn(mockCallHandler, 'handle');

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      // Headers should be set immediately
      expect(setHeaderSpy).toHaveBeenCalledTimes(2);
      expect(handleSpy).toHaveBeenCalledTimes(1);
    });

    it('should set headers in correct order', (done) => {
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          const calls = setHeaderSpy.mock.calls;
          expect(calls[0]).toEqual(['Content-Encoding', 'gzip']);
          expect(calls[1]).toEqual(['Vary', 'Accept-Encoding']);
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

    it('should call next.handle()', (done) => {
      const handleSpy = jest.spyOn(mockCallHandler, 'handle');

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(handleSpy).toHaveBeenCalledTimes(1);
          expect(handleSpy).toHaveBeenCalledWith();
          done();
        },
        error: done.fail,
      });
    });

    it('should not modify response data', (done) => {
      const responseData = {
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
        total: 2,
      };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBe(responseData);
          expect(data).toEqual({
            users: [
              { id: 1, name: 'Alice' },
              { id: 2, name: 'Bob' },
            ],
            total: 2,
          });
          done();
        },
        error: done.fail,
      });
    });

    it('should handle null response data', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of(null));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBeNull();
          expect(setHeaderSpy).toHaveBeenCalledTimes(2);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle undefined response data', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of(undefined));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBeUndefined();
          expect(setHeaderSpy).toHaveBeenCalledTimes(2);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle empty object response', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual({});
          done();
        },
        error: done.fail,
      });
    });

    it('should handle empty array response', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of([]));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual([]);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle string response', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of('Success'));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBe('Success');
          done();
        },
        error: done.fail,
      });
    });

    it('should handle number response', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of(42));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBe(42);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle boolean response', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of(true));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBe(true);
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('intercept - Error handling', () => {
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

    it('should set headers even if handler throws error', (done) => {
      const error = new Error('Test error');
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => error));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Headers are set before subscribing
      expect(setHeaderSpy).toHaveBeenCalledTimes(2);

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: () => {
          expect(setHeaderSpy).toHaveBeenCalledTimes(2);
          done();
        },
      });
    });

    it('should propagate HTTP errors', (done) => {
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
          expect(err).toEqual({ status: 404, message: 'Not Found' });
          done();
        },
      });
    });

    it('should propagate validation errors', (done) => {
      const error = { status: 422, message: 'Validation failed', errors: [] };
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
          expect(err.status).toBe(422);
          expect(err.message).toBe('Validation failed');
          done();
        },
      });
    });

    it('should propagate authorization errors', (done) => {
      const error = { status: 401, message: 'Unauthorized' };
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
          expect(err.status).toBe(401);
          done();
        },
      });
    });
  });

  describe('intercept - Context extraction', () => {
    it('should extract response from HTTP context', (done) => {
      const switchToHttpSpy = jest.spyOn(mockExecutionContext, 'switchToHttp');

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(switchToHttpSpy).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should work with HTTP context', (done) => {
      mockExecutionContext.getType = jest.fn().mockReturnValue('http');

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(setHeaderSpy).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should get response object correctly', (done) => {
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockResponse.setHeader).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('intercept - Multiple requests', () => {
    it('should set headers for each request independently', (done) => {
      let completedCount = 0;

      for (let i = 0; i < 3; i++) {
        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          next: () => {
            completedCount++;
            if (completedCount === 3) {
              // 2 headers per request * 3 requests = 6 calls
              expect(setHeaderSpy).toHaveBeenCalledTimes(6);
              done();
            }
          },
        });
      }
    });

    it('should maintain header values across multiple requests', (done) => {
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
            expect(setHeaderSpy).toHaveBeenCalledWith(
              'Content-Encoding',
              'gzip',
            );
            expect(setHeaderSpy).toHaveBeenCalledWith(
              'Vary',
              'Accept-Encoding',
            );
            done();
          }
        },
      });

      result2$.subscribe({
        next: () => {
          completed++;
          if (completed === 2) {
            expect(setHeaderSpy).toHaveBeenCalledWith(
              'Content-Encoding',
              'gzip',
            );
            expect(setHeaderSpy).toHaveBeenCalledWith(
              'Vary',
              'Accept-Encoding',
            );
            done();
          }
        },
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should compress JSON response', (done) => {
      const responseData = {
        id: 1,
        username: 'john_doe',
        email: 'john@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual(responseData);
          expect(setHeaderSpy).toHaveBeenCalledWith('Content-Encoding', 'gzip');
          expect(setHeaderSpy).toHaveBeenCalledWith('Vary', 'Accept-Encoding');
          done();
        },
        error: done.fail,
      });
    });

    it('should compress array response', (done) => {
      const responseData = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
      ];
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual(responseData);
          expect(setHeaderSpy).toHaveBeenCalledWith('Content-Encoding', 'gzip');
          done();
        },
        error: done.fail,
      });
    });

    it('should compress paginated response', (done) => {
      const responseData = {
        data: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 100,
        },
      };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual(responseData);
          expect(setHeaderSpy).toHaveBeenCalledWith('Vary', 'Accept-Encoding');
          done();
        },
        error: done.fail,
      });
    });

    it('should compress large text response', (done) => {
      const largeText = 'Lorem ipsum '.repeat(1000);
      mockCallHandler.handle = jest.fn().mockReturnValue(of(largeText));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBe(largeText);
          expect(setHeaderSpy).toHaveBeenCalledWith('Content-Encoding', 'gzip');
          done();
        },
        error: done.fail,
      });
    });

    it('should handle file download response', (done) => {
      const fileData = { filename: 'document.pdf', size: 1024000 };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(fileData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual(fileData);
          expect(setHeaderSpy).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should handle API success response', (done) => {
      const responseData = {
        success: true,
        message: 'Operation completed successfully',
        data: { id: 123 },
      };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.success).toBe(true);
          expect(setHeaderSpy).toHaveBeenCalledWith('Content-Encoding', 'gzip');
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle response object with circular references', (done) => {
      const circularObj: any = { name: 'Test' };
      circularObj.self = circularObj;
      mockCallHandler.handle = jest.fn().mockReturnValue(of(circularObj));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.name).toBe('Test');
          expect(data.self).toBe(data);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle very large response', (done) => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        data: 'x'.repeat(100),
      }));
      mockCallHandler.handle = jest.fn().mockReturnValue(of(largeArray));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.length).toBe(10000);
          expect(setHeaderSpy).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should handle response with special characters', (done) => {
      const responseData = {
        message: 'Hello 世界 🌍 café',
        emoji: '😀🎉🚀',
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

    it('should handle response with nested arrays', (done) => {
      const responseData = {
        matrix: [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ],
      };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.matrix).toEqual([
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9],
          ]);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle response with Date objects', (done) => {
      const now = new Date();
      const responseData = {
        timestamp: now,
        created: now.toISOString(),
      };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.timestamp).toBe(now);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle response with Buffer', (done) => {
      const buffer = Buffer.from('Hello World');
      mockCallHandler.handle = jest.fn().mockReturnValue(of(buffer));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBe(buffer);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle zero value', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of(0));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBe(0);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle false value', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of(false));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBe(false);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle empty string value', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of(''));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBe('');
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('Header immutability', () => {
    it('should always set Content-Encoding to gzip', (done) => {
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          const calls = setHeaderSpy.mock.calls.filter(
            (call) => call[0] === 'Content-Encoding',
          );
          expect(calls.length).toBe(1);
          expect(calls[0][1]).toBe('gzip');
          done();
        },
        error: done.fail,
      });
    });

    it('should always set Vary to Accept-Encoding', (done) => {
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          const calls = setHeaderSpy.mock.calls.filter(
            (call) => call[0] === 'Vary',
          );
          expect(calls.length).toBe(1);
          expect(calls[0][1]).toBe('Accept-Encoding');
          done();
        },
        error: done.fail,
      });
    });

    it('should not set any other headers', (done) => {
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(setHeaderSpy).toHaveBeenCalledTimes(2);
          const headerNames = setHeaderSpy.mock.calls.map((call) => call[0]);
          expect(headerNames).toEqual(['Content-Encoding', 'Vary']);
          done();
        },
        error: done.fail,
      });
    });
  });
});
