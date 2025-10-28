import 'reflect-metadata';
import { ValidationExceptionFilter } from '../src/common/filters/validationexception.filters';
import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationErrorDto } from '../src/common/dto/validation.error.dto';

describe('ValidationExceptionFilter - White Box Testing (Input-Output)', () => {
  let filter: ValidationExceptionFilter;
  let mockRequest: any;
  let mockResponse: Partial<Response>;
  let mockArgumentsHost: jest.Mocked<ArgumentsHost>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    filter = new ValidationExceptionFilter();

    mockRequest = {
      url: '/api/test',
      method: 'POST',
      requestId: 'test-request-id',
    };

    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as unknown as jest.Mocked<ArgumentsHost>;

    // Mock logger to prevent console output during tests
    jest.spyOn(filter['logger'], 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Object Response Handling', () => {
    /**
     * Test Case 1: Kiểm tra object response with message string
     * Input: Object response with message as string
     * Expected Output: Message extracted
     * Path Coverage: typeof exceptionResponse === 'object' && message is string
     */
    it('TC001: should handle object response with message string', () => {
      const exception = new BadRequestException({
        message: 'Invalid data provided',
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'VALIDATION_ERROR',
          message: 'Invalid data provided',
          details: [],
        }),
      );
    });

    /**
     * Test Case 2: Kiểm tra object response without message
     * Input: Object without message property
     * Expected Output: Default 'Validation failed' message
     * Path Coverage: Object without message
     */
    it('TC002: should use default message when object has no message', () => {
      const exception = new BadRequestException({ someField: 'value' });

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
        }),
      );
    });

    /**
     * Test Case 3: Kiểm tra object response with empty string message
     * Input: Object with message = ''
     * Expected Output: Default 'Validation failed' message
     * Path Coverage: Empty string message
     */
    it('TC003: should use default message when message is empty string', () => {
      const exception = new BadRequestException({ message: '' });

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
        }),
      );
    });

    /**
     * Test Case 4: Kiểm tra object response with null message
     * Input: Object with message = null
     * Expected Output: Default 'Validation failed' message
     * Path Coverage: Null message
     */
    it('TC004: should use default message when message is null', () => {
      const exception = new BadRequestException({ message: null });

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
        }),
      );
    });
  });

  describe('Array Message Handling (Validation Errors)', () => {
    /**
     * Test Case 5: Kiểm tra array message with single validation error
     * Input: Array with one validation error
     * Expected Output: ValidationErrorDto array created
     * Path Coverage: Array.isArray(responseObj.message) === true
     */
    it('TC005: should handle array message with single validation error', () => {
      const validationError = {
        property: 'email',
        constraints: {
          isEmail: 'email must be an email',
          isNotEmpty: 'email should not be empty',
        },
        value: 'invalid-email',
      };

      const exception = new BadRequestException({
        message: [validationError],
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'email',
              message: expect.stringContaining('email must be an email'),
              value: 'invalid-email',
            }),
          ]),
        }),
      );
    });

    /**
     * Test Case 6: Kiểm tra array message with multiple validation errors
     * Input: Array with multiple errors
     * Expected Output: Multiple ValidationErrorDto objects
     * Path Coverage: Multiple array elements
     */
    it('TC006: should handle array message with multiple validation errors', () => {
      const validationErrors = [
        {
          property: 'email',
          constraints: { isEmail: 'email must be an email' },
          value: 'invalid',
        },
        {
          property: 'password',
          constraints: { minLength: 'password must be at least 8 characters' },
          value: '123',
        },
      ];

      const exception = new BadRequestException({
        message: validationErrors,
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.details).toHaveLength(2);
      expect(responseCall.details[0].field).toBe('email');
      expect(responseCall.details[1].field).toBe('password');
    });

    /**
     * Test Case 7: Kiểm tra validation error with multiple constraints
     * Input: Single error with multiple constraints
     * Expected Output: Constraints joined with ', '
     * Path Coverage: Multiple constraints
     */
    it('TC007: should join multiple constraints with comma', () => {
      const validationError = {
        property: 'age',
        constraints: {
          isNumber: 'age must be a number',
          min: 'age must be at least 18',
          max: 'age must be at most 100',
        },
        value: 'abc',
      };

      const exception = new BadRequestException({
        message: [validationError],
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.details[0].message).toContain(',');
      expect(responseCall.details[0].message).toContain('age must be a number');
    });

    /**
     * Test Case 8: Kiểm tra validation error without property
     * Input: Error without property field
     * Expected Output: Empty string for field
     * Path Coverage: Missing property
     */
    it('TC008: should use empty string when property is missing', () => {
      const validationError = {
        constraints: { error: 'Some error' },
        value: 'value',
      };

      const exception = new BadRequestException({
        message: [validationError],
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.details[0].field).toBe('');
    });

    /**
     * Test Case 9: Kiểm tra validation error without constraints
     * Input: Error without constraints field
     * Expected Output: Empty string for message
     * Path Coverage: Missing constraints
     */
    it('TC009: should handle missing constraints', () => {
      const validationError = {
        property: 'field',
        value: 'value',
      };

      const exception = new BadRequestException({
        message: [validationError],
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.details[0].message).toBe('');
    });

    /**
     * Test Case 10: Kiểm tra validation error without value
     * Input: Error without value field
     * Expected Output: undefined for value
     * Path Coverage: Missing value
     */
    it('TC010: should handle missing value', () => {
      const validationError = {
        property: 'field',
        constraints: { error: 'Error message' },
      };

      const exception = new BadRequestException({
        message: [validationError],
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.details[0].value).toBeUndefined();
    });

    /**
     * Test Case 11: Kiểm tra validation error with null value
     * Input: Error with value = null
     * Expected Output: null value preserved
     * Path Coverage: Null value
     */
    it('TC011: should preserve null value', () => {
      const validationError = {
        property: 'field',
        constraints: { error: 'Error' },
        value: null,
      };

      const exception = new BadRequestException({
        message: [validationError],
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.details[0].value).toBeNull();
    });

    /**
     * Test Case 12: Kiểm tra validation error with 0 value
     * Input: Error with value = 0
     * Expected Output: 0 value preserved
     * Path Coverage: Falsy value
     */
    it('TC012: should preserve zero value', () => {
      const validationError = {
        property: 'age',
        constraints: { min: 'age must be positive' },
        value: 0,
      };

      const exception = new BadRequestException({
        message: [validationError],
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.details[0].value).toBe(0);
    });

    /**
     * Test Case 13: Kiểm tra validation error with empty array value
     * Input: Error with value = []
     * Expected Output: Empty array preserved
     * Path Coverage: Array value
     */
    it('TC013: should preserve empty array value', () => {
      const validationError = {
        property: 'items',
        constraints: { minLength: 'items should not be empty' },
        value: [],
      };

      const exception = new BadRequestException({
        message: [validationError],
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.details[0].value).toEqual([]);
    });

    /**
     * Test Case 14: Kiểm tra validation error with object value
     * Input: Error with complex object value
     * Expected Output: Object value preserved
     * Path Coverage: Object value
     */
    it('TC014: should preserve object value', () => {
      const complexValue = { nested: { field: 'value' } };
      const validationError = {
        property: 'data',
        constraints: { error: 'Invalid data' },
        value: complexValue,
      };

      const exception = new BadRequestException({
        message: [validationError],
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.details[0].value).toEqual(complexValue);
    });

    /**
     * Test Case 15: Kiểm tra empty array message
     * Input: Array message with no elements
     * Expected Output: Empty errors array
     * Path Coverage: Empty array
     */
    it('TC015: should handle empty array message', () => {
      const exception = new BadRequestException({ message: [] });

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          details: [],
        }),
      );
    });
  });

  describe('String Response Handling', () => {
    /**
     * Test Case 16: Kiểm tra string response
     * Input: BadRequestException with string response
     * Expected Output: Uses exception message as-is, empty errors
     * Path Coverage: typeof exceptionResponse !== 'object'
     */
    it('TC016: should handle string response', () => {
      const exception = new BadRequestException('Invalid request');

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid request',
          details: [],
        }),
      );
    });

    /**
     * Test Case 17: Kiểm tra empty string response
     * Input: Empty string response
     * Expected Output: Uses default 'Bad Request' message from NestJS
     * Path Coverage: Empty string response
     */
    it('TC017: should handle empty string response', () => {
      const exception = new BadRequestException('');

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Bad Request',
          details: [],
        }),
      );
    });
  });

  describe('Response Structure', () => {
    /**
     * Test Case 18: Kiểm tra response structure completeness
     * Input: Any BadRequestException
     * Expected Output: Complete error response
     * Path Coverage: Response structure
     */
    it('TC018: should return complete error response structure', () => {
      const exception = new BadRequestException('Invalid');

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'VALIDATION_ERROR',
          message: expect.any(String),
          timestamp: expect.any(String),
          path: expect.any(String),
          method: expect.any(String),
          requestId: expect.any(String),
          details: expect.any(Array),
        }),
      );
    });

    /**
     * Test Case 19: Kiểm tra HTTP status code
     * Input: Any BadRequestException
     * Expected Output: 400 BAD_REQUEST
     * Path Coverage: Status code
     */
    it('TC019: should return 400 BAD_REQUEST status', () => {
      const exception = new BadRequestException('Invalid');

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    });

    /**
     * Test Case 20: Kiểm tra error code
     * Input: Any BadRequestException
     * Expected Output: error = 'VALIDATION_ERROR'
     * Path Coverage: Error code
     */
    it('TC020: should set error code to VALIDATION_ERROR', () => {
      const exception = new BadRequestException('Invalid');

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'VALIDATION_ERROR',
        }),
      );
    });

    /**
     * Test Case 21: Kiểm tra success field
     * Input: Any BadRequestException
     * Expected Output: success = false
     * Path Coverage: Success field
     */
    it('TC021: should set success to false', () => {
      const exception = new BadRequestException('Invalid');

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });

    /**
     * Test Case 22: Kiểm tra timestamp format
     * Input: Any BadRequestException
     * Expected Output: ISO format timestamp
     * Path Coverage: Timestamp
     */
    it('TC022: should include ISO timestamp', () => {
      const exception = new BadRequestException('Invalid');

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    /**
     * Test Case 23: Kiểm tra path field
     * Input: BadRequestException
     * Expected Output: Request path included
     * Path Coverage: Path field
     */
    it('TC023: should include request path', () => {
      const exception = new BadRequestException('Invalid');

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/test',
        }),
      );
    });

    /**
     * Test Case 24: Kiểm tra method field
     * Input: BadRequestException
     * Expected Output: Request method included
     * Path Coverage: Method field
     */
    it('TC024: should include request method', () => {
      const exception = new BadRequestException('Invalid');

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
        }),
      );
    });

    /**
     * Test Case 25: Kiểm tra requestId field
     * Input: BadRequestException
     * Expected Output: RequestId included
     * Path Coverage: RequestId field
     */
    it('TC025: should include requestId', () => {
      const exception = new BadRequestException('Invalid');

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'test-request-id',
        }),
      );
    });

    /**
     * Test Case 26: Kiểm tra details field is array
     * Input: BadRequestException
     * Expected Output: details is always an array
     * Path Coverage: Details type
     */
    it('TC026: should always include details as array', () => {
      const exception = new BadRequestException('Invalid');

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(Array.isArray(responseCall.details)).toBe(true);
    });
  });

  describe('Logging Behavior', () => {
    /**
     * Test Case 27: Kiểm tra logger warning được gọi
     * Input: Any BadRequestException
     * Expected Output: logger.warn called
     * Path Coverage: Logger invocation
     */
    it('TC027: should log warning for validation error', () => {
      const exception = new BadRequestException('Invalid');
      const loggerSpy = jest.spyOn(filter['logger'], 'warn');

      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalled();
    });

    /**
     * Test Case 28: Kiểm tra log message format
     * Input: BadRequestException with custom message
     * Expected Output: Log contains 'Validation Error'
     * Path Coverage: Log format
     */
    it('TC028: should log with correct format', () => {
      const exception = new BadRequestException({
        message: 'Custom validation error',
      });
      const loggerSpy = jest.spyOn(filter['logger'], 'warn');

      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Validation Error'),
      );
    });

    /**
     * Test Case 29: Kiểm tra log includes request method
     * Input: BadRequestException
     * Expected Output: Log contains method
     * Path Coverage: Method in log
     */
    it('TC029: should include request method in log', () => {
      const exception = new BadRequestException('Invalid');
      const loggerSpy = jest.spyOn(filter['logger'], 'warn');

      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('POST'));
    });

    /**
     * Test Case 30: Kiểm tra log includes request URL
     * Input: BadRequestException
     * Expected Output: Log contains URL
     * Path Coverage: URL in log
     */
    it('TC030: should include request URL in log', () => {
      const exception = new BadRequestException('Invalid');
      const loggerSpy = jest.spyOn(filter['logger'], 'warn');

      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
      );
    });

    /**
     * Test Case 31: Kiểm tra log includes custom message
     * Input: BadRequestException with custom message
     * Expected Output: Log contains custom message
     * Path Coverage: Custom message in log
     */
    it('TC031: should include custom message in log', () => {
      const exception = new BadRequestException({
        message: 'Email format is invalid',
      });
      const loggerSpy = jest.spyOn(filter['logger'], 'warn');

      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Email format is invalid'),
      );
    });
  });

  describe('Edge Cases', () => {
    /**
     * Test Case 32: Kiểm tra without requestId
     * Input: Request without requestId
     * Expected Output: 'unknown' requestId
     * Path Coverage: Missing requestId
     */
    it('TC032: should use "unknown" when requestId is missing', () => {
      delete mockRequest.requestId;
      const exception = new BadRequestException('Invalid');

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'unknown',
        }),
      );
    });

    /**
     * Test Case 33: Kiểm tra với different HTTP methods
     * Input: Various HTTP methods
     * Expected Output: Method reflected in response
     * Path Coverage: Different methods
     */
    it('TC033: should handle different HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      methods.forEach((method) => {
        mockRequest.method = method;
        const exception = new BadRequestException('Invalid');

        filter.catch(exception, mockArgumentsHost);

        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            method: method,
          }),
        );
      });
    });

    /**
     * Test Case 34: Kiểm tra với different URLs
     * Input: Various URL paths
     * Expected Output: Path reflected in response
     * Path Coverage: Different URLs
     */
    it('TC034: should handle different URL paths', () => {
      const urls = ['/api/users', '/api/posts/create', '/auth/register'];

      urls.forEach((url) => {
        mockRequest.url = url;
        const exception = new BadRequestException('Invalid');

        filter.catch(exception, mockArgumentsHost);

        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            path: url,
          }),
        );
      });
    });

    /**
     * Test Case 35: Kiểm tra URL with query parameters
     * Input: URL with query string
     * Expected Output: Full URL preserved
     * Path Coverage: Query parameters
     */
    it('TC035: should preserve URL with query parameters', () => {
      mockRequest.url = '/api/users?search=test&page=1';
      const exception = new BadRequestException('Invalid');

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/users?search=test&page=1',
        }),
      );
    });

    /**
     * Test Case 36: Kiểm tra nested property names
     * Input: Validation error with nested property
     * Expected Output: Nested property name preserved
     * Path Coverage: Nested property
     */
    it('TC036: should handle nested property names', () => {
      const validationError = {
        property: 'user.profile.email',
        constraints: { isEmail: 'email must be valid' },
        value: 'invalid',
      };

      const exception = new BadRequestException({
        message: [validationError],
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.details[0].field).toBe('user.profile.email');
    });

    /**
     * Test Case 37: Kiểm tra array index property
     * Input: Property with array index
     * Expected Output: Array index preserved
     * Path Coverage: Array property
     */
    it('TC037: should handle array index in property name', () => {
      const validationError = {
        property: 'items[0].name',
        constraints: { isNotEmpty: 'name should not be empty' },
        value: '',
      };

      const exception = new BadRequestException({
        message: [validationError],
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.details[0].field).toBe('items[0].name');
    });
  });

  describe('Real-world Scenarios', () => {
    /**
     * Test Case 38: Kiểm tra user registration validation
     * Input: Multiple validation errors for registration
     * Expected Output: All errors included
     * Path Coverage: Registration scenario
     */
    it('TC038: should handle user registration validation errors', () => {
      const validationErrors = [
        {
          property: 'email',
          constraints: { isEmail: 'email must be an email' },
          value: 'invalid-email',
        },
        {
          property: 'password',
          constraints: {
            minLength: 'password must be at least 8 characters',
          },
          value: '123',
        },
        {
          property: 'username',
          constraints: { matches: 'username must be alphanumeric' },
          value: 'user@123',
        },
      ];

      const exception = new BadRequestException({
        message: validationErrors,
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.details).toHaveLength(3);
    });

    /**
     * Test Case 39: Kiểm tra form validation with empty fields
     * Input: Empty required fields
     * Expected Output: IsNotEmpty validation errors
     * Path Coverage: Empty field validation
     */
    it('TC039: should handle empty required fields validation', () => {
      const validationErrors = [
        {
          property: 'firstName',
          constraints: { isNotEmpty: 'firstName should not be empty' },
          value: '',
        },
        {
          property: 'lastName',
          constraints: { isNotEmpty: 'lastName should not be empty' },
          value: '',
        },
      ];

      const exception = new BadRequestException({
        message: validationErrors,
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.details.every((d: any) => d.value === '')).toBe(true);
    });

    /**
     * Test Case 40: Kiểm tra numeric field validation
     * Input: Invalid number field
     * Expected Output: Number validation error
     * Path Coverage: Number validation
     */
    it('TC040: should handle numeric field validation', () => {
      const validationError = {
        property: 'age',
        constraints: {
          isNumber: 'age must be a number',
          min: 'age must not be less than 0',
          max: 'age must not be greater than 150',
        },
        value: 'not-a-number',
      };

      const exception = new BadRequestException({
        message: [validationError],
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.details[0].message).toContain('age must be a number');
    });

    /**
     * Test Case 41: Kiểm tra date field validation
     * Input: Invalid date format
     * Expected Output: Date validation error
     * Path Coverage: Date validation
     */
    it('TC041: should handle date field validation', () => {
      const validationError = {
        property: 'birthDate',
        constraints: {
          isDateString: 'birthDate must be a valid ISO 8601 date',
        },
        value: 'invalid-date',
      };

      const exception = new BadRequestException({
        message: [validationError],
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.details[0].field).toBe('birthDate');
    });

    /**
     * Test Case 42: Kiểm tra enum field validation
     * Input: Invalid enum value
     * Expected Output: Enum validation error
     * Path Coverage: Enum validation
     */
    it('TC042: should handle enum field validation', () => {
      const validationError = {
        property: 'status',
        constraints: {
          isEnum:
            'status must be one of the following values: active, inactive',
        },
        value: 'unknown',
      };

      const exception = new BadRequestException({
        message: [validationError],
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.details[0].value).toBe('unknown');
    });

    /**
     * Test Case 43: Kiểm tra array field validation
     * Input: Invalid array field
     * Expected Output: Array validation error
     * Path Coverage: Array validation
     */
    it('TC043: should handle array field validation', () => {
      const validationError = {
        property: 'tags',
        constraints: {
          isArray: 'tags must be an array',
          arrayMinSize: 'tags must contain at least 1 element',
        },
        value: null,
      };

      const exception = new BadRequestException({
        message: [validationError],
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.details[0].field).toBe('tags');
    });

    /**
     * Test Case 44: Kiểm tra boolean field validation
     * Input: Invalid boolean value
     * Expected Output: Boolean validation error
     * Path Coverage: Boolean validation
     */
    it('TC044: should handle boolean field validation', () => {
      const validationError = {
        property: 'isActive',
        constraints: { isBoolean: 'isActive must be a boolean value' },
        value: 'yes',
      };

      const exception = new BadRequestException({
        message: [validationError],
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.details[0].value).toBe('yes');
    });

    /**
     * Test Case 45: Kiểm tra URL field validation
     * Input: Invalid URL
     * Expected Output: URL validation error
     * Path Coverage: URL validation
     */
    it('TC045: should handle URL field validation', () => {
      const validationError = {
        property: 'website',
        constraints: { isUrl: 'website must be an URL address' },
        value: 'not-a-url',
      };

      const exception = new BadRequestException({
        message: [validationError],
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.details[0].field).toBe('website');
    });

    /**
     * Test Case 46: Kiểm tra UUID field validation
     * Input: Invalid UUID
     * Expected Output: UUID validation error
     * Path Coverage: UUID validation
     */
    it('TC046: should handle UUID field validation', () => {
      const validationError = {
        property: 'userId',
        constraints: { isUuid: 'userId must be a UUID' },
        value: 'not-a-uuid',
      };

      const exception = new BadRequestException({
        message: [validationError],
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.details[0].value).toBe('not-a-uuid');
    });

    /**
     * Test Case 47: Kiểm tra length validation
     * Input: String length validation errors
     * Expected Output: Min/Max length errors
     * Path Coverage: Length validation
     */
    it('TC047: should handle length validation errors', () => {
      const validationError = {
        property: 'username',
        constraints: {
          minLength: 'username must be longer than or equal to 3 characters',
          maxLength: 'username must be shorter than or equal to 20 characters',
        },
        value: 'ab',
      };

      const exception = new BadRequestException({
        message: [validationError],
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.details[0].message).toContain(
        'username must be longer',
      );
    });

    /**
     * Test Case 48: Kiểm tra regex pattern validation
     * Input: Pattern mismatch
     * Expected Output: Pattern validation error
     * Path Coverage: Pattern validation
     */
    it('TC048: should handle regex pattern validation', () => {
      const validationError = {
        property: 'phoneNumber',
        constraints: {
          matches:
            'phoneNumber must match /^\\+?[1-9]\\d{1,14}$/ regular expression',
        },
        value: 'abc123',
      };

      const exception = new BadRequestException({
        message: [validationError],
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.details[0].field).toBe('phoneNumber');
    });

    /**
     * Test Case 49: Kiểm tra custom validation
     * Input: Custom validator error
     * Expected Output: Custom error message
     * Path Coverage: Custom validation
     */
    it('TC049: should handle custom validation errors', () => {
      const validationError = {
        property: 'confirmPassword',
        constraints: {
          passwordMatch: 'confirmPassword must match password',
        },
        value: 'different-password',
      };

      const exception = new BadRequestException({
        message: [validationError],
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.details[0].message).toBe(
        'confirmPassword must match password',
      );
    });

    /**
     * Test Case 50: Kiểm tra multiple validations on single field
     * Input: Field with many constraint violations
     * Expected Output: All constraints joined
     * Path Coverage: Multiple constraints
     */
    it('TC050: should handle multiple validations on single field', () => {
      const validationError = {
        property: 'email',
        constraints: {
          isNotEmpty: 'email should not be empty',
          isEmail: 'email must be an email',
          maxLength: 'email must be shorter than or equal to 100 characters',
          isUnique: 'email already exists',
        },
        value: '',
      };

      const exception = new BadRequestException({
        message: [validationError],
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      const errorMessage = responseCall.details[0].message;
      expect(errorMessage.split(',').length).toBe(4);
    });

    /**
     * Test Case 51: Kiểm tra POST request validation
     * Input: POST request with validation errors
     * Expected Output: Validation response
     * Path Coverage: POST request
     */
    it('TC051: should handle POST request validation', () => {
      mockRequest.method = 'POST';
      mockRequest.url = '/api/users/create';
      const exception = new BadRequestException({
        message: 'Validation failed',
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          path: '/api/users/create',
        }),
      );
    });

    /**
     * Test Case 52: Kiểm tra PUT request validation
     * Input: PUT request with validation errors
     * Expected Output: Validation response
     * Path Coverage: PUT request
     */
    it('TC052: should handle PUT request validation', () => {
      mockRequest.method = 'PUT';
      mockRequest.url = '/api/users/123';
      const exception = new BadRequestException({
        message: 'Invalid update data',
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PUT',
          message: 'Invalid update data',
        }),
      );
    });

    /**
     * Test Case 53: Kiểm tra PATCH request validation
     * Input: PATCH request with validation errors
     * Expected Output: Validation response
     * Path Coverage: PATCH request
     */
    it('TC053: should handle PATCH request validation', () => {
      mockRequest.method = 'PATCH';
      mockRequest.url = '/api/users/123';
      const exception = new BadRequestException({
        message: 'Invalid patch data',
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PATCH',
        }),
      );
    });

    /**
     * Test Case 54: Kiểm tra complete validation flow
     * Input: BadRequestException with full validation data
     * Expected Output: Complete flow executed
     * Path Coverage: Complete flow
     */
    it('TC054: should execute complete validation flow', () => {
      const loggerSpy = jest.spyOn(filter['logger'], 'warn');

      const validationErrors = [
        {
          property: 'email',
          constraints: { isEmail: 'email must be an email' },
          value: 'invalid',
        },
      ];

      const exception = new BadRequestException({
        message: validationErrors,
      });

      filter.catch(exception, mockArgumentsHost);

      // Verify all steps
      expect(loggerSpy).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'VALIDATION_ERROR',
          message: expect.arrayContaining([
            expect.objectContaining({
              property: 'email',
            }),
          ]),
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'email',
            }),
          ]),
        }),
      );
    });

    /**
     * Test Case 55: Kiểm tra Unicode in validation messages
     * Input: Validation error with Unicode
     * Expected Output: Unicode preserved
     * Path Coverage: Unicode
     */
    it('TC055: should handle Unicode in validation messages', () => {
      const validationError = {
        property: 'name',
        constraints: { error: '名前は必須です (Name is required)' },
        value: '',
      };

      const exception = new BadRequestException({
        message: [validationError],
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.details[0].message).toBe(
        '名前は必須です (Name is required)',
      );
    });

    /**
     * Test Case 56: Kiểm tra special characters in field names
     * Input: Field with special characters
     * Expected Output: Special characters preserved
     * Path Coverage: Special characters
     */
    it('TC056: should handle special characters in field names', () => {
      const validationError = {
        property: 'user-email',
        constraints: { error: 'Invalid' },
        value: 'test',
      };

      const exception = new BadRequestException({
        message: [validationError],
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.details[0].field).toBe('user-email');
    });

    /**
     * Test Case 57: Kiểm tra very long constraint messages
     * Input: Long validation messages
     * Expected Output: Full messages preserved
     * Path Coverage: Long messages
     */
    it('TC057: should handle very long constraint messages', () => {
      const longMessage = 'Error: ' + 'x'.repeat(500);
      const validationError = {
        property: 'field',
        constraints: { custom: longMessage },
        value: 'test',
      };

      const exception = new BadRequestException({
        message: [validationError],
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.details[0].message).toBe(longMessage);
    });

    /**
     * Test Case 58: Kiểm tra constraint with empty string
     * Input: Constraint with empty message
     * Expected Output: Empty string in message
     * Path Coverage: Empty constraint
     */
    it('TC058: should handle constraint with empty string', () => {
      const validationError = {
        property: 'field',
        constraints: { error: '' },
        value: 'test',
      };

      const exception = new BadRequestException({
        message: [validationError],
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.details[0].message).toBe('');
    });

    /**
     * Test Case 59: Kiểm tra mixed string and array message
     * Input: String message (not array)
     * Expected Output: Empty errors array
     * Path Coverage: Non-array message
     */
    it('TC059: should handle non-array message in object response', () => {
      const exception = new BadRequestException({
        message: 'Single string message',
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Single string message',
          details: [],
        }),
      );
    });

    /**
     * Test Case 60: Kiểm tra ValidationErrorDto instantiation
     * Input: Validation error with all fields
     * Expected Output: Proper ValidationErrorDto created
     * Path Coverage: DTO creation
     */
    it('TC060: should create proper ValidationErrorDto instances', () => {
      const validationError = {
        property: 'testField',
        constraints: {
          constraint1: 'Error 1',
          constraint2: 'Error 2',
        },
        value: 'testValue',
      };

      const exception = new BadRequestException({
        message: [validationError],
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      const errorDto = responseCall.details[0];

      expect(errorDto).toHaveProperty('field');
      expect(errorDto).toHaveProperty('message');
      expect(errorDto).toHaveProperty('value');
      expect(errorDto.field).toBe('testField');
      expect(errorDto.value).toBe('testValue');
    });
  });
});
