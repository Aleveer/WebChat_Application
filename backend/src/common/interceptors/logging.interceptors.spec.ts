import { LoggingInterceptor } from './logging.interceptors';
import { ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { Test, TestingModule } from '@nestjs/testing';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: any;
  let mockResponse: any;
  let loggerLogMock: jest.SpyInstance;
  let loggerErrorMock: jest.SpyInstance;

  beforeEach(async () => {
    interceptor = new LoggingInterceptor();

    mockRequest = {
      method: 'GET',
      url: '/api/users',
      ip: '192.168.1.1',
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    };

    mockResponse = {
      statusCode: 200,
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

    loggerLogMock = jest
      .spyOn((interceptor as any)['logger'] as Logger, 'log')
      .mockImplementation();
    loggerErrorMock = jest
      .spyOn((interceptor as any)['logger'] as Logger, 'error')
      .mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('intercept - Incoming request logging', () => {
    it('should log incoming request with method, url, ip, and user-agent', (done) => {
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            'Incoming Request: GET /api/users - 192.168.1.1 - Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log incoming request before calling handler', (done) => {
      const handleSpy = jest.spyOn(mockCallHandler, 'handle');

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Logger should be called immediately, before subscribing
      expect(loggerLogMock).toHaveBeenCalledWith(
        expect.stringContaining('Incoming Request:'),
      );

      result$.subscribe({
        next: () => {
          expect(handleSpy).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should log POST request correctly', (done) => {
      mockRequest.method = 'POST';
      mockRequest.url = '/api/users';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('Incoming Request: POST /api/users'),
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log PUT request correctly', (done) => {
      mockRequest.method = 'PUT';
      mockRequest.url = '/api/users/1';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('Incoming Request: PUT /api/users/1'),
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log DELETE request correctly', (done) => {
      mockRequest.method = 'DELETE';
      mockRequest.url = '/api/users/1';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('Incoming Request: DELETE /api/users/1'),
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log PATCH request correctly', (done) => {
      mockRequest.method = 'PATCH';
      mockRequest.url = '/api/users/1';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('Incoming Request: PATCH /api/users/1'),
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should use empty string when user-agent is missing', (done) => {
      mockRequest.headers = {};

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            'Incoming Request: GET /api/users - 192.168.1.1 - ',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should handle undefined user-agent', (done) => {
      mockRequest.headers['user-agent'] = undefined;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            'Incoming Request: GET /api/users - 192.168.1.1 - ',
          );
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('intercept - Outgoing response logging', () => {
    it('should log outgoing response with method, url, statusCode, and duration', (done) => {
      jest.useFakeTimers();
      mockResponse.statusCode = 200;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(150);

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            'Outgoing Response: GET /api/users - 200 - 150ms',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log 201 status code for created resource', (done) => {
      jest.useFakeTimers();
      mockResponse.statusCode = 201;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(100);

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('- 201 -'),
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log 204 status code for no content', (done) => {
      jest.useFakeTimers();
      mockResponse.statusCode = 204;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(50);

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('- 204 -'),
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log 304 status code for not modified', (done) => {
      jest.useFakeTimers();
      mockResponse.statusCode = 304;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(20);

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('- 304 -'),
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should calculate duration correctly', (done) => {
      jest.useFakeTimers();

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(500);

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('500ms'),
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log both incoming and outgoing messages', (done) => {
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledTimes(2);
          expect(loggerLogMock).toHaveBeenNthCalledWith(
            1,
            expect.stringContaining('Incoming Request:'),
          );
          expect(loggerLogMock).toHaveBeenNthCalledWith(
            2,
            expect.stringContaining('Outgoing Response:'),
          );
          done();
        },
        error: done.fail,
      });
    });

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
  });

  describe('intercept - Error handling', () => {
    it('should log error with method, url, status, duration, and message', (done) => {
      jest.useFakeTimers();
      const error = { status: 400, message: 'Bad Request' };
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => error));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(100);

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (err) => {
          expect(loggerErrorMock).toHaveBeenCalledWith(
            'Request Error: GET /api/users - 400 - 100ms - Bad Request',
          );
          expect(err).toBe(error);
          done();
        },
      });
    });

    it('should use 500 status code when error.status is missing', (done) => {
      jest.useFakeTimers();
      const error = { message: 'Internal Server Error' };
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => error));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(200);

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: () => {
          expect(loggerErrorMock).toHaveBeenCalledWith(
            'Request Error: GET /api/users - 500 - 200ms - Internal Server Error',
          );
          done();
        },
      });
    });

    it('should log 404 error correctly', (done) => {
      jest.useFakeTimers();
      const error = { status: 404, message: 'Not Found' };
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => error));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(50);

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: () => {
          expect(loggerErrorMock).toHaveBeenCalledWith(
            expect.stringContaining('- 404 -'),
          );
          expect(loggerErrorMock).toHaveBeenCalledWith(
            expect.stringContaining('Not Found'),
          );
          done();
        },
      });
    });

    it('should log 401 error correctly', (done) => {
      jest.useFakeTimers();
      const error = { status: 401, message: 'Unauthorized' };
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => error));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(30);

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: () => {
          expect(loggerErrorMock).toHaveBeenCalledWith(
            expect.stringContaining('- 401 -'),
          );
          done();
        },
      });
    });

    it('should log 403 error correctly', (done) => {
      jest.useFakeTimers();
      const error = { status: 403, message: 'Forbidden' };
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => error));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(40);

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: () => {
          expect(loggerErrorMock).toHaveBeenCalledWith(
            expect.stringContaining('- 403 -'),
          );
          done();
        },
      });
    });

    it('should log 422 error correctly', (done) => {
      jest.useFakeTimers();
      const error = { status: 422, message: 'Unprocessable Entity' };
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => error));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(60);

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: () => {
          expect(loggerErrorMock).toHaveBeenCalledWith(
            expect.stringContaining('- 422 -'),
          );
          expect(loggerErrorMock).toHaveBeenCalledWith(
            expect.stringContaining('Unprocessable Entity'),
          );
          done();
        },
      });
    });

    it('should log 500 error correctly', (done) => {
      jest.useFakeTimers();
      const error = { status: 500, message: 'Internal Server Error' };
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => error));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(150);

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: () => {
          expect(loggerErrorMock).toHaveBeenCalledWith(
            expect.stringContaining('- 500 -'),
          );
          done();
        },
      });
    });

    it('should log 503 error correctly', (done) => {
      jest.useFakeTimers();
      const error = { status: 503, message: 'Service Unavailable' };
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => error));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(80);

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: () => {
          expect(loggerErrorMock).toHaveBeenCalledWith(
            expect.stringContaining('- 503 -'),
          );
          done();
        },
      });
    });

    it('should propagate error after logging', (done) => {
      const error = { status: 400, message: 'Bad Request' };
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
          expect(err.status).toBe(400);
          expect(err.message).toBe('Bad Request');
          done();
        },
      });
    });

    it('should log incoming request even if error occurs', (done) => {
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
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('Incoming Request:'),
          );
          done();
        },
      });
    });

    it('should calculate error duration correctly', (done) => {
      jest.useFakeTimers();
      const error = { status: 500, message: 'Error' };
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => error));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(250);

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: () => {
          expect(loggerErrorMock).toHaveBeenCalledWith(
            expect.stringContaining('250ms'),
          );
          done();
        },
      });
    });
  });

  describe('intercept - Different IP addresses', () => {
    it('should log IPv4 address', (done) => {
      mockRequest.ip = '192.168.1.100';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('192.168.1.100'),
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log IPv6 address', (done) => {
      mockRequest.ip = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('2001:0db8:85a3:0000:0000:8a2e:0370:7334'),
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log localhost IPv4', (done) => {
      mockRequest.ip = '127.0.0.1';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('127.0.0.1'),
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log localhost IPv6', (done) => {
      mockRequest.ip = '::1';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('::1'),
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should handle undefined IP', (done) => {
      mockRequest.ip = undefined;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('undefined'),
          );
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('intercept - Different URLs', () => {
    it('should log URL with query parameters', (done) => {
      mockRequest.url = '/api/users?page=1&limit=10';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('/api/users?page=1&limit=10'),
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log URL with path parameters', (done) => {
      mockRequest.url = '/api/users/123/posts/456';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('/api/users/123/posts/456'),
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log root URL', (done) => {
      mockRequest.url = '/';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('GET /'),
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log URL with special characters', (done) => {
      mockRequest.url = '/api/search?q=hello%20world&filter=active';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining(
              '/api/search?q=hello%20world&filter=active',
            ),
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log very long URL', (done) => {
      const longUrl = '/api/' + 'a'.repeat(500);
      mockRequest.url = longUrl;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining(longUrl),
          );
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('intercept - Different User-Agents', () => {
    it('should log Chrome user-agent', (done) => {
      mockRequest.headers['user-agent'] =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('Chrome/120.0.0.0'),
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log Firefox user-agent', (done) => {
      mockRequest.headers['user-agent'] =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('Firefox/121.0'),
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log Safari user-agent', (done) => {
      mockRequest.headers['user-agent'] =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('Safari/605.1.15'),
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log mobile user-agent', (done) => {
      mockRequest.headers['user-agent'] =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('iPhone'),
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log Postman user-agent', (done) => {
      mockRequest.headers['user-agent'] = 'PostmanRuntime/7.35.0';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('PostmanRuntime/7.35.0'),
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log cURL user-agent', (done) => {
      mockRequest.headers['user-agent'] = 'curl/7.68.0';

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('curl/7.68.0'),
          );
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('intercept - Timing scenarios', () => {
    it('should log fast request (< 100ms)', (done) => {
      jest.useFakeTimers();

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(50);

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('50ms'),
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log moderate request (100-1000ms)', (done) => {
      jest.useFakeTimers();

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(500);

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('500ms'),
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log slow request (> 1000ms)', (done) => {
      jest.useFakeTimers();

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(2500);

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('2500ms'),
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log instant request (0ms)', (done) => {
      jest.useFakeTimers();

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('0ms'),
          );
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should log complete successful request flow', (done) => {
      jest.useFakeTimers();
      mockRequest.method = 'POST';
      mockRequest.url = '/api/users';
      mockRequest.ip = '10.0.0.5';
      mockRequest.headers['user-agent'] = 'Chrome/120.0.0.0';
      mockResponse.statusCode = 201;

      const responseData = { id: 1, username: 'john_doe' };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(180);

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual(responseData);
          expect(loggerLogMock).toHaveBeenCalledTimes(2);
          expect(loggerLogMock).toHaveBeenNthCalledWith(
            1,
            'Incoming Request: POST /api/users - 10.0.0.5 - Chrome/120.0.0.0',
          );
          expect(loggerLogMock).toHaveBeenNthCalledWith(
            2,
            'Outgoing Response: POST /api/users - 201 - 180ms',
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log complete error request flow', (done) => {
      jest.useFakeTimers();
      mockRequest.method = 'GET';
      mockRequest.url = '/api/users/999';
      mockRequest.ip = '192.168.1.50';
      mockRequest.headers['user-agent'] = 'PostmanRuntime/7.35.0';

      const error = { status: 404, message: 'User not found' };
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => error));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(75);

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (err) => {
          expect(err).toBe(error);
          expect(loggerLogMock).toHaveBeenCalledWith(
            'Incoming Request: GET /api/users/999 - 192.168.1.50 - PostmanRuntime/7.35.0',
          );
          expect(loggerErrorMock).toHaveBeenCalledWith(
            'Request Error: GET /api/users/999 - 404 - 75ms - User not found',
          );
          done();
        },
      });
    });

    it('should log file upload request', (done) => {
      jest.useFakeTimers();
      mockRequest.method = 'POST';
      mockRequest.url = '/api/files/upload';
      mockResponse.statusCode = 200;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(3000);

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('POST /api/files/upload'),
          );
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('3000ms'),
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log authentication request', (done) => {
      jest.useFakeTimers();
      mockRequest.method = 'POST';
      mockRequest.url = '/api/auth/login';
      mockResponse.statusCode = 200;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(120);

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('POST /api/auth/login'),
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should log health check request', (done) => {
      mockRequest.method = 'GET';
      mockRequest.url = '/health';
      mockResponse.statusCode = 200;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(loggerLogMock).toHaveBeenCalledWith(
            expect.stringContaining('GET /health'),
          );
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('Logger instance', () => {
    it('should have logger with correct name', () => {
      const logger = (interceptor as any)['logger'];
      expect(logger).toBeInstanceOf(Logger);
      expect(logger.context).toBe('LoggingInterceptor');
    });

    it('should use log level for incoming/outgoing requests', (done) => {
      const logSpy = jest.spyOn((interceptor as any)['logger'], 'log');

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(logSpy).toHaveBeenCalledTimes(2);
          done();
        },
        error: done.fail,
      });
    });

    it('should use error level for errors', (done) => {
      const errorSpy = jest.spyOn((interceptor as any)['logger'], 'error');
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
          expect(errorSpy).toHaveBeenCalledTimes(1);
          done();
        },
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle error without message', (done) => {
      jest.useFakeTimers();
      const error = { status: 500 };
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => error));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(100);

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: () => {
          expect(loggerErrorMock).toHaveBeenCalledWith(
            expect.stringContaining('- undefined'),
          );
          done();
        },
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
          expect(loggerLogMock).toHaveBeenCalled();
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
          expect(loggerLogMock).toHaveBeenCalled();
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
          expect(loggerLogMock).toHaveBeenCalled();
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
          expect(loggerLogMock).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should handle error as string', (done) => {
      const error = 'String error';
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
          expect(err).toBe('String error');
          expect(loggerErrorMock).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should handle 0 status code as 500', (done) => {
      jest.useFakeTimers();
      const error = { status: 0, message: 'Network error' };
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => error));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      jest.advanceTimersByTime(100);

      result$.subscribe({
        next: () => done.fail('Should have thrown error'),
        error: () => {
          // status: 0 is falsy, so error.status || 500 returns 500
          expect(loggerErrorMock).toHaveBeenCalledWith(
            expect.stringContaining('- 500 -'),
          );
          done();
        },
      });
    });
  });
});
