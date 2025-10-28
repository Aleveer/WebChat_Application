import 'reflect-metadata';
import { SuccessResponseDto } from '../src/common/dto/success.response.dto';
import { BaseResponseDto } from '../src/common/dto/base.response.dto';

describe('SuccessResponseDto - White Box Testing (Input-Output)', () => {
  describe('Constructor with Default Message', () => {
    /**
     * Test Case 1: Kiểm tra constructor không parameters
     * Input: No parameters
     * Expected Output: success=true, default message, undefined data
     * Path Coverage: Default constructor
     */
    it('TC001: should create instance with default values', () => {
      const dto = new SuccessResponseDto();

      expect(dto.success).toBe(true);
      expect(dto.message).toBe('Operation successful');
      expect(dto.data).toBeUndefined();
      expect(dto.timestamp).toBeDefined();
      expect(typeof dto.timestamp).toBe('string');
    });

    /**
     * Test Case 2: Kiểm tra instance type
     * Input: New instance
     * Expected Output: Instance of SuccessResponseDto and BaseResponseDto
     * Path Coverage: Instance validation
     */
    it('TC002: should be instance of SuccessResponseDto and BaseResponseDto', () => {
      const dto = new SuccessResponseDto();

      expect(dto).toBeInstanceOf(SuccessResponseDto);
      expect(dto).toBeInstanceOf(BaseResponseDto);
    });

    /**
     * Test Case 3: Kiểm tra success always true
     * Input: Create multiple instances
     * Expected Output: All have success=true
     * Path Coverage: Success flag validation
     */
    it('TC003: should always have success flag as true', () => {
      const dto1 = new SuccessResponseDto();
      const dto2 = new SuccessResponseDto('data');
      const dto3 = new SuccessResponseDto('data', 'Custom message');

      expect(dto1.success).toBe(true);
      expect(dto2.success).toBe(true);
      expect(dto3.success).toBe(true);
    });
  });

  describe('Constructor with Data Only', () => {
    /**
     * Test Case 4: Kiểm tra với string data
     * Input: data = 'test'
     * Expected Output: data='test', default message
     * Path Coverage: String data
     */
    it('TC004: should accept string data with default message', () => {
      const dto = new SuccessResponseDto('test');

      expect(dto.success).toBe(true);
      expect(dto.data).toBe('test');
      expect(dto.message).toBe('Operation successful');
      expect(dto.timestamp).toBeDefined();
    });

    /**
     * Test Case 5: Kiểm tra với number data
     * Input: data = 123
     * Expected Output: data=123, default message
     * Path Coverage: Number data
     */
    it('TC005: should accept number data with default message', () => {
      const dto = new SuccessResponseDto(123);

      expect(dto.success).toBe(true);
      expect(dto.data).toBe(123);
      expect(dto.message).toBe('Operation successful');
    });

    /**
     * Test Case 6: Kiểm tra với boolean data
     * Input: data = true
     * Expected Output: data=true, default message
     * Path Coverage: Boolean data
     */
    it('TC006: should accept boolean data with default message', () => {
      const dto = new SuccessResponseDto(true);

      expect(dto.success).toBe(true);
      expect(dto.data).toBe(true);
      expect(dto.message).toBe('Operation successful');
    });

    /**
     * Test Case 7: Kiểm tra với object data
     * Input: data = { id: 1, name: 'test' }
     * Expected Output: data object, default message
     * Path Coverage: Object data
     */
    it('TC007: should accept object data with default message', () => {
      const testData = { id: 1, name: 'test' };
      const dto = new SuccessResponseDto(testData);

      expect(dto.success).toBe(true);
      expect(dto.data).toEqual(testData);
      expect(dto.data).toBe(testData); // Same reference
      expect(dto.message).toBe('Operation successful');
    });

    /**
     * Test Case 8: Kiểm tra với array data
     * Input: data = [1, 2, 3]
     * Expected Output: data array, default message
     * Path Coverage: Array data
     */
    it('TC008: should accept array data with default message', () => {
      const testData = [1, 2, 3];
      const dto = new SuccessResponseDto(testData);

      expect(dto.success).toBe(true);
      expect(dto.data).toEqual(testData);
      expect(dto.data).toBe(testData); // Same reference
      expect(dto.message).toBe('Operation successful');
    });

    /**
     * Test Case 9: Kiểm tra với null data
     * Input: data = null
     * Expected Output: data=null, default message
     * Path Coverage: Null data
     */
    it('TC009: should accept null data with default message', () => {
      const dto = new SuccessResponseDto(null);

      expect(dto.success).toBe(true);
      expect(dto.data).toBeNull();
      expect(dto.message).toBe('Operation successful');
    });

    /**
     * Test Case 10: Kiểm tra với undefined data explicitly
     * Input: data = undefined
     * Expected Output: data=undefined, default message
     * Path Coverage: Explicit undefined
     */
    it('TC010: should accept undefined data explicitly', () => {
      const dto = new SuccessResponseDto(undefined);

      expect(dto.success).toBe(true);
      expect(dto.data).toBeUndefined();
      expect(dto.message).toBe('Operation successful');
    });

    /**
     * Test Case 11: Kiểm tra với empty object
     * Input: data = {}
     * Expected Output: data={}, default message
     * Path Coverage: Empty object
     */
    it('TC011: should accept empty object', () => {
      const dto = new SuccessResponseDto({});

      expect(dto.success).toBe(true);
      expect(dto.data).toEqual({});
      expect(dto.message).toBe('Operation successful');
    });

    /**
     * Test Case 12: Kiểm tra với empty array
     * Input: data = []
     * Expected Output: data=[], default message
     * Path Coverage: Empty array
     */
    it('TC012: should accept empty array', () => {
      const dto = new SuccessResponseDto([]);

      expect(dto.success).toBe(true);
      expect(dto.data).toEqual([]);
      expect(dto.message).toBe('Operation successful');
    });
  });

  describe('Constructor with Data and Custom Message', () => {
    /**
     * Test Case 13: Kiểm tra với custom message
     * Input: data='test', message='Custom success'
     * Expected Output: Custom message displayed
     * Path Coverage: Custom message
     */
    it('TC013: should accept custom message', () => {
      const dto = new SuccessResponseDto('test', 'Custom success');

      expect(dto.success).toBe(true);
      expect(dto.data).toBe('test');
      expect(dto.message).toBe('Custom success');
    });

    /**
     * Test Case 14: Kiểm tra với empty message
     * Input: data='test', message=''
     * Expected Output: Empty message accepted
     * Path Coverage: Empty message
     */
    it('TC014: should accept empty message', () => {
      const dto = new SuccessResponseDto('test', '');

      expect(dto.success).toBe(true);
      expect(dto.data).toBe('test');
      expect(dto.message).toBe('');
    });

    /**
     * Test Case 15: Kiểm tra với long message
     * Input: Very long message
     * Expected Output: Long message accepted
     * Path Coverage: Long message
     */
    it('TC015: should accept long message', () => {
      const longMessage = 'A'.repeat(500);
      const dto = new SuccessResponseDto('test', longMessage);

      expect(dto.success).toBe(true);
      expect(dto.message).toBe(longMessage);
      expect(dto.message.length).toBe(500);
    });

    /**
     * Test Case 16: Kiểm tra với special characters in message
     * Input: message with special chars
     * Expected Output: Special chars preserved
     * Path Coverage: Special characters
     */
    it('TC016: should accept message with special characters', () => {
      const message = 'Success! 🎉 @#$%^&*()';
      const dto = new SuccessResponseDto('test', message);

      expect(dto.success).toBe(true);
      expect(dto.message).toBe(message);
    });

    /**
     * Test Case 17: Kiểm tra với Unicode message
     * Input: Unicode message
     * Expected Output: Unicode preserved
     * Path Coverage: Unicode
     */
    it('TC017: should accept Unicode in message', () => {
      const message = '操作成功 🚀';
      const dto = new SuccessResponseDto('test', message);

      expect(dto.success).toBe(true);
      expect(dto.message).toBe(message);
    });

    /**
     * Test Case 18: Kiểm tra với multiline message
     * Input: Multiline message
     * Expected Output: Multiline preserved
     * Path Coverage: Multiline
     */
    it('TC018: should accept multiline message', () => {
      const message = 'Line 1\nLine 2\nLine 3';
      const dto = new SuccessResponseDto('test', message);

      expect(dto.success).toBe(true);
      expect(dto.message).toBe(message);
    });
  });

  describe('Generic Type Support', () => {
    /**
     * Test Case 19: Kiểm tra với typed interface
     * Input: User interface type
     * Expected Output: Type-safe data
     * Path Coverage: Interface type
     */
    it('TC019: should support typed interface data', () => {
      interface User {
        id: number;
        name: string;
        email: string;
      }

      const userData: User = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      };

      const dto = new SuccessResponseDto<User>(userData);

      expect(dto.success).toBe(true);
      expect(dto.data).toEqual(userData);
      expect(dto.data?.id).toBe(1);
      expect(dto.data?.name).toBe('John Doe');
      expect(dto.data?.email).toBe('john@example.com');
    });

    /**
     * Test Case 20: Kiểm tra với array of typed objects
     * Input: Array of User objects
     * Expected Output: Type-safe array
     * Path Coverage: Array of objects
     */
    it('TC020: should support array of typed objects', () => {
      interface User {
        id: number;
        name: string;
      }

      const users: User[] = [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' },
      ];

      const dto = new SuccessResponseDto<User[]>(users);

      expect(dto.success).toBe(true);
      expect(dto.data).toEqual(users);
      expect(dto.data?.length).toBe(2);
      expect(dto.data?.[0].id).toBe(1);
    });

    /**
     * Test Case 21: Kiểm tra với nested objects
     * Input: Nested object structure
     * Expected Output: Nested structure preserved
     * Path Coverage: Nested objects
     */
    it('TC021: should support nested object structures', () => {
      const nestedData = {
        user: {
          id: 1,
          profile: {
            name: 'John',
            settings: {
              theme: 'dark',
            },
          },
        },
      };

      const dto = new SuccessResponseDto(nestedData);

      expect(dto.success).toBe(true);
      expect(dto.data).toEqual(nestedData);
      expect(dto.data.user.profile.settings.theme).toBe('dark');
    });

    /**
     * Test Case 22: Kiểm tra với string generic type
     * Input: Generic type = string
     * Expected Output: Type-safe string
     * Path Coverage: String generic
     */
    it('TC022: should support string generic type', () => {
      const dto = new SuccessResponseDto<string>('Success message');

      expect(dto.success).toBe(true);
      expect(dto.data).toBe('Success message');
      expect(typeof dto.data).toBe('string');
    });

    /**
     * Test Case 23: Kiểm tra với number generic type
     * Input: Generic type = number
     * Expected Output: Type-safe number
     * Path Coverage: Number generic
     */
    it('TC023: should support number generic type', () => {
      const dto = new SuccessResponseDto<number>(42);

      expect(dto.success).toBe(true);
      expect(dto.data).toBe(42);
      expect(typeof dto.data).toBe('number');
    });

    /**
     * Test Case 24: Kiểm tra với any generic type (default)
     * Input: No generic type specified
     * Expected Output: Any type accepted
     * Path Coverage: Default any type
     */
    it('TC024: should support any type by default', () => {
      const dto = new SuccessResponseDto('string');
      const dto2 = new SuccessResponseDto(123);
      const dto3 = new SuccessResponseDto({ key: 'value' });

      expect(dto.data).toBe('string');
      expect(dto2.data).toBe(123);
      expect(dto3.data).toEqual({ key: 'value' });
    });
  });

  describe('Timestamp Validation', () => {
    /**
     * Test Case 25: Kiểm tra timestamp exists
     * Input: New instance
     * Expected Output: Timestamp defined as ISO string
     * Path Coverage: Timestamp creation
     */
    it('TC025: should have timestamp on creation', () => {
      const dto = new SuccessResponseDto();

      expect(dto.timestamp).toBeDefined();
      expect(typeof dto.timestamp).toBe('string');
      expect(new Date(dto.timestamp).toISOString()).toBe(dto.timestamp);
    });

    /**
     * Test Case 26: Kiểm tra timestamp is recent
     * Input: New instance
     * Expected Output: Timestamp within last second
     * Path Coverage: Timestamp accuracy
     */
    it('TC026: should have recent timestamp', () => {
      const before = new Date();
      const dto = new SuccessResponseDto();
      const after = new Date();

      const timestamp = new Date(dto.timestamp);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    /**
     * Test Case 27: Kiểm tra multiple instances have timestamps
     * Input: Create instances with delay
     * Expected Output: Timestamps defined for all
     * Path Coverage: Multiple timestamps
     */
    it('TC027: should have timestamps for multiple instances', async () => {
      const dto1 = new SuccessResponseDto();
      await new Promise((resolve) => setTimeout(resolve, 5));
      const dto2 = new SuccessResponseDto();

      expect(dto1.timestamp).toBeDefined();
      expect(dto2.timestamp).toBeDefined();
      expect(typeof dto1.timestamp).toBe('string');
      expect(typeof dto2.timestamp).toBe('string');
    });
  });

  describe('Response Structure', () => {
    /**
     * Test Case 28: Kiểm tra complete response structure
     * Input: Full constructor params
     * Expected Output: All properties present
     * Path Coverage: Complete structure
     */
    it('TC028: should have complete response structure', () => {
      const dto = new SuccessResponseDto({ id: 1 }, 'Created successfully');

      expect(dto).toHaveProperty('success');
      expect(dto).toHaveProperty('message');
      expect(dto).toHaveProperty('data');
      expect(dto).toHaveProperty('timestamp');

      // BaseResponseDto includes error and requestId properties
      const keys = Object.keys(dto);
      expect(keys).toContain('success');
      expect(keys).toContain('message');
      expect(keys).toContain('data');
      expect(keys).toContain('timestamp');
    });

    /**
     * Test Case 29: Kiểm tra JSON serialization
     * Input: DTO instance
     * Expected Output: Valid JSON
     * Path Coverage: JSON conversion
     */
    it('TC029: should be JSON serializable', () => {
      const dto = new SuccessResponseDto({ id: 1, name: 'Test' }, 'Success');

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.success).toBe(true);
      expect(parsed.message).toBe('Success');
      expect(parsed.data).toEqual({ id: 1, name: 'Test' });
      expect(parsed.timestamp).toBeDefined();
    });

    /**
     * Test Case 30: Kiểm tra property enumeration
     * Input: DTO instance
     * Expected Output: All properties enumerable
     * Path Coverage: Property enumeration
     */
    it('TC030: should have enumerable properties', () => {
      const dto = new SuccessResponseDto('test', 'Success');

      const keys = Object.keys(dto);

      expect(keys).toContain('success');
      expect(keys).toContain('message');
      expect(keys).toContain('data');
      expect(keys).toContain('timestamp');
    });
  });

  describe('Edge Cases', () => {
    /**
     * Test Case 31: Kiểm tra với data = 0
     * Input: data = 0
     * Expected Output: Zero value preserved
     * Path Coverage: Zero value
     */
    it('TC031: should handle zero as data', () => {
      const dto = new SuccessResponseDto(0);

      expect(dto.success).toBe(true);
      expect(dto.data).toBe(0);
      expect(dto.data).not.toBeUndefined();
      expect(dto.data).not.toBeNull();
    });

    /**
     * Test Case 32: Kiểm tra với data = false
     * Input: data = false
     * Expected Output: False value preserved
     * Path Coverage: False value
     */
    it('TC032: should handle false as data', () => {
      const dto = new SuccessResponseDto(false);

      expect(dto.success).toBe(true);
      expect(dto.data).toBe(false);
      expect(dto.data).not.toBeUndefined();
      expect(dto.data).not.toBeNull();
    });

    /**
     * Test Case 33: Kiểm tra với data = empty string
     * Input: data = ''
     * Expected Output: Empty string preserved
     * Path Coverage: Empty string
     */
    it('TC033: should handle empty string as data', () => {
      const dto = new SuccessResponseDto('');

      expect(dto.success).toBe(true);
      expect(dto.data).toBe('');
      expect(dto.data).not.toBeUndefined();
      expect(dto.data).not.toBeNull();
    });

    /**
     * Test Case 34: Kiểm tra với circular reference (object)
     * Input: Object with circular reference
     * Expected Output: Object stored (serialization may fail)
     * Path Coverage: Circular reference
     */
    it('TC034: should handle object with circular reference', () => {
      const circularObj: any = { id: 1 };
      circularObj.self = circularObj;

      const dto = new SuccessResponseDto(circularObj);

      expect(dto.success).toBe(true);
      expect(dto.data).toBe(circularObj);
      expect(dto.data.self).toBe(circularObj);
    });

    /**
     * Test Case 35: Kiểm tra với very large array
     * Input: Array with 1000 items
     * Expected Output: Large array handled
     * Path Coverage: Large data
     */
    it('TC035: should handle very large array', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => i);
      const dto = new SuccessResponseDto(largeArray);

      expect(dto.success).toBe(true);
      expect(dto.data).toEqual(largeArray);
      expect(dto.data.length).toBe(1000);
    });

    /**
     * Test Case 36: Kiểm tra với special Number values
     * Input: NaN, Infinity
     * Expected Output: Special values preserved
     * Path Coverage: Special numbers
     */
    it('TC036: should handle special Number values', () => {
      const dtoNaN = new SuccessResponseDto(NaN);
      const dtoInfinity = new SuccessResponseDto(Infinity);

      expect(dtoNaN.success).toBe(true);
      expect(dtoNaN.data).toBeNaN();

      expect(dtoInfinity.success).toBe(true);
      expect(dtoInfinity.data).toBe(Infinity);
    });

    /**
     * Test Case 37: Kiểm tra với Date object
     * Input: Date instance
     * Expected Output: Date preserved
     * Path Coverage: Date object
     */
    it('TC037: should handle Date object as data', () => {
      const date = new Date('2024-01-01');
      const dto = new SuccessResponseDto(date);

      expect(dto.success).toBe(true);
      expect(dto.data).toBe(date);
      expect(dto.data).toBeInstanceOf(Date);
    });

    /**
     * Test Case 38: Kiểm tra với RegExp object
     * Input: RegExp instance
     * Expected Output: RegExp preserved
     * Path Coverage: RegExp object
     */
    it('TC038: should handle RegExp object as data', () => {
      const regex = /test/gi;
      const dto = new SuccessResponseDto(regex);

      expect(dto.success).toBe(true);
      expect(dto.data).toBe(regex);
      expect(dto.data).toBeInstanceOf(RegExp);
    });

    /**
     * Test Case 39: Kiểm tra với Map object
     * Input: Map instance
     * Expected Output: Map preserved
     * Path Coverage: Map object
     */
    it('TC039: should handle Map object as data', () => {
      const map = new Map([
        ['key1', 'value1'],
        ['key2', 'value2'],
      ]);
      const dto = new SuccessResponseDto(map);

      expect(dto.success).toBe(true);
      expect(dto.data).toBe(map);
      expect(dto.data).toBeInstanceOf(Map);
      expect(dto.data.get('key1')).toBe('value1');
    });

    /**
     * Test Case 40: Kiểm tra với Set object
     * Input: Set instance
     * Expected Output: Set preserved
     * Path Coverage: Set object
     */
    it('TC040: should handle Set object as data', () => {
      const set = new Set([1, 2, 3, 4]);
      const dto = new SuccessResponseDto(set);

      expect(dto.success).toBe(true);
      expect(dto.data).toBe(set);
      expect(dto.data).toBeInstanceOf(Set);
      expect(dto.data.has(2)).toBe(true);
    });
  });

  describe('Integration Scenarios', () => {
    /**
     * Test Case 41: Kiểm tra REST API success response
     * Input: User created successfully
     * Expected Output: Proper success response
     * Path Coverage: Create user scenario
     */
    it('TC041: should create proper success response for user creation', () => {
      const newUser = {
        id: 1,
        username: 'johndoe',
        email: 'john@example.com',
        createdAt: new Date(),
      };

      const dto = new SuccessResponseDto(newUser, 'User created successfully');

      expect(dto.success).toBe(true);
      expect(dto.message).toBe('User created successfully');
      expect(dto.data).toEqual(newUser);
      expect(dto.timestamp).toBeDefined();
    });

    /**
     * Test Case 42: Kiểm tra list response
     * Input: Array of items
     * Expected Output: List success response
     * Path Coverage: List scenario
     */
    it('TC042: should create proper success response for list retrieval', () => {
      const users = [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' },
        { id: 3, name: 'User 3' },
      ];

      const dto = new SuccessResponseDto(users, 'Users retrieved successfully');

      expect(dto.success).toBe(true);
      expect(dto.message).toBe('Users retrieved successfully');
      expect(dto.data).toEqual(users);
      expect(dto.data.length).toBe(3);
    });

    /**
     * Test Case 43: Kiểm tra update response
     * Input: Updated entity
     * Expected Output: Update success response
     * Path Coverage: Update scenario
     */
    it('TC043: should create proper success response for update', () => {
      const updatedUser = {
        id: 1,
        username: 'johndoe_updated',
        email: 'john.new@example.com',
        updatedAt: new Date(),
      };

      const dto = new SuccessResponseDto(
        updatedUser,
        'User updated successfully',
      );

      expect(dto.success).toBe(true);
      expect(dto.message).toBe('User updated successfully');
      expect(dto.data).toEqual(updatedUser);
    });

    /**
     * Test Case 44: Kiểm tra delete response
     * Input: Deleted entity ID or null
     * Expected Output: Delete success response
     * Path Coverage: Delete scenario
     */
    it('TC044: should create proper success response for delete', () => {
      const dto = new SuccessResponseDto(null, 'User deleted successfully');

      expect(dto.success).toBe(true);
      expect(dto.message).toBe('User deleted successfully');
      expect(dto.data).toBeNull();
    });

    /**
     * Test Case 45: Kiểm tra boolean operation response
     * Input: Boolean result
     * Expected Output: Boolean success response
     * Path Coverage: Boolean operation
     */
    it('TC045: should create proper success response for boolean operation', () => {
      const dto = new SuccessResponseDto(true, 'Email verified successfully');

      expect(dto.success).toBe(true);
      expect(dto.message).toBe('Email verified successfully');
      expect(dto.data).toBe(true);
    });

    /**
     * Test Case 46: Kiểm tra empty list response
     * Input: Empty array
     * Expected Output: Success with empty array
     * Path Coverage: Empty result
     */
    it('TC046: should create proper success response for empty result', () => {
      const dto = new SuccessResponseDto([], 'No users found');

      expect(dto.success).toBe(true);
      expect(dto.message).toBe('No users found');
      expect(dto.data).toEqual([]);
      expect(dto.data.length).toBe(0);
    });

    /**
     * Test Case 47: Kiểm tra batch operation response
     * Input: Batch operation results
     * Expected Output: Batch success response
     * Path Coverage: Batch operation
     */
    it('TC047: should create proper success response for batch operation', () => {
      const results = {
        created: 5,
        updated: 3,
        failed: 0,
        total: 8,
      };

      const dto = new SuccessResponseDto(results, 'Batch operation completed');

      expect(dto.success).toBe(true);
      expect(dto.message).toBe('Batch operation completed');
      expect(dto.data).toEqual(results);
      expect(dto.data.total).toBe(8);
    });

    /**
     * Test Case 48: Kiểm tra file upload response
     * Input: File metadata
     * Expected Output: Upload success response
     * Path Coverage: File upload
     */
    it('TC048: should create proper success response for file upload', () => {
      const fileInfo = {
        filename: 'document.pdf',
        size: 1024000,
        mimetype: 'application/pdf',
        path: '/uploads/document.pdf',
      };

      const dto = new SuccessResponseDto(
        fileInfo,
        'File uploaded successfully',
      );

      expect(dto.success).toBe(true);
      expect(dto.message).toBe('File uploaded successfully');
      expect(dto.data).toEqual(fileInfo);
      expect(dto.data.size).toBe(1024000);
    });

    /**
     * Test Case 49: Kiểm tra authentication response
     * Input: Auth token
     * Expected Output: Auth success response
     * Path Coverage: Authentication
     */
    it('TC049: should create proper success response for authentication', () => {
      const authData = {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        expiresIn: 3600,
        user: {
          id: 1,
          username: 'johndoe',
        },
      };

      const dto = new SuccessResponseDto(authData, 'Login successful');

      expect(dto.success).toBe(true);
      expect(dto.message).toBe('Login successful');
      expect(dto.data).toEqual(authData);
      expect(dto.data.expiresIn).toBe(3600);
    });

    /**
     * Test Case 50: Kiểm tra statistics response
     * Input: Statistical data
     * Expected Output: Stats success response
     * Path Coverage: Statistics
     */
    it('TC050: should create proper success response for statistics', () => {
      const stats = {
        totalUsers: 1500,
        activeUsers: 1200,
        newUsersToday: 25,
        averageSessionTime: 1800,
        metrics: {
          signups: [10, 15, 25],
          logins: [100, 120, 150],
        },
      };

      const dto = new SuccessResponseDto(
        stats,
        'Statistics retrieved successfully',
      );

      expect(dto.success).toBe(true);
      expect(dto.message).toBe('Statistics retrieved successfully');
      expect(dto.data).toEqual(stats);
      expect(dto.data.totalUsers).toBe(1500);
      expect(dto.data.metrics.signups.length).toBe(3);
    });
  });
});
