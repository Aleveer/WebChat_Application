import { SecurityHeadersInterceptor } from './security.headers.interceptors';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { Response } from 'express';

describe('SecurityHeadersInterceptor', () => {
  let interceptor: SecurityHeadersInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockResponse: Partial<Response>;
  let setHeaderSpy: jest.Mock;

  beforeEach(() => {
    interceptor = new SecurityHeadersInterceptor();

    setHeaderSpy = jest.fn();
    mockResponse = {
      setHeader: setHeaderSpy,
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
      handle: jest.fn(),
    } as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('intercept', () => {
    it('should set X-Content-Type-Options header', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(setHeaderSpy).toHaveBeenCalledWith(
            'X-Content-Type-Options',
            'nosniff',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should set X-Frame-Options header', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(setHeaderSpy).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
          done();
        },
        error: done.fail,
      });
    });

    it('should set X-XSS-Protection header', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(setHeaderSpy).toHaveBeenCalledWith(
            'X-XSS-Protection',
            '1; mode=block',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should set Strict-Transport-Security header', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(setHeaderSpy).toHaveBeenCalledWith(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should set Referrer-Policy header', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(setHeaderSpy).toHaveBeenCalledWith(
            'Referrer-Policy',
            'strict-origin-when-cross-origin',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should set Content-Security-Policy header', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(setHeaderSpy).toHaveBeenCalledWith(
            'Content-Security-Policy',
            "default-src 'self'",
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should set all 6 security headers', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(setHeaderSpy).toHaveBeenCalledTimes(6);
          done();
        },
        error: done.fail,
      });
    });

    it('should set headers in correct order', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(setHeaderSpy.mock.calls[0]).toEqual([
            'X-Content-Type-Options',
            'nosniff',
          ]);
          expect(setHeaderSpy.mock.calls[1]).toEqual([
            'X-Frame-Options',
            'DENY',
          ]);
          expect(setHeaderSpy.mock.calls[2]).toEqual([
            'X-XSS-Protection',
            '1; mode=block',
          ]);
          expect(setHeaderSpy.mock.calls[3]).toEqual([
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains',
          ]);
          expect(setHeaderSpy.mock.calls[4]).toEqual([
            'Referrer-Policy',
            'strict-origin-when-cross-origin',
          ]);
          expect(setHeaderSpy.mock.calls[5]).toEqual([
            'Content-Security-Policy',
            "default-src 'self'",
          ]);
          done();
        },
        error: done.fail,
      });
    });

    it('should set headers before handler execution', (done) => {
      let headersSet = false;
      setHeaderSpy.mockImplementation(() => {
        headersSet = true;
      });

      mockCallHandler.handle = jest.fn().mockImplementation(() => {
        expect(headersSet).toBe(true);
        return of({ data: 'test' });
      });

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

    it('should return handler response', (done) => {
      const testData = { message: 'Success', id: 123 };
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

    it('should pass through null response', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of(null));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBeNull();
          expect(setHeaderSpy).toHaveBeenCalledTimes(6);
          done();
        },
        error: done.fail,
      });
    });

    it('should pass through undefined response', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of(undefined));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBeUndefined();
          expect(setHeaderSpy).toHaveBeenCalledTimes(6);
          done();
        },
        error: done.fail,
      });
    });

    it('should pass through array response', (done) => {
      const arrayData = [1, 2, 3, 4, 5];
      mockCallHandler.handle = jest.fn().mockReturnValue(of(arrayData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual(arrayData);
          expect(setHeaderSpy).toHaveBeenCalledTimes(6);
          done();
        },
        error: done.fail,
      });
    });

    it('should pass through string response', (done) => {
      const stringData = 'test string response';
      mockCallHandler.handle = jest.fn().mockReturnValue(of(stringData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBe(stringData);
          expect(setHeaderSpy).toHaveBeenCalledTimes(6);
          done();
        },
        error: done.fail,
      });
    });

    it('should pass through number response', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of(42));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBe(42);
          expect(setHeaderSpy).toHaveBeenCalledTimes(6);
          done();
        },
        error: done.fail,
      });
    });

    it('should pass through boolean response', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of(true));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBe(true);
          expect(setHeaderSpy).toHaveBeenCalledTimes(6);
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('Error handling', () => {
    it('should set headers even when handler throws error', (done) => {
      const customError = new Error('Handler error');
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
          expect(setHeaderSpy).toHaveBeenCalledTimes(6);
          expect(error).toBe(customError);
          done();
        },
      });
    });

    it('should propagate errors from handler', (done) => {
      const testError = new Error('Test error');
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => testError));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error).toBe(testError);
          expect(error.message).toBe('Test error');
          done();
        },
      });
    });

    it('should handle error thrown as string', (done) => {
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
          expect(setHeaderSpy).toHaveBeenCalledTimes(6);
          done();
        },
      });
    });

    it('should handle error thrown as object', (done) => {
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
          expect(setHeaderSpy).toHaveBeenCalledTimes(6);
          done();
        },
      });
    });
  });

  describe('Response object interaction', () => {
    it('should call getResponse from http context', (done) => {
      const getResponseSpy = jest.fn().mockReturnValue(mockResponse);
      const switchToHttpSpy = jest.fn().mockReturnValue({
        getRequest: jest.fn(),
        getResponse: getResponseSpy,
      });

      mockExecutionContext.switchToHttp = switchToHttpSpy;
      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(switchToHttpSpy).toHaveBeenCalled();
          expect(getResponseSpy).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should work with response object that has additional methods', (done) => {
      const extendedResponse = {
        ...mockResponse,
        setHeader: setHeaderSpy,
        status: jest.fn(),
        json: jest.fn(),
        send: jest.fn(),
      };

      mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn(),
        getResponse: jest.fn().mockReturnValue(extendedResponse),
      });

      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(setHeaderSpy).toHaveBeenCalledTimes(6);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle setHeader being called multiple times on same header', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

      const result1$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result1$.subscribe({
        next: () => {
          const firstCallCount = setHeaderSpy.mock.calls.length;
          expect(firstCallCount).toBe(6);

          // Reset mock
          setHeaderSpy.mockClear();

          const result2$ = interceptor.intercept(
            mockExecutionContext,
            mockCallHandler,
          );

          result2$.subscribe({
            next: () => {
              expect(setHeaderSpy).toHaveBeenCalledTimes(6);
              done();
            },
            error: done.fail,
          });
        },
        error: done.fail,
      });
    });
  });

  describe('Multiple requests', () => {
    it('should set headers for each request independently', (done) => {
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValueOnce(of({ id: 1 }))
        .mockReturnValueOnce(of({ id: 2 }));

      const result1$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      const result2$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      let count = 0;

      result1$.subscribe({
        next: (data) => {
          expect(data.id).toBe(1);
          count++;
          if (count === 2) done();
        },
      });

      result2$.subscribe({
        next: (data) => {
          expect(data.id).toBe(2);
          count++;
          if (count === 2) done();
        },
      });
    });

    it('should set headers consistently across multiple rapid requests', (done) => {
      const requests = 10;
      let completed = 0;

      for (let i = 0; i < requests; i++) {
        setHeaderSpy.mockClear();
        mockCallHandler.handle = jest.fn().mockReturnValue(of({ index: i }));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          next: () => {
            expect(setHeaderSpy).toHaveBeenCalledTimes(6);
            completed++;
            if (completed === requests) done();
          },
          error: done.fail,
        });
      }
    });
  });

  describe('Edge cases', () => {
    it('should work when response is already set with other headers', (done) => {
      const existingHeaders = {
        'Custom-Header': 'custom-value',
        'Another-Header': 'another-value',
      };

      const responseWithHeaders = {
        setHeader: setHeaderSpy,
        headers: existingHeaders,
      };

      mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn(),
        getResponse: jest.fn().mockReturnValue(responseWithHeaders),
      });

      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(setHeaderSpy).toHaveBeenCalledTimes(6);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle response with complex nested data', (done) => {
      const complexData = {
        user: {
          id: 1,
          profile: {
            name: 'Test',
            settings: {
              security: {
                twoFactor: true,
                headers: ['custom-header'],
              },
            },
          },
        },
        metadata: {
          timestamp: Date.now(),
          version: '1.0.0',
        },
      };

      mockCallHandler.handle = jest.fn().mockReturnValue(of(complexData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual(complexData);
          expect(setHeaderSpy).toHaveBeenCalledTimes(6);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle very large response payloads', (done) => {
      const largePayload = {
        data: Array(10000).fill({ id: 1, value: 'test data' }),
      };

      mockCallHandler.handle = jest.fn().mockReturnValue(of(largePayload));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data.data.length).toBe(10000);
          expect(setHeaderSpy).toHaveBeenCalledTimes(6);
          done();
        },
        error: done.fail,
      });
    });

    it('should work with empty object response', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual({});
          expect(setHeaderSpy).toHaveBeenCalledTimes(6);
          done();
        },
        error: done.fail,
      });
    });

    it('should work with empty array response', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of([]));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual([]);
          expect(setHeaderSpy).toHaveBeenCalledTimes(6);
          done();
        },
        error: done.fail,
      });
    });

    it('should work with zero as response', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of(0));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBe(0);
          expect(setHeaderSpy).toHaveBeenCalledTimes(6);
          done();
        },
        error: done.fail,
      });
    });

    it('should work with false as response', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of(false));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBe(false);
          expect(setHeaderSpy).toHaveBeenCalledTimes(6);
          done();
        },
        error: done.fail,
      });
    });

    it('should work with empty string as response', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of(''));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toBe('');
          expect(setHeaderSpy).toHaveBeenCalledTimes(6);
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('Security header values verification', () => {
    it('should verify X-Content-Type-Options prevents MIME sniffing', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          const call = setHeaderSpy.mock.calls.find(
            (c) => c[0] === 'X-Content-Type-Options',
          );
          expect(call[1]).toBe('nosniff');
          done();
        },
        error: done.fail,
      });
    });

    it('should verify X-Frame-Options prevents clickjacking', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          const call = setHeaderSpy.mock.calls.find(
            (c) => c[0] === 'X-Frame-Options',
          );
          expect(call[1]).toBe('DENY');
          done();
        },
        error: done.fail,
      });
    });

    it('should verify X-XSS-Protection enables XSS filtering', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          const call = setHeaderSpy.mock.calls.find(
            (c) => c[0] === 'X-XSS-Protection',
          );
          expect(call[1]).toBe('1; mode=block');
          done();
        },
        error: done.fail,
      });
    });

    it('should verify HSTS header includes max-age and subdomains', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          const call = setHeaderSpy.mock.calls.find(
            (c) => c[0] === 'Strict-Transport-Security',
          );
          expect(call[1]).toContain('max-age=31536000');
          expect(call[1]).toContain('includeSubDomains');
          done();
        },
        error: done.fail,
      });
    });

    it('should verify Referrer-Policy is strict', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          const call = setHeaderSpy.mock.calls.find(
            (c) => c[0] === 'Referrer-Policy',
          );
          expect(call[1]).toBe('strict-origin-when-cross-origin');
          done();
        },
        error: done.fail,
      });
    });

    it('should verify CSP restricts to self', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          const call = setHeaderSpy.mock.calls.find(
            (c) => c[0] === 'Content-Security-Policy',
          );
          expect(call[1]).toBe("default-src 'self'");
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should work with observable that emits multiple values', (done) => {
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
          expect(setHeaderSpy).toHaveBeenCalledTimes(6);
          done();
        },
        error: done.fail,
      });
    });

    it('should maintain proper execution flow', (done) => {
      const executionOrder: string[] = [];

      setHeaderSpy.mockImplementation(() => {
        executionOrder.push('setHeader');
      });

      mockCallHandler.handle = jest.fn().mockImplementation(() => {
        executionOrder.push('handler');
        return of({ data: 'test' });
      });

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          executionOrder.push('subscribe');
          // Headers should be set before handler
          expect(executionOrder[0]).toBe('setHeader');
          expect(executionOrder.indexOf('handler')).toBeGreaterThan(0);
          expect(executionOrder[executionOrder.length - 1]).toBe('subscribe');
          done();
        },
        error: done.fail,
      });
    });

    it('should call handler only once per intercept call', (done) => {
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

    it('should set headers exactly once per request', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          // Each header should be set exactly once
          expect(
            setHeaderSpy.mock.calls.filter(
              (c) => c[0] === 'X-Content-Type-Options',
            ).length,
          ).toBe(1);
          expect(
            setHeaderSpy.mock.calls.filter((c) => c[0] === 'X-Frame-Options')
              .length,
          ).toBe(1);
          expect(
            setHeaderSpy.mock.calls.filter((c) => c[0] === 'X-XSS-Protection')
              .length,
          ).toBe(1);
          expect(
            setHeaderSpy.mock.calls.filter(
              (c) => c[0] === 'Strict-Transport-Security',
            ).length,
          ).toBe(1);
          expect(
            setHeaderSpy.mock.calls.filter((c) => c[0] === 'Referrer-Policy')
              .length,
          ).toBe(1);
          expect(
            setHeaderSpy.mock.calls.filter(
              (c) => c[0] === 'Content-Security-Policy',
            ).length,
          ).toBe(1);
          done();
        },
        error: done.fail,
      });
    });
  });
});
