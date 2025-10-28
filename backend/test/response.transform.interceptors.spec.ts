import 'reflect-metadata';
import { ResponseTransformInterceptor } from '../src/common/interceptors/response.transform.interceptors';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('ResponseTransformInterceptor - White Box Testing (Input-Output)', () => {
  let interceptor: ResponseTransformInterceptor;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;

  beforeEach(() => {
    // Mock ExecutionContext
    mockExecutionContext = {
      switchToHttp: jest.fn(),
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

    interceptor = new ResponseTransformInterceptor();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Already Formatted Response', () => {
    /**
     * Test Case 1: Kiểm tra response đã có success field
     * Input: { success: true, data: {...} }
     * Expected Output: Return as is
     * Path Coverage: if (data && typeof data === 'object' && 'success' in data)
     */
    it('TC001: should return already formatted response as is', (done) => {
      const formattedData = {
        success: true,
        data: { id: 1, name: 'Test' },
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      mockCallHandler.handle.mockReturnValue(of(formattedData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data).toEqual(formattedData);
        expect(data.success).toBe(true);
        expect(data.data).toEqual({ id: 1, name: 'Test' });
        done();
      });
    });

    /**
     * Test Case 2: Kiểm tra response với success: false
     * Input: { success: false, error: 'Error' }
     * Expected Output: Return as is
     * Path Coverage: 'success' in data (false case)
     */
    it('TC002: should return error response with success: false as is', (done) => {
      const errorResponse = {
        success: false,
        error: 'Something went wrong',
        message: 'Error details',
      };

      mockCallHandler.handle.mockReturnValue(of(errorResponse));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data).toEqual(errorResponse);
        expect(data.success).toBe(false);
        done();
      });
    });

    /**
     * Test Case 3: Kiểm tra response với success field và data
     * Input: { success: true, data: [], metadata: {} }
     * Expected Output: Return unchanged
     * Path Coverage: Already formatted with additional fields
     */
    it('TC003: should preserve additional fields in formatted response', (done) => {
      const formattedData = {
        success: true,
        data: [1, 2, 3],
        metadata: { total: 3, page: 1 },
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      mockCallHandler.handle.mockReturnValue(of(formattedData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data).toEqual(formattedData);
        expect(data.metadata).toEqual({ total: 3, page: 1 });
        done();
      });
    });
  });

  describe('Transform Unformatted Response', () => {
    /**
     * Test Case 4: Kiểm tra transform object response
     * Input: { id: 1, name: 'Test' }
     * Expected Output: { success: true, data: {...}, timestamp: ISO }
     * Path Coverage: Transform object without success field
     */
    it('TC004: should transform plain object response', (done) => {
      const rawData = { id: 1, name: 'Test' };
      mockCallHandler.handle.mockReturnValue(of(rawData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data).toEqual(rawData);
        expect(data.timestamp).toBeDefined();
        expect(typeof data.timestamp).toBe('string');
        done();
      });
    });

    /**
     * Test Case 5: Kiểm tra transform array response
     * Input: [1, 2, 3]
     * Expected Output: { success: true, data: [1,2,3], timestamp }
     * Path Coverage: Transform array
     */
    it('TC005: should transform array response', (done) => {
      const rawData = [1, 2, 3];
      mockCallHandler.handle.mockReturnValue(of(rawData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data).toEqual([1, 2, 3]);
        expect(data.timestamp).toBeDefined();
        done();
      });
    });

    /**
     * Test Case 6: Kiểm tra transform string response
     * Input: "Hello World"
     * Expected Output: { success: true, data: "Hello World", timestamp }
     * Path Coverage: Transform primitive string
     */
    it('TC006: should transform string response', (done) => {
      const rawData = 'Hello World';
      mockCallHandler.handle.mockReturnValue(of(rawData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data).toBe('Hello World');
        expect(data.timestamp).toBeDefined();
        done();
      });
    });

    /**
     * Test Case 7: Kiểm tra transform number response
     * Input: 42
     * Expected Output: { success: true, data: 42, timestamp }
     * Path Coverage: Transform primitive number
     */
    it('TC007: should transform number response', (done) => {
      const rawData = 42;
      mockCallHandler.handle.mockReturnValue(of(rawData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data).toBe(42);
        expect(data.timestamp).toBeDefined();
        done();
      });
    });

    /**
     * Test Case 8: Kiểm tra transform boolean response
     * Input: true
     * Expected Output: { success: true, data: true, timestamp }
     * Path Coverage: Transform primitive boolean
     */
    it('TC008: should transform boolean response', (done) => {
      const rawData = true;
      mockCallHandler.handle.mockReturnValue(of(rawData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data).toBe(true);
        expect(data.timestamp).toBeDefined();
        done();
      });
    });

    /**
     * Test Case 9: Kiểm tra transform null response
     * Input: null
     * Expected Output: { success: true, data: null, timestamp }
     * Path Coverage: data && typeof data === 'object' (null case)
     */
    it('TC009: should transform null response', (done) => {
      const rawData = null;
      mockCallHandler.handle.mockReturnValue(of(rawData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data).toBeNull();
        expect(data.timestamp).toBeDefined();
        done();
      });
    });

    /**
     * Test Case 10: Kiểm tra transform undefined response
     * Input: undefined
     * Expected Output: { success: true, data: undefined, timestamp }
     * Path Coverage: Undefined value
     */
    it('TC010: should transform undefined response', (done) => {
      const rawData = undefined;
      mockCallHandler.handle.mockReturnValue(of(rawData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data).toBeUndefined();
        expect(data.timestamp).toBeDefined();
        done();
      });
    });
  });

  describe('Timestamp Validation', () => {
    /**
     * Test Case 11: Kiểm tra timestamp format
     * Input: Any data
     * Expected Output: ISO 8601 timestamp
     * Path Coverage: new Date().toISOString()
     */
    it('TC011: should generate valid ISO 8601 timestamp', (done) => {
      mockCallHandler.handle.mockReturnValue(of({ test: 'data' }));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.timestamp).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        );
        done();
      });
    });

    /**
     * Test Case 12: Kiểm tra timestamp is current time
     * Input: Any data
     * Expected Output: Timestamp within last second
     * Path Coverage: Timestamp accuracy
     */
    it('TC012: should generate current timestamp', (done) => {
      const before = new Date().toISOString();
      mockCallHandler.handle.mockReturnValue(of({ test: 'data' }));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        const after = new Date().toISOString();
        expect(data.timestamp >= before).toBe(true);
        expect(data.timestamp <= after).toBe(true);
        done();
      });
    });

    /**
     * Test Case 13: Kiểm tra không override existing timestamp
     * Input: { success: true, data: {}, timestamp: 'old' }
     * Expected Output: Keep old timestamp
     * Path Coverage: Preserve existing timestamp
     */
    it('TC013: should preserve existing timestamp in formatted response', (done) => {
      const oldTimestamp = '2020-01-01T00:00:00.000Z';
      const formattedData = {
        success: true,
        data: { test: 'data' },
        timestamp: oldTimestamp,
      };

      mockCallHandler.handle.mockReturnValue(of(formattedData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.timestamp).toBe(oldTimestamp);
        done();
      });
    });
  });

  describe('Edge Cases', () => {
    /**
     * Test Case 14: Kiểm tra empty object
     * Input: {}
     * Expected Output: { success: true, data: {}, timestamp }
     * Path Coverage: Empty object without success field
     */
    it('TC014: should transform empty object', (done) => {
      mockCallHandler.handle.mockReturnValue(of({}));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data).toEqual({});
        expect(data.timestamp).toBeDefined();
        done();
      });
    });

    /**
     * Test Case 15: Kiểm tra empty array
     * Input: []
     * Expected Output: { success: true, data: [], timestamp }
     * Path Coverage: Empty array
     */
    it('TC015: should transform empty array', (done) => {
      mockCallHandler.handle.mockReturnValue(of([]));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data).toEqual([]);
        expect(data.timestamp).toBeDefined();
        done();
      });
    });

    /**
     * Test Case 16: Kiểm tra empty string
     * Input: ""
     * Expected Output: { success: true, data: "", timestamp }
     * Path Coverage: Empty string
     */
    it('TC016: should transform empty string', (done) => {
      mockCallHandler.handle.mockReturnValue(of(''));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data).toBe('');
        expect(data.timestamp).toBeDefined();
        done();
      });
    });

    /**
     * Test Case 17: Kiểm tra zero number
     * Input: 0
     * Expected Output: { success: true, data: 0, timestamp }
     * Path Coverage: Falsy number
     */
    it('TC017: should transform zero', (done) => {
      mockCallHandler.handle.mockReturnValue(of(0));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data).toBe(0);
        expect(data.timestamp).toBeDefined();
        done();
      });
    });

    /**
     * Test Case 18: Kiểm tra false boolean
     * Input: false
     * Expected Output: { success: true, data: false, timestamp }
     * Path Coverage: Falsy boolean
     */
    it('TC018: should transform false boolean', (done) => {
      mockCallHandler.handle.mockReturnValue(of(false));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data).toBe(false);
        expect(data.timestamp).toBeDefined();
        done();
      });
    });

    /**
     * Test Case 19: Kiểm tra object with success property but not boolean
     * Input: { success: "yes", data: {} }
     * Expected Output: Return as is (has 'success' property)
     * Path Coverage: 'success' in data (non-boolean)
     */
    it('TC019: should return object with non-boolean success as is', (done) => {
      const rawData = { success: 'yes', data: { test: 'value' } };
      mockCallHandler.handle.mockReturnValue(of(rawData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data).toEqual(rawData);
        expect(data.success).toBe('yes');
        done();
      });
    });

    /**
     * Test Case 20: Kiểm tra nested object
     * Input: { user: { id: 1, profile: { name: 'Test' } } }
     * Expected Output: Transform with nested structure preserved
     * Path Coverage: Complex nested object
     */
    it('TC020: should preserve nested object structure', (done) => {
      const nestedData = {
        user: {
          id: 1,
          profile: { name: 'Test', settings: { theme: 'dark' } },
        },
      };

      mockCallHandler.handle.mockReturnValue(of(nestedData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data).toEqual(nestedData);
        expect(data.data.user.profile.settings.theme).toBe('dark');
        done();
      });
    });
  });

  describe('Real-world Scenarios', () => {
    /**
     * Test Case 21: Kiểm tra user list response
     * Input: [{ id: 1, name: 'User1' }, { id: 2, name: 'User2' }]
     * Expected Output: Wrapped in standard format
     * Path Coverage: Array of objects
     */
    it('TC021: should transform user list response', (done) => {
      const users = [
        { id: 1, name: 'User1' },
        { id: 2, name: 'User2' },
      ];

      mockCallHandler.handle.mockReturnValue(of(users));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data).toHaveLength(2);
        expect(data.data[0].name).toBe('User1');
        done();
      });
    });

    /**
     * Test Case 22: Kiểm tra single user response
     * Input: { id: 1, name: 'John', email: 'john@test.com' }
     * Expected Output: Wrapped response
     * Path Coverage: Single entity
     */
    it('TC022: should transform single user response', (done) => {
      const user = { id: 1, name: 'John', email: 'john@test.com' };
      mockCallHandler.handle.mockReturnValue(of(user));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data.name).toBe('John');
        expect(data.data.email).toBe('john@test.com');
        done();
      });
    });

    /**
     * Test Case 23: Kiểm tra pagination response
     * Input: { items: [], total: 100, page: 1, limit: 10 }
     * Expected Output: Wrapped response
     * Path Coverage: Pagination object
     */
    it('TC023: should transform pagination response', (done) => {
      const pagination = {
        items: [{ id: 1 }, { id: 2 }],
        total: 100,
        page: 1,
        limit: 10,
      };

      mockCallHandler.handle.mockReturnValue(of(pagination));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data.total).toBe(100);
        expect(data.data.items).toHaveLength(2);
        done();
      });
    });

    /**
     * Test Case 24: Kiểm tra create response
     * Input: { id: 1, created: true }
     * Expected Output: Wrapped response
     * Path Coverage: Creation response
     */
    it('TC024: should transform create response', (done) => {
      const created = { id: 1, created: true };
      mockCallHandler.handle.mockReturnValue(of(created));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data.id).toBe(1);
        expect(data.data.created).toBe(true);
        done();
      });
    });

    /**
     * Test Case 25: Kiểm tra update response
     * Input: { id: 1, updated: true, affectedRows: 1 }
     * Expected Output: Wrapped response
     * Path Coverage: Update response
     */
    it('TC025: should transform update response', (done) => {
      const updated = { id: 1, updated: true, affectedRows: 1 };
      mockCallHandler.handle.mockReturnValue(of(updated));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data.updated).toBe(true);
        done();
      });
    });

    /**
     * Test Case 26: Kiểm tra delete response
     * Input: { deleted: true }
     * Expected Output: Wrapped response
     * Path Coverage: Delete response
     */
    it('TC026: should transform delete response', (done) => {
      const deleted = { deleted: true };
      mockCallHandler.handle.mockReturnValue(of(deleted));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data.deleted).toBe(true);
        done();
      });
    });

    /**
     * Test Case 27: Kiểm tra search response
     * Input: { results: [], query: 'test', count: 0 }
     * Expected Output: Wrapped response
     * Path Coverage: Search response
     */
    it('TC027: should transform search response', (done) => {
      const search = { results: [], query: 'test', count: 0 };
      mockCallHandler.handle.mockReturnValue(of(search));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data.query).toBe('test');
        expect(data.data.results).toEqual([]);
        done();
      });
    });

    /**
     * Test Case 28: Kiểm tra stats response
     * Input: { total: 100, active: 50, inactive: 50 }
     * Expected Output: Wrapped response
     * Path Coverage: Statistics response
     */
    it('TC028: should transform statistics response', (done) => {
      const stats = { total: 100, active: 50, inactive: 50 };
      mockCallHandler.handle.mockReturnValue(of(stats));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data.total).toBe(100);
        done();
      });
    });

    /**
     * Test Case 29: Kiểm tra health check response
     * Input: { status: 'ok', uptime: 12345 }
     * Expected Output: Wrapped response
     * Path Coverage: Health check
     */
    it('TC029: should transform health check response', (done) => {
      const health = { status: 'ok', uptime: 12345 };
      mockCallHandler.handle.mockReturnValue(of(health));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data.status).toBe('ok');
        done();
      });
    });

    /**
     * Test Case 30: Kiểm tra message response
     * Input: "Operation completed successfully"
     * Expected Output: Wrapped string
     * Path Coverage: String message
     */
    it('TC030: should transform message response', (done) => {
      const message = 'Operation completed successfully';
      mockCallHandler.handle.mockReturnValue(of(message));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data).toBe(message);
        done();
      });
    });

    /**
     * Test Case 31: Kiểm tra count response
     * Input: 42
     * Expected Output: Wrapped number
     * Path Coverage: Numeric result
     */
    it('TC031: should transform count response', (done) => {
      mockCallHandler.handle.mockReturnValue(of(42));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data).toBe(42);
        done();
      });
    });

    /**
     * Test Case 32: Kiểm tra boolean flag response
     * Input: true
     * Expected Output: Wrapped boolean
     * Path Coverage: Boolean result
     */
    it('TC032: should transform boolean flag response', (done) => {
      mockCallHandler.handle.mockReturnValue(of(true));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data).toBe(true);
        done();
      });
    });

    /**
     * Test Case 33: Kiểm tra already formatted pagination
     * Input: { success: true, data: { items: [], total: 0 }, pagination: {} }
     * Expected Output: Return as is
     * Path Coverage: Pre-formatted with metadata
     */
    it('TC033: should preserve formatted pagination response', (done) => {
      const formatted = {
        success: true,
        data: { items: [], total: 0 },
        pagination: { page: 1, limit: 10 },
      };

      mockCallHandler.handle.mockReturnValue(of(formatted));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data).toEqual(formatted);
        expect(data.pagination).toBeDefined();
        done();
      });
    });

    /**
     * Test Case 34: Kiểm tra file upload response
     * Input: { filename: 'test.jpg', size: 1024, url: 'http://...' }
     * Expected Output: Wrapped response
     * Path Coverage: File metadata
     */
    it('TC034: should transform file upload response', (done) => {
      const file = {
        filename: 'test.jpg',
        size: 1024,
        url: 'http://example.com/test.jpg',
      };

      mockCallHandler.handle.mockReturnValue(of(file));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data.filename).toBe('test.jpg');
        done();
      });
    });

    /**
     * Test Case 35: Kiểm tra batch operation response
     * Input: { processed: 100, succeeded: 95, failed: 5 }
     * Expected Output: Wrapped response
     * Path Coverage: Batch results
     */
    it('TC035: should transform batch operation response', (done) => {
      const batch = { processed: 100, succeeded: 95, failed: 5 };
      mockCallHandler.handle.mockReturnValue(of(batch));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data.processed).toBe(100);
        done();
      });
    });

    /**
     * Test Case 36: Kiểm tra token response
     * Input: { token: 'jwt-token', expiresIn: 3600 }
     * Expected Output: Wrapped response
     * Path Coverage: Authentication response
     */
    it('TC036: should transform token response', (done) => {
      const token = { token: 'jwt-token', expiresIn: 3600 };
      mockCallHandler.handle.mockReturnValue(of(token));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data.token).toBe('jwt-token');
        done();
      });
    });

    /**
     * Test Case 37: Kiểm tra validation result
     * Input: { valid: false, errors: ['Error 1', 'Error 2'] }
     * Expected Output: Wrapped response
     * Path Coverage: Validation response
     */
    it('TC037: should transform validation response', (done) => {
      const validation = { valid: false, errors: ['Error 1', 'Error 2'] };
      mockCallHandler.handle.mockReturnValue(of(validation));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data.valid).toBe(false);
        expect(data.data.errors).toHaveLength(2);
        done();
      });
    });

    /**
     * Test Case 38: Kiểm tra metrics response
     * Input: { cpu: 45.2, memory: 78.5, requests: 1000 }
     * Expected Output: Wrapped response
     * Path Coverage: Metrics data
     */
    it('TC038: should transform metrics response', (done) => {
      const metrics = { cpu: 45.2, memory: 78.5, requests: 1000 };
      mockCallHandler.handle.mockReturnValue(of(metrics));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data.cpu).toBe(45.2);
        done();
      });
    });

    /**
     * Test Case 39: Kiểm tra export response
     * Input: { exportId: 'abc123', status: 'processing' }
     * Expected Output: Wrapped response
     * Path Coverage: Export job response
     */
    it('TC039: should transform export response', (done) => {
      const exportJob = { exportId: 'abc123', status: 'processing' };
      mockCallHandler.handle.mockReturnValue(of(exportJob));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe((data) => {
        expect(data.success).toBe(true);
        expect(data.data.exportId).toBe('abc123');
        done();
      });
    });

    /**
     * Test Case 40: Kiểm tra complete transformation flow
     * Input: Various data types in sequence
     * Expected Output: All properly transformed
     * Path Coverage: Complete integration
     */
    it('TC040: should handle complete transformation flow', (done) => {
      const testCases = [
        { input: { id: 1 }, expectedSuccess: true },
        { input: [1, 2, 3], expectedSuccess: true },
        { input: 'test', expectedSuccess: true },
        { input: 42, expectedSuccess: true },
        { input: true, expectedSuccess: true },
        { input: { success: false, error: 'Test' }, expectedSuccess: false },
      ];

      let completed = 0;

      testCases.forEach((testCase) => {
        mockCallHandler.handle.mockReturnValueOnce(of(testCase.input));

        const result = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result.subscribe((data) => {
          expect(data.success).toBe(testCase.expectedSuccess);
          if (testCase.expectedSuccess) {
            expect(data.data).toBeDefined();
            expect(data.timestamp).toBeDefined();
          }

          completed++;
          if (completed === testCases.length) {
            done();
          }
        });
      });
    });
  });
});
