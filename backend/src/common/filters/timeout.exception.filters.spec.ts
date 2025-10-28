import { TimeoutExceptionFilter } from './timeout.exception.filters';
import { ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

describe('TimeoutExceptionFilter', () => {
  let filter: TimeoutExceptionFilter;
  let mockArgumentsHost: ArgumentsHost;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  let loggerWarnMock: jest.SpyInstance;

  beforeEach(() => {
    filter = new TimeoutExceptionFilter();
    // Mock logger
    loggerWarnMock = jest
      .spyOn((filter as any)['logger'] as Logger, 'warn')
      .mockImplementation();

    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn();

    mockRequest = {
      method: 'POST',
      url: '/api/test',
      requestId: 'test-request-id-123',
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

  describe('Timeout exception handling', () => {
    it('should handle timeout exception and return 408 with proper error response', () => {
      const exception = { message: 'Request timeout occurred' };

      filter.catch(exception, mockArgumentsHost);

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.REQUEST_TIMEOUT);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'REQUEST_TIMEOUT',
          message: 'Request timeout, please try again',
          path: '/api/test',
          method: 'POST',
          requestId: 'test-request-id-123',
        }),
      );
      expect(loggerWarnMock).toHaveBeenCalledWith(
        'Request Timeout: POST /api/test',
      );
    });

    it('should handle timeout exception with lowercase "timeout" in message', () => {
      const exception = { message: 'Connection timeout' };

      filter.catch(exception, mockArgumentsHost);

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.REQUEST_TIMEOUT);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'REQUEST_TIMEOUT',
          message: 'Request timeout, please try again',
        }),
      );
    });

    it('should handle timeout exception when requestId is undefined', () => {
      mockRequest.requestId = undefined;
      const exception = { message: 'Request timeout' };

      filter.catch(exception, mockArgumentsHost);

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.REQUEST_TIMEOUT);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'unknown',
        }),
      );
    });

    it('should handle timeout exception with different HTTP methods', () => {
      mockRequest.method = 'GET';
      mockRequest.url = '/api/users';
      const exception = { message: 'timeout exceeded' };

      filter.catch(exception, mockArgumentsHost);

      expect(loggerWarnMock).toHaveBeenCalledWith(
        'Request Timeout: GET /api/users',
      );
    });
  });

  describe('Non-timeout exception handling', () => {
    it('should re-throw exception if message does not contain "timeout"', () => {
      const exception = { message: 'Database connection error' };

      expect(() => filter.catch(exception, mockArgumentsHost)).toThrow(
        expect.objectContaining({ message: 'Database connection error' }),
      );

      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
      expect(loggerWarnMock).not.toHaveBeenCalled();
    });

    it('should re-throw exception if message is undefined', () => {
      const exception = { error: 'Some error' };

      expect(() => filter.catch(exception, mockArgumentsHost)).toThrow(
        expect.objectContaining({ error: 'Some error' }),
      );

      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('should re-throw exception if message is null', () => {
      const exception = { message: null };

      expect(() => filter.catch(exception, mockArgumentsHost)).toThrow(
        expect.objectContaining({ message: null }),
      );

      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('should re-throw exception if message is empty string', () => {
      const exception = { message: '' };

      expect(() => filter.catch(exception, mockArgumentsHost)).toThrow(
        expect.objectContaining({ message: '' }),
      );

      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('should re-throw exception with completely different error structure', () => {
      const exception = new Error('Unknown error');

      expect(() => filter.catch(exception, mockArgumentsHost)).toThrow(
        exception,
      );

      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle timeout in message with mixed case', () => {
      const exception = { message: 'TIMEOUT ERROR' };

      expect(() => filter.catch(exception, mockArgumentsHost)).toThrow();

      // "TIMEOUT" (uppercase) doesn't match "timeout" (lowercase) in includes() check
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should handle timeout exception with partial match in message', () => {
      const exception = { message: 'The request has timed out due to timeout' };

      filter.catch(exception, mockArgumentsHost);

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.REQUEST_TIMEOUT);
    });

    it('should verify timestamp format in error response', () => {
      const exception = { message: 'timeout occurred' };
      const beforeTime = new Date().toISOString();

      filter.catch(exception, mockArgumentsHost);

      const afterTime = new Date().toISOString();
      const callArgs = jsonMock.mock.calls[0][0];

      expect(callArgs.timestamp).toBeDefined();
      expect(callArgs.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
      expect(callArgs.timestamp >= beforeTime).toBe(true);
      expect(callArgs.timestamp <= afterTime).toBe(true);
    });
  });
});
