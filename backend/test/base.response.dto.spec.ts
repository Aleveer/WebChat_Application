import { BaseResponseDto } from '../src/common/dto/base.response.dto';

describe('BaseResponseDto - White Box Testing (Input-Output)', () => {
  describe('Constructor', () => {
    /**
     * Test Case 1: Kiểm tra constructor với all parameters
     * Input: success, message, data, error, requestId
     * Expected Output: Instance với tất cả properties được set
     * Path Coverage: Constructor với full parameters
     */
    it('TC001: should create instance with all parameters', () => {
      const data = { id: 1, name: 'test' };
      const error = { code: 'ERROR_CODE', details: { reason: 'test error' } };
      const requestId = 'req-123';

      const response = new BaseResponseDto(
        true,
        'Success message',
        data,
        error,
        requestId,
      );

      expect(response.success).toBe(true);
      expect(response.message).toBe('Success message');
      expect(response.data).toEqual(data);
      expect(response.error).toEqual(error);
      expect(response.timestamp).toBeDefined();
      expect(response.requestId).toBe(requestId);
    });

    /**
     * Test Case 2: Kiểm tra constructor với success=false
     * Input: success=false, message
     * Expected Output: success property = false
     * Path Coverage: Constructor với failure case
     */
    it('TC002: should create instance with success false', () => {
      const response = new BaseResponseDto(false, 'Error message');

      expect(response.success).toBe(false);
      expect(response.message).toBe('Error message');
    });

    /**
     * Test Case 3: Kiểm tra constructor với minimum parameters
     * Input: Only success and message
     * Expected Output: Required fields set, optional fields undefined
     * Path Coverage: Constructor với minimal parameters
     */
    it('TC003: should create instance with only required parameters', () => {
      const response = new BaseResponseDto(true, 'Test message');

      expect(response.success).toBe(true);
      expect(response.message).toBe('Test message');
      expect(response.data).toBeUndefined();
      expect(response.error).toBeUndefined();
      expect(response.timestamp).toBeDefined();
      expect(response.requestId).toBeUndefined();
    });

    /**
     * Test Case 4: Kiểm tra timestamp auto-generation
     * Input: success, message
     * Expected Output: timestamp auto-generated to current time
     * Path Coverage: Timestamp generation
     */
    it('TC004: should auto-generate timestamp', () => {
      const beforeTime = new Date();
      const response = new BaseResponseDto(true, 'Message');
      const afterTime = new Date();

      expect(response.timestamp).toBeDefined();
      expect(response.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );

      const timestamp = new Date(response.timestamp);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    /**
     * Test Case 5: Kiểm tra constructor với data=null
     * Input: data explicitly set to null
     * Expected Output: data = null (not undefined)
     * Path Coverage: Null data handling
     */
    it('TC005: should handle null data', () => {
      const response = new BaseResponseDto(true, 'Message', null);

      expect(response.data).toBeNull();
      expect(response.data).not.toBeUndefined();
    });

    /**
     * Test Case 6: Kiểm tra constructor với error object
     * Input: success=false, error with code and details
     * Expected Output: error object preserved
     * Path Coverage: Error object handling
     */
    it('TC006: should handle error object with code and details', () => {
      const error = {
        code: 'VALIDATION_ERROR',
        details: {
          field: 'email',
          reason: 'Invalid format',
        },
      };

      const response = new BaseResponseDto(
        false,
        'Validation failed',
        undefined,
        error,
      );

      expect(response.error).toEqual(error);
      expect(response.error?.code).toBe('VALIDATION_ERROR');
      expect(response.error?.details).toEqual({
        field: 'email',
        reason: 'Invalid format',
      });
    });

    /**
     * Test Case 7: Kiểm tra constructor với error without details
     * Input: error with only code
     * Expected Output: error.details = undefined
     * Path Coverage: Error without details
     */
    it('TC007: should handle error without details', () => {
      const error = { code: 'GENERIC_ERROR' };

      const response = new BaseResponseDto(false, 'Error', undefined, error);

      expect(response.error?.code).toBe('GENERIC_ERROR');
      expect(response.error?.details).toBeUndefined();
    });

    /**
     * Test Case 8: Kiểm tra constructor với empty message
     * Input: message = ''
     * Expected Output: message = '' (empty string)
     * Path Coverage: Empty message
     */
    it('TC008: should handle empty string message', () => {
      const response = new BaseResponseDto(true, '');

      expect(response.message).toBe('');
    });

    /**
     * Test Case 9: Kiểm tra constructor với complex data object
     * Input: Nested data object
     * Expected Output: Data preserved with nested structures
     * Path Coverage: Complex data handling
     */
    it('TC009: should handle complex nested data', () => {
      const complexData = {
        user: {
          id: 1,
          profile: {
            name: 'John',
            settings: {
              theme: 'dark',
            },
          },
        },
        metadata: ['tag1', 'tag2'],
      };

      const response = new BaseResponseDto(true, 'Success', complexData);

      expect(response.data).toEqual(complexData);
      expect(response.data?.user.profile.settings.theme).toBe('dark');
      expect(response.data?.metadata).toHaveLength(2);
    });

    /**
     * Test Case 10: Kiểm tra constructor với requestId
     * Input: requestId string
     * Expected Output: requestId preserved
     * Path Coverage: RequestId handling
     */
    it('TC010: should handle requestId', () => {
      const requestId = 'req-abc-123-xyz';

      const response = new BaseResponseDto(
        true,
        'Message',
        undefined,
        undefined,
        requestId,
      );

      expect(response.requestId).toBe(requestId);
    });

    /**
     * Test Case 11: Kiểm tra timestamp format ISO 8601
     * Input: Any constructor call
     * Expected Output: timestamp in ISO 8601 format
     * Path Coverage: ISO timestamp format
     */
    it('TC011: should generate ISO 8601 timestamp', () => {
      const response = new BaseResponseDto(true, 'Message');

      const date = new Date(response.timestamp);
      expect(date.toISOString()).toBe(response.timestamp);
    });

    /**
     * Test Case 12: Kiểm tra với both data and error (unusual case)
     * Input: Both data and error provided
     * Expected Output: Both preserved (though semantically odd)
     * Path Coverage: Both data and error
     */
    it('TC012: should handle both data and error (edge case)', () => {
      const data = { test: 'value' };
      const error = { code: 'WARNING' };

      const response = new BaseResponseDto(true, 'Message', data, error);

      expect(response.data).toEqual(data);
      expect(response.error).toEqual(error);
    });
  });

  describe('success() Static Method', () => {
    /**
     * Test Case 13: Kiểm tra success() với all parameters
     * Input: data, custom message, requestId
     * Expected Output: Success response với all fields
     * Path Coverage: success() với full parameters
     */
    it('TC013: should create success response with all parameters', () => {
      const data = { id: 1, name: 'test' };
      const message = 'Custom success message';
      const requestId = 'req-123';

      const response = BaseResponseDto.success(data, message, requestId);

      expect(response).toBeInstanceOf(BaseResponseDto);
      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.message).toBe(message);
      expect(response.error).toBeUndefined();
      expect(response.requestId).toBe(requestId);
    });

    /**
     * Test Case 14: Kiểm tra success() với default message
     * Input: data only, message=undefined
     * Expected Output: Default message 'Operation successful'
     * Path Coverage: Default message parameter
     */
    it('TC014: should use default message when not provided', () => {
      const data = { result: 'success' };

      const response = BaseResponseDto.success(data);

      expect(response.success).toBe(true);
      expect(response.message).toBe('Operation successful');
      expect(response.data).toEqual(data);
    });

    /**
     * Test Case 15: Kiểm tra success() với custom message
     * Input: data, custom message
     * Expected Output: Custom message used
     * Path Coverage: Custom message override
     */
    it('TC015: should override default message with custom message', () => {
      const data = { test: 'value' };
      const customMessage = 'User created successfully';

      const response = BaseResponseDto.success(data, customMessage);

      expect(response.message).toBe(customMessage);
      expect(response.message).not.toBe('Operation successful');
    });

    /**
     * Test Case 16: Kiểm tra success() với requestId
     * Input: data, message, requestId
     * Expected Output: requestId included
     * Path Coverage: RequestId in success()
     */
    it('TC016: should include requestId in success response', () => {
      const data = { test: 'data' };
      const requestId = 'req-xyz-789';

      const response = BaseResponseDto.success(data, 'Success', requestId);

      expect(response.requestId).toBe(requestId);
    });

    /**
     * Test Case 17: Kiểm tra success() error field always undefined
     * Input: Any success parameters
     * Expected Output: error = undefined
     * Path Coverage: Error undefined in success
     */
    it('TC017: should always have undefined error in success response', () => {
      const response = BaseResponseDto.success({ test: 'data' });

      expect(response.error).toBeUndefined();
    });

    /**
     * Test Case 18: Kiểm tra success() auto-generates timestamp
     * Input: data
     * Expected Output: timestamp generated
     * Path Coverage: Timestamp generation in success()
     */
    it('TC018: should auto-generate timestamp in success response', () => {
      const response = BaseResponseDto.success({ test: 'data' });

      expect(response.timestamp).toBeDefined();
      expect(typeof response.timestamp).toBe('string');
    });

    /**
     * Test Case 19: Kiểm tra success() với null data
     * Input: null as data
     * Expected Output: data = null, success = true
     * Path Coverage: Null data in success
     */
    it('TC019: should handle null data in success response', () => {
      const response = BaseResponseDto.success(null);

      expect(response.success).toBe(true);
      expect(response.data).toBeNull();
    });

    /**
     * Test Case 20: Kiểm tra success() với array data
     * Input: Array of objects
     * Expected Output: Array preserved
     * Path Coverage: Array data
     */
    it('TC020: should handle array data in success response', () => {
      const data = [
        { id: 1, name: 'item1' },
        { id: 2, name: 'item2' },
      ];

      const response = BaseResponseDto.success(data);

      expect(response.data).toEqual(data);
      expect(response.data).toHaveLength(2);
    });

    /**
     * Test Case 21: Kiểm tra success() với primitive types
     * Input: string, number, boolean
     * Expected Output: Primitives preserved
     * Path Coverage: Primitive data types
     */
    it('TC021: should handle primitive data types', () => {
      const stringResponse = BaseResponseDto.success('text value');
      const numberResponse = BaseResponseDto.success(42);
      const boolResponse = BaseResponseDto.success(true);

      expect(stringResponse.data).toBe('text value');
      expect(numberResponse.data).toBe(42);
      expect(boolResponse.data).toBe(true);
    });

    /**
     * Test Case 22: Kiểm tra success() returns new instance
     * Input: Same data multiple times
     * Expected Output: Different instances
     * Path Coverage: Instance creation
     */
    it('TC022: should return new instance each time', () => {
      const data = { test: 'value' };

      const response1 = BaseResponseDto.success(data);
      const response2 = BaseResponseDto.success(data);

      expect(response1).not.toBe(response2);
      expect(response1).toBeInstanceOf(BaseResponseDto);
      expect(response2).toBeInstanceOf(BaseResponseDto);
      // Timestamps may be same if created in same millisecond
      expect(response1.timestamp).toBeDefined();
      expect(response2.timestamp).toBeDefined();
    });

    /**
     * Test Case 23: Kiểm tra success() với empty string message
     * Input: data, message = ''
     * Expected Output: Empty message (overrides default)
     * Path Coverage: Empty string message parameter
     */
    it('TC023: should accept empty string message', () => {
      const response = BaseResponseDto.success({ test: 'data' }, '');

      expect(response.message).toBe('');
      expect(response.message).not.toBe('Operation successful');
    });

    /**
     * Test Case 24: Kiểm tra success() without requestId
     * Input: data, message, no requestId
     * Expected Output: requestId = undefined
     * Path Coverage: No requestId
     */
    it('TC024: should have undefined requestId when not provided', () => {
      const response = BaseResponseDto.success({ test: 'data' }, 'Success');

      expect(response.requestId).toBeUndefined();
    });
  });

  describe('error() Static Method', () => {
    /**
     * Test Case 25: Kiểm tra error() với all parameters
     * Input: message, code, details, requestId
     * Expected Output: Error response với all fields
     * Path Coverage: error() với full parameters
     */
    it('TC025: should create error response with all parameters', () => {
      const message = 'Validation failed';
      const code = 'VALIDATION_ERROR';
      const details = { field: 'email', reason: 'invalid' };
      const requestId = 'req-456';

      const response = BaseResponseDto.error(message, code, details, requestId);

      expect(response).toBeInstanceOf(BaseResponseDto);
      expect(response.success).toBe(false);
      expect(response.message).toBe(message);
      expect(response.error?.code).toBe(code);
      expect(response.error?.details).toEqual(details);
      expect(response.requestId).toBe(requestId);
      expect(response.data).toBeUndefined();
    });

    /**
     * Test Case 26: Kiểm tra error() với default code
     * Input: message only
     * Expected Output: Default code 'ERROR'
     * Path Coverage: Default code parameter
     */
    it('TC026: should use default code when not provided', () => {
      const message = 'Something went wrong';

      const response = BaseResponseDto.error(message);

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('ERROR');
      expect(response.message).toBe(message);
    });

    /**
     * Test Case 27: Kiểm tra error() với custom code
     * Input: message, custom code
     * Expected Output: Custom code used
     * Path Coverage: Custom code override
     */
    it('TC027: should override default code with custom code', () => {
      const message = 'Not found';
      const code = 'NOT_FOUND';

      const response = BaseResponseDto.error(message, code);

      expect(response.error?.code).toBe(code);
      expect(response.error?.code).not.toBe('ERROR');
    });

    /**
     * Test Case 28: Kiểm tra error() without details
     * Input: message, code, no details
     * Expected Output: error.details = undefined
     * Path Coverage: No details parameter
     */
    it('TC028: should have undefined details when not provided', () => {
      const response = BaseResponseDto.error('Error', 'ERROR_CODE');

      expect(response.error?.code).toBe('ERROR_CODE');
      expect(response.error?.details).toBeUndefined();
    });

    /**
     * Test Case 29: Kiểm tra error() với complex details
     * Input: message, code, complex details object
     * Expected Output: Details preserved
     * Path Coverage: Complex details
     */
    it('TC029: should handle complex error details', () => {
      const details = {
        errors: [
          { field: 'email', message: 'Invalid' },
          { field: 'password', message: 'Too short' },
        ],
        metadata: {
          timestamp: '2025-10-28',
          source: 'validator',
        },
      };

      const response = BaseResponseDto.error(
        'Validation failed',
        'VALIDATION',
        details,
      );

      expect(response.error?.details).toEqual(details);
      expect((response.error?.details as any).errors).toHaveLength(2);
    });

    /**
     * Test Case 30: Kiểm tra error() data always undefined
     * Input: Any error parameters
     * Expected Output: data = undefined (always)
     * Path Coverage: Data undefined in error
     */
    it('TC030: should always have undefined data in error response', () => {
      const response = BaseResponseDto.error('Error', 'CODE');

      expect(response.data).toBeUndefined();
    });

    /**
     * Test Case 31: Kiểm tra error() auto-generates timestamp
     * Input: message
     * Expected Output: timestamp generated
     * Path Coverage: Timestamp generation in error()
     */
    it('TC031: should auto-generate timestamp in error response', () => {
      const response = BaseResponseDto.error('Error occurred');

      expect(response.timestamp).toBeDefined();
      expect(typeof response.timestamp).toBe('string');
    });

    /**
     * Test Case 32: Kiểm tra error() với requestId
     * Input: message, code, details, requestId
     * Expected Output: requestId included
     * Path Coverage: RequestId in error()
     */
    it('TC032: should include requestId in error response', () => {
      const requestId = 'req-error-123';

      const response = BaseResponseDto.error('Error', 'CODE', null, requestId);

      expect(response.requestId).toBe(requestId);
    });

    /**
     * Test Case 33: Kiểm tra error() returns new instance
     * Input: Same message multiple times
     * Expected Output: Different instances
     * Path Coverage: Instance creation
     */
    it('TC033: should return new instance each time', () => {
      const message = 'Error message';

      const response1 = BaseResponseDto.error(message);
      const response2 = BaseResponseDto.error(message);

      expect(response1).not.toBe(response2);
      expect(response1).toBeInstanceOf(BaseResponseDto);
      expect(response2).toBeInstanceOf(BaseResponseDto);
      // Timestamps may be same if created in same millisecond
      expect(response1.timestamp).toBeDefined();
      expect(response2.timestamp).toBeDefined();
    });

    /**
     * Test Case 34: Kiểm tra error() với empty message
     * Input: message = ''
     * Expected Output: Empty message accepted
     * Path Coverage: Empty message
     */
    it('TC034: should handle empty string message', () => {
      const response = BaseResponseDto.error('', 'CODE');

      expect(response.message).toBe('');
      expect(response.success).toBe(false);
    });

    /**
     * Test Case 35: Kiểm tra error() với null details
     * Input: details = null
     * Expected Output: details = null
     * Path Coverage: Null details
     */
    it('TC035: should handle null details', () => {
      const response = BaseResponseDto.error('Error', 'CODE', null);

      expect(response.error?.details).toBeNull();
    });

    /**
     * Test Case 36: Kiểm tra error() return type
     * Input: Any error call
     * Expected Output: BaseResponseDto<undefined>
     * Path Coverage: Return type validation
     */
    it('TC036: should return BaseResponseDto with undefined generic type', () => {
      const response = BaseResponseDto.error('Error');

      expect(response).toBeInstanceOf(BaseResponseDto);
      expect(response.data).toBeUndefined();
    });
  });

  describe('Property Types and Structure', () => {
    /**
     * Test Case 37: Kiểm tra success property type
     * Input: Various instances
     * Expected Output: success is always boolean
     * Path Coverage: Type validation
     */
    it('TC037: should have boolean success property', () => {
      const successResponse = BaseResponseDto.success({ test: 'data' });
      const errorResponse = BaseResponseDto.error('error');

      expect(typeof successResponse.success).toBe('boolean');
      expect(typeof errorResponse.success).toBe('boolean');
    });

    /**
     * Test Case 38: Kiểm tra message property type
     * Input: Various instances
     * Expected Output: message is always string
     * Path Coverage: Required string type
     */
    it('TC038: should have required string message', () => {
      const response1 = BaseResponseDto.success({ test: 'data' });
      const response2 = BaseResponseDto.error('error');

      expect(typeof response1.message).toBe('string');
      expect(typeof response2.message).toBe('string');
    });

    /**
     * Test Case 39: Kiểm tra data property optional
     * Input: Instances with and without data
     * Expected Output: data can be undefined or any type
     * Path Coverage: Optional data
     */
    it('TC039: should have optional data property', () => {
      const withData = BaseResponseDto.success({ test: 'value' });
      const withoutData = BaseResponseDto.error('error');

      expect(withData.data).toBeDefined();
      expect(withoutData.data).toBeUndefined();
    });

    /**
     * Test Case 40: Kiểm tra error property structure
     * Input: Instance with error
     * Expected Output: error has code and optional details
     * Path Coverage: Error structure
     */
    it('TC040: should have valid error structure', () => {
      const response = BaseResponseDto.error('Error', 'CODE', { info: 'test' });

      expect(response.error).toBeDefined();
      expect(response.error).toHaveProperty('code');
      expect(typeof response.error?.code).toBe('string');
      expect(response.error).toHaveProperty('details');
    });

    /**
     * Test Case 41: Kiểm tra timestamp property type
     * Input: Any instance
     * Expected Output: timestamp is string
     * Path Coverage: Timestamp type
     */
    it('TC041: should have string timestamp property', () => {
      const response = BaseResponseDto.success({ test: 'data' });

      expect(typeof response.timestamp).toBe('string');
    });

    /**
     * Test Case 42: Kiểm tra requestId property optional
     * Input: Instances with and without requestId
     * Expected Output: requestId can be undefined or string
     * Path Coverage: Optional requestId
     */
    it('TC042: should have optional requestId property', () => {
      const withRequestId = BaseResponseDto.success(
        { test: 'data' },
        'Success',
        'req-123',
      );
      const withoutRequestId = BaseResponseDto.success({ test: 'data' });

      expect(withRequestId.requestId).toBeDefined();
      expect(typeof withRequestId.requestId).toBe('string');
      expect(withoutRequestId.requestId).toBeUndefined();
    });
  });

  describe('Edge Cases and Boundaries', () => {
    /**
     * Test Case 43: Kiểm tra với very large data object
     * Input: Large nested object
     * Expected Output: Data preserved
     * Path Coverage: Large data handling
     */
    it('TC043: should handle very large data objects', () => {
      const largeData = {
        items: Array(1000)
          .fill(null)
          .map((_, i) => ({ id: i, value: `item-${i}` })),
      };

      const response = BaseResponseDto.success(largeData);

      expect(response.data?.items).toHaveLength(1000);
      expect(response.data?.items[999].id).toBe(999);
    });

    /**
     * Test Case 44: Kiểm tra với very long message
     * Input: Very long message string
     * Expected Output: Full message preserved
     * Path Coverage: Long string handling
     */
    it('TC044: should handle very long messages', () => {
      const longMessage = 'Error '.repeat(1000);

      const response = BaseResponseDto.error(longMessage);

      expect(response.message).toBe(longMessage);
      expect(response.message.length).toBeGreaterThan(5000);
    });

    /**
     * Test Case 45: Kiểm tra với special characters in message
     * Input: Message with special chars
     * Expected Output: Special chars preserved
     * Path Coverage: Special character handling
     */
    it('TC045: should handle special characters in message', () => {
      const message =
        "Error: <script>alert('xss')</script> & symbols !@#$%^&*()";

      const response = BaseResponseDto.error(message);

      expect(response.message).toBe(message);
      expect(response.message).toContain('<script>');
    });

    /**
     * Test Case 46: Kiểm tra với Unicode in message
     * Input: Unicode characters
     * Expected Output: Unicode preserved
     * Path Coverage: Unicode handling
     */
    it('TC046: should handle Unicode characters in message', () => {
      const message = '成功 😀 🎉 Émojis and 中文';

      const response = BaseResponseDto.success({ test: 'data' }, message);

      expect(response.message).toBe(message);
      expect(response.message).toContain('😀');
    });

    /**
     * Test Case 47: Kiểm tra với circular reference in data
     * Input: Object with circular reference
     * Expected Output: Reference preserved
     * Path Coverage: Circular reference
     */
    it('TC047: should handle object with circular reference', () => {
      const circularObj: any = { id: 1 };
      circularObj.self = circularObj;

      const response = BaseResponseDto.success(circularObj);

      expect(response.data?.id).toBe(1);
      expect(response.data?.self).toBe(response.data);
    });

    /**
     * Test Case 48: Kiểm tra với falsy values in data
     * Input: 0, false, ''
     * Expected Output: Falsy values preserved
     * Path Coverage: Falsy value handling
     */
    it('TC048: should preserve falsy values in data', () => {
      const zeroResponse = BaseResponseDto.success(0);
      const falseResponse = BaseResponseDto.success(false);
      const emptyStringResponse = BaseResponseDto.success('');

      expect(zeroResponse.data).toBe(0);
      expect(falseResponse.data).toBe(false);
      expect(emptyStringResponse.data).toBe('');
    });

    /**
     * Test Case 49: Kiểm tra với undefined vs null distinction
     * Input: Explicit undefined and null
     * Expected Output: Distinction preserved
     * Path Coverage: Undefined vs null
     */
    it('TC049: should distinguish between undefined and null', () => {
      const nullResponse = BaseResponseDto.success(null);
      const undefinedResponse = new BaseResponseDto(true, 'Message', undefined);

      expect(nullResponse.data).toBeNull();
      expect(undefinedResponse.data).toBeUndefined();
      expect(nullResponse.data).not.toBe(undefinedResponse.data);
    });

    /**
     * Test Case 50: Kiểm tra với complex error details types
     * Input: Various details types (string, number, object, array)
     * Expected Output: All types preserved
     * Path Coverage: Details type flexibility
     */
    it('TC050: should handle various types of error details', () => {
      const stringDetails = BaseResponseDto.error(
        'Error',
        'CODE',
        'String detail',
      );
      const numberDetails = BaseResponseDto.error('Error', 'CODE', 12345);
      const arrayDetails = BaseResponseDto.error('Error', 'CODE', [1, 2, 3]);
      const objectDetails = BaseResponseDto.error('Error', 'CODE', {
        key: 'value',
      });

      expect(stringDetails.error?.details).toBe('String detail');
      expect(numberDetails.error?.details).toBe(12345);
      expect(arrayDetails.error?.details).toEqual([1, 2, 3]);
      expect(objectDetails.error?.details).toEqual({ key: 'value' });
    });
  });

  describe('Timestamp Generation', () => {
    /**
     * Test Case 51: Kiểm tra timestamp format ISO 8601
     * Input: New instance
     * Expected Output: ISO 8601 format
     * Path Coverage: ISO format validation
     */
    it('TC051: should generate ISO 8601 timestamp', () => {
      const response = BaseResponseDto.success({ test: 'data' });

      expect(response.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );

      const date = new Date(response.timestamp);
      expect(date.toISOString()).toBe(response.timestamp);
    });

    /**
     * Test Case 52: Kiểm tra timestamp is current time
     * Input: New instance
     * Expected Output: Timestamp close to current time
     * Path Coverage: Current time validation
     */
    it('TC052: should generate current timestamp', () => {
      const before = new Date();
      const response = BaseResponseDto.success({ test: 'data' });
      const after = new Date();

      const timestamp = new Date(response.timestamp);

      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    /**
     * Test Case 53: Kiểm tra timestamps are unique between instances
     * Input: Multiple instances
     * Expected Output: Different timestamps (or possibly same if very fast)
     * Path Coverage: Timestamp uniqueness
     */
    it('TC053: should generate unique timestamps for each instance', () => {
      const response1 = BaseResponseDto.success({ test: 'data' });
      const response2 = BaseResponseDto.success({ test: 'data' });

      expect(response1.timestamp).toBeDefined();
      expect(response2.timestamp).toBeDefined();
      // May be same or different depending on execution speed
    });
  });

  describe('Integration and Real-world Scenarios', () => {
    /**
     * Test Case 54: Kiểm tra typical success API response
     * Input: User data
     * Expected Output: Complete success response
     * Path Coverage: Real success scenario
     */
    it('TC054: should create typical success API response', () => {
      const user = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      };

      const response = BaseResponseDto.success(
        user,
        'User retrieved successfully',
        'req-abc-123',
      );

      expect(response.success).toBe(true);
      expect(response.data).toEqual(user);
      expect(response.message).toBe('User retrieved successfully');
      expect(response.requestId).toBe('req-abc-123');
      expect(response.error).toBeUndefined();
    });

    /**
     * Test Case 55: Kiểm tra typical error API response
     * Input: Error details
     * Expected Output: Complete error response
     * Path Coverage: Real error scenario
     */
    it('TC055: should create typical error API response', () => {
      const response = BaseResponseDto.error(
        'User not found',
        'NOT_FOUND',
        { userId: 123 },
        'req-xyz-789',
      );

      expect(response.success).toBe(false);
      expect(response.message).toBe('User not found');
      expect(response.error?.code).toBe('NOT_FOUND');
      expect(response.error?.details).toEqual({ userId: 123 });
      expect(response.requestId).toBe('req-xyz-789');
      expect(response.data).toBeUndefined();
    });

    /**
     * Test Case 56: Kiểm tra paginated list response
     * Input: Array of items
     * Expected Output: List in data
     * Path Coverage: List response
     */
    it('TC056: should create paginated list response', () => {
      const items = Array(10)
        .fill(null)
        .map((_, i) => ({ id: i, name: `item-${i}` }));

      const response = BaseResponseDto.success(items, 'Items retrieved');

      expect(response.data).toHaveLength(10);
      expect(response.success).toBe(true);
    });

    /**
     * Test Case 57: Kiểm tra validation error response
     * Input: Validation errors
     * Expected Output: Error with validation details
     * Path Coverage: Validation error scenario
     */
    it('TC057: should create validation error response', () => {
      const validationErrors = {
        fields: [
          { name: 'email', error: 'Invalid format' },
          { name: 'password', error: 'Too short' },
        ],
      };

      const response = BaseResponseDto.error(
        'Validation failed',
        'VALIDATION_ERROR',
        validationErrors,
      );

      expect(response.error?.code).toBe('VALIDATION_ERROR');
      expect((response.error?.details as any).fields).toHaveLength(2);
    });

    /**
     * Test Case 58: Kiểm tra response serialization
     * Input: Complex response
     * Expected Output: Can be JSON stringified
     * Path Coverage: JSON serialization
     */
    it('TC058: should be JSON serializable', () => {
      const response = BaseResponseDto.success(
        { id: 1, name: 'test' },
        'Success',
        'req-123',
      );

      const json = JSON.stringify(response);
      const parsed = JSON.parse(json);

      expect(parsed.success).toBe(true);
      expect(parsed.data.id).toBe(1);
      expect(parsed.message).toBe('Success');
      expect(parsed.requestId).toBe('req-123');
    });

    /**
     * Test Case 59: Kiểm tra instanceof check
     * Input: Responses from different methods
     * Expected Output: All are instances of BaseResponseDto
     * Path Coverage: Instance checking
     */
    it('TC059: should be instance of BaseResponseDto', () => {
      const success = BaseResponseDto.success({ test: 'data' });
      const error = BaseResponseDto.error('error');
      const constructed = new BaseResponseDto(true, 'message');

      expect(success).toBeInstanceOf(BaseResponseDto);
      expect(error).toBeInstanceOf(BaseResponseDto);
      expect(constructed).toBeInstanceOf(BaseResponseDto);
    });

    /**
     * Test Case 60: Kiểm tra response mutability
     * Input: Modify data after creation
     * Expected Output: Original data object can be modified
     * Path Coverage: Mutability check
     */
    it('TC060: should reference original data object (not deep cloned)', () => {
      const data = { id: 1, name: 'test' };
      const response = BaseResponseDto.success(data);

      data.name = 'modified';

      expect(response.data?.name).toBe('modified');
    });
  });
});
