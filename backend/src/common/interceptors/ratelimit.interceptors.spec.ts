import { RateLimitInterceptor } from './ratelimit.interceptors';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { Test, TestingModule } from '@nestjs/testing';

describe('RateLimitInterceptor', () => {
  let interceptor: RateLimitInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: any;

  beforeEach(async () => {
    interceptor = new RateLimitInterceptor();

    mockRequest = {
      ip: '192.168.1.1',
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
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('intercept - First request', () => {
    it('should allow first request from client', (done) => {
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual({ success: true });
          expect(mockCallHandler.handle).toHaveBeenCalledTimes(1);
          done();
        },
        error: done.fail,
      });
    });

    it('should initialize request counter for new client', (done) => {
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          const requests = (interceptor as any).requests;
          const clientRequests = requests.get('192.168.1.1');

          expect(clientRequests).toBeDefined();
          expect(clientRequests.count).toBe(1);
          expect(clientRequests.resetTime).toBeGreaterThan(Date.now());
          done();
        },
        error: done.fail,
      });
    });

    it('should set reset time 15 minutes in future', (done) => {
      const beforeTime = Date.now();
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          const afterTime = Date.now();
          const requests = (interceptor as any).requests;
          const clientRequests = requests.get('192.168.1.1');

          const expectedResetTime = beforeTime + 15 * 60 * 1000;
          expect(clientRequests.resetTime).toBeGreaterThanOrEqual(
            expectedResetTime,
          );
          expect(clientRequests.resetTime).toBeLessThanOrEqual(
            afterTime + 15 * 60 * 1000,
          );
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('intercept - Multiple requests within window', () => {
    it('should allow multiple requests within limit', (done) => {
      let completedRequests = 0;
      const totalRequests = 10;

      for (let i = 0; i < totalRequests; i++) {
        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );
        result$.subscribe({
          next: () => {
            completedRequests++;
            if (completedRequests === totalRequests) {
              const requests = (interceptor as any).requests;
              const clientRequests = requests.get('192.168.1.1');
              expect(clientRequests.count).toBe(totalRequests);
              done();
            }
          },
          error: done.fail,
        });
      }
    });

    it('should increment counter for each request', (done) => {
      const result1$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result1$.subscribe({
        next: () => {
          const requests = (interceptor as any).requests;
          expect(requests.get('192.168.1.1').count).toBe(1);

          const result2$ = interceptor.intercept(
            mockExecutionContext,
            mockCallHandler,
          );
          result2$.subscribe({
            next: () => {
              expect(requests.get('192.168.1.1').count).toBe(2);

              const result3$ = interceptor.intercept(
                mockExecutionContext,
                mockCallHandler,
              );
              result3$.subscribe({
                next: () => {
                  expect(requests.get('192.168.1.1').count).toBe(3);
                  done();
                },
                error: done.fail,
              });
            },
            error: done.fail,
          });
        },
        error: done.fail,
      });
    });

    it('should maintain same reset time for requests in same window', (done) => {
      const result1$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result1$.subscribe({
        next: () => {
          const requests = (interceptor as any).requests;
          const resetTime1 = requests.get('192.168.1.1').resetTime;

          const result2$ = interceptor.intercept(
            mockExecutionContext,
            mockCallHandler,
          );
          result2$.subscribe({
            next: () => {
              const resetTime2 = requests.get('192.168.1.1').resetTime;
              expect(resetTime2).toBe(resetTime1);
              done();
            },
            error: done.fail,
          });
        },
        error: done.fail,
      });
    });
  });

  describe('intercept - Rate limit exceeded', () => {
    it('should throw error when limit is exceeded', (done) => {
      // Make 100 requests to reach limit
      for (let i = 0; i < 100; i++) {
        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );
        result$.subscribe({ next: () => {}, error: () => {} });
      }

      // 101st request should be rejected
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => done.fail('Should have thrown rate limit error'),
        error: (error) => {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toBe('Rate limit exceeded');
          done();
        },
      });
    });

    it('should not increment counter when limit is exceeded', (done) => {
      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );
        result$.subscribe({ next: () => {}, error: () => {} });
      }

      const requests = (interceptor as any).requests;
      const countBefore = requests.get('192.168.1.1').count;

      // Try one more request
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: () => {
          const countAfter = requests.get('192.168.1.1').count;
          expect(countAfter).toBe(countBefore);
          expect(countAfter).toBe(100);
          done();
        },
      });
    });

    it('should not call next.handle() when limit is exceeded', (done) => {
      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );
        result$.subscribe({ next: () => {}, error: () => {} });
      }

      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(of({ data: 'should not be called' }));

      // 101st request
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: () => {
          expect(mockCallHandler.handle).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should reject exactly at limit (100 requests)', (done) => {
      // Make exactly 100 requests
      for (let i = 0; i < 100; i++) {
        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );
        result$.subscribe({ next: () => {}, error: () => {} });
      }

      // 100th request should succeed
      const requests = (interceptor as any).requests;
      expect(requests.get('192.168.1.1').count).toBe(100);

      // 101st request should fail
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toBe('Rate limit exceeded');
          done();
        },
      });
    });
  });

  describe('intercept - Window reset', () => {
    it('should reset counter after window expires', (done) => {
      jest.useFakeTimers();

      // First request
      const result1$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      result1$.subscribe({ next: () => {}, error: () => {} });

      const requests = (interceptor as any).requests;
      expect(requests.get('192.168.1.1').count).toBe(1);

      // Advance time past reset time
      jest.advanceTimersByTime(16 * 60 * 1000); // 16 minutes

      // New request should reset counter
      const result2$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      result2$.subscribe({
        next: () => {
          expect(requests.get('192.168.1.1').count).toBe(1);
          expect(requests.get('192.168.1.1').resetTime).toBeGreaterThan(
            Date.now(),
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should allow requests after window reset even if previously at limit', (done) => {
      jest.useFakeTimers();

      // Reach limit
      for (let i = 0; i < 100; i++) {
        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );
        result$.subscribe({ next: () => {}, error: () => {} });
      }

      // Verify at limit
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      result$.subscribe({
        next: () => done.fail('Should be at limit'),
        error: () => {
          // Advance time past reset
          jest.advanceTimersByTime(16 * 60 * 1000);

          // Should allow new request
          const result2$ = interceptor.intercept(
            mockExecutionContext,
            mockCallHandler,
          );
          result2$.subscribe({
            next: (data) => {
              expect(data).toEqual({ success: true });
              const requests = (interceptor as any).requests;
              expect(requests.get('192.168.1.1').count).toBe(1);
              done();
            },
            error: done.fail,
          });
        },
      });
    });

    it('should create new reset time after window expires', (done) => {
      jest.useFakeTimers();
      const initialTime = Date.now();

      // First request
      const result1$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      result1$.subscribe({ next: () => {}, error: () => {} });

      const requests = (interceptor as any).requests;
      const firstResetTime = requests.get('192.168.1.1').resetTime;

      // Advance time
      jest.advanceTimersByTime(16 * 60 * 1000);

      // New request after reset
      const result2$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      result2$.subscribe({
        next: () => {
          const newResetTime = requests.get('192.168.1.1').resetTime;
          expect(newResetTime).toBeGreaterThan(firstResetTime);
          expect(newResetTime).toBeGreaterThan(Date.now());
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('intercept - Multiple clients', () => {
    it('should track different clients independently', (done) => {
      const client1 = '192.168.1.1';
      const client2 = '192.168.1.2';

      mockRequest.ip = client1;
      const result1$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result1$.subscribe({
        next: () => {
          mockRequest.ip = client2;
          const result2$ = interceptor.intercept(
            mockExecutionContext,
            mockCallHandler,
          );

          result2$.subscribe({
            next: () => {
              const requests = (interceptor as any).requests;
              expect(requests.get(client1).count).toBe(1);
              expect(requests.get(client2).count).toBe(1);
              done();
            },
            error: done.fail,
          });
        },
        error: done.fail,
      });
    });

    it('should not affect other clients when one reaches limit', (done) => {
      const client1 = '192.168.1.1';
      const client2 = '192.168.1.2';

      // Client 1 reaches limit
      mockRequest.ip = client1;
      for (let i = 0; i < 100; i++) {
        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );
        result$.subscribe({ next: () => {}, error: () => {} });
      }

      // Client 1 should be blocked
      const result1$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      result1$.subscribe({
        next: () => done.fail('Client 1 should be blocked'),
        error: () => {
          // Client 2 should still be allowed
          mockRequest.ip = client2;
          const result2$ = interceptor.intercept(
            mockExecutionContext,
            mockCallHandler,
          );

          result2$.subscribe({
            next: (data) => {
              expect(data).toEqual({ success: true });
              done();
            },
            error: done.fail,
          });
        },
      });
    });

    it('should maintain separate counters for each client', (done) => {
      mockRequest.ip = '192.168.1.1';
      for (let i = 0; i < 5; i++) {
        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );
        result$.subscribe({ next: () => {}, error: () => {} });
      }

      mockRequest.ip = '192.168.1.2';
      for (let i = 0; i < 10; i++) {
        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );
        result$.subscribe({ next: () => {}, error: () => {} });
      }

      const requests = (interceptor as any).requests;
      expect(requests.get('192.168.1.1').count).toBe(5);
      expect(requests.get('192.168.1.2').count).toBe(10);
      done();
    });
  });

  describe('intercept - Unknown client IP', () => {
    it('should use "unknown" for missing IP', (done) => {
      mockRequest.ip = undefined;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          const requests = (interceptor as any).requests;
          expect(requests.has('unknown')).toBe(true);
          expect(requests.get('unknown').count).toBe(1);
          done();
        },
        error: done.fail,
      });
    });

    it('should use "unknown" for null IP', (done) => {
      mockRequest.ip = null;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          const requests = (interceptor as any).requests;
          expect(requests.has('unknown')).toBe(true);
          done();
        },
        error: done.fail,
      });
    });

    it('should use "unknown" for empty string IP', (done) => {
      mockRequest.ip = '';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          const requests = (interceptor as any).requests;
          expect(requests.has('unknown')).toBe(true);
          done();
        },
        error: done.fail,
      });
    });

    it('should track all unknown clients together', (done) => {
      mockRequest.ip = undefined;
      const result1$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      result1$.subscribe({ next: () => {}, error: () => {} });

      mockRequest.ip = null;
      const result2$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      result2$.subscribe({ next: () => {}, error: () => {} });

      mockRequest.ip = '';
      const result3$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      result3$.subscribe({
        next: () => {
          const requests = (interceptor as any).requests;
          expect(requests.get('unknown').count).toBe(3);
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('intercept - Edge cases', () => {
    it('should handle IPv6 addresses', (done) => {
      mockRequest.ip = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          const requests = (interceptor as any).requests;
          expect(requests.has('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(
            true,
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should handle localhost IP', (done) => {
      mockRequest.ip = '127.0.0.1';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          const requests = (interceptor as any).requests;
          expect(requests.has('127.0.0.1')).toBe(true);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle ::1 (IPv6 localhost)', (done) => {
      mockRequest.ip = '::1';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          const requests = (interceptor as any).requests;
          expect(requests.has('::1')).toBe(true);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle IP with port number', (done) => {
      mockRequest.ip = '192.168.1.1:8080';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          const requests = (interceptor as any).requests;
          expect(requests.has('192.168.1.1:8080')).toBe(true);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle very long IP string', (done) => {
      const longIp = 'a'.repeat(1000);
      mockRequest.ip = longIp;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          const requests = (interceptor as any).requests;
          expect(requests.has(longIp)).toBe(true);
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('intercept - Window timing edge cases', () => {
    it('should reset exactly when window expires', (done) => {
      jest.useFakeTimers();

      const result1$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      result1$.subscribe({ next: () => {}, error: () => {} });

      const requests = (interceptor as any).requests;
      const resetTime = requests.get('192.168.1.1').resetTime;

      // Advance to exactly reset time
      jest.setSystemTime(resetTime);

      const result2$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      result2$.subscribe({
        next: () => {
          // At exactly reset time, should still be in same window (not >)
          expect(requests.get('192.168.1.1').count).toBe(2);
          done();
        },
        error: done.fail,
      });
    });

    it('should reset 1ms after window expires', (done) => {
      jest.useFakeTimers();

      const result1$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      result1$.subscribe({ next: () => {}, error: () => {} });

      const requests = (interceptor as any).requests;
      const resetTime = requests.get('192.168.1.1').resetTime;

      // Advance to 1ms after reset time
      jest.setSystemTime(resetTime + 1);

      const result2$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      result2$.subscribe({
        next: () => {
          // Should be new window
          expect(requests.get('192.168.1.1').count).toBe(1);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle requests at exact limit boundary', (done) => {
      // Make exactly 99 requests
      for (let i = 0; i < 99; i++) {
        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );
        result$.subscribe({ next: () => {}, error: () => {} });
      }

      // 100th request should succeed
      const result100$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      result100$.subscribe({
        next: (data) => {
          expect(data).toEqual({ success: true });

          // 101st should fail
          const result101$ = interceptor.intercept(
            mockExecutionContext,
            mockCallHandler,
          );
          result101$.subscribe({
            next: () => done.fail('Should have been blocked'),
            error: (error) => {
              expect(error.message).toBe('Rate limit exceeded');
              done();
            },
          });
        },
        error: done.fail,
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should handle realistic usage pattern', (done) => {
      jest.useFakeTimers();
      let successCount = 0;
      let errorCount = 0;

      // Simulate 150 requests over time
      for (let i = 0; i < 150; i++) {
        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );
        result$.subscribe({
          next: () => successCount++,
          error: () => errorCount++,
        });

        // Advance time slightly between requests
        jest.advanceTimersByTime(100);
      }

      expect(successCount).toBe(100);
      expect(errorCount).toBe(50);
      done();
    });

    it('should handle burst traffic followed by normal traffic', (done) => {
      jest.useFakeTimers();

      // Burst: 50 requests immediately
      for (let i = 0; i < 50; i++) {
        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );
        result$.subscribe({ next: () => {}, error: () => {} });
      }

      const requests = (interceptor as any).requests;
      expect(requests.get('192.168.1.1').count).toBe(50);

      // Continue with 50 more (should all succeed)
      for (let i = 0; i < 50; i++) {
        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );
        result$.subscribe({ next: () => {}, error: () => {} });
        jest.advanceTimersByTime(1000);
      }

      expect(requests.get('192.168.1.1').count).toBe(100);

      // Next request should fail
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      result$.subscribe({
        next: () => done.fail('Should be blocked'),
        error: (error) => {
          expect(error.message).toBe('Rate limit exceeded');
          done();
        },
      });
    });

    it('should handle mixed clients with different usage patterns', (done) => {
      // Client 1: heavy user
      mockRequest.ip = '192.168.1.1';
      for (let i = 0; i < 100; i++) {
        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );
        result$.subscribe({ next: () => {}, error: () => {} });
      }

      // Client 2: light user
      mockRequest.ip = '192.168.1.2';
      for (let i = 0; i < 10; i++) {
        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );
        result$.subscribe({ next: () => {}, error: () => {} });
      }

      // Client 3: medium user
      mockRequest.ip = '192.168.1.3';
      for (let i = 0; i < 50; i++) {
        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );
        result$.subscribe({ next: () => {}, error: () => {} });
      }

      const requests = (interceptor as any).requests;
      expect(requests.get('192.168.1.1').count).toBe(100);
      expect(requests.get('192.168.1.2').count).toBe(10);
      expect(requests.get('192.168.1.3').count).toBe(50);

      // Verify client 1 is blocked but others aren't
      mockRequest.ip = '192.168.1.1';
      const result1$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      result1$.subscribe({
        next: () => done.fail('Client 1 should be blocked'),
        error: () => {
          mockRequest.ip = '192.168.1.2';
          const result2$ = interceptor.intercept(
            mockExecutionContext,
            mockCallHandler,
          );
          result2$.subscribe({
            next: (data) => {
              expect(data).toEqual({ success: true });
              done();
            },
            error: done.fail,
          });
        },
      });
    });
  });

  describe('Memory and performance', () => {
    it('should maintain request map in memory', (done) => {
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          const requests = (interceptor as any).requests;
          expect(requests).toBeInstanceOf(Map);
          expect(requests.size).toBe(1);
          done();
        },
        error: done.fail,
      });
    });

    it('should grow map with multiple clients', (done) => {
      for (let i = 1; i <= 10; i++) {
        mockRequest.ip = `192.168.1.${i}`;
        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );
        result$.subscribe({ next: () => {}, error: () => {} });
      }

      const requests = (interceptor as any).requests;
      expect(requests.size).toBe(10);
      done();
    });

    it('should keep expired entries in map (no cleanup)', (done) => {
      jest.useFakeTimers();

      // Add client 1
      mockRequest.ip = '192.168.1.1';
      const result1$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      result1$.subscribe({ next: () => {}, error: () => {} });

      // Advance time to expire
      jest.advanceTimersByTime(16 * 60 * 1000);

      // Add client 2
      mockRequest.ip = '192.168.1.2';
      const result2$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      result2$.subscribe({
        next: () => {
          const requests = (interceptor as any).requests;
          // Both entries still in map (no automatic cleanup)
          expect(requests.size).toBe(2);
          done();
        },
        error: done.fail,
      });
    });
  });
});
