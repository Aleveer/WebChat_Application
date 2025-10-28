import { ApiResponseDto } from '../src/common/dto/api.response.dto';
import { ValidationErrorDto } from '../src/common/dto/validation.error.dto';

describe('ApiResponseDto - White Box Testing (Input-Output)', () => {
  describe('Constructor', () => {
    /**
     * Test Case 1: Kiểm tra constructor với all parameters
     * Input: success=true, data, message, errors, meta
     * Expected Output: Instance với tất cả properties được set
     * Path Coverage: Constructor với full parameters
     */
    it('TC001: should create instance with all parameters', () => {
      const data = { id: 1, name: 'test' };
      const message = 'Success message';
      const errors = [new ValidationErrorDto('field1', 'error1')];
      const meta = {
        timestamp: '2025-10-28T10:00:00.000Z',
        requestId: 'req-123',
        version: '1.0.0',
      };

      const response = new ApiResponseDto(true, data, message, errors, meta);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.message).toBe(message);
      expect(response.errors).toEqual(errors);
      expect(response.meta).toEqual(meta);
    });

    /**
     * Test Case 2: Kiểm tra constructor với success=false
     * Input: success=false
     * Expected Output: success property = false
     * Path Coverage: Constructor với success false
     */
    it('TC002: should create instance with success false', () => {
      const response = new ApiResponseDto(false);

      expect(response.success).toBe(false);
    });

    /**
     * Test Case 3: Kiểm tra constructor với minimum parameters
     * Input: Only success parameter
     * Expected Output: success set, others undefined, meta auto-generated
     * Path Coverage: Constructor với minimal parameters
     */
    it('TC003: should create instance with only success parameter', () => {
      const response = new ApiResponseDto(true);

      expect(response.success).toBe(true);
      expect(response.data).toBeUndefined();
      expect(response.message).toBeUndefined();
      expect(response.errors).toBeUndefined();
      expect(response.meta).toBeDefined();
      expect(response.meta?.timestamp).toBeDefined();
      expect(response.meta?.version).toBe('1.0.0');
    });

    /**
     * Test Case 4: Kiểm tra auto-generated meta khi meta=undefined
     * Input: success, data, message, errors, meta=undefined
     * Expected Output: meta auto-generated với timestamp và version
     * Path Coverage: Meta generation branch (meta || {...})
     */
    it('TC004: should auto-generate meta when not provided', () => {
      const beforeTime = new Date();
      const response = new ApiResponseDto(true, { test: 'data' }, 'message');
      const afterTime = new Date();

      expect(response.meta).toBeDefined();
      expect(response.meta?.timestamp).toBeDefined();
      expect(response.meta?.version).toBe('1.0.0');

      const metaTime = new Date(response.meta!.timestamp);
      expect(metaTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(metaTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    /**
     * Test Case 5: Kiểm tra constructor không override meta khi provided
     * Input: Custom meta object
     * Expected Output: Meta giữ nguyên, không auto-generate
     * Path Coverage: Meta provided branch
     */
    it('TC005: should not override meta when provided', () => {
      const customMeta = {
        timestamp: '2020-01-01T00:00:00.000Z',
        requestId: 'custom-123',
        version: '2.0.0',
      };

      const response = new ApiResponseDto(
        true,
        null,
        undefined,
        undefined,
        customMeta,
      );

      expect(response.meta).toEqual(customMeta);
      expect(response.meta?.timestamp).toBe('2020-01-01T00:00:00.000Z');
      expect(response.meta?.version).toBe('2.0.0');
    });

    /**
     * Test Case 6: Kiểm tra constructor với data=null
     * Input: data explicitly set to null
     * Expected Output: data = null (not undefined)
     * Path Coverage: Null data handling
     */
    it('TC006: should handle null data', () => {
      const response = new ApiResponseDto(true, null);

      expect(response.data).toBeNull();
      expect(response.data).not.toBeUndefined();
    });

    /**
     * Test Case 7: Kiểm tra constructor với empty string message
     * Input: message = ''
     * Expected Output: message = '' (empty string, not undefined)
     * Path Coverage: Empty string message
     */
    it('TC007: should handle empty string message', () => {
      const response = new ApiResponseDto(true, null, '');

      expect(response.message).toBe('');
      expect(response.message).not.toBeUndefined();
    });

    /**
     * Test Case 8: Kiểm tra constructor với empty errors array
     * Input: errors = []
     * Expected Output: errors = [] (empty array)
     * Path Coverage: Empty errors array
     */
    it('TC008: should handle empty errors array', () => {
      const response = new ApiResponseDto(false, null, 'error', []);

      expect(response.errors).toEqual([]);
      expect(response.errors).toHaveLength(0);
    });

    /**
     * Test Case 9: Kiểm tra constructor với complex data object
     * Input: Nested data object with arrays
     * Expected Output: Data preserved with all nested structures
     * Path Coverage: Complex data handling
     */
    it('TC009: should handle complex nested data', () => {
      const complexData = {
        user: {
          id: 1,
          name: 'John',
          roles: ['admin', 'user'],
        },
        metadata: {
          created: '2025-10-28',
          tags: ['tag1', 'tag2'],
        },
      };

      const response = new ApiResponseDto(true, complexData);

      expect(response.data).toEqual(complexData);
      expect(response.data?.user.roles).toHaveLength(2);
      expect(response.data?.metadata.tags).toContain('tag1');
    });

    /**
     * Test Case 10: Kiểm tra constructor với meta có pagination
     * Input: meta with pagination object
     * Expected Output: Pagination included in meta
     * Path Coverage: Meta with pagination
     */
    it('TC010: should handle meta with pagination', () => {
      const metaWithPagination = {
        timestamp: '2025-10-28T10:00:00.000Z',
        version: '1.0.0',
        pagination: {
          page: 1,
          limit: 10,
          total: 100,
          totalPages: 10,
        },
      };

      const response = new ApiResponseDto(
        true,
        [],
        undefined,
        undefined,
        metaWithPagination,
      );

      expect(response.meta?.pagination).toBeDefined();
      expect(response.meta?.pagination?.page).toBe(1);
      expect(response.meta?.pagination?.total).toBe(100);
    });

    /**
     * Test Case 11: Kiểm tra constructor với multiple validation errors
     * Input: Array of multiple ValidationErrorDto
     * Expected Output: All errors preserved
     * Path Coverage: Multiple errors
     */
    it('TC011: should handle multiple validation errors', () => {
      const errors = [
        new ValidationErrorDto('email', 'Invalid email', 'test@'),
        new ValidationErrorDto('password', 'Too short', '123'),
        new ValidationErrorDto('age', 'Must be positive', -1),
      ];

      const response = new ApiResponseDto(
        false,
        null,
        'Validation failed',
        errors,
      );

      expect(response.errors).toHaveLength(3);
      expect(response.errors?.[0].field).toBe('email');
      expect(response.errors?.[1].field).toBe('password');
      expect(response.errors?.[2].field).toBe('age');
    });
  });

  describe('success() Static Method', () => {
    /**
     * Test Case 12: Kiểm tra success() với data và message
     * Input: data object, success message
     * Expected Output: ApiResponseDto với success=true
     * Path Coverage: success() with both parameters
     */
    it('TC012: should create success response with data and message', () => {
      const data = { id: 1, name: 'test' };
      const message = 'Operation successful';

      const response = ApiResponseDto.success(data, message);

      expect(response).toBeInstanceOf(ApiResponseDto);
      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.message).toBe(message);
      expect(response.errors).toBeUndefined();
    });

    /**
     * Test Case 13: Kiểm tra success() với only data
     * Input: data object, no message
     * Expected Output: success=true, message=undefined
     * Path Coverage: success() with data only
     */
    it('TC013: should create success response with only data', () => {
      const data = { result: 'success' };

      const response = ApiResponseDto.success(data);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.message).toBeUndefined();
    });

    /**
     * Test Case 14: Kiểm tra success() với only message
     * Input: undefined data, message string
     * Expected Output: success=true, data=undefined, message set
     * Path Coverage: success() with message only
     */
    it('TC014: should create success response with only message', () => {
      const message = 'Successfully completed';

      const response = ApiResponseDto.success(undefined, message);

      expect(response.success).toBe(true);
      expect(response.data).toBeUndefined();
      expect(response.message).toBe(message);
    });

    /**
     * Test Case 15: Kiểm tra success() without parameters
     * Input: No parameters
     * Expected Output: success=true, all optional fields undefined
     * Path Coverage: success() with no parameters
     */
    it('TC015: should create success response without parameters', () => {
      const response = ApiResponseDto.success();

      expect(response.success).toBe(true);
      expect(response.data).toBeUndefined();
      expect(response.message).toBeUndefined();
    });

    /**
     * Test Case 16: Kiểm tra success() auto-generates meta
     * Input: data and message
     * Expected Output: meta with timestamp and version
     * Path Coverage: Meta auto-generation in success()
     */
    it('TC016: should auto-generate meta in success response', () => {
      const response = ApiResponseDto.success({ test: 'data' }, 'Success');

      expect(response.meta).toBeDefined();
      expect(response.meta?.timestamp).toBeDefined();
      expect(response.meta?.version).toBe('1.0.0');
    });

    /**
     * Test Case 17: Kiểm tra success() với array data
     * Input: Array of objects
     * Expected Output: Array preserved in data
     * Path Coverage: Array data in success()
     */
    it('TC017: should handle array data in success response', () => {
      const data = [
        { id: 1, name: 'item1' },
        { id: 2, name: 'item2' },
      ];

      const response = ApiResponseDto.success(data);

      expect(response.data).toEqual(data);
      expect(response.data).toHaveLength(2);
    });

    /**
     * Test Case 18: Kiểm tra success() với primitive data types
     * Input: string, number, boolean
     * Expected Output: Primitive values preserved
     * Path Coverage: Primitive types in success()
     */
    it('TC018: should handle primitive data types', () => {
      const stringResponse = ApiResponseDto.success('text value');
      const numberResponse = ApiResponseDto.success(42);
      const boolResponse = ApiResponseDto.success(true);

      expect(stringResponse.data).toBe('text value');
      expect(numberResponse.data).toBe(42);
      expect(boolResponse.data).toBe(true);
    });

    /**
     * Test Case 19: Kiểm tra success() returns new instance
     * Input: Same data multiple times
     * Expected Output: Different instances each time
     * Path Coverage: Instance creation
     */
    it('TC019: should return new instance each time', () => {
      const data = { test: 'value' };

      const response1 = ApiResponseDto.success(data);
      const response2 = ApiResponseDto.success(data);

      expect(response1).not.toBe(response2);
      expect(response1).toEqual(response2);
    });

    /**
     * Test Case 20: Kiểm tra success() với null data explicitly
     * Input: null as data
     * Expected Output: data = null
     * Path Coverage: Null handling in success()
     */
    it('TC020: should handle explicit null data', () => {
      const response = ApiResponseDto.success(null, 'Success with null');

      expect(response.data).toBeNull();
      expect(response.success).toBe(true);
    });
  });

  describe('error() Static Method', () => {
    /**
     * Test Case 21: Kiểm tra error() với message và errors
     * Input: error message, validation errors array
     * Expected Output: success=false, message and errors set
     * Path Coverage: error() with both parameters
     */
    it('TC021: should create error response with message and errors', () => {
      const message = 'Validation failed';
      const errors = [
        new ValidationErrorDto('field1', 'Error 1'),
        new ValidationErrorDto('field2', 'Error 2'),
      ];

      const response = ApiResponseDto.error(message, errors);

      expect(response).toBeInstanceOf(ApiResponseDto);
      expect(response.success).toBe(false);
      expect(response.message).toBe(message);
      expect(response.errors).toEqual(errors);
      expect(response.data).toBeUndefined();
    });

    /**
     * Test Case 22: Kiểm tra error() với only message
     * Input: error message only
     * Expected Output: success=false, errors=undefined
     * Path Coverage: error() with message only
     */
    it('TC022: should create error response with only message', () => {
      const message = 'Something went wrong';

      const response = ApiResponseDto.error(message);

      expect(response.success).toBe(false);
      expect(response.message).toBe(message);
      expect(response.errors).toBeUndefined();
      expect(response.data).toBeUndefined();
    });

    /**
     * Test Case 23: Kiểm tra error() với empty errors array
     * Input: message, empty array
     * Expected Output: errors = []
     * Path Coverage: Empty errors in error()
     */
    it('TC023: should handle empty errors array', () => {
      const response = ApiResponseDto.error('Error occurred', []);

      expect(response.success).toBe(false);
      expect(response.errors).toEqual([]);
      expect(response.errors).toHaveLength(0);
    });

    /**
     * Test Case 24: Kiểm tra error() data always undefined
     * Input: message and errors
     * Expected Output: data = undefined (but property exists)
     * Path Coverage: Data undefined in error()
     */
    it('TC024: should always have undefined data in error response', () => {
      const response = ApiResponseDto.error('Error', []);

      expect(response.data).toBeUndefined();
      // Property exists but is undefined
      expect(response).toHaveProperty('data');
    });

    /**
     * Test Case 25: Kiểm tra error() auto-generates meta
     * Input: message and errors
     * Expected Output: meta with timestamp and version
     * Path Coverage: Meta generation in error()
     */
    it('TC025: should auto-generate meta in error response', () => {
      const response = ApiResponseDto.error('Error occurred');

      expect(response.meta).toBeDefined();
      expect(response.meta?.timestamp).toBeDefined();
      expect(response.meta?.version).toBe('1.0.0');
    });

    /**
     * Test Case 26: Kiểm tra error() với single validation error
     * Input: message, single error in array
     * Expected Output: errors array with one item
     * Path Coverage: Single error in array
     */
    it('TC026: should handle single validation error', () => {
      const error = new ValidationErrorDto('username', 'Required field');
      const response = ApiResponseDto.error('Validation error', [error]);

      expect(response.errors).toHaveLength(1);
      expect(response.errors?.[0].field).toBe('username');
    });

    /**
     * Test Case 27: Kiểm tra error() với complex error messages
     * Input: Long detailed error message
     * Expected Output: Full message preserved
     * Path Coverage: Long message handling
     */
    it('TC027: should handle complex error messages', () => {
      const longMessage =
        'A detailed error occurred due to multiple validation failures in the request body';

      const response = ApiResponseDto.error(longMessage);

      expect(response.message).toBe(longMessage);
      expect(response.message?.length).toBeGreaterThan(50);
    });

    /**
     * Test Case 28: Kiểm tra error() returns new instance
     * Input: Same message multiple times
     * Expected Output: Different instances
     * Path Coverage: Instance creation
     */
    it('TC028: should return new instance each time', () => {
      const message = 'Error message';

      const response1 = ApiResponseDto.error(message);
      const response2 = ApiResponseDto.error(message);

      expect(response1).not.toBe(response2);
      expect(response1).toEqual(response2);
    });

    /**
     * Test Case 29: Kiểm tra error() với validation errors có values
     * Input: ValidationErrorDto with values
     * Expected Output: Error values preserved
     * Path Coverage: Error with values
     */
    it('TC029: should preserve error values in validation errors', () => {
      const errors = [
        new ValidationErrorDto('age', 'Invalid age', -5),
        new ValidationErrorDto('email', 'Invalid format', 'not-email'),
      ];

      const response = ApiResponseDto.error('Validation failed', errors);

      expect(response.errors?.[0].value).toBe(-5);
      expect(response.errors?.[1].value).toBe('not-email');
    });

    /**
     * Test Case 30: Kiểm tra error() với empty message
     * Input: Empty string message
     * Expected Output: message = ''
     * Path Coverage: Empty string message
     */
    it('TC030: should handle empty string message', () => {
      const response = ApiResponseDto.error('');

      expect(response.message).toBe('');
      expect(response.success).toBe(false);
    });
  });

  describe('Property Types and Structure', () => {
    /**
     * Test Case 31: Kiểm tra success property type
     * Input: Various instances
     * Expected Output: success is always boolean
     * Path Coverage: Type validation
     */
    it('TC031: should have boolean success property', () => {
      const successResponse = ApiResponseDto.success();
      const errorResponse = ApiResponseDto.error('error');

      expect(typeof successResponse.success).toBe('boolean');
      expect(typeof errorResponse.success).toBe('boolean');
    });

    /**
     * Test Case 32: Kiểm tra message property type
     * Input: Instances with and without message
     * Expected Output: message is string or undefined
     * Path Coverage: Optional string type
     */
    it('TC032: should have optional string message', () => {
      const withMessage = ApiResponseDto.success(null, 'test');
      const withoutMessage = ApiResponseDto.success();

      expect(typeof withMessage.message).toBe('string');
      expect(withoutMessage.message).toBeUndefined();
    });

    /**
     * Test Case 33: Kiểm tra data property generic type
     * Input: Different data types
     * Expected Output: Data type preserved
     * Path Coverage: Generic type handling
     */
    it('TC033: should preserve generic data type', () => {
      const stringData = ApiResponseDto.success<string>('text');
      const numberData = ApiResponseDto.success<number>(123);
      const objectData = ApiResponseDto.success<{ id: number }>({ id: 1 });

      expect(typeof stringData.data).toBe('string');
      expect(typeof numberData.data).toBe('number');
      expect(typeof objectData.data).toBe('object');
    });

    /**
     * Test Case 34: Kiểm tra errors property type
     * Input: Instances with and without errors
     * Expected Output: errors is array or undefined
     * Path Coverage: Optional array type
     */
    it('TC034: should have optional errors array', () => {
      const withErrors = ApiResponseDto.error('error', []);
      const withoutErrors = ApiResponseDto.success();

      expect(Array.isArray(withErrors.errors)).toBe(true);
      expect(withoutErrors.errors).toBeUndefined();
    });

    /**
     * Test Case 35: Kiểm tra meta property structure
     * Input: Various instances
     * Expected Output: meta has required structure
     * Path Coverage: Meta structure validation
     */
    it('TC035: should have valid meta structure', () => {
      const response = ApiResponseDto.success();

      expect(response.meta).toBeDefined();
      expect(response.meta).toHaveProperty('timestamp');
      expect(response.meta).toHaveProperty('version');
      expect(typeof response.meta?.timestamp).toBe('string');
      expect(typeof response.meta?.version).toBe('string');
    });

    /**
     * Test Case 36: Kiểm tra meta.pagination structure
     * Input: Meta with pagination
     * Expected Output: Pagination has all required fields
     * Path Coverage: Pagination structure
     */
    it('TC036: should have valid pagination structure in meta', () => {
      const meta = {
        timestamp: '2025-10-28T10:00:00.000Z',
        version: '1.0.0',
        pagination: {
          page: 1,
          limit: 20,
          total: 100,
          totalPages: 5,
        },
      };

      const response = new ApiResponseDto(true, [], undefined, undefined, meta);

      expect(response.meta?.pagination).toBeDefined();
      expect(typeof response.meta?.pagination?.page).toBe('number');
      expect(typeof response.meta?.pagination?.limit).toBe('number');
      expect(typeof response.meta?.pagination?.total).toBe('number');
      expect(typeof response.meta?.pagination?.totalPages).toBe('number');
    });

    /**
     * Test Case 37: Kiểm tra all properties present in success response
     * Input: Full success response
     * Expected Output: All declared properties exist
     * Path Coverage: Property existence
     */
    it('TC037: should have all properties in structure', () => {
      const response = ApiResponseDto.success({ data: 'test' }, 'message');

      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('data');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('meta');
      // errors is optional, may not be present
    });
  });

  describe('Edge Cases and Boundaries', () => {
    /**
     * Test Case 38: Kiểm tra với very large data object
     * Input: Large nested object
     * Expected Output: Data preserved
     * Path Coverage: Large data handling
     */
    it('TC038: should handle very large data objects', () => {
      const largeData = {
        items: Array(1000)
          .fill(null)
          .map((_, i) => ({ id: i, value: `item-${i}` })),
      };

      const response = ApiResponseDto.success(largeData);

      expect(response.data?.items).toHaveLength(1000);
      expect(response.data?.items[999].id).toBe(999);
    });

    /**
     * Test Case 39: Kiểm tra với very long message
     * Input: Very long error message
     * Expected Output: Full message preserved
     * Path Coverage: Long string handling
     */
    it('TC039: should handle very long messages', () => {
      const longMessage = 'Error '.repeat(1000);

      const response = ApiResponseDto.error(longMessage);

      expect(response.message).toBe(longMessage);
      expect(response.message?.length).toBeGreaterThan(5000);
    });

    /**
     * Test Case 40: Kiểm tra với many validation errors
     * Input: Large array of errors
     * Expected Output: All errors preserved
     * Path Coverage: Many errors
     */
    it('TC040: should handle many validation errors', () => {
      const errors = Array(100)
        .fill(null)
        .map((_, i) => new ValidationErrorDto(`field${i}`, `error${i}`));

      const response = ApiResponseDto.error('Many errors', errors);

      expect(response.errors).toHaveLength(100);
      expect(response.errors?.[99].field).toBe('field99');
    });

    /**
     * Test Case 41: Kiểm tra với special characters in message
     * Input: Message with special characters
     * Expected Output: Special chars preserved
     * Path Coverage: Special character handling
     */
    it('TC041: should handle special characters in message', () => {
      const message =
        "Error: <script>alert('xss')</script> & symbols !@#$%^&*()";

      const response = ApiResponseDto.error(message);

      expect(response.message).toBe(message);
      expect(response.message).toContain('<script>');
      expect(response.message).toContain('&');
    });

    /**
     * Test Case 42: Kiểm tra với Unicode in message
     * Input: Message with Unicode characters
     * Expected Output: Unicode preserved
     * Path Coverage: Unicode handling
     */
    it('TC042: should handle Unicode characters in message', () => {
      const message = '错误消息 😀 🎉 Émojis and 中文';

      const response = ApiResponseDto.success(null, message);

      expect(response.message).toBe(message);
      expect(response.message).toContain('😀');
      expect(response.message).toContain('中文');
    });

    /**
     * Test Case 43: Kiểm tra với circular reference in data
     * Input: Object with circular reference
     * Expected Output: Reference preserved (may cause issues in serialization)
     * Path Coverage: Circular reference
     */
    it('TC043: should handle object with circular reference', () => {
      const circularObj: any = { id: 1 };
      circularObj.self = circularObj;

      const response = ApiResponseDto.success(circularObj);

      expect(response.data?.id).toBe(1);
      expect(response.data?.self).toBe(response.data);
    });

    /**
     * Test Case 44: Kiểm tra với undefined vs null distinction
     * Input: Explicit undefined and null
     * Expected Output: Distinction preserved
     * Path Coverage: Undefined vs null
     */
    it('TC044: should distinguish between undefined and null', () => {
      const nullResponse = ApiResponseDto.success(null);
      const undefinedResponse = ApiResponseDto.success(undefined);

      expect(nullResponse.data).toBeNull();
      expect(undefinedResponse.data).toBeUndefined();
      expect(nullResponse.data).not.toBe(undefinedResponse.data);
    });

    /**
     * Test Case 45: Kiểm tra với zero and false values
     * Input: 0 and false as data
     * Expected Output: Falsy values preserved
     * Path Coverage: Falsy value handling
     */
    it('TC045: should preserve falsy values in data', () => {
      const zeroResponse = ApiResponseDto.success(0);
      const falseResponse = ApiResponseDto.success(false);
      const emptyStringResponse = ApiResponseDto.success('');

      expect(zeroResponse.data).toBe(0);
      expect(falseResponse.data).toBe(false);
      expect(emptyStringResponse.data).toBe('');
    });
  });

  describe('Meta Timestamp Generation', () => {
    /**
     * Test Case 46: Kiểm tra timestamp format
     * Input: New instance
     * Expected Output: ISO 8601 format timestamp
     * Path Coverage: Timestamp format validation
     */
    it('TC046: should generate ISO 8601 timestamp', () => {
      const response = ApiResponseDto.success();

      expect(response.meta?.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );

      const date = new Date(response.meta!.timestamp);
      expect(date.toISOString()).toBe(response.meta?.timestamp);
    });

    /**
     * Test Case 47: Kiểm tra timestamp is current time
     * Input: New instance
     * Expected Output: Timestamp close to current time
     * Path Coverage: Current time validation
     */
    it('TC047: should generate current timestamp', () => {
      const before = new Date();
      const response = ApiResponseDto.success();
      const after = new Date();

      const timestamp = new Date(response.meta!.timestamp);

      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    /**
     * Test Case 48: Kiểm tra timestamps are unique
     * Input: Multiple instances created sequentially
     * Expected Output: Different timestamps (or possibly same if very fast)
     * Path Coverage: Timestamp uniqueness
     */
    it('TC048: should generate timestamps for each instance', () => {
      const response1 = ApiResponseDto.success();
      const response2 = ApiResponseDto.success();

      expect(response1.meta?.timestamp).toBeDefined();
      expect(response2.meta?.timestamp).toBeDefined();
      // Timestamps might be same if created very quickly
    });

    /**
     * Test Case 49: Kiểm tra custom timestamp preservation
     * Input: Custom timestamp in meta
     * Expected Output: Custom timestamp not overridden
     * Path Coverage: Custom timestamp
     */
    it('TC049: should preserve custom timestamp in meta', () => {
      const customTimestamp = '2020-01-01T00:00:00.000Z';
      const meta = {
        timestamp: customTimestamp,
        version: '1.0.0',
      };

      const response = new ApiResponseDto(
        true,
        null,
        undefined,
        undefined,
        meta,
      );

      expect(response.meta?.timestamp).toBe(customTimestamp);
    });
  });

  describe('Version Information', () => {
    /**
     * Test Case 50: Kiểm tra default version
     * Input: Instance without custom version
     * Expected Output: version = '1.0.0'
     * Path Coverage: Default version
     */
    it('TC050: should have default version 1.0.0', () => {
      const response = ApiResponseDto.success();

      expect(response.meta?.version).toBe('1.0.0');
    });

    /**
     * Test Case 51: Kiểm tra custom version
     * Input: Custom version in meta
     * Expected Output: Custom version preserved
     * Path Coverage: Custom version
     */
    it('TC051: should preserve custom version', () => {
      const meta = {
        timestamp: '2025-10-28T10:00:00.000Z',
        version: '2.5.3',
      };

      const response = new ApiResponseDto(
        true,
        null,
        undefined,
        undefined,
        meta,
      );

      expect(response.meta?.version).toBe('2.5.3');
    });
  });

  describe('Integration and Real-world Scenarios', () => {
    /**
     * Test Case 52: Kiểm tra typical success API response
     * Input: User data with pagination
     * Expected Output: Complete success response
     * Path Coverage: Real success scenario
     */
    it('TC052: should create typical success API response', () => {
      const users = [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' },
      ];

      const response = ApiResponseDto.success(
        users,
        'Users retrieved successfully',
      );

      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(2);
      expect(response.message).toBe('Users retrieved successfully');
      expect(response.meta?.timestamp).toBeDefined();
    });

    /**
     * Test Case 53: Kiểm tra typical error API response
     * Input: Validation errors
     * Expected Output: Complete error response
     * Path Coverage: Real error scenario
     */
    it('TC053: should create typical error API response', () => {
      const errors = [
        new ValidationErrorDto('email', 'Email is required'),
        new ValidationErrorDto(
          'password',
          'Password must be at least 8 characters',
        ),
      ];

      const response = ApiResponseDto.error('Validation failed', errors);

      expect(response.success).toBe(false);
      expect(response.message).toBe('Validation failed');
      expect(response.errors).toHaveLength(2);
      expect(response.data).toBeUndefined();
    });

    /**
     * Test Case 54: Kiểm tra paginated response
     * Input: Data with pagination meta
     * Expected Output: Response with pagination info
     * Path Coverage: Pagination scenario
     */
    it('TC054: should create paginated response', () => {
      const items = Array(10)
        .fill(null)
        .map((_, i) => ({ id: i }));

      const meta = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        pagination: {
          page: 1,
          limit: 10,
          total: 100,
          totalPages: 10,
        },
      };

      const response = new ApiResponseDto(
        true,
        items,
        undefined,
        undefined,
        meta,
      );

      expect(response.data).toHaveLength(10);
      expect(response.meta?.pagination?.page).toBe(1);
      expect(response.meta?.pagination?.totalPages).toBe(10);
    });

    /**
     * Test Case 55: Kiểm tra response with requestId tracking
     * Input: Meta with requestId
     * Expected Output: RequestId preserved
     * Path Coverage: Request tracking
     */
    it('TC055: should include requestId in meta', () => {
      const meta = {
        timestamp: new Date().toISOString(),
        requestId: 'req-abc-123-xyz',
        version: '1.0.0',
      };

      const response = new ApiResponseDto(
        true,
        { test: 'data' },
        undefined,
        undefined,
        meta,
      );

      expect(response.meta?.requestId).toBe('req-abc-123-xyz');
    });

    /**
     * Test Case 56: Kiểm tra chaining with instanceof
     * Input: Responses created by different methods
     * Expected Output: All are instances of ApiResponseDto
     * Path Coverage: Instance checking
     */
    it('TC056: should be instance of ApiResponseDto', () => {
      const success = ApiResponseDto.success();
      const error = ApiResponseDto.error('error');
      const constructed = new ApiResponseDto(true);

      expect(success).toBeInstanceOf(ApiResponseDto);
      expect(error).toBeInstanceOf(ApiResponseDto);
      expect(constructed).toBeInstanceOf(ApiResponseDto);
    });

    /**
     * Test Case 57: Kiểm tra response serialization
     * Input: Complex response
     * Expected Output: Can be JSON stringified
     * Path Coverage: JSON serialization
     */
    it('TC057: should be JSON serializable', () => {
      const response = ApiResponseDto.success(
        { id: 1, name: 'test' },
        'Success',
      );

      const json = JSON.stringify(response);
      const parsed = JSON.parse(json);

      expect(parsed.success).toBe(true);
      expect(parsed.data.id).toBe(1);
      expect(parsed.message).toBe('Success');
    });

    /**
     * Test Case 58: Kiểm tra error response without data
     * Input: Error message
     * Expected Output: No data field in JSON
     * Path Coverage: Error data omission
     */
    it('TC058: should not include data in error response JSON', () => {
      const response = ApiResponseDto.error('Error occurred');
      const json = JSON.parse(JSON.stringify(response));

      expect(json.success).toBe(false);
      expect(json.message).toBe('Error occurred');
      // data may be undefined or not present in JSON
      expect(json.data).toBeUndefined();
    });

    /**
     * Test Case 59: Kiểm tra response immutability concern
     * Input: Modify data after creation
     * Expected Output: Original data object can be modified (not immutable)
     * Path Coverage: Mutability check
     */
    it('TC059: should reference original data object (not deep cloned)', () => {
      const data = { id: 1, name: 'test' };
      const response = ApiResponseDto.success(data);

      data.name = 'modified';

      expect(response.data?.name).toBe('modified');
    });

    /**
     * Test Case 60: Kiểm tra multiple error types
     * Input: Different error scenarios
     * Expected Output: Flexible error handling
     * Path Coverage: Various error patterns
     */
    it('TC060: should handle various error scenarios', () => {
      const notFoundError = ApiResponseDto.error('Resource not found');
      const validationError = ApiResponseDto.error('Invalid input', [
        new ValidationErrorDto('field', 'error'),
      ]);
      const serverError = ApiResponseDto.error('Internal server error');

      expect(notFoundError.success).toBe(false);
      expect(validationError.errors).toBeDefined();
      expect(serverError.data).toBeUndefined();
    });
  });
});
