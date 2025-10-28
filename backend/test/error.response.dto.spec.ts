import { ErrorResponseDto } from '../src/common/dto/error.response.dto';
import { BaseResponseDto } from '../src/common/dto/base.response.dto';

describe('ErrorResponseDto - White Box Testing (Input-Output)', () => {
  describe('Constructor', () => {
    /**
     * Test Case 1: Kiểm tra constructor với all parameters
     * Input: message, code, details
     * Expected Output: Instance với all error properties
     * Path Coverage: Constructor với full parameters
     */
    it('TC001: should create instance with all parameters', () => {
      const message = 'Validation failed';
      const code = 'VALIDATION_ERROR';
      const details = { field: 'email', reason: 'invalid' };

      const response = new ErrorResponseDto(message, code, details);

      expect(response).toBeInstanceOf(ErrorResponseDto);
      expect(response).toBeInstanceOf(BaseResponseDto);
      expect(response.success).toBe(false);
      expect(response.message).toBe(message);
      expect(response.error?.code).toBe(code);
      expect(response.error?.details).toEqual(details);
      expect(response.data).toBeUndefined();
    });

    /**
     * Test Case 2: Kiểm tra constructor với default code
     * Input: message only (code=undefined, details=undefined)
     * Expected Output: Default code 'ERROR'
     * Path Coverage: Default code parameter
     */
    it('TC002: should use default code when not provided', () => {
      const message = 'Something went wrong';

      const response = new ErrorResponseDto(message);

      expect(response.error?.code).toBe('ERROR');
      expect(response.message).toBe(message);
      expect(response.error?.details).toBeUndefined();
    });

    /**
     * Test Case 3: Kiểm tra constructor với custom code
     * Input: message, custom code (no details)
     * Expected Output: Custom code used, details undefined
     * Path Coverage: Custom code without details
     */
    it('TC003: should use custom code without details', () => {
      const message = 'Not found';
      const code = 'NOT_FOUND';

      const response = new ErrorResponseDto(message, code);

      expect(response.error?.code).toBe(code);
      expect(response.message).toBe(message);
      expect(response.error?.details).toBeUndefined();
    });

    /**
     * Test Case 4: Kiểm tra success always false
     * Input: Any constructor parameters
     * Expected Output: success = false (always)
     * Path Coverage: Success field validation
     */
    it('TC004: should always have success false', () => {
      const response1 = new ErrorResponseDto('Error 1');
      const response2 = new ErrorResponseDto('Error 2', 'CODE');
      const response3 = new ErrorResponseDto('Error 3', 'CODE', {
        detail: 'test',
      });

      expect(response1.success).toBe(false);
      expect(response2.success).toBe(false);
      expect(response3.success).toBe(false);
    });

    /**
     * Test Case 5: Kiểm tra data always undefined
     * Input: Any constructor parameters
     * Expected Output: data = undefined (always)
     * Path Coverage: Data field validation
     */
    it('TC005: should always have undefined data', () => {
      const response = new ErrorResponseDto('Error', 'CODE', { test: 'value' });

      expect(response.data).toBeUndefined();
    });

    /**
     * Test Case 6: Kiểm tra timestamp auto-generation
     * Input: message
     * Expected Output: timestamp generated in ISO format
     * Path Coverage: Timestamp generation
     */
    it('TC006: should auto-generate timestamp', () => {
      const beforeTime = new Date();
      const response = new ErrorResponseDto('Error');
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
     * Test Case 7: Kiểm tra error object structure
     * Input: message, code, details
     * Expected Output: error object with code and details
     * Path Coverage: Error object structure
     */
    it('TC007: should have valid error object structure', () => {
      const details = { userId: 123, reason: 'not found' };
      const response = new ErrorResponseDto('Error', 'NOT_FOUND', details);

      expect(response.error).toBeDefined();
      expect(response.error).toHaveProperty('code');
      expect(response.error).toHaveProperty('details');
      expect(response.error?.code).toBe('NOT_FOUND');
      expect(response.error?.details).toEqual(details);
    });

    /**
     * Test Case 8: Kiểm tra inheritance from BaseResponseDto
     * Input: Any error instance
     * Expected Output: Instance of both ErrorResponseDto and BaseResponseDto
     * Path Coverage: Inheritance validation
     */
    it('TC008: should inherit from BaseResponseDto', () => {
      const response = new ErrorResponseDto('Error');

      expect(response).toBeInstanceOf(ErrorResponseDto);
      expect(response).toBeInstanceOf(BaseResponseDto);
    });

    /**
     * Test Case 9: Kiểm tra requestId field exists
     * Input: Error instance
     * Expected Output: requestId property exists (inherited from Base)
     * Path Coverage: Inherited property validation
     */
    it('TC009: should have requestId property from BaseResponseDto', () => {
      const response = new ErrorResponseDto('Error');

      expect(response).toHaveProperty('requestId');
      expect(response.requestId).toBeUndefined();
    });
  });

  describe('Message Parameter', () => {
    /**
     * Test Case 10: Kiểm tra với normal message
     * Input: Standard error message
     * Expected Output: Message preserved
     * Path Coverage: Normal message
     */
    it('TC010: should handle normal error message', () => {
      const message = 'An error occurred';
      const response = new ErrorResponseDto(message);

      expect(response.message).toBe(message);
    });

    /**
     * Test Case 11: Kiểm tra với empty message
     * Input: message = ''
     * Expected Output: Empty string preserved
     * Path Coverage: Empty message
     */
    it('TC011: should handle empty message string', () => {
      const response = new ErrorResponseDto('');

      expect(response.message).toBe('');
    });

    /**
     * Test Case 12: Kiểm tra với very long message
     * Input: Very long error message
     * Expected Output: Full message preserved
     * Path Coverage: Long message
     */
    it('TC012: should handle very long error message', () => {
      const longMessage = 'Error: '.repeat(1000);
      const response = new ErrorResponseDto(longMessage);

      expect(response.message).toBe(longMessage);
      expect(response.message.length).toBeGreaterThan(5000);
    });

    /**
     * Test Case 13: Kiểm tra với special characters
     * Input: Message with special chars
     * Expected Output: Special chars preserved
     * Path Coverage: Special characters
     */
    it('TC013: should handle special characters in message', () => {
      const message = "Error: <script>alert('xss')</script> & symbols !@#$%";
      const response = new ErrorResponseDto(message);

      expect(response.message).toBe(message);
      expect(response.message).toContain('<script>');
    });

    /**
     * Test Case 14: Kiểm tra với Unicode characters
     * Input: Message with Unicode
     * Expected Output: Unicode preserved
     * Path Coverage: Unicode handling
     */
    it('TC014: should handle Unicode characters in message', () => {
      const message = 'エラー: 错误 😞 발생';
      const response = new ErrorResponseDto(message);

      expect(response.message).toBe(message);
      expect(response.message).toContain('😞');
    });

    /**
     * Test Case 15: Kiểm tra với newlines in message
     * Input: Multi-line message
     * Expected Output: Newlines preserved
     * Path Coverage: Newline handling
     */
    it('TC015: should handle newlines in message', () => {
      const message = 'Error occurred:\nLine 1\nLine 2\nLine 3';
      const response = new ErrorResponseDto(message);

      expect(response.message).toBe(message);
      expect(response.message.split('\n')).toHaveLength(4);
    });

    /**
     * Test Case 16: Kiểm tra với whitespace message
     * Input: Only whitespace
     * Expected Output: Whitespace preserved
     * Path Coverage: Whitespace message
     */
    it('TC016: should handle whitespace-only message', () => {
      const message = '   ';
      const response = new ErrorResponseDto(message);

      expect(response.message).toBe(message);
    });
  });

  describe('Code Parameter', () => {
    /**
     * Test Case 17: Kiểm tra với standard error codes
     * Input: Common HTTP-like error codes
     * Expected Output: Codes preserved
     * Path Coverage: Standard codes
     */
    it('TC017: should handle standard error codes', () => {
      const codes = [
        'BAD_REQUEST',
        'UNAUTHORIZED',
        'FORBIDDEN',
        'NOT_FOUND',
        'INTERNAL_ERROR',
      ];

      codes.forEach((code) => {
        const response = new ErrorResponseDto('Error', code);
        expect(response.error?.code).toBe(code);
      });
    });

    /**
     * Test Case 18: Kiểm tra với custom error code
     * Input: Custom business logic code
     * Expected Output: Custom code preserved
     * Path Coverage: Custom code
     */
    it('TC018: should handle custom error codes', () => {
      const code = 'BUSINESS_RULE_VIOLATION';
      const response = new ErrorResponseDto('Error', code);

      expect(response.error?.code).toBe(code);
    });

    /**
     * Test Case 19: Kiểm tra với numeric code
     * Input: Numeric error code
     * Expected Output: Numeric code preserved
     * Path Coverage: Numeric code
     */
    it('TC019: should handle numeric error codes', () => {
      const code = '404';
      const response = new ErrorResponseDto('Not found', code);

      expect(response.error?.code).toBe(code);
    });

    /**
     * Test Case 20: Kiểm tra với empty code string
     * Input: code = ''
     * Expected Output: Empty code preserved
     * Path Coverage: Empty code
     */
    it('TC020: should handle empty code string', () => {
      const response = new ErrorResponseDto('Error', '');

      expect(response.error?.code).toBe('');
    });

    /**
     * Test Case 21: Kiểm tra với code containing special chars
     * Input: Code with special characters
     * Expected Output: Special chars in code preserved
     * Path Coverage: Special chars in code
     */
    it('TC021: should handle special characters in code', () => {
      const code = 'ERROR-001_TYPE.A';
      const response = new ErrorResponseDto('Error', code);

      expect(response.error?.code).toBe(code);
    });

    /**
     * Test Case 22: Kiểm tra với lowercase code
     * Input: Lowercase code
     * Expected Output: Case preserved
     * Path Coverage: Case sensitivity
     */
    it('TC022: should preserve code case', () => {
      const code = 'error_occurred';
      const response = new ErrorResponseDto('Error', code);

      expect(response.error?.code).toBe(code);
      expect(response.error?.code).not.toBe('ERROR_OCCURRED');
    });

    /**
     * Test Case 23: Kiểm tra với code containing whitespace
     * Input: Code with spaces
     * Expected Output: Spaces preserved
     * Path Coverage: Whitespace in code
     */
    it('TC023: should handle whitespace in code', () => {
      const code = 'ERROR CODE';
      const response = new ErrorResponseDto('Error', code);

      expect(response.error?.code).toBe(code);
    });
  });

  describe('Details Parameter', () => {
    /**
     * Test Case 24: Kiểm tra với object details
     * Input: Object with multiple properties
     * Expected Output: Object details preserved
     * Path Coverage: Object details
     */
    it('TC024: should handle object details', () => {
      const details = {
        field: 'email',
        value: 'invalid@',
        constraint: 'email format',
      };
      const response = new ErrorResponseDto(
        'Validation error',
        'VALIDATION',
        details,
      );

      expect(response.error?.details).toEqual(details);
      expect((response.error?.details as any).field).toBe('email');
    });

    /**
     * Test Case 25: Kiểm tra với nested object details
     * Input: Deeply nested object
     * Expected Output: Nested structure preserved
     * Path Coverage: Nested details
     */
    it('TC025: should handle nested object details', () => {
      const details = {
        user: {
          id: 123,
          profile: {
            email: 'test@example.com',
            errors: ['error1', 'error2'],
          },
        },
      };
      const response = new ErrorResponseDto('Error', 'NESTED_ERROR', details);

      expect(response.error?.details).toEqual(details);
      expect((response.error?.details as any).user.profile.errors).toHaveLength(
        2,
      );
    });

    /**
     * Test Case 26: Kiểm tra với array details
     * Input: Array of errors
     * Expected Output: Array preserved
     * Path Coverage: Array details
     */
    it('TC026: should handle array details', () => {
      const details = [
        { field: 'email', error: 'invalid' },
        { field: 'password', error: 'too short' },
      ];
      const response = new ErrorResponseDto(
        'Multiple errors',
        'VALIDATION',
        details,
      );

      expect(response.error?.details).toEqual(details);
      expect(Array.isArray(response.error?.details)).toBe(true);
      expect(response.error?.details).toHaveLength(2);
    });

    /**
     * Test Case 27: Kiểm tra với string details
     * Input: String as details
     * Expected Output: String preserved
     * Path Coverage: String details
     */
    it('TC027: should handle string details', () => {
      const details = 'Additional error information';
      const response = new ErrorResponseDto('Error', 'CODE', details);

      expect(response.error?.details).toBe(details);
    });

    /**
     * Test Case 28: Kiểm tra với number details
     * Input: Number as details
     * Expected Output: Number preserved
     * Path Coverage: Number details
     */
    it('TC028: should handle number details', () => {
      const details = 404;
      const response = new ErrorResponseDto('Error', 'CODE', details);

      expect(response.error?.details).toBe(details);
    });

    /**
     * Test Case 29: Kiểm tra với boolean details
     * Input: Boolean as details
     * Expected Output: Boolean preserved
     * Path Coverage: Boolean details
     */
    it('TC029: should handle boolean details', () => {
      const details = true;
      const response = new ErrorResponseDto('Error', 'CODE', details);

      expect(response.error?.details).toBe(details);
    });

    /**
     * Test Case 30: Kiểm tra với null details
     * Input: details = null
     * Expected Output: null preserved
     * Path Coverage: Null details
     */
    it('TC030: should handle null details', () => {
      const response = new ErrorResponseDto('Error', 'CODE', null);

      expect(response.error?.details).toBeNull();
    });

    /**
     * Test Case 31: Kiểm tra với undefined details (default)
     * Input: details not provided
     * Expected Output: details = undefined
     * Path Coverage: Default undefined details
     */
    it('TC031: should have undefined details when not provided', () => {
      const response = new ErrorResponseDto('Error', 'CODE');

      expect(response.error?.details).toBeUndefined();
    });

    /**
     * Test Case 32: Kiểm tra với empty object details
     * Input: details = {}
     * Expected Output: Empty object preserved
     * Path Coverage: Empty object details
     */
    it('TC032: should handle empty object details', () => {
      const details = {};
      const response = new ErrorResponseDto('Error', 'CODE', details);

      expect(response.error?.details).toEqual({});
    });

    /**
     * Test Case 33: Kiểm tra với empty array details
     * Input: details = []
     * Expected Output: Empty array preserved
     * Path Coverage: Empty array details
     */
    it('TC033: should handle empty array details', () => {
      const details: any[] = [];
      const response = new ErrorResponseDto('Error', 'CODE', details);

      expect(response.error?.details).toEqual([]);
      expect(response.error?.details).toHaveLength(0);
    });

    /**
     * Test Case 34: Kiểm tra với Error object as details
     * Input: JavaScript Error object
     * Expected Output: Error object preserved
     * Path Coverage: Error object details
     */
    it('TC034: should handle Error object as details', () => {
      const error = new Error('Original error');
      const response = new ErrorResponseDto('Wrapped error', 'CODE', error);

      expect(response.error?.details).toBe(error);
      expect((response.error?.details as any).message).toBe('Original error');
    });

    /**
     * Test Case 35: Kiểm tra với circular reference in details
     * Input: Object with circular reference
     * Expected Output: Reference preserved
     * Path Coverage: Circular reference
     */
    it('TC035: should handle circular reference in details', () => {
      const details: any = { id: 1 };
      details.self = details;

      const response = new ErrorResponseDto('Error', 'CODE', details);

      expect((response.error?.details as any).id).toBe(1);
      expect((response.error?.details as any).self).toBe(
        response.error?.details,
      );
    });

    /**
     * Test Case 36: Kiểm tra với very large details object
     * Input: Large object with many properties
     * Expected Output: Full object preserved
     * Path Coverage: Large details
     */
    it('TC036: should handle very large details object', () => {
      const details = {
        items: Array(1000)
          .fill(null)
          .map((_, i) => ({ id: i, error: `error-${i}` })),
      };
      const response = new ErrorResponseDto('Error', 'CODE', details);

      expect((response.error?.details as any).items).toHaveLength(1000);
    });
  });

  describe('Edge Cases and Boundaries', () => {
    /**
     * Test Case 37: Kiểm tra multiple instances independence
     * Input: Multiple error instances
     * Expected Output: Each instance independent
     * Path Coverage: Instance independence
     */
    it('TC037: should create independent instances', () => {
      const error1 = new ErrorResponseDto('Error 1', 'CODE1', { id: 1 });
      const error2 = new ErrorResponseDto('Error 2', 'CODE2', { id: 2 });

      expect(error1).not.toBe(error2);
      expect(error1.message).toBe('Error 1');
      expect(error2.message).toBe('Error 2');
      expect(error1.error?.code).toBe('CODE1');
      expect(error2.error?.code).toBe('CODE2');
      // Timestamps may be same if created in same millisecond
      expect(error1.timestamp).toBeDefined();
      expect(error2.timestamp).toBeDefined();
    });

    /**
     * Test Case 38: Kiểm tra với same parameters
     * Input: Same message, code, details
     * Expected Output: Different instances with different timestamps
     * Path Coverage: Same parameters
     */
    it('TC038: should create different instances with same parameters', () => {
      const message = 'Same error';
      const code = 'SAME_CODE';
      const details = { same: 'details' };

      const error1 = new ErrorResponseDto(message, code, details);
      const error2 = new ErrorResponseDto(message, code, details);

      expect(error1).not.toBe(error2);
      expect(error1.message).toBe(error2.message);
      expect(error1.error?.code).toBe(error2.error?.code);
      // Timestamps may be same if created in same millisecond
      expect(error1.timestamp).toBeDefined();
      expect(error2.timestamp).toBeDefined();
    });

    /**
     * Test Case 39: Kiểm tra property immutability
     * Input: Change message after creation
     * Expected Output: Original message unchanged
     * Path Coverage: Property modification
     */
    it('TC039: should allow property modification (no immutability)', () => {
      const response = new ErrorResponseDto('Original');
      const originalMessage = response.message;

      response.message = 'Modified';

      expect(response.message).toBe('Modified');
      expect(response.message).not.toBe(originalMessage);
    });

    /**
     * Test Case 40: Kiểm tra details object reference
     * Input: Modify details object after creation
     * Expected Output: Original object modified (reference)
     * Path Coverage: Reference vs copy
     */
    it('TC040: should reference original details object', () => {
      const details = { value: 'original' };
      const response = new ErrorResponseDto('Error', 'CODE', details);

      details.value = 'modified';

      expect((response.error?.details as any).value).toBe('modified');
    });
  });

  describe('Integration and Real-world Scenarios', () => {
    /**
     * Test Case 41: Kiểm tra validation error scenario
     * Input: Typical validation error
     * Expected Output: Proper validation error response
     * Path Coverage: Validation use case
     */
    it('TC041: should create typical validation error', () => {
      const response = new ErrorResponseDto(
        'Validation failed',
        'VALIDATION_ERROR',
        {
          errors: [
            { field: 'email', message: 'Invalid email format' },
            { field: 'password', message: 'Password too short' },
          ],
        },
      );

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('VALIDATION_ERROR');
      expect((response.error?.details as any).errors).toHaveLength(2);
    });

    /**
     * Test Case 42: Kiểm tra authentication error scenario
     * Input: Auth error
     * Expected Output: Proper auth error response
     * Path Coverage: Auth use case
     */
    it('TC042: should create authentication error', () => {
      const response = new ErrorResponseDto(
        'Invalid credentials',
        'UNAUTHORIZED',
        { attemptedUsername: 'user@example.com' },
      );

      expect(response.error?.code).toBe('UNAUTHORIZED');
      expect((response.error?.details as any).attemptedUsername).toBe(
        'user@example.com',
      );
    });

    /**
     * Test Case 43: Kiểm tra not found error scenario
     * Input: Resource not found
     * Expected Output: Proper not found error response
     * Path Coverage: Not found use case
     */
    it('TC043: should create not found error', () => {
      const response = new ErrorResponseDto('User not found', 'NOT_FOUND', {
        userId: '12345',
      });

      expect(response.error?.code).toBe('NOT_FOUND');
      expect(response.message).toBe('User not found');
    });

    /**
     * Test Case 44: Kiểm tra internal server error scenario
     * Input: Internal error with stack trace
     * Expected Output: Proper internal error response
     * Path Coverage: Internal error use case
     */
    it('TC044: should create internal server error', () => {
      const error = new Error('Database connection failed');
      const response = new ErrorResponseDto(
        'Internal server error',
        'INTERNAL_ERROR',
        {
          originalError: error.message,
          stack: error.stack,
        },
      );

      expect(response.error?.code).toBe('INTERNAL_ERROR');
      expect((response.error?.details as any).originalError).toBe(
        'Database connection failed',
      );
    });

    /**
     * Test Case 45: Kiểm tra rate limit error scenario
     * Input: Rate limit exceeded
     * Expected Output: Proper rate limit error response
     * Path Coverage: Rate limit use case
     */
    it('TC045: should create rate limit error', () => {
      const response = new ErrorResponseDto(
        'Rate limit exceeded',
        'RATE_LIMIT',
        {
          limit: 100,
          current: 150,
          resetAt: new Date().toISOString(),
        },
      );

      expect(response.error?.code).toBe('RATE_LIMIT');
      expect((response.error?.details as any).limit).toBe(100);
      expect((response.error?.details as any).current).toBe(150);
    });

    /**
     * Test Case 46: Kiểm tra JSON serialization
     * Input: Error response
     * Expected Output: Can be JSON stringified
     * Path Coverage: JSON serialization
     */
    it('TC046: should be JSON serializable', () => {
      const response = new ErrorResponseDto('Error message', 'ERROR_CODE', {
        detail: 'test',
      });

      const json = JSON.stringify(response);
      const parsed = JSON.parse(json);

      expect(parsed.success).toBe(false);
      expect(parsed.message).toBe('Error message');
      expect(parsed.error.code).toBe('ERROR_CODE');
      expect(parsed.error.details.detail).toBe('test');
    });

    /**
     * Test Case 47: Kiểm tra từ API response
     * Input: Error from API
     * Expected Output: Can be sent as HTTP response
     * Path Coverage: API response use case
     */
    it('TC047: should work as HTTP API response', () => {
      const response = new ErrorResponseDto('Bad request', 'BAD_REQUEST');

      const apiResponse = {
        statusCode: 400,
        body: response,
      };

      expect(apiResponse.body.success).toBe(false);
      expect(apiResponse.body.error?.code).toBe('BAD_REQUEST');
    });

    /**
     * Test Case 48: Kiểm tra error chaining
     * Input: Multiple errors chained
     * Expected Output: Nested error structure
     * Path Coverage: Error chaining
     */
    it('TC048: should support error chaining', () => {
      const rootError = new Error('Root cause');
      const response = new ErrorResponseDto(
        'Operation failed',
        'OPERATION_ERROR',
        {
          cause: rootError.message,
          context: 'During user creation',
          timestamp: new Date().toISOString(),
        },
      );

      expect((response.error?.details as any).cause).toBe('Root cause');
      expect((response.error?.details as any).context).toBe(
        'During user creation',
      );
    });

    /**
     * Test Case 49: Kiểm tra với TypeScript type checking
     * Input: Error response
     * Expected Output: Generic type is undefined
     * Path Coverage: Type safety
     */
    it('TC049: should have undefined generic type', () => {
      const response = new ErrorResponseDto('Error');

      // Type assertion to verify generic type
      const typed: BaseResponseDto<undefined> = response;

      expect(typed.data).toBeUndefined();
      expect(response.data).toBeUndefined();
    });

    /**
     * Test Case 50: Kiểm tra logging scenario
     * Input: Error for logging
     * Expected Output: Can extract all fields for logging
     * Path Coverage: Logging use case
     */
    it('TC050: should provide all fields for logging', () => {
      const response = new ErrorResponseDto('Database error', 'DB_ERROR', {
        query: 'SELECT * FROM users',
        sqlState: '42000',
      });

      const logEntry = {
        timestamp: response.timestamp,
        success: response.success,
        message: response.message,
        errorCode: response.error?.code,
        errorDetails: response.error?.details,
      };

      expect(logEntry.timestamp).toBeDefined();
      expect(logEntry.success).toBe(false);
      expect(logEntry.message).toBe('Database error');
      expect(logEntry.errorCode).toBe('DB_ERROR');
      expect((logEntry.errorDetails as any)?.query).toBe('SELECT * FROM users');
    });
  });
});
