import 'reflect-metadata';
import { ValidationErrorDto } from '../src/common/dto/validation.error.dto';

describe('ValidationErrorDto - White Box Testing (Input-Output)', () => {
  describe('Constructor with Required Parameters', () => {
    /**
     * Test Case 1: Kiểm tra constructor với field và message
     * Input: field='email', message='Invalid email'
     * Expected Output: Properties set, value undefined
     * Path Coverage: Basic constructor
     */
    it('TC001: should create instance with field and message', () => {
      const dto = new ValidationErrorDto('email', 'Invalid email');

      expect(dto.field).toBe('email');
      expect(dto.message).toBe('Invalid email');
      expect(dto.value).toBeUndefined();
    });

    /**
     * Test Case 2: Kiểm tra instance type
     * Input: New instance
     * Expected Output: Instance of ValidationErrorDto
     * Path Coverage: Instance validation
     */
    it('TC002: should be instance of ValidationErrorDto', () => {
      const dto = new ValidationErrorDto('field', 'message');

      expect(dto).toBeInstanceOf(ValidationErrorDto);
    });

    /**
     * Test Case 3: Kiểm tra empty field
     * Input: field='', message='error'
     * Expected Output: Empty field accepted
     * Path Coverage: Empty field
     */
    it('TC003: should accept empty field', () => {
      const dto = new ValidationErrorDto('', 'Error message');

      expect(dto.field).toBe('');
      expect(dto.message).toBe('Error message');
    });

    /**
     * Test Case 4: Kiểm tra empty message
     * Input: field='field', message=''
     * Expected Output: Empty message accepted
     * Path Coverage: Empty message
     */
    it('TC004: should accept empty message', () => {
      const dto = new ValidationErrorDto('field', '');

      expect(dto.field).toBe('field');
      expect(dto.message).toBe('');
    });

    /**
     * Test Case 5: Kiểm tra both empty
     * Input: field='', message=''
     * Expected Output: Both empty accepted
     * Path Coverage: Both empty
     */
    it('TC005: should accept both empty strings', () => {
      const dto = new ValidationErrorDto('', '');

      expect(dto.field).toBe('');
      expect(dto.message).toBe('');
      expect(dto.value).toBeUndefined();
    });
  });

  describe('Constructor with All Parameters', () => {
    /**
     * Test Case 6: Kiểm tra với string value
     * Input: field, message, value='test'
     * Expected Output: All properties set
     * Path Coverage: String value
     */
    it('TC006: should accept string value', () => {
      const dto = new ValidationErrorDto('username', 'Too short', 'ab');

      expect(dto.field).toBe('username');
      expect(dto.message).toBe('Too short');
      expect(dto.value).toBe('ab');
    });

    /**
     * Test Case 7: Kiểm tra với number value
     * Input: value=123
     * Expected Output: Number value stored
     * Path Coverage: Number value
     */
    it('TC007: should accept number value', () => {
      const dto = new ValidationErrorDto('age', 'Must be positive', -5);

      expect(dto.field).toBe('age');
      expect(dto.message).toBe('Must be positive');
      expect(dto.value).toBe(-5);
    });

    /**
     * Test Case 8: Kiểm tra với boolean value
     * Input: value=false
     * Expected Output: Boolean value stored
     * Path Coverage: Boolean value
     */
    it('TC008: should accept boolean value', () => {
      const dto = new ValidationErrorDto('isActive', 'Must be true', false);

      expect(dto.field).toBe('isActive');
      expect(dto.message).toBe('Must be true');
      expect(dto.value).toBe(false);
    });

    /**
     * Test Case 9: Kiểm tra với object value
     * Input: value={ key: 'value' }
     * Expected Output: Object value stored
     * Path Coverage: Object value
     */
    it('TC009: should accept object value', () => {
      const objValue = { key: 'value' };
      const dto = new ValidationErrorDto('data', 'Invalid structure', objValue);

      expect(dto.field).toBe('data');
      expect(dto.message).toBe('Invalid structure');
      expect(dto.value).toEqual(objValue);
      expect(dto.value).toBe(objValue); // Same reference
    });

    /**
     * Test Case 10: Kiểm tra với array value
     * Input: value=[1, 2, 3]
     * Expected Output: Array value stored
     * Path Coverage: Array value
     */
    it('TC010: should accept array value', () => {
      const arrayValue = [1, 2, 3];
      const dto = new ValidationErrorDto('items', 'Too many items', arrayValue);

      expect(dto.field).toBe('items');
      expect(dto.message).toBe('Too many items');
      expect(dto.value).toEqual(arrayValue);
      expect(dto.value).toBe(arrayValue); // Same reference
    });

    /**
     * Test Case 11: Kiểm tra với null value
     * Input: value=null
     * Expected Output: Null value stored
     * Path Coverage: Null value
     */
    it('TC011: should accept null value', () => {
      const dto = new ValidationErrorDto('field', 'Cannot be null', null);

      expect(dto.field).toBe('field');
      expect(dto.message).toBe('Cannot be null');
      expect(dto.value).toBeNull();
    });

    /**
     * Test Case 12: Kiểm tra với undefined value explicitly
     * Input: value=undefined
     * Expected Output: Undefined value stored
     * Path Coverage: Explicit undefined
     */
    it('TC012: should accept undefined value explicitly', () => {
      const dto = new ValidationErrorDto('field', 'Required', undefined);

      expect(dto.field).toBe('field');
      expect(dto.message).toBe('Required');
      expect(dto.value).toBeUndefined();
    });
  });

  describe('Field Names - Various Formats', () => {
    /**
     * Test Case 13: Kiểm tra nested field name
     * Input: field='user.email'
     * Expected Output: Nested field name accepted
     * Path Coverage: Nested field
     */
    it('TC013: should accept nested field names', () => {
      const dto = new ValidationErrorDto('user.email', 'Invalid email');

      expect(dto.field).toBe('user.email');
    });

    /**
     * Test Case 14: Kiểm tra array field name
     * Input: field='users[0].name'
     * Expected Output: Array field name accepted
     * Path Coverage: Array field
     */
    it('TC014: should accept array field names', () => {
      const dto = new ValidationErrorDto('users[0].name', 'Required');

      expect(dto.field).toBe('users[0].name');
    });

    /**
     * Test Case 15: Kiểm tra camelCase field
     * Input: field='firstName'
     * Expected Output: CamelCase accepted
     * Path Coverage: CamelCase
     */
    it('TC015: should accept camelCase field names', () => {
      const dto = new ValidationErrorDto('firstName', 'Too short');

      expect(dto.field).toBe('firstName');
    });

    /**
     * Test Case 16: Kiểm tra snake_case field
     * Input: field='first_name'
     * Expected Output: Snake_case accepted
     * Path Coverage: Snake_case
     */
    it('TC016: should accept snake_case field names', () => {
      const dto = new ValidationErrorDto('first_name', 'Too short');

      expect(dto.field).toBe('first_name');
    });

    /**
     * Test Case 17: Kiểm tra kebab-case field
     * Input: field='first-name'
     * Expected Output: Kebab-case accepted
     * Path Coverage: Kebab-case
     */
    it('TC017: should accept kebab-case field names', () => {
      const dto = new ValidationErrorDto('first-name', 'Too short');

      expect(dto.field).toBe('first-name');
    });

    /**
     * Test Case 18: Kiểm tra field with numbers
     * Input: field='field123'
     * Expected Output: Numbers in field accepted
     * Path Coverage: Numeric field
     */
    it('TC018: should accept field names with numbers', () => {
      const dto = new ValidationErrorDto('field123', 'Invalid');

      expect(dto.field).toBe('field123');
    });

    /**
     * Test Case 19: Kiểm tra field with special chars
     * Input: field='field@special'
     * Expected Output: Special chars accepted
     * Path Coverage: Special chars
     */
    it('TC019: should accept field names with special characters', () => {
      const dto = new ValidationErrorDto('field@special', 'Invalid');

      expect(dto.field).toBe('field@special');
    });

    /**
     * Test Case 20: Kiểm tra very long field name
     * Input: Very long field name
     * Expected Output: Long field accepted
     * Path Coverage: Long field
     */
    it('TC020: should accept very long field names', () => {
      const longField = 'a'.repeat(200);
      const dto = new ValidationErrorDto(longField, 'Error');

      expect(dto.field).toBe(longField);
      expect(dto.field.length).toBe(200);
    });
  });

  describe('Error Messages - Various Formats', () => {
    /**
     * Test Case 21: Kiểm tra simple validation message
     * Input: message='Required'
     * Expected Output: Simple message accepted
     * Path Coverage: Simple message
     */
    it('TC021: should accept simple validation messages', () => {
      const dto = new ValidationErrorDto('field', 'Required');

      expect(dto.message).toBe('Required');
    });

    /**
     * Test Case 22: Kiểm tra detailed message
     * Input: Detailed error message
     * Expected Output: Detailed message accepted
     * Path Coverage: Detailed message
     */
    it('TC022: should accept detailed error messages', () => {
      const message = 'Email must be a valid email address';
      const dto = new ValidationErrorDto('email', message);

      expect(dto.message).toBe(message);
    });

    /**
     * Test Case 23: Kiểm tra message with constraints
     * Input: Message with min/max values
     * Expected Output: Constraint message accepted
     * Path Coverage: Constraint message
     */
    it('TC023: should accept messages with constraints', () => {
      const message = 'Must be between 8 and 20 characters';
      const dto = new ValidationErrorDto('password', message);

      expect(dto.message).toBe(message);
    });

    /**
     * Test Case 24: Kiểm tra message with special characters
     * Input: Message with special chars
     * Expected Output: Special chars preserved
     * Path Coverage: Special chars
     */
    it('TC024: should accept messages with special characters', () => {
      const message = 'Invalid! Must match: /^[a-z]+$/';
      const dto = new ValidationErrorDto('field', message);

      expect(dto.message).toBe(message);
    });

    /**
     * Test Case 25: Kiểm tra multiline message
     * Input: Multiline message
     * Expected Output: Multiline preserved
     * Path Coverage: Multiline
     */
    it('TC025: should accept multiline messages', () => {
      const message = 'Error:\n- Must be valid\n- Must be unique';
      const dto = new ValidationErrorDto('field', message);

      expect(dto.message).toBe(message);
    });

    /**
     * Test Case 26: Kiểm tra Unicode message
     * Input: Unicode characters
     * Expected Output: Unicode preserved
     * Path Coverage: Unicode
     */
    it('TC026: should accept Unicode in messages', () => {
      const message = '无效的电子邮件 🚫';
      const dto = new ValidationErrorDto('email', message);

      expect(dto.message).toBe(message);
    });

    /**
     * Test Case 27: Kiểm tra very long message
     * Input: Very long error message
     * Expected Output: Long message accepted
     * Path Coverage: Long message
     */
    it('TC027: should accept very long messages', () => {
      const longMessage = 'Error: '.repeat(100);
      const dto = new ValidationErrorDto('field', longMessage);

      expect(dto.message).toBe(longMessage);
      expect(dto.message.length).toBeGreaterThan(500);
    });
  });

  describe('Value Types - Edge Cases', () => {
    /**
     * Test Case 28: Kiểm tra zero value
     * Input: value=0
     * Expected Output: Zero preserved
     * Path Coverage: Zero value
     */
    it('TC028: should handle zero as value', () => {
      const dto = new ValidationErrorDto('count', 'Must be positive', 0);

      expect(dto.value).toBe(0);
      expect(dto.value).not.toBeUndefined();
      expect(dto.value).not.toBeNull();
    });

    /**
     * Test Case 29: Kiểm tra false value
     * Input: value=false
     * Expected Output: False preserved
     * Path Coverage: False value
     */
    it('TC029: should handle false as value', () => {
      const dto = new ValidationErrorDto('active', 'Must be true', false);

      expect(dto.value).toBe(false);
      expect(dto.value).not.toBeUndefined();
      expect(dto.value).not.toBeNull();
    });

    /**
     * Test Case 30: Kiểm tra empty string value
     * Input: value=''
     * Expected Output: Empty string preserved
     * Path Coverage: Empty string
     */
    it('TC030: should handle empty string as value', () => {
      const dto = new ValidationErrorDto('name', 'Required', '');

      expect(dto.value).toBe('');
      expect(dto.value).not.toBeUndefined();
      expect(dto.value).not.toBeNull();
    });

    /**
     * Test Case 31: Kiểm tra empty object value
     * Input: value={}
     * Expected Output: Empty object preserved
     * Path Coverage: Empty object
     */
    it('TC031: should handle empty object as value', () => {
      const dto = new ValidationErrorDto('data', 'Invalid', {});

      expect(dto.value).toEqual({});
      expect(Object.keys(dto.value).length).toBe(0);
    });

    /**
     * Test Case 32: Kiểm tra empty array value
     * Input: value=[]
     * Expected Output: Empty array preserved
     * Path Coverage: Empty array
     */
    it('TC032: should handle empty array as value', () => {
      const dto = new ValidationErrorDto('items', 'Required', []);

      expect(dto.value).toEqual([]);
      expect(dto.value.length).toBe(0);
    });

    /**
     * Test Case 33: Kiểm tra NaN value
     * Input: value=NaN
     * Expected Output: NaN preserved
     * Path Coverage: NaN
     */
    it('TC033: should handle NaN as value', () => {
      const dto = new ValidationErrorDto('number', 'Invalid number', NaN);

      expect(dto.value).toBeNaN();
    });

    /**
     * Test Case 34: Kiểm tra Infinity value
     * Input: value=Infinity
     * Expected Output: Infinity preserved
     * Path Coverage: Infinity
     */
    it('TC034: should handle Infinity as value', () => {
      const dto = new ValidationErrorDto('number', 'Too large', Infinity);

      expect(dto.value).toBe(Infinity);
    });

    /**
     * Test Case 35: Kiểm tra negative Infinity
     * Input: value=-Infinity
     * Expected Output: -Infinity preserved
     * Path Coverage: -Infinity
     */
    it('TC035: should handle negative Infinity as value', () => {
      const dto = new ValidationErrorDto('number', 'Too small', -Infinity);

      expect(dto.value).toBe(-Infinity);
    });

    /**
     * Test Case 36: Kiểm tra Date value
     * Input: value=Date object
     * Expected Output: Date preserved
     * Path Coverage: Date object
     */
    it('TC036: should handle Date object as value', () => {
      const date = new Date('2024-01-01');
      const dto = new ValidationErrorDto('date', 'Invalid date', date);

      expect(dto.value).toBe(date);
      expect(dto.value).toBeInstanceOf(Date);
    });

    /**
     * Test Case 37: Kiểm tra RegExp value
     * Input: value=RegExp object
     * Expected Output: RegExp preserved
     * Path Coverage: RegExp object
     */
    it('TC037: should handle RegExp object as value', () => {
      const regex = /test/i;
      const dto = new ValidationErrorDto('pattern', 'Invalid regex', regex);

      expect(dto.value).toBe(regex);
      expect(dto.value).toBeInstanceOf(RegExp);
    });

    /**
     * Test Case 38: Kiểm tra Function value
     * Input: value=function
     * Expected Output: Function preserved
     * Path Coverage: Function
     */
    it('TC038: should handle Function as value', () => {
      const fn = () => 'test';
      const dto = new ValidationErrorDto('callback', 'Invalid function', fn);

      expect(dto.value).toBe(fn);
      expect(typeof dto.value).toBe('function');
    });

    /**
     * Test Case 39: Kiểm tra Symbol value
     * Input: value=Symbol
     * Expected Output: Symbol preserved
     * Path Coverage: Symbol
     */
    it('TC039: should handle Symbol as value', () => {
      const sym = Symbol('test');
      const dto = new ValidationErrorDto('symbol', 'Invalid symbol', sym);

      expect(dto.value).toBe(sym);
      expect(typeof dto.value).toBe('symbol');
    });

    /**
     * Test Case 40: Kiểm tra nested object value
     * Input: Deeply nested object
     * Expected Output: Nested structure preserved
     * Path Coverage: Nested object
     */
    it('TC040: should handle deeply nested object as value', () => {
      const nested = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
      };
      const dto = new ValidationErrorDto('data', 'Invalid structure', nested);

      expect(dto.value).toEqual(nested);
      expect(dto.value.level1.level2.level3.value).toBe('deep');
    });
  });

  describe('JSON Serialization', () => {
    /**
     * Test Case 41: Kiểm tra basic JSON serialization
     * Input: Basic ValidationErrorDto
     * Expected Output: Valid JSON
     * Path Coverage: Basic JSON
     */
    it('TC041: should be JSON serializable', () => {
      const dto = new ValidationErrorDto('email', 'Invalid email', 'test@');

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.field).toBe('email');
      expect(parsed.message).toBe('Invalid email');
      expect(parsed.value).toBe('test@');
    });

    /**
     * Test Case 42: Kiểm tra JSON without value
     * Input: DTO without value
     * Expected Output: JSON with undefined value
     * Path Coverage: No value JSON
     */
    it('TC042: should serialize without value property', () => {
      const dto = new ValidationErrorDto('field', 'Error');

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.field).toBe('field');
      expect(parsed.message).toBe('Error');
      // undefined is not serialized in JSON
      expect(parsed.value).toBeUndefined();
    });

    /**
     * Test Case 43: Kiểm tra JSON with complex value
     * Input: Complex object value
     * Expected Output: Complex structure serialized
     * Path Coverage: Complex JSON
     */
    it('TC043: should serialize complex values', () => {
      const complexValue = {
        items: [1, 2, 3],
        metadata: {
          count: 3,
          valid: false,
        },
      };
      const dto = new ValidationErrorDto('data', 'Invalid', complexValue);

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.value).toEqual(complexValue);
      expect(parsed.value.items).toEqual([1, 2, 3]);
    });
  });

  describe('Multiple Instances', () => {
    /**
     * Test Case 44: Kiểm tra independent instances
     * Input: Multiple DTOs
     * Expected Output: Independent instances
     * Path Coverage: Instance independence
     */
    it('TC044: should create independent instances', () => {
      const dto1 = new ValidationErrorDto('field1', 'Error 1', 'value1');
      const dto2 = new ValidationErrorDto('field2', 'Error 2', 'value2');

      expect(dto1).not.toBe(dto2);
      expect(dto1.field).toBe('field1');
      expect(dto2.field).toBe('field2');
      expect(dto1.value).toBe('value1');
      expect(dto2.value).toBe('value2');
    });

    /**
     * Test Case 45: Kiểm tra array of validation errors
     * Input: Array of DTOs
     * Expected Output: All DTOs stored correctly
     * Path Coverage: Array of errors
     */
    it('TC045: should work in arrays', () => {
      const errors = [
        new ValidationErrorDto('email', 'Invalid'),
        new ValidationErrorDto('password', 'Too short'),
        new ValidationErrorDto('age', 'Must be positive', -1),
      ];

      expect(errors.length).toBe(3);
      expect(errors[0].field).toBe('email');
      expect(errors[1].field).toBe('password');
      expect(errors[2].value).toBe(-1);
    });
  });

  describe('Real-world Validation Scenarios', () => {
    /**
     * Test Case 46: Kiểm tra email validation error
     * Input: Invalid email validation
     * Expected Output: Email error DTO
     * Path Coverage: Email validation
     */
    it('TC046: should represent email validation error', () => {
      const dto = new ValidationErrorDto(
        'email',
        'Must be a valid email address',
        'invalid-email',
      );

      expect(dto.field).toBe('email');
      expect(dto.message).toBe('Must be a valid email address');
      expect(dto.value).toBe('invalid-email');
    });

    /**
     * Test Case 47: Kiểm tra password strength error
     * Input: Weak password validation
     * Expected Output: Password error DTO
     * Path Coverage: Password validation
     */
    it('TC047: should represent password validation error', () => {
      const dto = new ValidationErrorDto(
        'password',
        'Must be at least 8 characters and contain uppercase, lowercase, number',
        'weak',
      );

      expect(dto.field).toBe('password');
      expect(dto.message).toContain('8 characters');
      expect(dto.value).toBe('weak');
    });

    /**
     * Test Case 48: Kiểm tra min/max validation error
     * Input: Out of range value
     * Expected Output: Range error DTO
     * Path Coverage: Range validation
     */
    it('TC048: should represent min/max validation error', () => {
      const dto = new ValidationErrorDto(
        'age',
        'Must be between 18 and 100',
        150,
      );

      expect(dto.field).toBe('age');
      expect(dto.message).toContain('between');
      expect(dto.value).toBe(150);
    });

    /**
     * Test Case 49: Kiểm tra array validation error
     * Input: Invalid array
     * Expected Output: Array error DTO
     * Path Coverage: Array validation
     */
    it('TC049: should represent array validation error', () => {
      const invalidArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      const dto = new ValidationErrorDto(
        'items',
        'Array must contain between 1 and 10 items',
        invalidArray,
      );

      expect(dto.field).toBe('items');
      expect(dto.message).toContain('between 1 and 10');
      expect(dto.value).toEqual(invalidArray);
      expect(dto.value.length).toBe(11);
    });

    /**
     * Test Case 50: Kiểm tra nested field validation error
     * Input: Nested field validation
     * Expected Output: Nested error DTO
     * Path Coverage: Nested validation
     */
    it('TC050: should represent nested field validation error', () => {
      const dto = new ValidationErrorDto(
        'user.profile.address.zipCode',
        'Invalid ZIP code format',
        '1234',
      );

      expect(dto.field).toBe('user.profile.address.zipCode');
      expect(dto.message).toBe('Invalid ZIP code format');
      expect(dto.value).toBe('1234');
    });

    /**
     * Test Case 51: Kiểm tra enum validation error
     * Input: Invalid enum value
     * Expected Output: Enum error DTO
     * Path Coverage: Enum validation
     */
    it('TC051: should represent enum validation error', () => {
      const dto = new ValidationErrorDto(
        'status',
        'Must be one of: active, inactive, pending',
        'invalid-status',
      );

      expect(dto.field).toBe('status');
      expect(dto.message).toContain('one of');
      expect(dto.value).toBe('invalid-status');
    });

    /**
     * Test Case 52: Kiểm tra type validation error
     * Input: Wrong type
     * Expected Output: Type error DTO
     * Path Coverage: Type validation
     */
    it('TC052: should represent type validation error', () => {
      const dto = new ValidationErrorDto(
        'count',
        'Must be a number',
        'not-a-number',
      );

      expect(dto.field).toBe('count');
      expect(dto.message).toBe('Must be a number');
      expect(dto.value).toBe('not-a-number');
    });

    /**
     * Test Case 53: Kiểm tra required field error
     * Input: Missing required field
     * Expected Output: Required error DTO
     * Path Coverage: Required validation
     */
    it('TC053: should represent required field error', () => {
      const dto = new ValidationErrorDto('username', 'This field is required');

      expect(dto.field).toBe('username');
      expect(dto.message).toBe('This field is required');
      expect(dto.value).toBeUndefined();
    });

    /**
     * Test Case 54: Kiểm tra unique validation error
     * Input: Duplicate value
     * Expected Output: Unique error DTO
     * Path Coverage: Unique validation
     */
    it('TC054: should represent unique validation error', () => {
      const dto = new ValidationErrorDto(
        'email',
        'Email already exists',
        'existing@example.com',
      );

      expect(dto.field).toBe('email');
      expect(dto.message).toBe('Email already exists');
      expect(dto.value).toBe('existing@example.com');
    });

    /**
     * Test Case 55: Kiểm tra pattern validation error
     * Input: Pattern mismatch
     * Expected Output: Pattern error DTO
     * Path Coverage: Pattern validation
     */
    it('TC055: should represent pattern validation error', () => {
      const dto = new ValidationErrorDto(
        'username',
        'Must contain only letters and numbers',
        'user@name!',
      );

      expect(dto.field).toBe('username');
      expect(dto.message).toContain('letters and numbers');
      expect(dto.value).toBe('user@name!');
    });

    /**
     * Test Case 56: Kiểm tra custom validation error
     * Input: Custom business rule violation
     * Expected Output: Custom error DTO
     * Path Coverage: Custom validation
     */
    it('TC056: should represent custom validation error', () => {
      const dto = new ValidationErrorDto(
        'scheduledDate',
        'Date must be in the future',
        new Date('2020-01-01'),
      );

      expect(dto.field).toBe('scheduledDate');
      expect(dto.message).toBe('Date must be in the future');
      expect(dto.value).toBeInstanceOf(Date);
    });

    /**
     * Test Case 57: Kiểm tra file validation error
     * Input: Invalid file
     * Expected Output: File error DTO
     * Path Coverage: File validation
     */
    it('TC057: should represent file validation error', () => {
      const fileInfo = {
        name: 'document.exe',
        size: 5000000,
        type: 'application/x-msdownload',
      };
      const dto = new ValidationErrorDto(
        'file',
        'File type not allowed. Only PDF, DOC, DOCX are accepted',
        fileInfo,
      );

      expect(dto.field).toBe('file');
      expect(dto.message).toContain('not allowed');
      expect(dto.value).toEqual(fileInfo);
    });

    /**
     * Test Case 58: Kiểm tra conditional validation error
     * Input: Conditional rule violation
     * Expected Output: Conditional error DTO
     * Path Coverage: Conditional validation
     */
    it('TC058: should represent conditional validation error', () => {
      const dto = new ValidationErrorDto(
        'confirmPassword',
        'Passwords do not match',
        'different',
      );

      expect(dto.field).toBe('confirmPassword');
      expect(dto.message).toBe('Passwords do not match');
      expect(dto.value).toBe('different');
    });

    /**
     * Test Case 59: Kiểm tra async validation error
     * Input: Async validation failure
     * Expected Output: Async error DTO
     * Path Coverage: Async validation
     */
    it('TC059: should represent async validation error', () => {
      const dto = new ValidationErrorDto(
        'apiKey',
        'API key verification failed',
        'invalid-key-xyz',
      );

      expect(dto.field).toBe('apiKey');
      expect(dto.message).toBe('API key verification failed');
      expect(dto.value).toBe('invalid-key-xyz');
    });

    /**
     * Test Case 60: Kiểm tra cross-field validation error
     * Input: Cross-field rule violation
     * Expected Output: Cross-field error DTO
     * Path Coverage: Cross-field validation
     */
    it('TC060: should represent cross-field validation error', () => {
      const dto = new ValidationErrorDto(
        'endDate',
        'End date must be after start date',
        new Date('2024-01-01'),
      );

      expect(dto.field).toBe('endDate');
      expect(dto.message).toContain('after start date');
      expect(dto.value).toBeInstanceOf(Date);
    });
  });
});
