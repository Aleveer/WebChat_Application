import 'reflect-metadata';
import { CompressionInterceptor } from '../src/common/interceptors/compression.interceptors';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { Response } from 'express';

describe('CompressionInterceptor - White Box Testing (Input-Output)', () => {
  let interceptor: CompressionInterceptor;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;
  let mockResponse: Partial<Response>;
  let mockSetHeader: jest.Mock;

  beforeEach(() => {
    // Mock Response
    mockSetHeader = jest.fn();
    mockResponse = {
      setHeader: mockSetHeader,
    };

    // Mock ExecutionContext
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
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
      handle: jest.fn(),
    } as jest.Mocked<CallHandler>;

    interceptor = new CompressionInterceptor();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Header Setting', () => {
    /**
     * Test Case 1: Kiểm tra Content-Encoding header được set
     * Input: Any request
     * Expected Output: Content-Encoding: gzip header set
     * Path Coverage: setHeader('Content-Encoding', 'gzip')
     */
    it('TC001: should set Content-Encoding header to gzip', () => {
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockSetHeader).toHaveBeenCalledWith('Content-Encoding', 'gzip');
    });

    /**
     * Test Case 2: Kiểm tra Vary header được set
     * Input: Any request
     * Expected Output: Vary: Accept-Encoding header set
     * Path Coverage: setHeader('Vary', 'Accept-Encoding')
     */
    it('TC002: should set Vary header to Accept-Encoding', () => {
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockSetHeader).toHaveBeenCalledWith('Vary', 'Accept-Encoding');
    });

    /**
     * Test Case 3: Kiểm tra cả hai headers được set
     * Input: Any request
     * Expected Output: Both headers set
     * Path Coverage: Complete header setting
     */
    it('TC003: should set both compression headers', () => {
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockSetHeader).toHaveBeenCalledTimes(2);
      expect(mockSetHeader).toHaveBeenNthCalledWith(
        1,
        'Content-Encoding',
        'gzip',
      );
      expect(mockSetHeader).toHaveBeenNthCalledWith(
        2,
        'Vary',
        'Accept-Encoding',
      );
    });

    /**
     * Test Case 4: Kiểm tra headers được set trước khi call handler
     * Input: Any request
     * Expected Output: Headers set before handler execution
     * Path Coverage: Order of execution
     */
    it('TC004: should set headers before calling handler', () => {
      const callOrder: string[] = [];

      mockSetHeader.mockImplementation((key) => {
        callOrder.push(`setHeader:${key}`);
      });

      mockCallHandler.handle.mockImplementation(() => {
        callOrder.push('handle');
        return of({ data: 'test' });
      });

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(callOrder).toEqual([
        'setHeader:Content-Encoding',
        'setHeader:Vary',
        'handle',
      ]);
    });
  });

  describe('Handler Execution', () => {
    /**
     * Test Case 5: Kiểm tra handler được gọi
     * Input: Any request
     * Expected Output: next.handle() called
     * Path Coverage: Handler invocation
     */
    it('TC005: should call next handler', () => {
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockCallHandler.handle).toHaveBeenCalled();
    });

    /**
     * Test Case 6: Kiểm tra handler được gọi đúng 1 lần
     * Input: Any request
     * Expected Output: Handler called exactly once
     * Path Coverage: Single handler call
     */
    it('TC006: should call handler exactly once', () => {
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockCallHandler.handle).toHaveBeenCalledTimes(1);
    });

    /**
     * Test Case 7: Kiểm tra Observable từ handler được return
     * Input: Handler returns Observable
     * Expected Output: Same Observable returned
     * Path Coverage: Observable passthrough
     */
    it('TC007: should return Observable from handler', () => {
      const testObservable = of({ data: 'test' });
      mockCallHandler.handle.mockReturnValue(testObservable);

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      expect(result).toBe(testObservable);
    });
  });

  describe('Response Data Handling', () => {
    /**
     * Test Case 8: Kiểm tra với object response
     * Input: Handler returns object
     * Expected Output: Object data returned in Observable
     * Path Coverage: Object response
     */
    it('TC008: should handle object response data', (done) => {
      const responseData = { id: 1, name: 'Test' };
      mockCallHandler.handle.mockReturnValue(of(responseData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data).toEqual(responseData);
        done();
      });
    });

    /**
     * Test Case 9: Kiểm tra với array response
     * Input: Handler returns array
     * Expected Output: Array data returned
     * Path Coverage: Array response
     */
    it('TC009: should handle array response data', (done) => {
      const responseData = [{ id: 1 }, { id: 2 }];
      mockCallHandler.handle.mockReturnValue(of(responseData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data).toEqual(responseData);
        done();
      });
    });

    /**
     * Test Case 10: Kiểm tra với string response
     * Input: Handler returns string
     * Expected Output: String data returned
     * Path Coverage: String response
     */
    it('TC010: should handle string response data', (done) => {
      const responseData = 'Hello World';
      mockCallHandler.handle.mockReturnValue(of(responseData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data).toBe(responseData);
        done();
      });
    });

    /**
     * Test Case 11: Kiểm tra với number response
     * Input: Handler returns number
     * Expected Output: Number data returned
     * Path Coverage: Number response
     */
    it('TC011: should handle number response data', (done) => {
      const responseData = 42;
      mockCallHandler.handle.mockReturnValue(of(responseData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data).toBe(responseData);
        done();
      });
    });

    /**
     * Test Case 12: Kiểm tra với boolean response
     * Input: Handler returns boolean
     * Expected Output: Boolean data returned
     * Path Coverage: Boolean response
     */
    it('TC012: should handle boolean response data', (done) => {
      const responseData = true;
      mockCallHandler.handle.mockReturnValue(of(responseData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data).toBe(responseData);
        done();
      });
    });

    /**
     * Test Case 13: Kiểm tra với null response
     * Input: Handler returns null
     * Expected Output: Null data returned
     * Path Coverage: Null response
     */
    it('TC013: should handle null response data', (done) => {
      const responseData = null;
      mockCallHandler.handle.mockReturnValue(of(responseData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data).toBeNull();
        done();
      });
    });

    /**
     * Test Case 14: Kiểm tra với undefined response
     * Input: Handler returns undefined
     * Expected Output: Undefined data returned
     * Path Coverage: Undefined response
     */
    it('TC014: should handle undefined response data', (done) => {
      const responseData = undefined;
      mockCallHandler.handle.mockReturnValue(of(responseData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data).toBeUndefined();
        done();
      });
    });

    /**
     * Test Case 15: Kiểm tra với empty object response
     * Input: Handler returns {}
     * Expected Output: Empty object returned
     * Path Coverage: Empty object
     */
    it('TC015: should handle empty object response', (done) => {
      const responseData = {};
      mockCallHandler.handle.mockReturnValue(of(responseData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data).toEqual({});
        done();
      });
    });

    /**
     * Test Case 16: Kiểm tra với empty array response
     * Input: Handler returns []
     * Expected Output: Empty array returned
     * Path Coverage: Empty array
     */
    it('TC016: should handle empty array response', (done) => {
      const responseData: any[] = [];
      mockCallHandler.handle.mockReturnValue(of(responseData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data).toEqual([]);
        done();
      });
    });
  });

  describe('Context Switching', () => {
    /**
     * Test Case 17: Kiểm tra switchToHttp được gọi
     * Input: Any request
     * Expected Output: switchToHttp() called
     * Path Coverage: Context switching
     */
    it('TC017: should call switchToHttp', () => {
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockExecutionContext.switchToHttp).toHaveBeenCalled();
    });

    /**
     * Test Case 18: Kiểm tra getResponse được gọi
     * Input: Any request
     * Expected Output: getResponse() called
     * Path Coverage: Response retrieval
     */
    it('TC018: should call getResponse from HTTP context', () => {
      const getResponseSpy = jest.fn().mockReturnValue(mockResponse);
      mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
        getResponse: getResponseSpy,
      });
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(getResponseSpy).toHaveBeenCalled();
    });
  });

  describe('Multiple Requests', () => {
    /**
     * Test Case 19: Kiểm tra multiple sequential requests
     * Input: Multiple requests
     * Expected Output: Headers set for each request
     * Path Coverage: Multiple invocations
     */
    it('TC019: should set headers for multiple requests', () => {
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      interceptor.intercept(mockExecutionContext, mockCallHandler);
      interceptor.intercept(mockExecutionContext, mockCallHandler);
      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockSetHeader).toHaveBeenCalledTimes(6); // 2 headers × 3 requests
    });

    /**
     * Test Case 20: Kiểm tra headers consistency across requests
     * Input: Multiple requests
     * Expected Output: Same headers each time
     * Path Coverage: Consistency
     */
    it('TC020: should set consistent headers across requests', () => {
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      for (let i = 0; i < 5; i++) {
        mockSetHeader.mockClear();
        interceptor.intercept(mockExecutionContext, mockCallHandler);

        expect(mockSetHeader).toHaveBeenCalledWith('Content-Encoding', 'gzip');
        expect(mockSetHeader).toHaveBeenCalledWith('Vary', 'Accept-Encoding');
      }
    });
  });

  describe('Real-world Scenarios', () => {
    /**
     * Test Case 21: Kiểm tra GET request
     * Input: GET request
     * Expected Output: Headers set, data returned
     * Path Coverage: GET scenario
     */
    it('TC021: should handle GET request', (done) => {
      const userData = { id: 1, name: 'John' };
      mockCallHandler.handle.mockReturnValue(of(userData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      expect(mockSetHeader).toHaveBeenCalledWith('Content-Encoding', 'gzip');
      result.subscribe((data) => {
        expect(data).toEqual(userData);
        done();
      });
    });

    /**
     * Test Case 22: Kiểm tra POST request
     * Input: POST request with response
     * Expected Output: Headers set, created data returned
     * Path Coverage: POST scenario
     */
    it('TC022: should handle POST request', (done) => {
      const createdData = { id: 1, status: 'created' };
      mockCallHandler.handle.mockReturnValue(of(createdData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      expect(mockSetHeader).toHaveBeenCalledWith('Content-Encoding', 'gzip');
      result.subscribe((data) => {
        expect(data).toEqual(createdData);
        done();
      });
    });

    /**
     * Test Case 23: Kiểm tra PUT request
     * Input: PUT request
     * Expected Output: Headers set, updated data returned
     * Path Coverage: PUT scenario
     */
    it('TC023: should handle PUT request', (done) => {
      const updatedData = { id: 1, name: 'Updated' };
      mockCallHandler.handle.mockReturnValue(of(updatedData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      expect(mockSetHeader).toHaveBeenCalledWith('Content-Encoding', 'gzip');
      result.subscribe((data) => {
        expect(data).toEqual(updatedData);
        done();
      });
    });

    /**
     * Test Case 24: Kiểm tra DELETE request
     * Input: DELETE request
     * Expected Output: Headers set, delete confirmation returned
     * Path Coverage: DELETE scenario
     */
    it('TC024: should handle DELETE request', (done) => {
      const deleteResponse = { success: true };
      mockCallHandler.handle.mockReturnValue(of(deleteResponse));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      expect(mockSetHeader).toHaveBeenCalledWith('Content-Encoding', 'gzip');
      result.subscribe((data) => {
        expect(data).toEqual(deleteResponse);
        done();
      });
    });

    /**
     * Test Case 25: Kiểm tra large JSON response
     * Input: Large object response
     * Expected Output: Compression headers set
     * Path Coverage: Large data compression
     */
    it('TC025: should set compression headers for large response', (done) => {
      const largeData = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: 'A'.repeat(100),
        })),
      };
      mockCallHandler.handle.mockReturnValue(of(largeData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      expect(mockSetHeader).toHaveBeenCalledWith('Content-Encoding', 'gzip');
      expect(mockSetHeader).toHaveBeenCalledWith('Vary', 'Accept-Encoding');
      result.subscribe((data) => {
        expect(data).toEqual(largeData);
        done();
      });
    });

    /**
     * Test Case 26: Kiểm tra paginated response
     * Input: Paginated data
     * Expected Output: Compression headers set
     * Path Coverage: Pagination scenario
     */
    it('TC026: should handle paginated response', (done) => {
      const paginatedData = {
        data: [{ id: 1 }, { id: 2 }],
        pagination: { page: 1, limit: 10, total: 100 },
      };
      mockCallHandler.handle.mockReturnValue(of(paginatedData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      expect(mockSetHeader).toHaveBeenCalled();
      result.subscribe((data) => {
        expect(data).toEqual(paginatedData);
        done();
      });
    });

    /**
     * Test Case 27: Kiểm tra list endpoint
     * Input: Array of items
     * Expected Output: Compression headers set
     * Path Coverage: List scenario
     */
    it('TC027: should handle list endpoint response', (done) => {
      const listData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ];
      mockCallHandler.handle.mockReturnValue(of(listData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      expect(mockSetHeader).toHaveBeenCalledWith('Content-Encoding', 'gzip');
      result.subscribe((data) => {
        expect(data).toEqual(listData);
        done();
      });
    });

    /**
     * Test Case 28: Kiểm tra detail endpoint
     * Input: Single item object
     * Expected Output: Compression headers set
     * Path Coverage: Detail scenario
     */
    it('TC028: should handle detail endpoint response', (done) => {
      const detailData = {
        id: 1,
        name: 'Item',
        details: { field1: 'value1', field2: 'value2' },
      };
      mockCallHandler.handle.mockReturnValue(of(detailData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      expect(mockSetHeader).toHaveBeenCalledWith('Content-Encoding', 'gzip');
      result.subscribe((data) => {
        expect(data).toEqual(detailData);
        done();
      });
    });

    /**
     * Test Case 29: Kiểm tra search endpoint
     * Input: Search results
     * Expected Output: Compression headers set
     * Path Coverage: Search scenario
     */
    it('TC029: should handle search endpoint response', (done) => {
      const searchData = {
        query: 'test',
        results: [{ id: 1 }, { id: 2 }],
        count: 2,
      };
      mockCallHandler.handle.mockReturnValue(of(searchData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      expect(mockSetHeader).toHaveBeenCalledWith('Content-Encoding', 'gzip');
      result.subscribe((data) => {
        expect(data).toEqual(searchData);
        done();
      });
    });

    /**
     * Test Case 30: Kiểm tra nested object response
     * Input: Deep nested object
     * Expected Output: Compression headers set
     * Path Coverage: Nested data
     */
    it('TC030: should handle deeply nested response', (done) => {
      const nestedData = {
        level1: {
          level2: {
            level3: {
              level4: {
                data: 'deep value',
              },
            },
          },
        },
      };
      mockCallHandler.handle.mockReturnValue(of(nestedData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      expect(mockSetHeader).toHaveBeenCalled();
      result.subscribe((data) => {
        expect(data).toEqual(nestedData);
        done();
      });
    });

    /**
     * Test Case 31: Kiểm tra API response format
     * Input: Standard API response structure
     * Expected Output: Headers set correctly
     * Path Coverage: API format
     */
    it('TC031: should handle standard API response format', (done) => {
      const apiResponse = {
        success: true,
        message: 'Operation successful',
        data: { id: 1 },
        timestamp: new Date().toISOString(),
      };
      mockCallHandler.handle.mockReturnValue(of(apiResponse));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      expect(mockSetHeader).toHaveBeenCalledWith('Content-Encoding', 'gzip');
      result.subscribe((data) => {
        expect(data).toEqual(apiResponse);
        done();
      });
    });

    /**
     * Test Case 32: Kiểm tra error response
     * Input: Error response object
     * Expected Output: Headers still set
     * Path Coverage: Error response
     */
    it('TC032: should handle error response', (done) => {
      const errorResponse = {
        success: false,
        error: 'NOT_FOUND',
        message: 'Resource not found',
      };
      mockCallHandler.handle.mockReturnValue(of(errorResponse));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      expect(mockSetHeader).toHaveBeenCalledWith('Content-Encoding', 'gzip');
      result.subscribe((data) => {
        expect(data).toEqual(errorResponse);
        done();
      });
    });

    /**
     * Test Case 33: Kiểm tra with special characters
     * Input: Data with special characters
     * Expected Output: Data preserved
     * Path Coverage: Special characters
     */
    it('TC033: should handle special characters in response', (done) => {
      const dataWithSpecialChars = {
        message: 'Hello! @#$%^&*() 你好 こんにちは',
        emoji: '😀🎉🚀',
      };
      mockCallHandler.handle.mockReturnValue(of(dataWithSpecialChars));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data).toEqual(dataWithSpecialChars);
        done();
      });
    });

    /**
     * Test Case 34: Kiểm tra with date objects
     * Input: Data with Date objects
     * Expected Output: Data preserved
     * Path Coverage: Date handling
     */
    it('TC034: should handle response with date objects', (done) => {
      const dateData = {
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      };
      mockCallHandler.handle.mockReturnValue(of(dateData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data).toEqual(dateData);
        done();
      });
    });

    /**
     * Test Case 35: Kiểm tra Observable completion
     * Input: Any request
     * Expected Output: Observable completes
     * Path Coverage: Observable lifecycle
     */
    it('TC035: should complete Observable properly', (done) => {
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: (data) => expect(data).toEqual({ data: 'test' }),
        complete: () => done(),
      });
    });

    /**
     * Test Case 36: Kiểm tra with buffer data
     * Input: Buffer response
     * Expected Output: Buffer preserved
     * Path Coverage: Buffer handling
     */
    it('TC036: should handle buffer response', (done) => {
      const bufferData = Buffer.from('test data');
      mockCallHandler.handle.mockReturnValue(of(bufferData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data).toBe(bufferData);
        done();
      });
    });

    /**
     * Test Case 37: Kiểm tra header immutability
     * Input: Any request
     * Expected Output: Headers always gzip
     * Path Coverage: Header values
     */
    it('TC037: should always set gzip encoding', () => {
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      const encodingCall = mockSetHeader.mock.calls.find(
        (call) => call[0] === 'Content-Encoding',
      );
      expect(encodingCall?.[1]).toBe('gzip');
    });

    /**
     * Test Case 38: Kiểm tra Vary header value
     * Input: Any request
     * Expected Output: Vary always Accept-Encoding
     * Path Coverage: Vary header
     */
    it('TC038: should always set Vary to Accept-Encoding', () => {
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      const varyCall = mockSetHeader.mock.calls.find(
        (call) => call[0] === 'Vary',
      );
      expect(varyCall?.[1]).toBe('Accept-Encoding');
    });

    /**
     * Test Case 39: Kiểm tra response không bị modify
     * Input: Original data
     * Expected Output: Exact same data returned
     * Path Coverage: Data passthrough
     */
    it('TC039: should not modify response data', (done) => {
      const originalData = { id: 1, nested: { value: 'test' } };
      const dataCopy = JSON.parse(JSON.stringify(originalData));
      mockCallHandler.handle.mockReturnValue(of(originalData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data).toEqual(dataCopy);
        done();
      });
    });

    /**
     * Test Case 40: Kiểm tra complete interceptor flow
     * Input: Standard request
     * Expected Output: All steps executed correctly
     * Path Coverage: Complete flow
     */
    it('TC040: should execute complete compression flow', (done) => {
      const responseData = { message: 'Success' };
      mockCallHandler.handle.mockReturnValue(of(responseData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Verify headers set
      expect(mockSetHeader).toHaveBeenCalledWith('Content-Encoding', 'gzip');
      expect(mockSetHeader).toHaveBeenCalledWith('Vary', 'Accept-Encoding');

      // Verify handler called
      expect(mockCallHandler.handle).toHaveBeenCalled();

      // Verify data returned
      result.subscribe({
        next: (data) => {
          expect(data).toEqual(responseData);
        },
        complete: () => done(),
      });
    });
  });
});
