import { Logger } from '@nestjs/common';
import {
  validateEnvironment,
  getEnv,
  getEnvNumber,
  getEnvBoolean,
} from '../src/common/utils/env-validation.utils';

describe('EnvValidationUtils - White Box Testing', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let loggerSpy: {
    log: jest.SpyInstance;
    warn: jest.SpyInstance;
    error: jest.SpyInstance;
  };

  beforeEach(() => {
    // Backup environment variables
    originalEnv = { ...process.env };

    // Setup Logger spies
    loggerSpy = {
      log: jest.spyOn(Logger.prototype, 'log').mockImplementation(),
      warn: jest.spyOn(Logger.prototype, 'warn').mockImplementation(),
      error: jest.spyOn(Logger.prototype, 'error').mockImplementation(),
    };
  });

  afterEach(() => {
    // Restore environment variables
    process.env = { ...originalEnv };

    // Restore all mocks
    jest.restoreAllMocks();
  });

  describe('validateEnvironment Function', () => {
    describe('Required Fields Validation', () => {
      /**
       * Test Case 1: Kiểm tra khi thiếu JWT_SECRET (required field)
       * Input: process.env không có JWT_SECRET
       * Expected Output: Throw error với message chứa "JWT_SECRET is required"
       * Path Coverage: Line 59-63 (required validation - error path)
       */
      it('TC001: should throw error when JWT_SECRET is missing', () => {
        delete process.env.JWT_SECRET;
        delete process.env.MONGODB_URI;

        expect(() => validateEnvironment()).toThrow(
          'Environment validation failed',
        );
        expect(loggerSpy.error).toHaveBeenCalledWith(
          expect.stringContaining('JWT_SECRET is required'),
        );
      });

      /**
       * Test Case 2: Kiểm tra khi thiếu MONGODB_URI (required field)
       * Input: process.env không có MONGODB_URI
       * Expected Output: Throw error với message chứa "MONGODB_URI"
       * Path Coverage: Line 59-63 (required validation - error path)
       */
      it('TC002: should throw error when MONGODB_URI is missing', () => {
        process.env.JWT_SECRET = 'a'.repeat(32);
        delete process.env.MONGODB_URI;

        expect(() => validateEnvironment()).toThrow(
          'Environment validation failed',
        );
        expect(loggerSpy.error).toHaveBeenCalledWith(
          expect.stringContaining('MONGODB_URI'),
        );
      });

      /**
       * Test Case 3: Kiểm tra khi JWT_SECRET có độ dài < minLength (32)
       * Input: JWT_SECRET với 20 ký tự
       * Expected Output: Throw error với message về minLength
       * Path Coverage: Line 90-93 (minLength validation - error path)
       */
      it('TC003: should throw error when JWT_SECRET is too short', () => {
        process.env.JWT_SECRET = 'short_secret_20chars';
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

        expect(() => validateEnvironment()).toThrow(
          'Environment validation failed',
        );
        expect(loggerSpy.error).toHaveBeenCalledWith(
          expect.stringContaining('JWT_SECRET must be at least 32 characters'),
        );
      });

      /**
       * Test Case 4: Kiểm tra khi JWT_SECRET có độ dài đúng bằng minLength (32)
       * Input: JWT_SECRET với đúng 32 ký tự
       * Expected Output: Validation pass
       * Path Coverage: Line 90-93 (minLength validation - success path)
       */
      it('TC004: should pass when JWT_SECRET has exactly 32 characters', () => {
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

        expect(() => validateEnvironment()).not.toThrow();
        expect(loggerSpy.log).toHaveBeenCalledWith(
          'Environment validation passed',
        );
      });

      /**
       * Test Case 5: Kiểm tra khi JWT_SECRET có độ dài > minLength
       * Input: JWT_SECRET với 64 ký tự
       * Expected Output: Validation pass
       * Path Coverage: Line 90-93 (minLength validation - success path)
       */
      it('TC005: should pass when JWT_SECRET is longer than minLength', () => {
        process.env.JWT_SECRET = 'a'.repeat(64);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

        expect(() => validateEnvironment()).not.toThrow();
        expect(loggerSpy.log).toHaveBeenCalledWith(
          'Environment validation passed',
        );
      });
    });

    describe('Default Values Assignment', () => {
      /**
       * Test Case 6: Kiểm tra set default value cho JWT_EXPIRES_IN
       * Input: Không có JWT_EXPIRES_IN trong env
       * Expected Output: process.env.JWT_EXPIRES_IN = '7d', warning logged
       * Path Coverage: Line 66-70 (default value assignment path)
       */
      it('TC006: should set default value for JWT_EXPIRES_IN', () => {
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        delete process.env.JWT_EXPIRES_IN;

        validateEnvironment();

        expect(process.env.JWT_EXPIRES_IN).toBe('7d');
        expect(loggerSpy.warn).toHaveBeenCalledWith(
          expect.stringContaining('JWT_EXPIRES_IN not set, using default: 7d'),
        );
      });

      /**
       * Test Case 7: Kiểm tra set default value cho NODE_ENV
       * Input: Không có NODE_ENV trong env
       * Expected Output: process.env.NODE_ENV = 'development'
       * Path Coverage: Line 66-70 (default value assignment path)
       */
      it('TC007: should set default value for NODE_ENV', () => {
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        delete process.env.NODE_ENV;

        validateEnvironment();

        expect(process.env.NODE_ENV).toBe('development');
      });

      /**
       * Test Case 8: Kiểm tra set default value cho PORT (number)
       * Input: Không có PORT trong env
       * Expected Output: process.env.PORT = '3000'
       * Path Coverage: Line 66-70 (default value number conversion)
       */
      it('TC008: should set default value for PORT as string', () => {
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        delete process.env.PORT;

        validateEnvironment();

        expect(process.env.PORT).toBe('3000');
      });

      /**
       * Test Case 9: Kiểm tra không override existing value
       * Input: JWT_EXPIRES_IN = '30d' đã tồn tại
       * Expected Output: JWT_EXPIRES_IN giữ nguyên '30d'
       * Path Coverage: Line 66 (skip default when value exists)
       */
      it('TC009: should not override existing JWT_EXPIRES_IN', () => {
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        process.env.JWT_EXPIRES_IN = '30d';

        validateEnvironment();

        expect(process.env.JWT_EXPIRES_IN).toBe('30d');
      });

      /**
       * Test Case 10: Kiểm tra set tất cả default values cho optional fields
       * Input: Chỉ có required fields
       * Expected Output: Tất cả optional fields có default values
       * Path Coverage: Line 66-70 (multiple defaults)
       */
      it('TC010: should set all default values for optional fields', () => {
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

        // Remove all optional fields
        delete process.env.NODE_ENV;
        delete process.env.PORT;
        delete process.env.FRONTEND_URL;
        delete process.env.RATE_LIMIT_TTL;
        delete process.env.RATE_LIMIT_LIMIT;

        validateEnvironment();

        expect(process.env.NODE_ENV).toBe('development');
        expect(process.env.PORT).toBe('3000');
        expect(process.env.FRONTEND_URL).toBe('http://localhost:5173');
        expect(process.env.RATE_LIMIT_TTL).toBe('60000');
        expect(process.env.RATE_LIMIT_LIMIT).toBe('100');
      });
    });

    describe('Type Validation', () => {
      /**
       * Test Case 11: Kiểm tra number type validation - valid number
       * Input: PORT = '8080'
       * Expected Output: Validation pass
       * Path Coverage: Line 76-80 (number type validation - success)
       */
      it('TC011: should pass number validation for valid PORT', () => {
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        process.env.PORT = '8080';

        expect(() => validateEnvironment()).not.toThrow();
      });

      /**
       * Test Case 12: Kiểm tra number type validation - invalid number
       * Input: PORT = 'abc'
       * Expected Output: Throw error với message về invalid number
       * Path Coverage: Line 76-80 (number type validation - error)
       */
      it('TC012: should throw error for invalid number PORT', () => {
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        process.env.PORT = 'abc';

        expect(() => validateEnvironment()).toThrow(
          'Environment validation failed',
        );
        expect(loggerSpy.error).toHaveBeenCalledWith(
          expect.stringContaining('PORT must be a valid number'),
        );
      });

      /**
       * Test Case 13: Kiểm tra number type validation - floating point
       * Input: PORT = '3000.5'
       * Expected Output: Validation pass (Number() accepts floats)
       * Path Coverage: Line 76-80 (number type validation - edge case)
       */
      it('TC013: should pass number validation for floating point PORT', () => {
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        process.env.PORT = '3000.5';

        expect(() => validateEnvironment()).not.toThrow();
      });

      /**
       * Test Case 14: Kiểm tra number type validation - negative number
       * Input: PORT = '-1'
       * Expected Output: Validation pass (Number() accepts negatives)
       * Path Coverage: Line 76-80 (number type validation - edge case)
       */
      it('TC014: should pass number validation for negative PORT', () => {
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        process.env.PORT = '-1';

        expect(() => validateEnvironment()).not.toThrow();
      });

      /**
       * Test Case 15: Kiểm tra number type validation - zero
       * Input: PORT = '0'
       * Expected Output: Validation pass
       * Path Coverage: Line 76-80 (number type validation - boundary)
       */
      it('TC015: should pass number validation for PORT = 0', () => {
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        process.env.PORT = '0';

        expect(() => validateEnvironment()).not.toThrow();
      });
    });

    describe('URL Validation', () => {
      /**
       * Test Case 16: Kiểm tra URL validation - valid URL
       * Input: FRONTEND_URL = 'http://localhost:5173'
       * Expected Output: Validation pass
       * Path Coverage: Line 82-87 (URL validation - success)
       */
      it('TC016: should pass URL validation for valid FRONTEND_URL', () => {
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        process.env.FRONTEND_URL = 'http://localhost:5173';

        expect(() => validateEnvironment()).not.toThrow();
      });

      /**
       * Test Case 17: Kiểm tra URL validation - valid HTTPS URL
       * Input: FRONTEND_URL = 'https://example.com'
       * Expected Output: Validation pass
       * Path Coverage: Line 82-87 (URL validation - success)
       */
      it('TC017: should pass URL validation for HTTPS URL', () => {
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        process.env.FRONTEND_URL = 'https://example.com';

        expect(() => validateEnvironment()).not.toThrow();
      });

      /**
       * Test Case 18: Kiểm tra URL validation - invalid URL
       * Input: FRONTEND_URL = 'not-a-url'
       * Expected Output: Warning logged (not error)
       * Path Coverage: Line 82-87 (URL validation - catch block)
       */
      it('TC018: should log warning for invalid FRONTEND_URL', () => {
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        process.env.FRONTEND_URL = 'not-a-url';

        expect(() => validateEnvironment()).not.toThrow();
        expect(loggerSpy.warn).toHaveBeenCalledWith(
          expect.stringContaining('FRONTEND_URL might not be a valid URL'),
        );
      });

      /**
       * Test Case 19: Kiểm tra URL validation - empty string
       * Input: FRONTEND_URL = ''
       * Expected Output: Skip validation (empty string is falsy), use default
       * Path Coverage: Line 73 (skip validation when !value)
       */
      it('TC019: should skip validation and use default for empty FRONTEND_URL', () => {
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        process.env.FRONTEND_URL = '';

        validateEnvironment();

        // Empty string is falsy, so default value is used
        expect(process.env.FRONTEND_URL).toBe('http://localhost:5173');
        expect(loggerSpy.warn).toHaveBeenCalledWith(
          expect.stringContaining('FRONTEND_URL not set, using default'),
        );
      });

      /**
       * Test Case 20: Kiểm tra URL validation - URL with path
       * Input: FRONTEND_URL = 'http://localhost:5173/api/v1'
       * Expected Output: Validation pass
       * Path Coverage: Line 82-87 (URL validation - success)
       */
      it('TC020: should pass URL validation for URL with path', () => {
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        process.env.FRONTEND_URL = 'http://localhost:5173/api/v1';

        expect(() => validateEnvironment()).not.toThrow();
      });
    });

    describe('Skip Validation When Not Set and Not Required', () => {
      /**
       * Test Case 21: Kiểm tra skip validation cho optional field không set
       * Input: JWT_REFRESH_SECRET không được set (optional)
       * Expected Output: Skip validation, không error
       * Path Coverage: Line 73 (continue when !value)
       */
      it('TC021: should skip validation for unset optional JWT_REFRESH_SECRET', () => {
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        delete process.env.JWT_REFRESH_SECRET;

        expect(() => validateEnvironment()).not.toThrow();
      });

      /**
       * Test Case 22: Kiểm tra validation cho JWT_REFRESH_SECRET khi được set
       * Input: JWT_REFRESH_SECRET = 'short' (< 32 chars)
       * Expected Output: Throw error về minLength
       * Path Coverage: Line 73 (skip continue), Line 90-93 (minLength error)
       */
      it('TC022: should validate JWT_REFRESH_SECRET when set', () => {
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        process.env.JWT_REFRESH_SECRET = 'short';

        expect(() => validateEnvironment()).toThrow(
          'Environment validation failed',
        );
        expect(loggerSpy.error).toHaveBeenCalledWith(
          expect.stringContaining('JWT_REFRESH_SECRET must be at least'),
        );
      });
    });

    describe('Multiple Errors Accumulation', () => {
      /**
       * Test Case 23: Kiểm tra tích lũy nhiều errors
       * Input: Thiếu cả JWT_SECRET và MONGODB_URI
       * Expected Output: Error messages cho cả 2 fields
       * Path Coverage: Line 97-106 (multiple errors)
       */
      it('TC023: should accumulate multiple validation errors', () => {
        delete process.env.JWT_SECRET;
        delete process.env.MONGODB_URI;

        expect(() => validateEnvironment()).toThrow(
          'Environment validation failed',
        );

        // Should log both errors
        expect(loggerSpy.error).toHaveBeenCalledWith(
          expect.stringContaining('JWT_SECRET'),
        );
        expect(loggerSpy.error).toHaveBeenCalledWith(
          expect.stringContaining('MONGODB_URI'),
        );
      });

      /**
       * Test Case 24: Kiểm tra nhiều errors khác loại
       * Input: JWT_SECRET ngắn + PORT invalid
       * Expected Output: Cả 2 error messages
       * Path Coverage: Line 90-93, 76-80, 97-106
       */
      it('TC024: should accumulate different types of errors', () => {
        process.env.JWT_SECRET = 'short';
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        process.env.PORT = 'invalid';

        expect(() => validateEnvironment()).toThrow(
          'Environment validation failed',
        );

        expect(loggerSpy.error).toHaveBeenCalledWith(
          expect.stringContaining('JWT_SECRET'),
        );
        expect(loggerSpy.error).toHaveBeenCalledWith(
          expect.stringContaining('PORT'),
        );
      });
    });

    describe('Multiple Warnings Accumulation', () => {
      /**
       * Test Case 25: Kiểm tra tích lũy nhiều warnings
       * Input: Nhiều fields sử dụng default values
       * Expected Output: Multiple warning messages
       * Path Coverage: Line 95-98 (warnings logging)
       */
      it('TC025: should accumulate multiple warnings', () => {
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        delete process.env.NODE_ENV;
        delete process.env.PORT;
        delete process.env.FRONTEND_URL;

        validateEnvironment();

        expect(loggerSpy.warn).toHaveBeenCalledWith('Environment Warnings:');
        expect(loggerSpy.warn).toHaveBeenCalledWith(
          expect.stringContaining('NODE_ENV'),
        );
        expect(loggerSpy.warn).toHaveBeenCalledWith(
          expect.stringContaining('PORT'),
        );
        expect(loggerSpy.warn).toHaveBeenCalledWith(
          expect.stringContaining('FRONTEND_URL'),
        );
      });

      /**
       * Test Case 26: Kiểm tra warnings + invalid URL warning
       * Input: Default values + invalid URL
       * Expected Output: Multiple warnings including URL warning
       * Path Coverage: Line 82-87, 95-98
       */
      it('TC026: should accumulate default value warnings and URL warnings', () => {
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        process.env.FRONTEND_URL = 'invalid-url';
        delete process.env.NODE_ENV;

        validateEnvironment();

        expect(loggerSpy.warn).toHaveBeenCalledWith(
          expect.stringContaining('NODE_ENV'),
        );
        expect(loggerSpy.warn).toHaveBeenCalledWith(
          expect.stringContaining('FRONTEND_URL might not be a valid URL'),
        );
      });
    });

    describe('Success Path - Complete Validation', () => {
      /**
       * Test Case 27: Kiểm tra validation pass với tất cả required + optional fields
       * Input: All valid environment variables
       * Expected Output: Log success message, no errors
       * Path Coverage: Line 109 (success path)
       */
      it('TC027: should pass validation with all valid fields', () => {
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        process.env.JWT_EXPIRES_IN = '7d';
        process.env.NODE_ENV = 'production';
        process.env.PORT = '3000';
        process.env.FRONTEND_URL = 'http://localhost:5173';

        expect(() => validateEnvironment()).not.toThrow();
        expect(loggerSpy.log).toHaveBeenCalledWith(
          'Environment validation passed',
        );
      });

      /**
       * Test Case 28: Kiểm tra validation pass với minimal required fields
       * Input: Chỉ JWT_SECRET và MONGODB_URI
       * Expected Output: Success với defaults assigned
       * Path Coverage: Line 66-70, 109
       */
      it('TC028: should pass validation with minimal required fields', () => {
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

        expect(() => validateEnvironment()).not.toThrow();
        expect(loggerSpy.log).toHaveBeenCalledWith(
          'Environment validation passed',
        );
      });
    });

    describe('Error Tip Message', () => {
      /**
       * Test Case 29: Kiểm tra error tip message được log
       * Input: Validation fails
       * Expected Output: Tip message về .env.example
       * Path Coverage: Line 103-105
       */
      it('TC029: should log helpful tip message on validation failure', () => {
        delete process.env.JWT_SECRET;
        delete process.env.MONGODB_URI;

        expect(() => validateEnvironment()).toThrow();
        expect(loggerSpy.error).toHaveBeenCalledWith(
          expect.stringContaining(
            'Tip: Copy .env.example to .env.local and fill in the values',
          ),
        );
      });
    });

    describe('Edge Cases and Boundary Values', () => {
      /**
       * Test Case 30: Kiểm tra JWT_SECRET với đúng 32 ký tự (boundary)
       * Input: JWT_SECRET = 32 chars
       * Expected Output: Pass validation
       * Path Coverage: Line 90-93 (boundary condition)
       */
      it('TC030: should accept JWT_SECRET with exactly 32 characters', () => {
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

        expect(() => validateEnvironment()).not.toThrow();
      });

      /**
       * Test Case 31: Kiểm tra JWT_SECRET với 31 ký tự (just below boundary)
       * Input: JWT_SECRET = 31 chars
       * Expected Output: Fail validation
       * Path Coverage: Line 90-93 (boundary condition)
       */
      it('TC031: should reject JWT_SECRET with 31 characters', () => {
        process.env.JWT_SECRET = 'a'.repeat(31);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

        expect(() => validateEnvironment()).toThrow();
      });

      /**
       * Test Case 32: Kiểm tra number validation với '0'
       * Input: PORT = '0'
       * Expected Output: Pass validation
       * Path Coverage: Line 76-80 (zero value)
       */
      it('TC032: should accept PORT with value 0', () => {
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        process.env.PORT = '0';

        expect(() => validateEnvironment()).not.toThrow();
      });

      /**
       * Test Case 33: Kiểm tra empty string cho optional field
       * Input: JWT_EXPIRES_IN = ''
       * Expected Output: Skip validation (empty string is falsy)
       * Path Coverage: Line 73 (empty string check)
       */
      it('TC033: should skip validation for empty string optional field', () => {
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        process.env.JWT_EXPIRES_IN = '';

        expect(() => validateEnvironment()).not.toThrow();
      });
    });

    describe('All ENV_RULES Coverage', () => {
      /**
       * Test Case 34: Kiểm tra tất cả number type rules
       * Input: All number fields với valid values
       * Expected Output: Pass validation
       * Path Coverage: All number type validations
       */
      it('TC034: should validate all number type fields', () => {
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        process.env.PORT = '3000';
        process.env.BACKEND_PORT = '3001';
        process.env.RATE_LIMIT_TTL = '60000';
        process.env.RATE_LIMIT_LIMIT = '100';
        process.env.CACHE_TTL = '3600000';
        process.env.CACHE_MAX_ITEMS = '100';
        process.env.DB_MAX_POOL_SIZE = '10';
        process.env.DB_SERVER_SELECTION_TIMEOUT_MS = '5000';
        process.env.DB_SOCKET_TIMEOUT_MS = '45000';

        expect(() => validateEnvironment()).not.toThrow();
      });

      /**
       * Test Case 35: Kiểm tra tất cả string type rules
       * Input: All string fields với valid values
       * Expected Output: Pass validation
       * Path Coverage: All string type validations
       */
      it('TC035: should validate all string type fields', () => {
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        process.env.JWT_EXPIRES_IN = '7d';
        process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
        process.env.NODE_ENV = 'production';

        expect(() => validateEnvironment()).not.toThrow();
      });

      /**
       * Test Case 36: Kiểm tra tất cả URL type rules
       * Input: All URL fields với valid values
       * Expected Output: Pass validation
       * Path Coverage: All URL type validations
       */
      it('TC036: should validate all URL type fields', () => {
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        process.env.FRONTEND_URL = 'http://localhost:5173';

        expect(() => validateEnvironment()).not.toThrow();
      });
    });
  });

  describe('getEnv Function', () => {
    /**
     * Test Case 37: Kiểm tra getEnv với existing value
     * Input: key = 'JWT_SECRET', value tồn tại
     * Expected Output: Return value
     * Path Coverage: Line 122-124 (success path)
     */
    it('TC037: should return value for existing environment variable', () => {
      process.env.TEST_VAR = 'test_value';

      const result = getEnv('TEST_VAR');

      expect(result).toBe('test_value');
    });

    /**
     * Test Case 38: Kiểm tra getEnv với default value khi env không tồn tại
     * Input: key không tồn tại, defaultValue = 'default'
     * Expected Output: Return default value
     * Path Coverage: Line 119 (defaultValue usage)
     */
    it('TC038: should return default value when env var not set', () => {
      delete process.env.MISSING_VAR;

      const result = getEnv('MISSING_VAR', 'default_value');

      expect(result).toBe('default_value');
    });

    /**
     * Test Case 39: Kiểm tra getEnv throw error khi không có value và defaultValue
     * Input: key không tồn tại, không có defaultValue
     * Expected Output: Throw error
     * Path Coverage: Line 121-123 (error path)
     */
    it('TC039: should throw error when env var not set and no default', () => {
      delete process.env.MISSING_VAR;

      expect(() => getEnv('MISSING_VAR')).toThrow(
        'Environment variable MISSING_VAR is not set',
      );
    });

    /**
     * Test Case 40: Kiểm tra getEnv với empty string value
     * Input: ENV_VAR = ''
     * Expected Output: Return defaultValue (empty string is falsy)
     * Path Coverage: Line 119, 121-123
     */
    it('TC040: should return default for empty string value', () => {
      process.env.EMPTY_VAR = '';

      const result = getEnv('EMPTY_VAR', 'default');

      expect(result).toBe('default');
    });

    /**
     * Test Case 41: Kiểm tra getEnv với whitespace value
     * Input: ENV_VAR = '   '
     * Expected Output: Return whitespace (truthy)
     * Path Coverage: Line 119, 126
     */
    it('TC041: should return whitespace value (truthy)', () => {
      process.env.WHITESPACE_VAR = '   ';

      const result = getEnv('WHITESPACE_VAR');

      expect(result).toBe('   ');
    });

    /**
     * Test Case 42: Kiểm tra getEnv với number string
     * Input: ENV_VAR = '123'
     * Expected Output: Return '123' as string
     * Path Coverage: Line 119, 126
     */
    it('TC042: should return number string as is', () => {
      process.env.NUMBER_VAR = '123';

      const result = getEnv('NUMBER_VAR');

      expect(result).toBe('123');
      expect(typeof result).toBe('string');
    });

    /**
     * Test Case 43: Kiểm tra getEnv override env value với defaultValue
     * Input: ENV_VAR tồn tại, có defaultValue
     * Expected Output: Return env value (not default)
     * Path Coverage: Line 119 (env value takes precedence)
     */
    it('TC043: should return env value over default value', () => {
      process.env.EXISTING_VAR = 'existing';

      const result = getEnv('EXISTING_VAR', 'default');

      expect(result).toBe('existing');
    });
  });

  describe('getEnvNumber Function', () => {
    /**
     * Test Case 44: Kiểm tra getEnvNumber với valid number
     * Input: PORT = '3000'
     * Expected Output: Return 3000 as number
     * Path Coverage: Line 142-148 (success path)
     */
    it('TC044: should return number for valid number string', () => {
      process.env.PORT = '3000';

      const result = getEnvNumber('PORT');

      expect(result).toBe(3000);
      expect(typeof result).toBe('number');
    });

    /**
     * Test Case 45: Kiểm tra getEnvNumber với default value
     * Input: Key không tồn tại, defaultValue = 8080
     * Expected Output: Return 8080
     * Path Coverage: Line 135-138 (default value path)
     */
    it('TC045: should return default value when env var not set', () => {
      delete process.env.MISSING_PORT;

      const result = getEnvNumber('MISSING_PORT', 8080);

      expect(result).toBe(8080);
    });

    /**
     * Test Case 46: Kiểm tra getEnvNumber throw error khi không có value
     * Input: Key không tồn tại, không có defaultValue
     * Expected Output: Throw error
     * Path Coverage: Line 139-141 (error path - no value)
     */
    it('TC046: should throw error when env var not set and no default', () => {
      delete process.env.MISSING_VAR;

      expect(() => getEnvNumber('MISSING_VAR')).toThrow(
        'Environment variable MISSING_VAR is not set',
      );
    });

    /**
     * Test Case 47: Kiểm tra getEnvNumber throw error với invalid number
     * Input: PORT = 'abc'
     * Expected Output: Throw error
     * Path Coverage: Line 145-148 (NaN validation error)
     */
    it('TC047: should throw error for invalid number string', () => {
      process.env.INVALID_PORT = 'abc';

      expect(() => getEnvNumber('INVALID_PORT')).toThrow(
        'Environment variable INVALID_PORT must be a number, got: abc',
      );
    });

    /**
     * Test Case 48: Kiểm tra getEnvNumber với floating point
     * Input: VALUE = '3.14'
     * Expected Output: Return 3.14
     * Path Coverage: Line 142-148 (success with float)
     */
    it('TC048: should return floating point number', () => {
      process.env.FLOAT_VAR = '3.14';

      const result = getEnvNumber('FLOAT_VAR');

      expect(result).toBe(3.14);
    });

    /**
     * Test Case 49: Kiểm tra getEnvNumber với negative number
     * Input: VALUE = '-100'
     * Expected Output: Return -100
     * Path Coverage: Line 142-148 (success with negative)
     */
    it('TC049: should return negative number', () => {
      process.env.NEGATIVE_VAR = '-100';

      const result = getEnvNumber('NEGATIVE_VAR');

      expect(result).toBe(-100);
    });

    /**
     * Test Case 50: Kiểm tra getEnvNumber với zero
     * Input: VALUE = '0'
     * Expected Output: Return 0
     * Path Coverage: Line 142-148 (success with zero)
     */
    it('TC050: should return zero', () => {
      process.env.ZERO_VAR = '0';

      const result = getEnvNumber('ZERO_VAR');

      expect(result).toBe(0);
    });

    /**
     * Test Case 51: Kiểm tra getEnvNumber với scientific notation
     * Input: VALUE = '1e3'
     * Expected Output: Return 1000
     * Path Coverage: Line 142-148 (scientific notation)
     */
    it('TC051: should parse scientific notation', () => {
      process.env.SCIENTIFIC_VAR = '1e3';

      const result = getEnvNumber('SCIENTIFIC_VAR');

      expect(result).toBe(1000);
    });

    /**
     * Test Case 52: Kiểm tra getEnvNumber với whitespace
     * Input: VALUE = '  123  '
     * Expected Output: Return 123 (Number trims whitespace)
     * Path Coverage: Line 142-148 (whitespace handling)
     */
    it('TC052: should parse number with whitespace', () => {
      process.env.WHITESPACE_NUM = '  123  ';

      const result = getEnvNumber('WHITESPACE_NUM');

      expect(result).toBe(123);
    });

    /**
     * Test Case 53: Kiểm tra getEnvNumber với empty string
     * Input: VALUE = ''
     * Expected Output: Return defaultValue
     * Path Coverage: Line 135-138 (empty string uses default)
     */
    it('TC053: should return default for empty string', () => {
      process.env.EMPTY_NUM = '';

      const result = getEnvNumber('EMPTY_NUM', 999);

      expect(result).toBe(999);
    });

    /**
     * Test Case 54: Kiểm tra getEnvNumber với defaultValue = 0
     * Input: Key không tồn tại, defaultValue = 0
     * Expected Output: Return 0
     * Path Coverage: Line 135-138 (zero default)
     */
    it('TC054: should return zero as default value', () => {
      delete process.env.MISSING_VAR;

      const result = getEnvNumber('MISSING_VAR', 0);

      expect(result).toBe(0);
    });
  });

  describe('getEnvBoolean Function', () => {
    /**
     * Test Case 55: Kiểm tra getEnvBoolean với 'true'
     * Input: VALUE = 'true'
     * Expected Output: Return true
     * Path Coverage: Line 168 (toLowerCase() === 'true')
     */
    it('TC055: should return true for "true" string', () => {
      process.env.BOOL_VAR = 'true';

      const result = getEnvBoolean('BOOL_VAR');

      expect(result).toBe(true);
    });

    /**
     * Test Case 56: Kiểm tra getEnvBoolean với 'TRUE'
     * Input: VALUE = 'TRUE'
     * Expected Output: Return true (case-insensitive)
     * Path Coverage: Line 168 (toLowerCase() transformation)
     */
    it('TC056: should return true for "TRUE" (case-insensitive)', () => {
      process.env.BOOL_VAR = 'TRUE';

      const result = getEnvBoolean('BOOL_VAR');

      expect(result).toBe(true);
    });

    /**
     * Test Case 57: Kiểm tra getEnvBoolean với 'True'
     * Input: VALUE = 'True'
     * Expected Output: Return true
     * Path Coverage: Line 168 (toLowerCase() transformation)
     */
    it('TC057: should return true for "True" (mixed case)', () => {
      process.env.BOOL_VAR = 'True';

      const result = getEnvBoolean('BOOL_VAR');

      expect(result).toBe(true);
    });

    /**
     * Test Case 58: Kiểm tra getEnvBoolean với 'false'
     * Input: VALUE = 'false'
     * Expected Output: Return false
     * Path Coverage: Line 168 (toLowerCase() !== 'true')
     */
    it('TC058: should return false for "false" string', () => {
      process.env.BOOL_VAR = 'false';

      const result = getEnvBoolean('BOOL_VAR');

      expect(result).toBe(false);
    });

    /**
     * Test Case 59: Kiểm tra getEnvBoolean với '0'
     * Input: VALUE = '0'
     * Expected Output: Return false
     * Path Coverage: Line 168 (toLowerCase() !== 'true')
     */
    it('TC059: should return false for "0" string', () => {
      process.env.BOOL_VAR = '0';

      const result = getEnvBoolean('BOOL_VAR');

      expect(result).toBe(false);
    });

    /**
     * Test Case 60: Kiểm tra getEnvBoolean với '1'
     * Input: VALUE = '1'
     * Expected Output: Return false (chỉ 'true' là true)
     * Path Coverage: Line 168 (toLowerCase() !== 'true')
     */
    it('TC060: should return false for "1" string', () => {
      process.env.BOOL_VAR = '1';

      const result = getEnvBoolean('BOOL_VAR');

      expect(result).toBe(false);
    });

    /**
     * Test Case 61: Kiểm tra getEnvBoolean với random string
     * Input: VALUE = 'random'
     * Expected Output: Return false
     * Path Coverage: Line 168 (toLowerCase() !== 'true')
     */
    it('TC061: should return false for random string', () => {
      process.env.BOOL_VAR = 'random';

      const result = getEnvBoolean('BOOL_VAR');

      expect(result).toBe(false);
    });

    /**
     * Test Case 62: Kiểm tra getEnvBoolean với default value = true
     * Input: Key không tồn tại, defaultValue = true
     * Expected Output: Return true
     * Path Coverage: Line 161-164 (default value = true)
     */
    it('TC062: should return default value true when env var not set', () => {
      delete process.env.MISSING_BOOL;

      const result = getEnvBoolean('MISSING_BOOL', true);

      expect(result).toBe(true);
    });

    /**
     * Test Case 63: Kiểm tra getEnvBoolean với default value = false
     * Input: Key không tồn tại, defaultValue = false
     * Expected Output: Return false
     * Path Coverage: Line 161-164 (default value = false)
     */
    it('TC063: should return default value false when env var not set', () => {
      delete process.env.MISSING_BOOL;

      const result = getEnvBoolean('MISSING_BOOL', false);

      expect(result).toBe(false);
    });

    /**
     * Test Case 64: Kiểm tra getEnvBoolean throw error khi không có value và default
     * Input: Key không tồn tại, không có defaultValue
     * Expected Output: Throw error
     * Path Coverage: Line 165-167 (error path)
     */
    it('TC064: should throw error when env var not set and no default', () => {
      delete process.env.MISSING_BOOL;

      expect(() => getEnvBoolean('MISSING_BOOL')).toThrow(
        'Environment variable MISSING_BOOL is not set',
      );
    });

    /**
     * Test Case 65: Kiểm tra getEnvBoolean với empty string
     * Input: VALUE = ''
     * Expected Output: Return defaultValue
     * Path Coverage: Line 161-164 (empty string uses default)
     */
    it('TC065: should return default for empty string', () => {
      process.env.EMPTY_BOOL = '';

      const result = getEnvBoolean('EMPTY_BOOL', true);

      expect(result).toBe(true);
    });

    /**
     * Test Case 66: Kiểm tra getEnvBoolean với whitespace + 'true'
     * Input: VALUE = '  true  '
     * Expected Output: Return false (toLowerCase() on '  true  ' !== 'true')
     * Path Coverage: Line 168 (no trim before toLowerCase)
     */
    it('TC066: should return false for whitespace around true', () => {
      process.env.WHITESPACE_BOOL = '  true  ';

      const result = getEnvBoolean('WHITESPACE_BOOL');

      // Note: Function doesn't trim, so '  true  '.toLowerCase() !== 'true'
      expect(result).toBe(false);
    });

    /**
     * Test Case 67: Kiểm tra getEnvBoolean override env value
     * Input: VALUE = 'false', defaultValue = true
     * Expected Output: Return false (env value takes precedence)
     * Path Coverage: Line 168 (env value overrides default)
     */
    it('TC067: should return env value over default value', () => {
      process.env.EXISTING_BOOL = 'false';

      const result = getEnvBoolean('EXISTING_BOOL', true);

      expect(result).toBe(false);
    });
  });

  describe('Integration Scenarios', () => {
    /**
     * Test Case 68: Scenario - Full application startup with valid env
     * Input: Complete valid environment
     * Expected Output: validateEnvironment pass, all getters work
     * Path Coverage: Full happy path integration
     */
    it('TC068: should support full application startup scenario', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      process.env.PORT = '3000';
      process.env.NODE_ENV = 'production';

      // Validate
      expect(() => validateEnvironment()).not.toThrow();

      // Get values
      expect(getEnv('JWT_SECRET')).toBe('a'.repeat(32));
      expect(getEnvNumber('PORT')).toBe(3000);
    });

      /**
       * Test Case 69: Scenario - Development environment with defaults
       * Input: Minimal required fields
       * Expected Output: Defaults assigned, getters work with defaults
       * Path Coverage: Default value integration
       */
      it('TC069: should support development environment with defaults', () => {
        process.env.JWT_SECRET = 'a'.repeat(32);
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        delete process.env.NODE_ENV; // Remove Jest's test env

        validateEnvironment();

        expect(getEnv('NODE_ENV')).toBe('development');
        expect(getEnvNumber('PORT')).toBe(3000);
        expect(getEnv('FRONTEND_URL')).toBe('http://localhost:5173');
      });    /**
     * Test Case 70: Scenario - Production environment strict validation
     * Input: Production values
     * Expected Output: All validations pass
     * Path Coverage: Production configuration path
     */
    it('TC070: should support production environment configuration', () => {
      process.env.JWT_SECRET = 'a'.repeat(64);
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(64);
      process.env.MONGODB_URI = 'mongodb://prod-server:27017/production';
      process.env.NODE_ENV = 'production';
      process.env.PORT = '8080';
      process.env.FRONTEND_URL = 'https://example.com';

      expect(() => validateEnvironment()).not.toThrow();
    });

    /**
     * Test Case 71: Scenario - Configuration error troubleshooting
     * Input: Multiple configuration errors
     * Expected Output: Helpful error messages for debugging
     * Path Coverage: Error reporting integration
     */
    it('TC071: should provide helpful error messages for troubleshooting', () => {
      process.env.JWT_SECRET = 'short';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      process.env.PORT = 'invalid';

      expect(() => validateEnvironment()).toThrow();

      // Should provide specific error messages
      expect(loggerSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('JWT_SECRET'),
      );
      expect(loggerSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('PORT'),
      );
      expect(loggerSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('.env.example'),
      );
    });

    /**
     * Test Case 72: Scenario - Partial configuration with warnings
     * Input: Some values missing (use defaults)
     * Expected Output: Warnings logged, validation passes
     * Path Coverage: Warning integration
     */
    it('TC072: should handle partial configuration with warnings', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      delete process.env.PORT;
      delete process.env.NODE_ENV;

      validateEnvironment();

      expect(loggerSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('PORT'),
      );
      expect(loggerSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('NODE_ENV'),
      );
      expect(loggerSpy.log).toHaveBeenCalledWith(
        'Environment validation passed',
      );
    });
  });

  describe('Type Safety and Immutability', () => {
    /**
     * Test Case 73: Kiểm tra return types của các functions
     * Input: Valid environment variables
     * Expected Output: Correct TypeScript types
     * Path Coverage: Type checking
     */
    it('TC073: should return correct types from getter functions', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.PORT = '3000';
      process.env.DEBUG = 'true';

      const stringValue = getEnv('JWT_SECRET');
      const numberValue = getEnvNumber('PORT');
      const booleanValue = getEnvBoolean('DEBUG');

      expect(typeof stringValue).toBe('string');
      expect(typeof numberValue).toBe('number');
      expect(typeof booleanValue).toBe('boolean');
    });

    /**
     * Test Case 74: Kiểm tra validateEnvironment không modify input
     * Input: Valid environment
     * Expected Output: Environment values unchanged (except defaults)
     * Path Coverage: Side effects check
     */
    it('TC074: should not modify existing environment values', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      process.env.PORT = '3000';

      const portBefore = process.env.PORT;

      validateEnvironment();

      expect(process.env.PORT).toBe(portBefore);
    });

    /**
     * Test Case 75: Kiểm tra error messages có chứa key name
     * Input: Missing required field
     * Expected Output: Error message contains field name
     * Path Coverage: Error message quality
     */
    it('TC075: should include field name in error messages', () => {
      delete process.env.JWT_SECRET;
      delete process.env.MONGODB_URI;

      expect(() => validateEnvironment()).toThrow();

      const errorCalls = loggerSpy.error.mock.calls;
      const errorMessages = errorCalls.map((call) => call[0]).join(' ');

      expect(errorMessages).toContain('JWT_SECRET');
      expect(errorMessages).toContain('MONGODB_URI');
    });
  });
});
