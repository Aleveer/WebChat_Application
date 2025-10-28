import { BaseResponseDto } from './base.response.dto';

describe('BaseResponseDto - White Box Testing', () => {
  describe('Constructor Tests', () => {
    describe('With all parameters', () => {
      it('should create BaseResponseDto with all fields provided - success case', () => {
        const errorDetails = { field: 'email', reason: 'Invalid format' };
        const error = { code: 'VALIDATION_ERROR', details: errorDetails };
        const dto = new BaseResponseDto(
          true,
          'Operation completed',
          'test-data',
          error,
          'req-123',
        );

        expect(dto.success).toBe(true);
        expect(dto.message).toBe('Operation completed');
        expect(dto.data).toBe('test-data');
        expect(dto.error).toEqual(error);
        expect(dto.requestId).toBe('req-123');
        expect(dto.timestamp).toBeDefined();
      });

      it('should create BaseResponseDto with all fields - error case', () => {
        const error = { code: 'NOT_FOUND', details: { id: '123' } };
        const dto = new BaseResponseDto(
          false,
          'Resource not found',
          undefined,
          error,
          'req-456',
        );

        expect(dto.success).toBe(false);
        expect(dto.message).toBe('Resource not found');
        expect(dto.data).toBeUndefined();
        expect(dto.error).toEqual(error);
        expect(dto.requestId).toBe('req-456');
      });
    });

    describe('With partial parameters', () => {
      it('should create BaseResponseDto with success, message and data only', () => {
        const dto = new BaseResponseDto(true, 'Success', 'data');

        expect(dto.success).toBe(true);
        expect(dto.message).toBe('Success');
        expect(dto.data).toBe('data');
        expect(dto.error).toBeUndefined();
        expect(dto.requestId).toBeUndefined();
        expect(dto.timestamp).toBeDefined();
      });

      it('should create BaseResponseDto with success and message only', () => {
        const dto = new BaseResponseDto(true, 'Processing...');

        expect(dto.success).toBe(true);
        expect(dto.message).toBe('Processing...');
        expect(dto.data).toBeUndefined();
        expect(dto.error).toBeUndefined();
        expect(dto.requestId).toBeUndefined();
      });

      it('should create BaseResponseDto with success false and error', () => {
        const error = { code: 'ERROR', details: 'Something went wrong' };
        const dto = new BaseResponseDto(false, 'Failed', undefined, error);

        expect(dto.success).toBe(false);
        expect(dto.message).toBe('Failed');
        expect(dto.error).toEqual(error);
      });

      it('should create BaseResponseDto with minimal parameters', () => {
        const dto = new BaseResponseDto(false, 'Error occurred');

        expect(dto.success).toBe(false);
        expect(dto.message).toBe('Error occurred');
        expect(dto.data).toBeUndefined();
        expect(dto.error).toBeUndefined();
      });
    });

    describe('Timestamp generation', () => {
      it('should auto-generate ISO timestamp', () => {
        const beforeTime = new Date();
        const dto = new BaseResponseDto(true, 'Test');
        const afterTime = new Date();

        const timestamp = new Date(dto.timestamp);
        expect(timestamp).toBeInstanceOf(Date);
        expect(timestamp >= beforeTime).toBe(true);
        expect(timestamp <= afterTime).toBe(true);
      });

      it('should generate different timestamps for different instances', async () => {
        const dto1 = new BaseResponseDto(true, 'First');
        // Small delay to ensure different timestamp
        await new Promise((resolve) => setTimeout(resolve, 10));
        const dto2 = new BaseResponseDto(true, 'Second');

        expect(dto1.timestamp).not.toBe(dto2.timestamp);
      });

      it('should generate valid ISO timestamp format', () => {
        const dto = new BaseResponseDto(true, 'Test');

        expect(dto.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      });
    });
  });

  describe('Static success() Method Tests', () => {
    it('should create success response with data only', () => {
      const dto = BaseResponseDto.success('test-data');

      expect(dto.success).toBe(true);
      expect(dto.message).toBe('Operation successful');
      expect(dto.data).toBe('test-data');
      expect(dto.error).toBeUndefined();
      expect(dto.requestId).toBeUndefined();
    });

    it('should create success response with custom message', () => {
      const dto = BaseResponseDto.success(
        'test-data',
        'User created successfully',
      );

      expect(dto.success).toBe(true);
      expect(dto.message).toBe('User created successfully');
      expect(dto.data).toBe('test-data');
    });

    it('should create success response with requestId', () => {
      const dto = BaseResponseDto.success('test-data', 'Success', 'req-789');

      expect(dto.success).toBe(true);
      expect(dto.data).toBe('test-data');
      expect(dto.requestId).toBe('req-789');
    });

    it('should create success response with object data', () => {
      const userData = { id: '123', name: 'John', email: 'john@example.com' };
      const dto = BaseResponseDto.success(userData);

      expect(dto.success).toBe(true);
      expect(dto.data).toEqual(userData);
      expect(dto.data?.id).toBe('123');
      expect(dto.data?.name).toBe('John');
    });

    it('should create success response with array data', () => {
      const arrayData = [{ id: '1' }, { id: '2' }, { id: '3' }];
      const dto = BaseResponseDto.success(arrayData);

      expect(dto.success).toBe(true);
      expect(dto.data).toEqual(arrayData);
      expect(Array.isArray(dto.data)).toBe(true);
      expect(dto.data?.length).toBe(3);
    });

    it('should create success response with number data', () => {
      const dto = BaseResponseDto.success(42, 'Count retrieved');

      expect(dto.success).toBe(true);
      expect(dto.message).toBe('Count retrieved');
      expect(dto.data).toBe(42);
      expect(typeof dto.data).toBe('number');
    });

    it('should create success response with boolean data', () => {
      const dto = BaseResponseDto.success(true, 'Feature enabled');

      expect(dto.success).toBe(true);
      expect(dto.data).toBe(true);
      expect(typeof dto.data).toBe('boolean');
    });

    it('should create success response with null data', () => {
      const dto = BaseResponseDto.success(null, 'No data available');

      expect(dto.success).toBe(true);
      expect(dto.data).toBeNull();
    });

    it('should create success response with all parameters', () => {
      const userData = { name: 'John', age: 30 };
      const dto = BaseResponseDto.success(userData, 'User found', 'req-999');

      expect(dto.success).toBe(true);
      expect(dto.message).toBe('User found');
      expect(dto.data).toEqual(userData);
      expect(dto.requestId).toBe('req-999');
      expect(dto.error).toBeUndefined();
    });
  });

  describe('Static error() Method Tests', () => {
    it('should create error response with message only', () => {
      const dto = BaseResponseDto.error('An error occurred');

      expect(dto.success).toBe(false);
      expect(dto.message).toBe('An error occurred');
      expect(dto.data).toBeUndefined();
      expect(dto.error).toBeDefined();
      expect(dto.error?.code).toBe('ERROR');
      expect(dto.error?.details).toBeUndefined();
      expect(dto.requestId).toBeUndefined();
    });

    it('should create error response with custom code', () => {
      const dto = BaseResponseDto.error('Not found', 'NOT_FOUND');

      expect(dto.success).toBe(false);
      expect(dto.message).toBe('Not found');
      expect(dto.error?.code).toBe('NOT_FOUND');
      expect(dto.error?.details).toBeUndefined();
    });

    it('should create error response with code and details', () => {
      const details = { field: 'email', value: 'invalid@' };
      const dto = BaseResponseDto.error(
        'Validation failed',
        'VALIDATION_ERROR',
        details,
      );

      expect(dto.success).toBe(false);
      expect(dto.message).toBe('Validation failed');
      expect(dto.error?.code).toBe('VALIDATION_ERROR');
      expect(dto.error?.details).toEqual(details);
    });

    it('should create error response with all parameters including requestId', () => {
      const details = { retryAfter: 60 };
      const dto = BaseResponseDto.error(
        'Rate limit exceeded',
        'RATE_LIMIT',
        details,
        'req-500',
      );

      expect(dto.success).toBe(false);
      expect(dto.message).toBe('Rate limit exceeded');
      expect(dto.error?.code).toBe('RATE_LIMIT');
      expect(dto.error?.details).toEqual(details);
      expect(dto.requestId).toBe('req-500');
    });

    it('should create error response with object details', () => {
      const details = {
        errors: [
          { field: 'email', message: 'Invalid' },
          { field: 'password', message: 'Too short' },
        ],
      };
      const dto = BaseResponseDto.error(
        'Multiple errors',
        'VALIDATION_ERROR',
        details,
      );

      expect(dto.error?.details).toEqual(details);
      expect(Array.isArray((dto.error?.details as any)?.errors)).toBe(true);
      expect((dto.error?.details as any)?.errors?.length).toBe(2);
    });

    it('should create error response with string details', () => {
      const dto = BaseResponseDto.error(
        'Server error',
        'INTERNAL_ERROR',
        'Database connection failed',
      );

      expect(dto.error?.details).toBe('Database connection failed');
      expect(typeof dto.error?.details).toBe('string');
    });

    it('should create error response with number details', () => {
      const dto = BaseResponseDto.error('Timeout', 'TIMEOUT', 5000);

      expect(dto.error?.details).toBe(5000);
      expect(typeof dto.error?.details).toBe('number');
    });
  });

  describe('Edge Cases and Special Values', () => {
    it('should handle empty string message', () => {
      const dto = new BaseResponseDto(true, '');

      expect(dto.success).toBe(true);
      expect(dto.message).toBe('');
      expect(dto.message).toHaveLength(0);
    });

    it('should handle very long message', () => {
      const longMessage = 'a'.repeat(1000);
      const dto = BaseResponseDto.error(longMessage);

      expect(dto.message).toBe(longMessage);
      expect(dto.message.length).toBe(1000);
    });

    it('should handle message with special characters', () => {
      const message = 'Error! 🚫 Special chars: @#$%^&*()[]{}';
      const dto = BaseResponseDto.error(message);

      expect(dto.message).toBe(message);
    });

    it('should handle empty string data', () => {
      const dto = BaseResponseDto.success('');

      expect(dto.success).toBe(true);
      expect(dto.data).toBe('');
      expect(dto.data).toHaveLength(0);
    });

    it('should handle number zero data', () => {
      const dto = BaseResponseDto.success(0, 'Zero count');

      expect(dto.success).toBe(true);
      expect(dto.data).toBe(0);
    });

    it('should handle empty object data', () => {
      const dto = BaseResponseDto.success({}, 'Empty result');

      expect(dto.success).toBe(true);
      expect(dto.data).toEqual({});
      expect(Object.keys(dto.data || {})).toHaveLength(0);
    });

    it('should handle empty array data', () => {
      const dto = BaseResponseDto.success([], 'No items');

      expect(dto.success).toBe(true);
      expect(dto.data).toEqual([]);
      expect(Array.isArray(dto.data)).toBe(true);
      expect(dto.data?.length).toBe(0);
    });

    it('should handle null error details', () => {
      const dto = BaseResponseDto.error('Error', 'ERROR_CODE', null);

      expect(dto.error?.details).toBeNull();
    });

    it('should handle undefined error details', () => {
      const dto = BaseResponseDto.error('Error', 'ERROR_CODE', undefined);

      expect(dto.error?.details).toBeUndefined();
    });

    it('should handle complex nested error details', () => {
      const details = {
        stack: ['Error at line 1', 'Error at line 2'],
        metadata: { file: 'index.ts', line: 42 },
      };
      const dto = BaseResponseDto.error(
        'Runtime error',
        'RUNTIME_ERROR',
        details,
      );

      expect(typeof dto.error?.details).toBe('object');
      expect((dto.error?.details as any)?.stack).toBeDefined();
      expect((dto.error?.details as any)?.metadata).toBeDefined();
    });
  });

  describe('Type Safety and TypeScript Features', () => {
    it('should preserve type information for object types', () => {
      interface Product {
        id: string;
        name: string;
        price: number;
        inStock: boolean;
      }

      const product: Product = {
        id: '1',
        name: 'Laptop',
        price: 999,
        inStock: true,
      };
      const dto = BaseResponseDto.success<Product>(product);

      expect(dto.data?.id).toBe('1');
      expect(dto.data?.name).toBe('Laptop');
      expect(dto.data?.price).toBe(999);
      expect(dto.data?.inStock).toBe(true);
    });

    it('should support union types', () => {
      type Result = string | number | boolean;

      const dto1 = BaseResponseDto.success<Result>('test');
      const dto2 = BaseResponseDto.success<Result>(42);
      const dto3 = BaseResponseDto.success<Result>(true);

      expect(typeof dto1.data).toBe('string');
      expect(typeof dto2.data).toBe('number');
      expect(typeof dto3.data).toBe('boolean');
    });

    it('should support array types', () => {
      const dto = BaseResponseDto.success<string[]>(
        ['a', 'b', 'c'],
        'List retrieved',
      );

      expect(Array.isArray(dto.data)).toBe(true);
      expect(dto.data).toEqual(['a', 'b', 'c']);
    });

    it('should handle generic type with undefined', () => {
      const dto = BaseResponseDto.success<undefined>(undefined, 'No data');

      expect(dto.success).toBe(true);
      expect(dto.data).toBeUndefined();
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should work for successful user creation', () => {
      const user = { id: '123', name: 'John Doe', email: 'john@example.com' };
      const dto = BaseResponseDto.success(
        user,
        'User created successfully',
        'req-001',
      );

      expect(dto.success).toBe(true);
      expect(dto.data).toEqual(user);
      expect(dto.message).toBe('User created successfully');
      expect(dto.requestId).toBe('req-001');
    });

    it('should work for authentication error', () => {
      const details = { attemptedAt: new Date().toISOString() };
      const dto = BaseResponseDto.error(
        'Authentication failed',
        'AUTH_ERROR',
        details,
        'req-002',
      );

      expect(dto.success).toBe(false);
      expect(dto.message).toBe('Authentication failed');
      expect(dto.error?.code).toBe('AUTH_ERROR');
      expect(dto.error?.details).toEqual(details);
    });

    it('should work for validation error', () => {
      const details = {
        fields: [
          { field: 'email', message: 'Invalid format' },
          { field: 'password', message: 'Too short' },
        ],
      };
      const dto = BaseResponseDto.error(
        'Validation failed',
        'VALIDATION_ERROR',
        details,
      );

      expect(dto.success).toBe(false);
      expect(dto.error?.code).toBe('VALIDATION_ERROR');
      expect((dto.error?.details as any)?.fields).toBeDefined();
      expect((dto.error?.details as any)?.fields?.length).toBe(2);
    });

    it('should work for paginated list response', () => {
      const users = [{ id: '1' }, { id: '2' }, { id: '3' }];
      const dto = BaseResponseDto.success(users, 'Users retrieved', 'req-003');

      expect(dto.success).toBe(true);
      expect(Array.isArray(dto.data)).toBe(true);
      expect(dto.data?.length).toBe(3);
      expect(dto.requestId).toBe('req-003');
    });

    it('should work for empty result with success', () => {
      const dto = BaseResponseDto.success([], 'No users found', 'req-004');

      expect(dto.success).toBe(true);
      expect(dto.data).toEqual([]);
      expect(dto.message).toBe('No users found');
      expect(dto.data?.length).toBe(0);
    });

    it('should work for database error', () => {
      const details = {
        database: 'postgres',
        query: 'SELECT * FROM users',
        timeout: 5000,
      };
      const dto = BaseResponseDto.error('Database error', 'DB_ERROR', details);

      expect(dto.success).toBe(false);
      expect(dto.error?.code).toBe('DB_ERROR');
      expect((dto.error?.details as any)?.database).toBe('postgres');
    });

    it('should work for rate limit error', () => {
      const dto = BaseResponseDto.error(
        'Too many requests',
        'RATE_LIMIT',
        100,
        'req-005',
      );

      expect(dto.error?.code).toBe('RATE_LIMIT');
      expect(dto.error?.details).toBe(100);
      expect(dto.requestId).toBe('req-005');
    });

    it('should work for file upload success', () => {
      const fileInfo = {
        filename: 'document.pdf',
        size: 1024,
        type: 'application/pdf',
      };
      const dto = BaseResponseDto.success(
        fileInfo,
        'File uploaded successfully',
      );

      expect(dto.success).toBe(true);
      expect(dto.data?.filename).toBe('document.pdf');
      expect(dto.data?.size).toBe(1024);
    });
  });

  describe('Property Assignment and Mutation', () => {
    it('should allow reassignment of properties', () => {
      const dto = BaseResponseDto.success(
        'initial',
        'Initial message',
        'req-1',
      );

      dto.data = 'modified';
      dto.message = 'Modified message';
      dto.requestId = 'req-2';

      expect(dto.data).toBe('modified');
      expect(dto.message).toBe('Modified message');
      expect(dto.requestId).toBe('req-2');
    });

    it('should allow adding error to successful response', () => {
      const dto = BaseResponseDto.success('data');

      dto.error = { code: 'WARNING', details: 'Minor issue detected' };

      expect(dto.error?.code).toBe('WARNING');
    });

    it('should allow modifying error details', () => {
      const dto = BaseResponseDto.error('Error', 'ERROR');

      dto.error!.details = { additionalInfo: 'More details' };

      expect((dto.error?.details as any)?.additionalInfo).toBe('More details');
    });
  });

  describe('JSON Serialization', () => {
    it('should serialize success response correctly to JSON', () => {
      const dto = BaseResponseDto.success(
        { name: 'test' },
        'Success',
        'req-json',
      );

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.success).toBe(true);
      expect(parsed.message).toBe('Success');
      expect(parsed.data.name).toBe('test');
      expect(parsed.requestId).toBe('req-json');
      expect(parsed.error).toBeUndefined();
    });

    it('should serialize error response correctly to JSON', () => {
      const details = { field: 'email', value: 'invalid' };
      const dto = BaseResponseDto.error(
        'Validation failed',
        'VALIDATION_ERROR',
        details,
      );

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.success).toBe(false);
      expect(parsed.message).toBe('Validation failed');
      expect(parsed.error.code).toBe('VALIDATION_ERROR');
      expect(parsed.error.details).toEqual(details);
      expect(parsed.data).toBeUndefined();
    });

    it('should serialize with timestamp in ISO format', () => {
      const dto = BaseResponseDto.success('test');

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.timestamp).toBeDefined();
      expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should serialize complex nested objects', () => {
      const complexData = {
        user: { id: '1', name: 'John' },
        tags: ['important', 'urgent'],
        metadata: { created: '2023-01-01', updated: '2023-01-02' },
      };
      const dto = BaseResponseDto.success(complexData);

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.data.user).toEqual(complexData.user);
      expect(parsed.data.tags).toEqual(complexData.tags);
      expect(parsed.data.metadata).toEqual(complexData.metadata);
    });
  });

  describe('Branch Coverage - All Code Paths', () => {
    it('should execute all branches in constructor', () => {
      // Branch 1: success, message, data, error, requestId
      const dto1 = new BaseResponseDto(
        true,
        'msg',
        'data',
        { code: 'ERR' },
        'req',
      );
      expect(dto1.success).toBe(true);

      // Branch 2: success, message, data
      const dto2 = new BaseResponseDto(true, 'msg', 'data');
      expect(dto2.success).toBe(true);

      // Branch 3: success, message
      const dto3 = new BaseResponseDto(true, 'msg');
      expect(dto3.success).toBe(true);

      // Branch 4: false with error
      const dto4 = new BaseResponseDto(false, 'err', undefined, {
        code: 'ERR',
      });
      expect(dto4.success).toBe(false);
    });

    it('should execute success() with default message', () => {
      const dto = BaseResponseDto.success('data');

      expect(dto.message).toBe('Operation successful');
    });

    it('should execute success() with custom message', () => {
      const dto = BaseResponseDto.success('data', 'Custom success');

      expect(dto.message).toBe('Custom success');
    });

    it('should execute error() with default code', () => {
      const dto = BaseResponseDto.error('error');

      expect(dto.error?.code).toBe('ERROR');
    });

    it('should execute error() with custom code', () => {
      const dto = BaseResponseDto.error('error', 'CUSTOM_CODE');

      expect(dto.error?.code).toBe('CUSTOM_CODE');
    });

    it('should execute error() with details', () => {
      const details = { info: 'test' };
      const dto = BaseResponseDto.error('error', 'CODE', details);

      expect(dto.error?.details).toEqual(details);
    });

    it('should execute error() without details', () => {
      const dto = BaseResponseDto.error('error', 'CODE');

      expect(dto.error?.details).toBeUndefined();
    });
  });
});
