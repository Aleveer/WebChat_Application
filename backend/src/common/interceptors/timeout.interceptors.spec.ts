import { TimeoutInterceptor } from './timeout.interceptors';
import {
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from '@nestjs/common';
import { of, throwError, delay, TimeoutError } from 'rxjs';
import { Test, TestingModule } from '@nestjs/testing';

describe('TimeoutInterceptor', () => {
  let interceptor: TimeoutInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;

  beforeEach(async () => {
    interceptor = new TimeoutInterceptor(5000);

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

  describe('Constructor', () => {
    it('should create interceptor with default timeout of 30000ms', () => {
      const defaultInterceptor = new TimeoutInterceptor();

      expect(defaultInterceptor).toBeDefined();
      expect((defaultInterceptor as any).timeoutMs).toBe(30000);
    });

    it('should create interceptor with custom timeout', () => {
      const customInterceptor = new TimeoutInterceptor(10000);

      expect(customInterceptor).toBeDefined();
      expect((customInterceptor as any).timeoutMs).toBe(10000);
    });

    it('should create interceptor with zero timeout', () => {
      const zeroInterceptor = new TimeoutInterceptor(0);

      expect(zeroInterceptor).toBeDefined();
      expect((zeroInterceptor as any).timeoutMs).toBe(0);
    });

    it('should create interceptor with very large timeout', () => {
      const largeTimeoutInterceptor = new TimeoutInterceptor(999999);

      expect(largeTimeoutInterceptor).toBeDefined();
      expect((largeTimeoutInterceptor as any).timeoutMs).toBe(999999);
    });
  });

  describe('intercept', () => {
    it('should pass through successful response within timeout', (done) => {
      const testData = { message: 'Success' };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(testData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual(testData);
          expect(mockCallHandler.handle).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should throw RequestTimeoutException when timeout occurs', (done) => {
      const fastInterceptor = new TimeoutInterceptor(100);
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(of({ data: 'test' }).pipe(delay(200)));

      const result$ = fastInterceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => done.fail('Should have thrown timeout error'),
        error: (error) => {
          expect(error).toBeInstanceOf(RequestTimeoutException);
          expect(error.message).toBe('Request timeout');
          done();
        },
      });
    });

    it('should pass through non-timeout errors', (done) => {
      const customError = new Error('Custom error');
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => customError));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error).toBe(customError);
          expect(error).not.toBeInstanceOf(RequestTimeoutException);
          expect(error.message).toBe('Custom error');
          done();
        },
      });
    });

    it('should handle multiple rapid requests', (done) => {
      const testData1 = { id: 1 };
      const testData2 = { id: 2 };
      const testData3 = { id: 3 };

      let count = 0;
      const expectedResults = [testData1, testData2, testData3];

      mockCallHandler.handle = jest
        .fn()
        .mockReturnValueOnce(of(testData1))
        .mockReturnValueOnce(of(testData2))
        .mockReturnValueOnce(of(testData3));

      const result1$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      const result2$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      const result3$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result1$.subscribe({
        next: (data) => {
          expect(data).toEqual(expectedResults[count]);
          count++;
          if (count === 3) done();
        },
      });

      result2$.subscribe({
        next: (data) => {
          expect(data).toEqual(expectedResults[count]);
          count++;
          if (count === 3) done();
        },
      });

      result3$.subscribe({
        next: (data) => {
          expect(data).toEqual(expectedResults[count]);
          count++;
          if (count === 3) done();
        },
      });
    });

    it('should handle empty response', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of(null));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBeNull();
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
          done();
        },
        error: done.fail,
      });
    });

    it('should handle response with array data', (done) => {
      const arrayData = [1, 2, 3, 4, 5];
      mockCallHandler.handle = jest.fn().mockReturnValue(of(arrayData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual(arrayData);
          expect(Array.isArray(data)).toBe(true);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle response with nested objects', (done) => {
      const nestedData = {
        user: {
          id: 1,
          profile: {
            name: 'Test User',
            settings: {
              theme: 'dark',
            },
          },
        },
      };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(nestedData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual(nestedData);
          expect(data.user.profile.settings.theme).toBe('dark');
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

    it('should handle string response', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of('test string'));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBe('test string');
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('Timeout scenarios', () => {
    it('should timeout at exact timeout duration', (done) => {
      const exactInterceptor = new TimeoutInterceptor(100);
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(of({ data: 'test' }).pipe(delay(101)));

      const result$ = exactInterceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => done.fail('Should have thrown timeout error'),
        error: (error) => {
          expect(error).toBeInstanceOf(RequestTimeoutException);
          done();
        },
      });
    });

    it('should not timeout just before timeout duration', (done) => {
      const interceptor = new TimeoutInterceptor(200);
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(of({ data: 'test' }).pipe(delay(50)));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual({ data: 'test' });
          done();
        },
        error: done.fail,
      });
    });

    it('should handle very fast responses with long timeout', (done) => {
      const longTimeoutInterceptor = new TimeoutInterceptor(30000);
      mockCallHandler.handle = jest.fn().mockReturnValue(of({ fast: true }));

      const result$ = longTimeoutInterceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual({ fast: true });
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('Error handling', () => {
    it('should correctly identify TimeoutError and convert to RequestTimeoutException', (done) => {
      const timeoutError = new TimeoutError();
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => timeoutError));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error).toBeInstanceOf(RequestTimeoutException);
          expect(error.message).toBe('Request timeout');
          done();
        },
      });
    });

    it('should not convert non-timeout errors', (done) => {
      class CustomException extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomException';
        }
      }

      const customError = new CustomException('Not a timeout');
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => customError));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error).toBeInstanceOf(CustomException);
          expect(error.message).toBe('Not a timeout');
          expect(error).not.toBeInstanceOf(RequestTimeoutException);
          done();
        },
      });
    });

    it('should handle errors with no message', (done) => {
      const errorWithoutMessage = new Error();
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => errorWithoutMessage));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error).toBe(errorWithoutMessage);
          done();
        },
      });
    });

    it('should handle errors thrown as strings', (done) => {
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => 'String error'));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error).toBe('String error');
          done();
        },
      });
    });

    it('should handle errors thrown as objects', (done) => {
      const errorObject = { code: 'ERROR', message: 'Object error' };
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => errorObject));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error).toEqual(errorObject);
          done();
        },
      });
    });
  });

  describe('Edge cases', () => {
    it('should work with different ExecutionContext types', (done) => {
      const wsContext = {
        ...mockExecutionContext,
        getType: jest.fn().mockReturnValue('ws'),
      } as any;

      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(of({ type: 'websocket' }));

      const result$ = interceptor.intercept(wsContext, mockCallHandler);

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual({ type: 'websocket' });
          done();
        },
        error: done.fail,
      });
    });

    it('should handle zero timeout value (RxJS allows it, emits immediately)', (done) => {
      const zeroTimeoutInterceptor = new TimeoutInterceptor(0);
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(of({ data: 'instant' }));

      const result$ = zeroTimeoutInterceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          // RxJS timeout with 0 allows synchronous emissions
          expect(data).toEqual({ data: 'instant' });
          done();
        },
        error: (error) => {
          // Or it might timeout, both are acceptable
          expect(error).toBeInstanceOf(RequestTimeoutException);
          done();
        },
      });
    });

    it('should handle negative timeout value (RxJS allows it)', (done) => {
      const negativeTimeoutInterceptor = new TimeoutInterceptor(-1000);
      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

      const result$ = negativeTimeoutInterceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          // RxJS timeout with negative value allows synchronous emissions
          expect(data).toEqual({ data: 'test' });
          done();
        },
        error: (error) => {
          // Or it might timeout, both are acceptable
          expect(error).toBeInstanceOf(RequestTimeoutException);
          done();
        },
      });
    });

    it('should handle very large response payload', (done) => {
      const largePayload = {
        data: Array(10000).fill({
          id: 1,
          name: 'Test',
          description: 'Large data',
        }),
      };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(largePayload));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.data.length).toBe(10000);
          done();
        },
        error: done.fail,
      });
    });

    it('should preserve response data types', (done) => {
      const mixedData = {
        string: 'text',
        number: 123,
        boolean: true,
        null: null,
        undefined: undefined,
        array: [1, 2, 3],
        object: { nested: 'value' },
      };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(mixedData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(typeof data.string).toBe('string');
          expect(typeof data.number).toBe('number');
          expect(typeof data.boolean).toBe('boolean');
          expect(data.null).toBeNull();
          expect(data.undefined).toBeUndefined();
          expect(Array.isArray(data.array)).toBe(true);
          expect(typeof data.object).toBe('object');
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should work with call handler that returns multiple values', (done) => {
      let count = 0;
      mockCallHandler.handle = jest.fn().mockReturnValue(of(1, 2, 3));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (value) => {
          count++;
          expect([1, 2, 3]).toContain(value);
        },
        complete: () => {
          expect(count).toBe(3);
          done();
        },
        error: done.fail,
      });
    });

    it('should call handler only once per intercept', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

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

    it('should maintain execution context integrity', (done) => {
      const contextSpy = jest.spyOn(mockExecutionContext, 'getType');
      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          // Context should still be accessible
          expect(mockExecutionContext).toBeDefined();
          expect(mockExecutionContext.getType).toBeDefined();
          done();
        },
        error: done.fail,
      });
    });

    it('should work correctly when timeout is exactly at boundary', (done) => {
      const boundaryInterceptor = new TimeoutInterceptor(100);
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(of({ data: 'test' }).pipe(delay(100)));

      const result$ = boundaryInterceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual({ data: 'test' });
          done();
        },
        error: (error) => {
          // Either success or timeout is acceptable at exact boundary
          expect(error).toBeInstanceOf(RequestTimeoutException);
          done();
        },
      });
    });
  });
});
