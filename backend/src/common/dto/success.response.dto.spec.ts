import 'reflect-metadata';
import { SuccessResponseDto } from './success.response.dto';
import { BaseResponseDto } from './base.response.dto';

describe('SuccessResponseDto - White Box Testing', () => {
  describe('Constructor Tests', () => {
    it('should create SuccessResponseDto with default message', () => {
      const dto = new SuccessResponseDto();

      expect(dto.success).toBe(true);
      expect(dto.message).toBe('Operation successful');
      expect(dto.data).toBeUndefined();
      expect(dto.error).toBeUndefined();
      expect(dto.timestamp).toBeDefined();
      expect(typeof dto.timestamp).toBe('string');
    });

    it('should create SuccessResponseDto with data only', () => {
      const data = { id: 1, name: 'Test' };
      const dto = new SuccessResponseDto(data);

      expect(dto.success).toBe(true);
      expect(dto.message).toBe('Operation successful');
      expect(dto.data).toEqual(data);
      expect(dto.error).toBeUndefined();
      expect(dto.timestamp).toBeDefined();
    });

    it('should create SuccessResponseDto with custom message', () => {
      const dto = new SuccessResponseDto(undefined, 'Custom success message');

      expect(dto.success).toBe(true);
      expect(dto.message).toBe('Custom success message');
      expect(dto.data).toBeUndefined();
      expect(dto.error).toBeUndefined();
      expect(dto.timestamp).toBeDefined();
    });

    it('should create SuccessResponseDto with data and custom message', () => {
      const data = { result: 'success' };
      const message = 'Task completed successfully';
      const dto = new SuccessResponseDto(data, message);

      expect(dto.success).toBe(true);
      expect(dto.message).toBe(message);
      expect(dto.data).toEqual(data);
      expect(dto.error).toBeUndefined();
      expect(dto.timestamp).toBeDefined();
    });

    it('should create SuccessResponseDto with empty string message', () => {
      const dto = new SuccessResponseDto(undefined, '');

      expect(dto.success).toBe(true);
      expect(dto.message).toBe('');
      expect(dto.data).toBeUndefined();
      expect(dto.timestamp).toBeDefined();
    });

    it('should create SuccessResponseDto with null data', () => {
      const dto = new SuccessResponseDto(null, 'Data is null');

      expect(dto.success).toBe(true);
      expect(dto.message).toBe('Data is null');
      expect(dto.data).toBeNull();
      expect(dto.timestamp).toBeDefined();
    });

    it('should create SuccessResponseDto with empty object data', () => {
      const data = {};
      const dto = new SuccessResponseDto(data);

      expect(dto.success).toBe(true);
      expect(dto.data).toEqual(data);
      expect(dto.timestamp).toBeDefined();
    });

    it('should create SuccessResponseDto with array data', () => {
      const data = [1, 2, 3];
      const dto = new SuccessResponseDto(data);

      expect(dto.success).toBe(true);
      expect(dto.data).toEqual(data);
      expect(dto.timestamp).toBeDefined();
    });
  });

  describe('Generic Type Tests', () => {
    it('should handle SuccessResponseDto with string type', () => {
      const data = 'test string';
      const dto = new SuccessResponseDto<string>(data);

      expect(dto.data).toBe('test string');
      expect(typeof dto.data).toBe('string');
    });

    it('should handle SuccessResponseDto with number type', () => {
      const data = 42;
      const dto = new SuccessResponseDto<number>(data);

      expect(dto.data).toBe(42);
      expect(typeof dto.data).toBe('number');
    });

    it('should handle SuccessResponseDto with boolean type', () => {
      const data = true;
      const dto = new SuccessResponseDto<boolean>(data);

      expect(dto.data).toBe(true);
      expect(typeof dto.data).toBe('boolean');
    });

    it('should handle SuccessResponseDto with complex object type', () => {
      interface User {
        id: number;
        name: string;
        email: string;
      }

      const data: User = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      };
      const dto = new SuccessResponseDto<User>(data);

      expect(dto.data).toEqual(data);
      expect(dto.data?.id).toBe(1);
      expect(dto.data?.name).toBe('John Doe');
      expect(dto.data?.email).toBe('john@example.com');
    });

    it('should handle SuccessResponseDto with array of objects type', () => {
      interface Product {
        id: number;
        name: string;
        price: number;
      }

      const data: Product[] = [
        { id: 1, name: 'Product 1', price: 10.99 },
        { id: 2, name: 'Product 2', price: 20.99 },
      ];
      const dto = new SuccessResponseDto<Product[]>(data);

      expect(dto.data).toEqual(data);
      expect(dto.data?.length).toBe(2);
      expect(dto.data?.[0].name).toBe('Product 1');
    });

    it('should handle SuccessResponseDto with undefined type', () => {
      const dto = new SuccessResponseDto<undefined>();

      expect(dto.data).toBeUndefined();
      expect(dto.success).toBe(true);
    });

    it('should handle SuccessResponseDto with any type', () => {
      const data = { mixed: 'types', num: 123, bool: true };
      const dto = new SuccessResponseDto<any>(data);

      expect(dto.data).toEqual(data);
    });
  });

  describe('Inheritance from BaseResponseDto', () => {
    it('should be instance of BaseResponseDto', () => {
      const dto = new SuccessResponseDto();
      expect(dto).toBeInstanceOf(BaseResponseDto);
    });

    it('should inherit all BaseResponseDto properties', () => {
      const dto = new SuccessResponseDto({ data: 'test' });

      expect('success' in dto).toBe(true);
      expect('message' in dto).toBe(true);
      expect('data' in dto).toBe(true);
      expect('error' in dto).toBe(true);
      expect('timestamp' in dto).toBe(true);
      expect('requestId' in dto).toBe(true);
    });

    it('should always set success to true', () => {
      const dto1 = new SuccessResponseDto();
      const dto2 = new SuccessResponseDto({ id: 1 });
      const dto3 = new SuccessResponseDto(null, 'test');

      expect(dto1.success).toBe(true);
      expect(dto2.success).toBe(true);
      expect(dto3.success).toBe(true);
    });

    it('should not set error property', () => {
      const dto = new SuccessResponseDto({ data: 'test' });

      expect(dto.error).toBeUndefined();
    });

    it('should inherit timestamp property', () => {
      const dto = new SuccessResponseDto();

      expect(dto.timestamp).toBeDefined();
      expect(typeof dto.timestamp).toBe('string');
      expect(new Date(dto.timestamp).getTime()).not.toBeNaN();
    });
  });

  describe('Timestamp Generation', () => {
    it('should generate valid ISO timestamp', () => {
      const dto = new SuccessResponseDto();

      expect(dto.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it('should generate different timestamps for different instances', async () => {
      const dto1 = new SuccessResponseDto();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const dto2 = new SuccessResponseDto();

      expect(dto1.timestamp).not.toBe(dto2.timestamp);
    });

    it('should have timestamp with valid date', () => {
      const dto = new SuccessResponseDto();
      const date = new Date(dto.timestamp);

      expect(date.getTime()).not.toBeNaN();
      expect(date instanceof Date).toBe(true);
    });
  });

  describe('Message Handling', () => {
    it('should use default message when not provided', () => {
      const dto = new SuccessResponseDto({ data: 'test' });

      expect(dto.message).toBe('Operation successful');
    });

    it('should use custom message when provided', () => {
      const customMessage = 'Custom success message';
      const dto = new SuccessResponseDto({ data: 'test' }, customMessage);

      expect(dto.message).toBe(customMessage);
    });

    it('should handle long message', () => {
      const longMessage = 'a'.repeat(1000);
      const dto = new SuccessResponseDto(undefined, longMessage);

      expect(dto.message).toBe(longMessage);
      expect(dto.message.length).toBe(1000);
    });

    it('should handle message with special characters', () => {
      const specialMessage = 'Success! 🎉 Operation completed @#$%';
      const dto = new SuccessResponseDto(undefined, specialMessage);

      expect(dto.message).toBe(specialMessage);
    });

    it('should handle message with unicode', () => {
      const unicodeMessage = '操作成功！✅';
      const dto = new SuccessResponseDto(undefined, unicodeMessage);

      expect(dto.message).toBe(unicodeMessage);
    });

    it('should handle message with newlines', () => {
      const multilineMessage = 'Operation\ncompleted\nsuccessfully';
      const dto = new SuccessResponseDto(undefined, multilineMessage);

      expect(dto.message).toBe(multilineMessage);
    });
  });

  describe('Data Handling', () => {
    it('should handle primitive string data', () => {
      const dto = new SuccessResponseDto('test data');

      expect(dto.data).toBe('test data');
      expect(typeof dto.data).toBe('string');
    });

    it('should handle primitive number data', () => {
      const dto = new SuccessResponseDto(42);

      expect(dto.data).toBe(42);
      expect(typeof dto.data).toBe('number');
    });

    it('should handle primitive boolean data', () => {
      const dto = new SuccessResponseDto(true);

      expect(dto.data).toBe(true);
      expect(typeof dto.data).toBe('boolean');
    });

    it('should handle object data', () => {
      const data = { id: 1, name: 'Test' };
      const dto = new SuccessResponseDto(data);

      expect(dto.data).toEqual(data);
      expect(typeof dto.data).toBe('object');
    });

    it('should handle array data', () => {
      const data = [1, 2, 3, 4, 5];
      const dto = new SuccessResponseDto(data);

      expect(dto.data).toEqual(data);
      expect(Array.isArray(dto.data)).toBe(true);
    });

    it('should handle nested object data', () => {
      const data = {
        user: {
          id: 1,
          name: 'John',
          address: {
            city: 'New York',
            country: 'USA',
          },
        },
      };
      const dto = new SuccessResponseDto(data);

      expect(dto.data).toEqual(data);
      expect(dto.data?.user.name).toBe('John');
      expect(dto.data?.user.address.city).toBe('New York');
    });

    it('should handle complex nested data', () => {
      const data = {
        users: [
          { id: 1, name: 'User 1', active: true },
          { id: 2, name: 'User 2', active: false },
        ],
        metadata: {
          total: 2,
          page: 1,
        },
      };
      const dto = new SuccessResponseDto(data);

      expect(dto.data).toEqual(data);
      expect(dto.data?.users.length).toBe(2);
      expect(dto.data?.metadata.total).toBe(2);
    });

    it('should handle function in data', () => {
      const data = {
        id: 1,
        callback: function () {
          return 'test';
        },
      };
      const dto = new SuccessResponseDto(data);

      expect(dto.data).toBeDefined();
      expect(dto.data?.id).toBe(1);
    });

    it('should handle Date object in data', () => {
      const data = new Date('2024-01-01');
      const dto = new SuccessResponseDto(data);

      expect(dto.data).toBeInstanceOf(Date);
      expect(dto.data?.getTime()).toBe(new Date('2024-01-01').getTime());
    });
  });

  describe('Combined Scenarios', () => {
    it('should handle SuccessResponseDto with all properties', () => {
      const data = { id: 1, name: 'Test' };
      const message = 'Operation completed';
      const dto = new SuccessResponseDto(data, message);

      expect(dto.success).toBe(true);
      expect(dto.message).toBe(message);
      expect(dto.data).toEqual(data);
      expect(dto.timestamp).toBeDefined();
    });

    it('should handle SuccessResponseDto with data but no message (uses default)', () => {
      const data = { result: 'success' };
      const dto = new SuccessResponseDto(data);

      expect(dto.success).toBe(true);
      expect(dto.message).toBe('Operation successful');
      expect(dto.data).toEqual(data);
    });

    it('should handle SuccessResponseDto with message but no data', () => {
      const message = 'Created successfully';
      const dto = new SuccessResponseDto(undefined, message);

      expect(dto.success).toBe(true);
      expect(dto.message).toBe(message);
      expect(dto.data).toBeUndefined();
    });
  });

  describe('Real-world Scenarios', () => {
    it('should work for user creation success response', () => {
      const userData = {
        id: 123,
        username: 'johndoe',
        email: 'john@example.com',
        createdAt: new Date().toISOString(),
      };
      const message = 'User created successfully';
      const dto = new SuccessResponseDto(userData, message);

      expect(dto.success).toBe(true);
      expect(dto.message).toBe(message);
      expect(dto.data?.id).toBe(123);
      expect(dto.data?.username).toBe('johndoe');
    });

    it('should work for login success response', () => {
      const loginData = {
        accessToken: 'token123',
        refreshToken: 'refresh456',
        user: { id: 1, username: 'johndoe' },
      };
      const message = 'Login successful';
      const dto = new SuccessResponseDto(loginData, message);

      expect(dto.success).toBe(true);
      expect(dto.message).toBe(message);
      expect(dto.data?.accessToken).toBe('token123');
    });

    it('should work for file upload success response', () => {
      const fileData = {
        filename: 'document.pdf',
        url: '/uploads/document.pdf',
        size: 1024,
        mimetype: 'application/pdf',
      };
      const message = 'File uploaded successfully';
      const dto = new SuccessResponseDto(fileData, message);

      expect(dto.success).toBe(true);
      expect(dto.message).toBe(message);
      expect(dto.data?.filename).toBe('document.pdf');
    });

    it('should work for data retrieval success response', () => {
      const data = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ];
      const message = 'Data retrieved successfully';
      const dto = new SuccessResponseDto(data, message);

      expect(dto.success).toBe(true);
      expect(dto.message).toBe(message);
      expect(Array.isArray(dto.data)).toBe(true);
      expect(dto.data?.length).toBe(3);
    });

    it('should work for update operation success response', () => {
      const updateData = {
        id: 456,
        updatedFields: ['name', 'email'],
        timestamp: new Date().toISOString(),
      };
      const message = 'Update successful';
      const dto = new SuccessResponseDto(updateData, message);

      expect(dto.success).toBe(true);
      expect(dto.message).toBe(message);
      expect(dto.data?.id).toBe(456);
    });

    it('should work for delete operation success response', () => {
      const message = 'Item deleted successfully';
      const dto = new SuccessResponseDto(undefined, message);

      expect(dto.success).toBe(true);
      expect(dto.message).toBe(message);
      expect(dto.data).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty object as data', () => {
      const dto = new SuccessResponseDto({});

      expect(dto.success).toBe(true);
      expect(dto.data).toEqual({});
    });

    it('should handle empty array as data', () => {
      const dto = new SuccessResponseDto([]);

      expect(dto.success).toBe(true);
      expect(Array.isArray(dto.data)).toBe(true);
      expect(dto.data?.length).toBe(0);
    });

    it('should handle undefined as data', () => {
      const dto = new SuccessResponseDto(undefined);

      expect(dto.success).toBe(true);
      expect(dto.data).toBeUndefined();
    });

    it('should handle null as data', () => {
      const dto = new SuccessResponseDto(null);

      expect(dto.success).toBe(true);
      expect(dto.data).toBeNull();
    });

    it('should handle zero as data', () => {
      const dto = new SuccessResponseDto(0);

      expect(dto.success).toBe(true);
      expect(dto.data).toBe(0);
    });

    it('should handle empty string as data', () => {
      const dto = new SuccessResponseDto('');

      expect(dto.success).toBe(true);
      expect(dto.data).toBe('');
    });

    it('should handle false as data', () => {
      const dto = new SuccessResponseDto(false);

      expect(dto.success).toBe(true);
      expect(dto.data).toBe(false);
    });

    it('should handle very large object as data', () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        value: `value-${i}`,
      }));
      const dto = new SuccessResponseDto(largeData);

      expect(dto.success).toBe(true);
      expect(dto.data?.length).toBe(10000);
    });

    it('should handle circular reference in data (not stringify properly)', () => {
      const data: any = { id: 1 };
      data.self = data;
      const dto = new SuccessResponseDto(data);

      expect(dto.success).toBe(true);
      expect(dto.data?.id).toBe(1);
      expect(dto.data?.self).toBeDefined();
    });

    it('should handle data with NaN', () => {
      const data = { value: NaN };
      const dto = new SuccessResponseDto(data);

      expect(dto.success).toBe(true);
      expect(isNaN(dto.data?.value as number)).toBe(true);
    });

    it('should handle data with Infinity', () => {
      const data = { value: Infinity };
      const dto = new SuccessResponseDto(data);

      expect(dto.success).toBe(true);
      expect(dto.data?.value).toBe(Infinity);
    });
  });

  describe('JSON Serialization', () => {
    it('should serialize to JSON correctly', () => {
      const data = { id: 1, name: 'Test' };
      const dto = new SuccessResponseDto(data, 'Success');

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.success).toBe(true);
      expect(parsed.message).toBe('Success');
      expect(parsed.data).toEqual(data);
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.error).toBeUndefined();
    });

    it('should serialize complex object to JSON', () => {
      const data = {
        users: [{ id: 1, name: 'John' }],
        metadata: { page: 1, total: 1 },
      };
      const dto = new SuccessResponseDto(data, 'Data loaded');

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.success).toBe(true);
      expect(parsed.data.users[0].name).toBe('John');
      expect(parsed.data.metadata.page).toBe(1);
    });

    it('should not serialize error property (undefined properties are omitted in JSON)', () => {
      const dto = new SuccessResponseDto({ id: 1 }, 'Success');

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      // When error is undefined, JSON.stringify omits it
      expect('error' in parsed).toBe(false);
      expect(parsed.error).toBeUndefined();
    });

    it('should serialize Date object in data correctly', () => {
      const date = new Date('2024-01-01');
      const dto = new SuccessResponseDto({ createdAt: date }, 'Success');

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.data.createdAt).toBe(date.toISOString());
    });
  });

  describe('Type Safety', () => {
    it('should maintain correct types for all properties', () => {
      const dto = new SuccessResponseDto({ id: 1, name: 'Test' }, 'Success');

      expect(typeof dto.success).toBe('boolean');
      expect(typeof dto.message).toBe('string');
      expect(typeof dto.timestamp).toBe('string');
      expect(dto.data).toBeDefined();
    });

    it('should maintain success as boolean true', () => {
      const dto = new SuccessResponseDto();
      const successValue: boolean = dto.success;

      expect(successValue).toBe(true);
      expect(typeof successValue).toBe('boolean');
    });

    it('should maintain message as string', () => {
      const dto = new SuccessResponseDto(undefined, 'Test message');
      const message: string = dto.message;

      expect(typeof message).toBe('string');
      expect(message).toBe('Test message');
    });
  });

  describe('Property Assignment', () => {
    it('should allow property modification', () => {
      const dto = new SuccessResponseDto({ id: 1 }, 'Initial message');

      dto.requestId = 'req-123';

      expect(dto.requestId).toBe('req-123');
    });

    it('should allow multiple property modifications', () => {
      const dto = new SuccessResponseDto({ id: 1 }, 'Initial');

      dto.requestId = 'req-456';
      dto.message = 'Modified message';

      expect(dto.requestId).toBe('req-456');
      expect(dto.message).toBe('Modified message');
      expect(dto.success).toBe(true);
    });
  });
});
