import { ApiResponseDto } from './api.response.dto';
import { ValidationErrorDto } from './validation.error.dto';

describe('ApiResponseDto - Comprehensive Input/Output Testing', () => {
  describe('Constructor Tests', () => {
    describe('With all parameters', () => {
      it('should create ApiResponseDto with all fields provided', () => {
        const errors = [
          new ValidationErrorDto('email', 'Invalid email format', 'test'),
        ];
        const meta = {
          timestamp: '2023-01-01T00:00:00.000Z',
          requestId: 'req-123',
          version: '2.0.0',
        };

        const dto = new ApiResponseDto(
          true,
          'test-data',
          'success',
          errors,
          meta,
        );

        expect(dto.success).toBe(true);
        expect(dto.data).toBe('test-data');
        expect(dto.message).toBe('success');
        expect(dto.errors).toEqual(errors);
        expect(dto.meta).toEqual(meta);
      });

      it('should create ApiResponseDto with success false', () => {
        const errors = [
          new ValidationErrorDto('username', 'Username is required'),
        ];

        const dto = new ApiResponseDto(
          false,
          undefined,
          'error occurred',
          errors,
        );

        expect(dto.success).toBe(false);
        expect(dto.data).toBeUndefined();
        expect(dto.message).toBe('error occurred');
        expect(dto.errors).toEqual(errors);
      });
    });

    describe('With partial parameters', () => {
      it('should create ApiResponseDto with only success and data', () => {
        const dto = new ApiResponseDto(true, 'data');

        expect(dto.success).toBe(true);
        expect(dto.data).toBe('data');
        expect(dto.message).toBeUndefined();
        expect(dto.errors).toBeUndefined();
        expect(dto.meta).toBeDefined();
        expect(dto.meta?.timestamp).toBeDefined();
      });

      it('should create ApiResponseDto with success and message only', () => {
        const dto = new ApiResponseDto(true, undefined, 'operation successful');

        expect(dto.success).toBe(true);
        expect(dto.data).toBeUndefined();
        expect(dto.message).toBe('operation successful');
        expect(dto.errors).toBeUndefined();
      });

      it('should create ApiResponseDto with only success flag', () => {
        const dto = new ApiResponseDto(false);

        expect(dto.success).toBe(false);
        expect(dto.data).toBeUndefined();
        expect(dto.message).toBeUndefined();
        expect(dto.errors).toBeUndefined();
        expect(dto.meta).toBeDefined();
      });
    });

    describe('With meta parameter variations', () => {
      it('should use provided meta timestamp', () => {
        const customMeta = { timestamp: '2023-01-01T00:00:00.000Z' };
        const dto = new ApiResponseDto(
          true,
          'data',
          undefined,
          undefined,
          customMeta,
        );

        expect(dto.meta?.timestamp).toBe('2023-01-01T00:00:00.000Z');
      });

      it('should auto-generate timestamp when meta is undefined', () => {
        const beforeTime = new Date().toISOString();
        const dto = new ApiResponseDto(true);
        const afterTime = new Date().toISOString();

        expect(dto.meta?.timestamp).toBeDefined();
        expect(dto.meta?.timestamp >= beforeTime).toBe(true);
        expect(dto.meta?.timestamp <= afterTime).toBe(true);
      });

      it('should set default version to 1.0.0 when meta is undefined', () => {
        const dto = new ApiResponseDto(true);

        expect(dto.meta?.version).toBe('1.0.0');
      });

      it('should include requestId when provided in meta', () => {
        const customMeta = {
          timestamp: '2023-01-01T00:00:00.000Z',
          requestId: 'req-456',
          version: '1.5.0',
        };
        const dto = new ApiResponseDto(
          true,
          'data',
          undefined,
          undefined,
          customMeta,
        );

        expect(dto.meta?.requestId).toBe('req-456');
        expect(dto.meta?.version).toBe('1.5.0');
      });
    });
  });

  describe('Static success() Method Tests', () => {
    it('should create success response with data only', () => {
      const dto = ApiResponseDto.success('test-data');

      expect(dto.success).toBe(true);
      expect(dto.data).toBe('test-data');
      expect(dto.message).toBeUndefined();
      expect(dto.errors).toBeUndefined();
      expect(dto.meta).toBeDefined();
    });

    it('should create success response with data and message', () => {
      const dto = ApiResponseDto.success('test-data', 'Operation successful');

      expect(dto.success).toBe(true);
      expect(dto.data).toBe('test-data');
      expect(dto.message).toBe('Operation successful');
      expect(dto.errors).toBeUndefined();
    });

    it('should create success response with message only', () => {
      const dto = ApiResponseDto.success(undefined, 'Operation successful');

      expect(dto.success).toBe(true);
      expect(dto.data).toBeUndefined();
      expect(dto.message).toBe('Operation successful');
      expect(dto.meta).toBeDefined();
    });

    it('should create success response with no parameters', () => {
      const dto = ApiResponseDto.success();

      expect(dto.success).toBe(true);
      expect(dto.data).toBeUndefined();
      expect(dto.message).toBeUndefined();
      expect(dto.meta).toBeDefined();
    });

    it('should create success response with object data', () => {
      const userData = { id: '123', name: 'John' };
      const dto = ApiResponseDto.success(userData);

      expect(dto.success).toBe(true);
      expect(dto.data).toEqual(userData);
      expect(dto.data.id).toBe('123');
      expect(dto.data.name).toBe('John');
    });

    it('should create success response with array data', () => {
      const arrayData = [{ id: '1' }, { id: '2' }];
      const dto = ApiResponseDto.success(arrayData);

      expect(dto.success).toBe(true);
      expect(dto.data).toEqual(arrayData);
      expect(Array.isArray(dto.data)).toBe(true);
      expect(dto.data.length).toBe(2);
    });

    it('should create success response with number data', () => {
      const dto = ApiResponseDto.success(42);

      expect(dto.success).toBe(true);
      expect(dto.data).toBe(42);
      expect(typeof dto.data).toBe('number');
    });

    it('should create success response with boolean data', () => {
      const dto = ApiResponseDto.success(true);

      expect(dto.success).toBe(true);
      expect(dto.data).toBe(true);
      expect(typeof dto.data).toBe('boolean');
    });

    it('should create success response with null data', () => {
      const dto = ApiResponseDto.success(null);

      expect(dto.success).toBe(true);
      expect(dto.data).toBeNull();
    });

    it('should maintain type safety with generics', () => {
      interface User {
        name: string;
        age: number;
      }

      const user: User = { name: 'John', age: 30 };
      const dto = ApiResponseDto.success<User>(user);

      expect(dto.data?.name).toBe('John');
      expect(dto.data?.age).toBe(30);
    });
  });

  describe('Static error() Method Tests', () => {
    it('should create error response with message only', () => {
      const dto = ApiResponseDto.error('An error occurred');

      expect(dto.success).toBe(false);
      expect(dto.data).toBeUndefined();
      expect(dto.message).toBe('An error occurred');
      expect(dto.errors).toBeUndefined();
      expect(dto.meta).toBeDefined();
    });

    it('should create error response with message and validation errors', () => {
      const errors = [
        new ValidationErrorDto('email', 'Invalid email', 'test@'),
        new ValidationErrorDto('password', 'Password is required'),
      ];
      const dto = ApiResponseDto.error('Validation failed', errors);

      expect(dto.success).toBe(false);
      expect(dto.data).toBeUndefined();
      expect(dto.message).toBe('Validation failed');
      expect(dto.errors).toEqual(errors);
      expect(dto.errors?.length).toBe(2);
    });

    it('should create error response with empty errors array', () => {
      const dto = ApiResponseDto.error('Error occurred', []);

      expect(dto.success).toBe(false);
      expect(dto.message).toBe('Error occurred');
      expect(dto.errors).toEqual([]);
      expect(dto.errors?.length).toBe(0);
    });

    it('should create error response with single validation error', () => {
      const error = new ValidationErrorDto(
        'username',
        'Username must be unique',
        'john',
      );
      const dto = ApiResponseDto.error('Validation failed', [error]);

      expect(dto.success).toBe(false);
      expect(dto.message).toBe('Validation failed');
      expect(dto.errors?.length).toBe(1);
      expect(dto.errors?.[0]?.field).toBe('username');
      expect(dto.errors?.[0]?.message).toBe('Username must be unique');
      expect(dto.errors?.[0]?.value).toBe('john');
    });
  });

  describe('Edge Cases and Special Values', () => {
    it('should handle empty string data', () => {
      const dto = ApiResponseDto.success('');

      expect(dto.success).toBe(true);
      expect(dto.data).toBe('');
      expect(dto.data).toHaveLength(0);
    });

    it('should handle number zero data', () => {
      const dto = ApiResponseDto.success(0);

      expect(dto.success).toBe(true);
      expect(dto.data).toBe(0);
    });

    it('should handle empty object data', () => {
      const dto = ApiResponseDto.success({});

      expect(dto.success).toBe(true);
      expect(dto.data).toEqual({});
      expect(Object.keys(dto.data || {})).toHaveLength(0);
    });

    it('should handle empty array data', () => {
      const dto = ApiResponseDto.success([]);

      expect(dto.success).toBe(true);
      expect(dto.data).toEqual([]);
      expect(Array.isArray(dto.data)).toBe(true);
      expect(dto.data).toHaveLength(0);
    });

    it('should handle very long string message', () => {
      const longMessage = 'a'.repeat(1000);
      const dto = ApiResponseDto.error(longMessage);

      expect(dto.message).toBe(longMessage);
      expect(dto.message.length).toBe(1000);
    });

    it('should handle emoji and special characters in message', () => {
      const dto = ApiResponseDto.error('Error! 🚫 Special chars: @#$%');

      expect(dto.message).toBe('Error! 🚫 Special chars: @#$%');
    });

    it('should handle multiple validation errors', () => {
      const errors = Array.from(
        { length: 10 },
        (_, i) =>
          new ValidationErrorDto(`field${i}`, `Error ${i}`, `value${i}`),
      );
      const dto = ApiResponseDto.error('Multiple errors', errors);

      expect(dto.errors?.length).toBe(10);
      errors.forEach((error, index) => {
        expect(dto.errors?.[index]).toEqual(error);
      });
    });
  });

  describe('Type Safety and TypeScript Features', () => {
    it('should preserve type information for object types', () => {
      interface Product {
        id: string;
        name: string;
        price: number;
      }

      const product: Product = { id: '1', name: 'Laptop', price: 999 };
      const dto = ApiResponseDto.success<Product>(product);

      if (dto.data) {
        expect(dto.data.id).toBe('1');
        expect(dto.data.name).toBe('Laptop');
        expect(dto.data.price).toBe(999);
      }
    });

    it('should support union types', () => {
      type StringOrNumber = string | number;
      const dto1 = ApiResponseDto.success<StringOrNumber>('test');
      const dto2 = ApiResponseDto.success<StringOrNumber>(42);

      expect(typeof dto1.data).toBe('string');
      expect(typeof dto2.data).toBe('number');
    });

    it('should support array types', () => {
      const dto = ApiResponseDto.success<string[]>(['a', 'b', 'c']);

      expect(Array.isArray(dto.data)).toBe(true);
      expect(dto.data).toEqual(['a', 'b', 'c']);
    });
  });

  describe('Meta Property Tests', () => {
    it('should auto-generate ISO timestamp', () => {
      const beforeTime = new Date();
      const dto = ApiResponseDto.success('test');
      const afterTime = new Date();

      const timestamp = new Date(dto.meta?.timestamp || '');
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp >= beforeTime).toBe(true);
      expect(timestamp <= afterTime).toBe(true);
    });

    it('should set version to 1.0.0 by default', () => {
      const dto = ApiResponseDto.success('test');

      expect(dto.meta?.version).toBe('1.0.0');
    });

    it('should allow custom meta in constructor', () => {
      const customMeta = {
        timestamp: '2023-01-01T00:00:00.000Z',
        requestId: 'custom-123',
        version: '2.5.0',
      };
      const dto = new ApiResponseDto(
        true,
        'data',
        undefined,
        undefined,
        customMeta,
      );

      expect(dto.meta).toEqual(customMeta);
    });

    it('should handle meta with pagination', () => {
      const customMeta = {
        timestamp: '2023-01-01T00:00:00.000Z',
        pagination: {
          page: 1,
          limit: 20,
          total: 100,
          totalPages: 5,
        },
      };
      const dto = new ApiResponseDto(
        true,
        'data',
        undefined,
        undefined,
        customMeta,
      );

      expect(dto.meta?.pagination).toBeDefined();
      expect(dto.meta?.pagination?.page).toBe(1);
      expect(dto.meta?.pagination?.total).toBe(100);
    });
  });

  describe('ValidationErrorDto Integration', () => {
    it('should include ValidationErrorDto in errors array', () => {
      const error = new ValidationErrorDto(
        'email',
        'Invalid format',
        'bad@email',
      );
      const dto = ApiResponseDto.error('Validation failed', [error]);

      expect(dto.errors?.[0]).toBeInstanceOf(ValidationErrorDto);
      expect(dto.errors?.[0]?.field).toBe('email');
      expect(dto.errors?.[0]?.message).toBe('Invalid format');
      expect(dto.errors?.[0]?.value).toBe('bad@email');
    });

    it('should handle multiple ValidationErrorDto objects', () => {
      const errors = [
        new ValidationErrorDto('field1', 'Error 1'),
        new ValidationErrorDto('field2', 'Error 2', 'test'),
        new ValidationErrorDto('field3', 'Error 3'),
      ];
      const dto = ApiResponseDto.error('Multiple errors', errors);

      expect(dto.errors?.length).toBe(3);
      expect(dto.errors?.every((e) => e instanceof ValidationErrorDto)).toBe(
        true,
      );
    });

    it('should handle ValidationErrorDto with undefined value', () => {
      const error = new ValidationErrorDto('password', 'Password required');
      const dto = ApiResponseDto.error('Validation failed', [error]);

      expect(dto.errors?.[0]?.value).toBeUndefined();
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should work for successful user creation', () => {
      const user = { id: '123', name: 'John Doe', email: 'john@example.com' };
      const dto = ApiResponseDto.success(user, 'User created successfully');

      expect(dto.success).toBe(true);
      expect(dto.data).toEqual(user);
      expect(dto.message).toBe('User created successfully');
    });

    it('should work for validation error scenario', () => {
      const errors = [
        new ValidationErrorDto('email', 'Email is required'),
        new ValidationErrorDto(
          'password',
          'Password must be at least 8 characters',
        ),
      ];
      const dto = ApiResponseDto.error('Validation failed', errors);

      expect(dto.success).toBe(false);
      expect(dto.message).toBe('Validation failed');
      expect(dto.errors?.length).toBe(2);
    });

    it('should work for paginated list response', () => {
      const users = [{ id: '1' }, { id: '2' }, { id: '3' }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
      };
      const meta = {
        timestamp: new Date().toISOString(),
        pagination,
      };

      const dto = new ApiResponseDto(
        true,
        users,
        'Users retrieved',
        undefined,
        meta,
      );

      expect(dto.success).toBe(true);
      expect(Array.isArray(dto.data)).toBe(true);
      expect(dto.data?.length).toBe(3);
      expect(dto.meta?.pagination).toEqual(pagination);
    });

    it('should work for empty result with success', () => {
      const dto = ApiResponseDto.success([], 'No items found');

      expect(dto.success).toBe(true);
      expect(dto.data).toEqual([]);
      expect(dto.message).toBe('No items found');
    });

    it('should work for error without validation errors', () => {
      const dto = ApiResponseDto.error('Internal server error');

      expect(dto.success).toBe(false);
      expect(dto.message).toBe('Internal server error');
      expect(dto.errors).toBeUndefined();
    });
  });

  describe('Property Assignment Tests', () => {
    it('should allow reassignment of properties', () => {
      const dto = ApiResponseDto.success('initial');

      dto.data = 'modified';
      dto.message = 'Custom message';
      dto.meta = { timestamp: 'custom-time', version: '2.0.0' };

      expect(dto.data).toBe('modified');
      expect(dto.message).toBe('Custom message');
      expect(dto.meta?.timestamp).toBe('custom-time');
    });

    it('should allow adding pagination to meta', () => {
      const dto = ApiResponseDto.success('data');
      dto.meta!.pagination = { page: 1, limit: 10, total: 50, totalPages: 5 };

      expect(dto.meta?.pagination).toBeDefined();
      expect(dto.meta?.pagination?.total).toBe(50);
    });
  });

  describe('JSON Serialization', () => {
    it('should serialize correctly to JSON', () => {
      const dto = ApiResponseDto.success({ name: 'test' }, 'Success');
      const json = JSON.stringify(dto);

      expect(json).toContain('"success":true');
      expect(json).toContain('"name":"test"');
      expect(json).toContain('"message":"Success"');
    });

    it('should serialize with errors to JSON', () => {
      const errors = [new ValidationErrorDto('field', 'message', 'value')];
      const dto = ApiResponseDto.error('Error', errors);
      const json = JSON.stringify(dto);

      expect(json).toContain('"success":false');
      expect(json).toContain('"field":"field"');
      expect(json).toContain('"message":"message"');
    });

    it('should serialize meta with pagination', () => {
      const dto = new ApiResponseDto(true, 'data', undefined, undefined, {
        timestamp: '2023-01-01',
        pagination: { page: 1, limit: 10, total: 100, totalPages: 10 },
      });

      const json = JSON.stringify(dto);
      expect(json).toContain('"pagination"');
      expect(json).toContain('"total":100');
    });
  });
});
