import { RateLimitExceptionFilter } from './ratelimit.exception.filters';
import { ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

describe('RateLimitExceptionFilter', () => {
  let filter: RateLimitExceptionFilter;
  let mockArgumentsHost: ArgumentsHost;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  let loggerWarnMock: jest.SpyInstance;

  beforeEach(() => {
    filter = new RateLimitExceptionFilter();
    // Mock logger
    loggerWarnMock = jest
      .spyOn((filter as any)['logger'] as Logger, 'warn')
      .mockImplementation();
    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn();
    mockRequest = {
      method: 'GET',
      url: '/test',
      ip: '127.0.0.1',
    };
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    } as any;
    mockArgumentsHost = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should handle rate limit exception and return 429', () => {
    const exception = { message: 'Rate limit exceeded' };
    filter.catch(exception, mockArgumentsHost);
    expect(statusMock).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
        retryAfter: 60,
      }),
    );
    expect(loggerWarnMock).toHaveBeenCalledWith(
      'Rate Limit Exceeded: GET /test - 127.0.0.1',
    );
  });

  it('should re-throw non-rate limit exceptions', () => {
    const exception = { message: 'Some other error' };
    expect(() => filter.catch(exception, mockArgumentsHost)).toThrow(
      expect.objectContaining({ message: 'Some other error' }),
    );
  });

  it('should re-throw if exception has no message', () => {
    const exception = { foo: 'bar' };
    expect(() => filter.catch(exception, mockArgumentsHost)).toThrow(
      expect.objectContaining({ foo: 'bar' }),
    );
  });
});
