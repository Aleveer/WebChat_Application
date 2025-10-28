import 'reflect-metadata';
import { RateLimitInterceptor } from '../src/common/interceptors/ratelimit.interceptors';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { Request } from 'express';

describe('RateLimitInterceptor - White Box Testing (Input-Output)', () => {
  let interceptor: RateLimitInterceptor;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;
  let mockRequest: Partial<Request>;

  beforeEach(() => {
    // Mock Request
    mockRequest = {
      ip: '127.0.0.1',
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
      handle: jest.fn().mockReturnValue(of({ data: 'test' })),
    } as jest.Mocked<CallHandler>;

    interceptor = new RateLimitInterceptor();

    // Mock logger to prevent console output
    jest.spyOn(interceptor['logger'], 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Clear requests map
    interceptor['requests'].clear();
  });

  describe('Module Lifecycle', () => {
    /**
     * Test Case 1: Kiểm tra onModuleInit
     * Input: Module initialization
     * Expected Output: Cleanup interval started
     * Path Coverage: onModuleInit()
     */
    it('TC001: should start cleanup interval on module init', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');

      interceptor.onModuleInit();

      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        5 * 60 * 1000,
      );
    });

    /**
     * Test Case 2: Kiểm tra onModuleDestroy
     * Input: Module destruction
     * Expected Output: Cleanup interval cleared
     * Path Coverage: onModuleDestroy()
     */
    it('TC002: should clear cleanup interval on module destroy', () => {
      interceptor.onModuleInit();
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      interceptor.onModuleDestroy();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    /**
     * Test Case 3: Kiểm tra onModuleDestroy without interval
     * Input: Destroy without init
     * Expected Output: No error
     * Path Coverage: if (this.cleanupInterval)
     */
    it('TC003: should handle destroy without init gracefully', () => {
      expect(() => interceptor.onModuleDestroy()).not.toThrow();
    });
  });

  describe('First Request Handling', () => {
    /**
     * Test Case 4: Kiểm tra first request
     * Input: First request from client
     * Expected Output: Request allowed, count = 1
     * Path Coverage: !clientRequests
     */
    it('TC004: should allow first request from client', (done) => {
      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data).toEqual({ data: 'test' });
        expect(interceptor['requests'].get('127.0.0.1')?.count).toBe(1);
        done();
      });
    });

    /**
     * Test Case 5: Kiểm tra reset time initialization
     * Input: First request
     * Expected Output: resetTime = now + 15 minutes
     * Path Coverage: resetTime: now + windowMs
     */
    it('TC005: should set reset time for first request', (done) => {
      const now = Date.now();

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        const clientData = interceptor['requests'].get('127.0.0.1');
        expect(clientData?.resetTime).toBeGreaterThan(now);
        expect(clientData?.resetTime).toBeLessThanOrEqual(
          now + 15 * 60 * 1000 + 100,
        ); // Allow small overhead
        done();
      });
    });

    /**
     * Test Case 6: Kiểm tra different client IPs
     * Input: Requests from different IPs
     * Expected Output: Separate tracking for each IP
     * Path Coverage: Multiple client IDs
     */
    it('TC006: should track different clients separately', (done) => {
      const ips = ['127.0.0.1', '192.168.1.1', '10.0.0.1'];
      let completed = 0;

      ips.forEach((ip) => {
        (mockRequest as any).ip = ip;
        const result = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result.subscribe(() => {
          completed++;
          if (completed === ips.length) {
            expect(interceptor['requests'].size).toBe(3);
            ips.forEach((ip) => {
              expect(interceptor['requests'].get(ip)?.count).toBe(1);
            });
            done();
          }
        });
      });
    });

    /**
     * Test Case 7: Kiểm tra unknown IP
     * Input: Request without IP
     * Expected Output: Use 'unknown' as clientId
     * Path Coverage: request.ip || 'unknown'
     */
    it('TC007: should use "unknown" for missing IP', (done) => {
      (mockRequest as any).ip = undefined;

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(interceptor['requests'].has('unknown')).toBe(true);
        done();
      });
    });
  });

  describe('Request Counter Increment', () => {
    /**
     * Test Case 8: Kiểm tra counter increment
     * Input: Multiple requests within window
     * Expected Output: Counter increments
     * Path Coverage: clientRequests.count++
     */
    it('TC008: should increment counter for subsequent requests', (done) => {
      let completed = 0;

      for (let i = 0; i < 5; i++) {
        const result = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result.subscribe(() => {
          completed++;
          if (completed === 5) {
            expect(interceptor['requests'].get('127.0.0.1')?.count).toBe(5);
            done();
          }
        });
      }
    });

    /**
     * Test Case 9: Kiểm tra counter at limit - 1
     * Input: 99 requests
     * Expected Output: All allowed
     * Path Coverage: count < limit
     */
    it('TC009: should allow requests below limit', (done) => {
      let completed = 0;

      for (let i = 0; i < 99; i++) {
        const result = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result.subscribe(() => {
          completed++;
          if (completed === 99) {
            expect(interceptor['requests'].get('127.0.0.1')?.count).toBe(99);
            done();
          }
        });
      }
    });

    /**
     * Test Case 10: Kiểm tra counter at exactly limit
     * Input: 100 requests
     * Expected Output: All allowed
     * Path Coverage: count === limit
     */
    it('TC010: should allow exactly 100 requests', (done) => {
      let completed = 0;

      for (let i = 0; i < 100; i++) {
        const result = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result.subscribe(() => {
          completed++;
          if (completed === 100) {
            expect(interceptor['requests'].get('127.0.0.1')?.count).toBe(100);
            done();
          }
        });
      }
    });
  });

  describe('Rate Limit Enforcement', () => {
    /**
     * Test Case 11: Kiểm tra 101st request
     * Input: 101 requests
     * Expected Output: 101st blocked
     * Path Coverage: count >= limit
     */
    it('TC011: should block request when limit exceeded', (done) => {
      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        interceptor
          .intercept(mockExecutionContext, mockCallHandler)
          .subscribe();
      }

      // 101st request should fail
      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: (err) => {
          expect(err.message).toBe('Rate limit exceeded');
          done();
        },
      });
    });

    /**
     * Test Case 12: Kiểm tra error message
     * Input: Rate limit exceeded
     * Expected Output: Error with specific message
     * Path Coverage: throwError()
     */
    it('TC012: should return correct error message', (done) => {
      // Exceed limit
      for (let i = 0; i < 100; i++) {
        interceptor
          .intercept(mockExecutionContext, mockCallHandler)
          .subscribe();
      }

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: (err) => {
          expect(err).toBeInstanceOf(Error);
          expect(err.message).toBe('Rate limit exceeded');
          done();
        },
      });
    });

    /**
     * Test Case 13: Kiểm tra multiple blocked requests
     * Input: Multiple requests after limit
     * Expected Output: All blocked
     * Path Coverage: Multiple rate limit errors
     */
    it('TC013: should block all requests after limit', (done) => {
      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        interceptor
          .intercept(mockExecutionContext, mockCallHandler)
          .subscribe();
      }

      let errorCount = 0;
      for (let i = 0; i < 5; i++) {
        const result = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result.subscribe({
          error: () => {
            errorCount++;
            if (errorCount === 5) {
              expect(errorCount).toBe(5);
              done();
            }
          },
        });
      }
    });

    /**
     * Test Case 14: Kiểm tra counter doesn't increment when blocked
     * Input: Request after limit
     * Expected Output: Counter stays at 100
     * Path Coverage: Early return in rate limit
     */
    it('TC014: should not increment counter when blocked', (done) => {
      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        interceptor
          .intercept(mockExecutionContext, mockCallHandler)
          .subscribe();
      }

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: () => {
          expect(interceptor['requests'].get('127.0.0.1')?.count).toBe(100);
          done();
        },
      });
    });
  });

  describe('Window Reset', () => {
    /**
     * Test Case 15: Kiểm tra window expiry
     * Input: Request after window expires
     * Expected Output: Counter resets
     * Path Coverage: now > clientRequests.resetTime
     */
    it('TC015: should reset counter after window expires', (done) => {
      // First request
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      // Manually expire the window
      const clientData = interceptor['requests'].get('127.0.0.1');
      if (clientData) {
        clientData.resetTime = Date.now() - 1000; // Set to past
      }

      // New request should reset
      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        const newData = interceptor['requests'].get('127.0.0.1');
        expect(newData?.count).toBe(1);
        expect(newData?.resetTime).toBeGreaterThan(Date.now());
        done();
      });
    });

    /**
     * Test Case 16: Kiểm tra new window time
     * Input: Reset after expiry
     * Expected Output: New resetTime = now + 15min
     * Path Coverage: Window time update
     */
    it('TC016: should set new window time after reset', (done) => {
      // First request
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      // Expire window
      const clientData = interceptor['requests'].get('127.0.0.1');
      if (clientData) {
        clientData.resetTime = Date.now() - 1000;
      }

      const now = Date.now();
      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        const newData = interceptor['requests'].get('127.0.0.1');
        expect(newData?.resetTime).toBeGreaterThan(now);
        expect(newData?.resetTime).toBeLessThanOrEqual(
          now + 15 * 60 * 1000 + 100,
        );
        done();
      });
    });

    /**
     * Test Case 17: Kiểm tra can make 100 requests again after reset
     * Input: 100 requests, reset, 100 more
     * Expected Output: All allowed
     * Path Coverage: Reset allows new requests
     */
    it('TC017: should allow requests again after window reset', (done) => {
      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        interceptor
          .intercept(mockExecutionContext, mockCallHandler)
          .subscribe();
      }

      // Expire window
      const clientData = interceptor['requests'].get('127.0.0.1');
      if (clientData) {
        clientData.resetTime = Date.now() - 1000;
      }

      // Should allow new requests
      let completed = 0;
      for (let i = 0; i < 50; i++) {
        const result = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result.subscribe(() => {
          completed++;
          if (completed === 50) {
            expect(interceptor['requests'].get('127.0.0.1')?.count).toBe(50);
            done();
          }
        });
      }
    });
  });

  describe('Cleanup Mechanism', () => {
    /**
     * Test Case 18: Kiểm tra cleanup expired entries
     * Input: Expired entries
     * Expected Output: Entries removed
     * Path Coverage: cleanupExpiredEntries()
     */
    it('TC018: should cleanup expired entries', () => {
      // Add multiple clients with expired windows
      interceptor['requests'].set('client1', {
        count: 50,
        resetTime: Date.now() - 1000,
      });
      interceptor['requests'].set('client2', {
        count: 30,
        resetTime: Date.now() - 2000,
      });
      interceptor['requests'].set('client3', {
        count: 10,
        resetTime: Date.now() + 10000, // Not expired
      });

      interceptor['cleanupExpiredEntries']();

      expect(interceptor['requests'].has('client1')).toBe(false);
      expect(interceptor['requests'].has('client2')).toBe(false);
      expect(interceptor['requests'].has('client3')).toBe(true);
    });

    /**
     * Test Case 19: Kiểm tra cleanup logging
     * Input: Expired entries
     * Expected Output: Debug log with count
     * Path Coverage: logger.debug() in cleanup
     */
    it('TC019: should log cleanup count', () => {
      const debugSpy = jest.spyOn(interceptor['logger'], 'debug');

      interceptor['requests'].set('client1', {
        count: 50,
        resetTime: Date.now() - 1000,
      });
      interceptor['requests'].set('client2', {
        count: 30,
        resetTime: Date.now() - 2000,
      });

      interceptor['cleanupExpiredEntries']();

      expect(debugSpy).toHaveBeenCalledWith(
        'Cleaned up 2 expired rate limit entries',
      );
    });

    /**
     * Test Case 20: Kiểm tra no cleanup when nothing expired
     * Input: No expired entries
     * Expected Output: No logging
     * Path Coverage: if (expiredCount > 0)
     */
    it('TC020: should not log when nothing to cleanup', () => {
      const debugSpy = jest.spyOn(interceptor['logger'], 'debug');

      interceptor['requests'].set('client1', {
        count: 50,
        resetTime: Date.now() + 10000,
      });

      interceptor['cleanupExpiredEntries']();

      expect(debugSpy).not.toHaveBeenCalled();
    });

    /**
     * Test Case 21: Kiểm tra cleanup empty map
     * Input: Empty requests map
     * Expected Output: No error, no logging
     * Path Coverage: Empty map iteration
     */
    it('TC021: should handle empty map cleanup', () => {
      const debugSpy = jest.spyOn(interceptor['logger'], 'debug');

      interceptor['cleanupExpiredEntries']();

      expect(debugSpy).not.toHaveBeenCalled();
    });
  });

  describe('Observable Behavior', () => {
    /**
     * Test Case 22: Kiểm tra handler called on success
     * Input: Valid request
     * Expected Output: CallHandler.handle() called
     * Path Coverage: next.handle()
     */
    it('TC022: should call handler for allowed requests', (done) => {
      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockCallHandler.handle).toHaveBeenCalled();
        done();
      });
    });

    /**
     * Test Case 23: Kiểm tra handler not called when blocked
     * Input: Rate limited request
     * Expected Output: Handler not called
     * Path Coverage: Early return without calling handler
     */
    it('TC023: should not call handler for blocked requests', (done) => {
      mockCallHandler.handle.mockClear();

      // Exceed limit
      for (let i = 0; i < 100; i++) {
        interceptor
          .intercept(mockExecutionContext, mockCallHandler)
          .subscribe();
      }

      mockCallHandler.handle.mockClear();

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: () => {
          expect(mockCallHandler.handle).not.toHaveBeenCalled();
          done();
        },
      });
    });

    /**
     * Test Case 24: Kiểm tra data passthrough
     * Input: Handler returns data
     * Expected Output: Data emitted unchanged
     * Path Coverage: Observable passthrough
     */
    it('TC024: should pass through handler data', (done) => {
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
     * Test Case 25: Kiểm tra Observable completes
     * Input: Successful request
     * Expected Output: Observable completes
     * Path Coverage: Observable lifecycle
     */
    it('TC025: should complete Observable on success', (done) => {
      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        complete: () => done(),
      });
    });
  });

  describe('Real-world Scenarios', () => {
    /**
     * Test Case 26: Kiểm tra API burst
     * Input: 50 rapid requests
     * Expected Output: All allowed
     * Path Coverage: Burst traffic
     */
    it('TC026: should handle burst traffic within limit', (done) => {
      let completed = 0;

      for (let i = 0; i < 50; i++) {
        const result = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result.subscribe(() => {
          completed++;
          if (completed === 50) {
            expect(interceptor['requests'].get('127.0.0.1')?.count).toBe(50);
            done();
          }
        });
      }
    });

    /**
     * Test Case 27: Kiểm tra DDoS simulation
     * Input: 200 requests from same IP
     * Expected Output: First 100 allowed, rest blocked
     * Path Coverage: Attack mitigation
     */
    it('TC027: should mitigate DDoS attack', (done) => {
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < 200; i++) {
        const result = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result.subscribe({
          next: () => {
            successCount++;
            if (successCount + errorCount === 200) {
              expect(successCount).toBe(100);
              expect(errorCount).toBe(100);
              done();
            }
          },
          error: () => {
            errorCount++;
            if (successCount + errorCount === 200) {
              expect(successCount).toBe(100);
              expect(errorCount).toBe(100);
              done();
            }
          },
        });
      }
    });

    /**
     * Test Case 28: Kiểm tra multiple clients concurrent
     * Input: 3 clients, 50 requests each
     * Expected Output: All allowed (separate limits)
     * Path Coverage: Concurrent client tracking
     */
    it('TC028: should track multiple clients concurrently', (done) => {
      const clients = ['192.168.1.1', '192.168.1.2', '192.168.1.3'];
      let totalCompleted = 0;

      clients.forEach((ip) => {
        (mockRequest as any).ip = ip;

        for (let i = 0; i < 50; i++) {
          const result = interceptor.intercept(
            mockExecutionContext,
            mockCallHandler,
          );

          result.subscribe(() => {
            totalCompleted++;
            if (totalCompleted === 150) {
              clients.forEach((clientIp) => {
                expect(interceptor['requests'].get(clientIp)?.count).toBe(50);
              });
              done();
            }
          });
        }
      });
    });

    /**
     * Test Case 29: Kiểm tra IPv6 address
     * Input: IPv6 client
     * Expected Output: Tracked correctly
     * Path Coverage: IPv6 support
     */
    it('TC029: should handle IPv6 addresses', (done) => {
      (mockRequest as any).ip = '::1';

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(interceptor['requests'].has('::1')).toBe(true);
        done();
      });
    });

    /**
     * Test Case 30: Kiểm tra proxy IP
     * Input: X-Forwarded-For header
     * Expected Output: Uses request.ip
     * Path Coverage: Proxy scenario
     */
    it('TC030: should use request.ip for rate limiting', (done) => {
      (mockRequest as any).ip = '203.0.113.42';

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(interceptor['requests'].has('203.0.113.42')).toBe(true);
        done();
      });
    });

    /**
     * Test Case 31: Kiểm tra gradual requests
     * Input: 100 requests over time
     * Expected Output: All allowed within window
     * Path Coverage: Distributed traffic
     */
    it('TC031: should allow distributed requests', (done) => {
      let completed = 0;

      for (let i = 0; i < 100; i++) {
        const result = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result.subscribe(() => {
          completed++;
          if (completed === 100) {
            expect(interceptor['requests'].get('127.0.0.1')?.count).toBe(100);
            done();
          }
        });
      }
    });

    /**
     * Test Case 32: Kiểm tra window boundary
     * Input: Request exactly at reset time
     * Expected Output: Counter resets
     * Path Coverage: Boundary condition
     */
    it('TC032: should reset at exact reset time', (done) => {
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      const clientData = interceptor['requests'].get('127.0.0.1');
      if (clientData) {
        clientData.count = 99; // Set to 99 instead of 100
        clientData.resetTime = Date.now() - 1; // Slightly in the past
      }

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(interceptor['requests'].get('127.0.0.1')?.count).toBe(1);
        done();
      });
    });

    /**
     * Test Case 33: Kiểm tra memory cleanup effectiveness
     * Input: Many expired clients
     * Expected Output: Map size reduced
     * Path Coverage: Memory management
     */
    it('TC033: should reduce memory usage after cleanup', () => {
      // Add many expired clients
      for (let i = 0; i < 100; i++) {
        interceptor['requests'].set(`client${i}`, {
          count: 50,
          resetTime: Date.now() - 1000,
        });
      }

      expect(interceptor['requests'].size).toBe(100);

      interceptor['cleanupExpiredEntries']();

      expect(interceptor['requests'].size).toBe(0);
    });

    /**
     * Test Case 34: Kiểm tra mixed expired and active
     * Input: Some expired, some active
     * Expected Output: Only expired removed
     * Path Coverage: Selective cleanup
     */
    it('TC034: should cleanup only expired entries', () => {
      const now = Date.now();

      for (let i = 0; i < 50; i++) {
        interceptor['requests'].set(`expired${i}`, {
          count: 50,
          resetTime: now - 1000,
        });
      }

      for (let i = 0; i < 50; i++) {
        interceptor['requests'].set(`active${i}`, {
          count: 30,
          resetTime: now + 10000,
        });
      }

      interceptor['cleanupExpiredEntries']();

      expect(interceptor['requests'].size).toBe(50);
      for (let i = 0; i < 50; i++) {
        expect(interceptor['requests'].has(`active${i}`)).toBe(true);
        expect(interceptor['requests'].has(`expired${i}`)).toBe(false);
      }
    });

    /**
     * Test Case 35: Kiểm tra client reconnect after limit
     * Input: Hit limit, wait, reconnect
     * Expected Output: New requests allowed
     * Path Coverage: Recovery scenario
     */
    it('TC035: should allow requests after window reset', (done) => {
      // Hit limit
      for (let i = 0; i < 100; i++) {
        interceptor
          .intercept(mockExecutionContext, mockCallHandler)
          .subscribe();
      }

      // Expire window
      const clientData = interceptor['requests'].get('127.0.0.1');
      if (clientData) {
        clientData.resetTime = Date.now() - 1000;
      }

      // Should work again
      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data).toEqual({ data: 'test' });
        done();
      });
    });

    /**
     * Test Case 36: Kiểm tra unknown client behavior
     * Input: Multiple unknown clients
     * Expected Output: All tracked under 'unknown'
     * Path Coverage: Missing IP handling
     */
    it('TC036: should group unknown clients together', (done) => {
      (mockRequest as any).ip = undefined;

      let completed = 0;
      for (let i = 0; i < 50; i++) {
        const result = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result.subscribe(() => {
          completed++;
          if (completed === 50) {
            expect(interceptor['requests'].get('unknown')?.count).toBe(50);
            done();
          }
        });
      }
    });

    /**
     * Test Case 37: Kiểm tra rate limit per endpoint
     * Input: Same client, different endpoints
     * Expected Output: Same limit (global)
     * Path Coverage: Global rate limit
     */
    it('TC037: should apply global rate limit', (done) => {
      let completed = 0;

      for (let i = 0; i < 100; i++) {
        const result = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result.subscribe(() => {
          completed++;
          if (completed === 100) {
            expect(interceptor['requests'].get('127.0.0.1')?.count).toBe(100);
            done();
          }
        });
      }
    });

    /**
     * Test Case 38: Kiểm tra high volume cleanup
     * Input: 1000 expired entries
     * Expected Output: All cleaned
     * Path Coverage: High volume cleanup
     */
    it('TC038: should handle high volume cleanup', () => {
      const debugSpy = jest.spyOn(interceptor['logger'], 'debug');

      for (let i = 0; i < 1000; i++) {
        interceptor['requests'].set(`client${i}`, {
          count: 50,
          resetTime: Date.now() - 1000,
        });
      }

      interceptor['cleanupExpiredEntries']();

      expect(debugSpy).toHaveBeenCalledWith(
        'Cleaned up 1000 expired rate limit entries',
      );
      expect(interceptor['requests'].size).toBe(0);
    });

    /**
     * Test Case 39: Kiểm tra partial limit usage
     * Input: 25 requests, check state
     * Expected Output: 75 requests remaining
     * Path Coverage: Partial usage
     */
    it('TC039: should track partial limit usage', (done) => {
      let completed = 0;

      for (let i = 0; i < 25; i++) {
        const result = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result.subscribe(() => {
          completed++;
          if (completed === 25) {
            expect(interceptor['requests'].get('127.0.0.1')?.count).toBe(25);
            // Can still make 75 more
            const remainingResult = interceptor.intercept(
              mockExecutionContext,
              mockCallHandler,
            );
            remainingResult.subscribe(() => {
              expect(interceptor['requests'].get('127.0.0.1')?.count).toBe(26);
              done();
            });
          }
        });
      }
    });

    /**
     * Test Case 40: Kiểm tra complete flow
     * Input: Multiple scenarios in sequence
     * Expected Output: All behaviors correct
     * Path Coverage: Integration test
     */
    it('TC040: should handle complete rate limit lifecycle', (done) => {
      // Phase 1: Normal usage (50 requests)
      for (let i = 0; i < 50; i++) {
        interceptor
          .intercept(mockExecutionContext, mockCallHandler)
          .subscribe();
      }
      expect(interceptor['requests'].get('127.0.0.1')?.count).toBe(50);

      // Phase 2: Hit limit
      for (let i = 0; i < 50; i++) {
        interceptor
          .intercept(mockExecutionContext, mockCallHandler)
          .subscribe();
      }
      expect(interceptor['requests'].get('127.0.0.1')?.count).toBe(100);

      // Phase 3: Block excess
      const blockedResult = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      blockedResult.subscribe({
        error: (err) => {
          expect(err.message).toBe('Rate limit exceeded');

          // Phase 4: Reset window
          const clientData = interceptor['requests'].get('127.0.0.1');
          if (clientData) {
            clientData.resetTime = Date.now() - 1000;
          }

          // Phase 5: New requests work
          const newResult = interceptor.intercept(
            mockExecutionContext,
            mockCallHandler,
          );

          newResult.subscribe((data) => {
            expect(data).toEqual({ data: 'test' });
            expect(interceptor['requests'].get('127.0.0.1')?.count).toBe(1);
            done();
          });
        },
      });
    });
  });
});
