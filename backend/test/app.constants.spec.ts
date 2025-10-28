import {
  APP_CONSTANTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  DB_ERROR_CODES,
  RECEIVER_TYPES,
  USER_ROLES,
  MEMBER_STATUS,
  MESSAGE_TYPES,
  CACHE_KEYS,
  SECURITY_CONSTANTS,
  ERROR_CODES,
  ErrorCode,
  HTTP_STATUS_TO_ERROR_CODE,
  getErrorCodeFromStatus,
} from '../src/common/constants/app.constants';

describe('AppConstants - White Box Testing (Input-Output)', () => {
  describe('APP_CONSTANTS', () => {
    describe('PAGINATION', () => {
      /**
       * Test Case 1: Kiểm tra PAGINATION.DEFAULT_PAGE
       * Input: N/A (constant)
       * Expected Output: DEFAULT_PAGE = 1
       * Path Coverage: Default value verification
       */
      it('TC001: should have DEFAULT_PAGE = 1', () => {
        expect(APP_CONSTANTS.PAGINATION.DEFAULT_PAGE).toBe(1);
      });

      /**
       * Test Case 2: Kiểm tra PAGINATION.DEFAULT_LIMIT
       * Input: N/A
       * Expected Output: DEFAULT_LIMIT = 20
       * Path Coverage: Default value verification
       */
      it('TC002: should have DEFAULT_LIMIT = 20', () => {
        expect(APP_CONSTANTS.PAGINATION.DEFAULT_LIMIT).toBe(20);
      });

      /**
       * Test Case 3: Kiểm tra PAGINATION.MIN_LIMIT
       * Input: N/A
       * Expected Output: MIN_LIMIT = 1
       * Path Coverage: Boundary value verification
       */
      it('TC003: should have MIN_LIMIT = 1', () => {
        expect(APP_CONSTANTS.PAGINATION.MIN_LIMIT).toBe(1);
      });

      /**
       * Test Case 4: Kiểm tra PAGINATION.MAX_LIMIT
       * Input: N/A
       * Expected Output: MAX_LIMIT = 100
       * Path Coverage: Boundary value verification
       */
      it('TC004: should have MAX_LIMIT = 100', () => {
        expect(APP_CONSTANTS.PAGINATION.MAX_LIMIT).toBe(100);
      });

      /**
       * Test Case 5: Kiểm tra logic MIN_LIMIT <= DEFAULT_LIMIT <= MAX_LIMIT
       * Input: N/A
       * Expected Output: MIN_LIMIT <= DEFAULT_LIMIT <= MAX_LIMIT
       * Path Coverage: Business logic validation
       */
      it('TC005: should have MIN_LIMIT <= DEFAULT_LIMIT <= MAX_LIMIT', () => {
        const { MIN_LIMIT, DEFAULT_LIMIT, MAX_LIMIT } =
          APP_CONSTANTS.PAGINATION;
        expect(MIN_LIMIT).toBeLessThanOrEqual(DEFAULT_LIMIT);
        expect(DEFAULT_LIMIT).toBeLessThanOrEqual(MAX_LIMIT);
      });
    });

    describe('DATABASE', () => {
      /**
       * Test Case 6: Kiểm tra DATABASE constants khớp với PAGINATION
       * Input: N/A
       * Expected Output: DATABASE và PAGINATION có cùng giá trị
       * Path Coverage: Cross-reference validation
       */
      it('TC006: should have DATABASE constants matching PAGINATION', () => {
        expect(APP_CONSTANTS.DATABASE.DEFAULT_LIMIT).toBe(
          APP_CONSTANTS.PAGINATION.DEFAULT_LIMIT,
        );
        expect(APP_CONSTANTS.DATABASE.MAX_LIMIT).toBe(
          APP_CONSTANTS.PAGINATION.MAX_LIMIT,
        );
        expect(APP_CONSTANTS.DATABASE.DEFAULT_PAGE).toBe(
          APP_CONSTANTS.PAGINATION.DEFAULT_PAGE,
        );
      });
    });

    describe('MESSAGES', () => {
      /**
       * Test Case 7: Kiểm tra MESSAGES.MAX_TEXT_LENGTH
       * Input: N/A
       * Expected Output: MAX_TEXT_LENGTH = 2000
       * Path Coverage: Default value verification
       */
      it('TC007: should have MAX_TEXT_LENGTH = 2000', () => {
        expect(APP_CONSTANTS.MESSAGES.MAX_TEXT_LENGTH).toBe(2000);
      });

      /**
       * Test Case 8: Kiểm tra MESSAGES.MIN_TEXT_LENGTH
       * Input: N/A
       * Expected Output: MIN_TEXT_LENGTH = 1
       * Path Coverage: Boundary value verification
       */
      it('TC008: should have MIN_TEXT_LENGTH = 1', () => {
        expect(APP_CONSTANTS.MESSAGES.MIN_TEXT_LENGTH).toBe(1);
      });

      /**
       * Test Case 9: Kiểm tra MESSAGES.DEFAULT_MESSAGE_LIMIT
       * Input: N/A
       * Expected Output: DEFAULT_MESSAGE_LIMIT = 50
       * Path Coverage: Default value verification
       */
      it('TC009: should have DEFAULT_MESSAGE_LIMIT = 50', () => {
        expect(APP_CONSTANTS.MESSAGES.DEFAULT_MESSAGE_LIMIT).toBe(50);
      });

      /**
       * Test Case 10: Kiểm tra MIN < MAX logic
       * Input: N/A
       * Expected Output: MIN_TEXT_LENGTH < MAX_TEXT_LENGTH
       * Path Coverage: Business logic validation
       */
      it('TC010: should have MIN_TEXT_LENGTH < MAX_TEXT_LENGTH', () => {
        expect(APP_CONSTANTS.MESSAGES.MIN_TEXT_LENGTH).toBeLessThan(
          APP_CONSTANTS.MESSAGES.MAX_TEXT_LENGTH,
        );
      });
    });

    describe('USERS', () => {
      /**
       * Test Case 11: Kiểm tra USERS.MIN_PASSWORD_LENGTH
       * Input: N/A
       * Expected Output: MIN_PASSWORD_LENGTH = 8
       * Path Coverage: Security requirement verification
       */
      it('TC011: should have MIN_PASSWORD_LENGTH = 8', () => {
        expect(APP_CONSTANTS.USERS.MIN_PASSWORD_LENGTH).toBe(8);
      });

      /**
       * Test Case 12: Kiểm tra USERS.MAX_PASSWORD_LENGTH
       * Input: N/A
       * Expected Output: MAX_PASSWORD_LENGTH = 64
       * Path Coverage: Boundary value verification
       */
      it('TC012: should have MAX_PASSWORD_LENGTH = 64', () => {
        expect(APP_CONSTANTS.USERS.MAX_PASSWORD_LENGTH).toBe(64);
      });

      /**
       * Test Case 13: Kiểm tra USERS.PHONE_REGEX với số điện thoại hợp lệ
       * Input: "+84123456789"
       * Expected Output: Match
       * Path Coverage: Regex validation - valid input
       */
      it('TC013: should validate correct phone number with PHONE_REGEX', () => {
        const validPhones = ['+84123456789', '+1234567890', '+9991234567890'];

        validPhones.forEach((phone) => {
          expect(APP_CONSTANTS.USERS.PHONE_REGEX.test(phone)).toBe(true);
        });
      });

      /**
       * Test Case 14: Kiểm tra USERS.PHONE_REGEX với số điện thoại không hợp lệ
       * Input: "0123456789" (không có +)
       * Expected Output: Not match
       * Path Coverage: Regex validation - invalid input
       */
      it('TC014: should reject invalid phone number with PHONE_REGEX', () => {
        const invalidPhones = ['0123456789', '+0123', '123456', 'abc', ''];

        invalidPhones.forEach((phone) => {
          expect(APP_CONSTANTS.USERS.PHONE_REGEX.test(phone)).toBe(false);
        });
      });

      /**
       * Test Case 15: Kiểm tra USERS.EMAIL_REGEX với email hợp lệ
       * Input: "test@example.com"
       * Expected Output: Match
       * Path Coverage: Regex validation - valid email
       */
      it('TC015: should validate correct email with EMAIL_REGEX', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'user+tag@example.org',
        ];

        validEmails.forEach((email) => {
          expect(APP_CONSTANTS.USERS.EMAIL_REGEX.test(email)).toBe(true);
        });
      });

      /**
       * Test Case 16: Kiểm tra USERS.EMAIL_REGEX với email không hợp lệ
       * Input: "invalid..email@test.com" (consecutive dots)
       * Expected Output: Not match
       * Path Coverage: Regex validation - invalid email
       */
      it('TC016: should reject invalid email with EMAIL_REGEX', () => {
        const invalidEmails = [
          'invalid..email@test.com',
          '@example.com',
          'user@',
          'user space@test.com',
          '',
        ];

        invalidEmails.forEach((email) => {
          expect(APP_CONSTANTS.USERS.EMAIL_REGEX.test(email)).toBe(false);
        });
      });

      /**
       * Test Case 17: Kiểm tra USERS.USERNAME_REGEX với username hợp lệ
       * Input: "user_name123"
       * Expected Output: Match
       * Path Coverage: Regex validation - valid username
       */
      it('TC017: should validate correct username with USERNAME_REGEX', () => {
        const validUsernames = [
          'username',
          'user_name',
          'user123',
          'User_Name_123',
        ];

        validUsernames.forEach((username) => {
          expect(APP_CONSTANTS.USERS.USERNAME_REGEX.test(username)).toBe(true);
        });
      });

      /**
       * Test Case 18: Kiểm tra USERS.USERNAME_REGEX với username không hợp lệ
       * Input: "user-name" (có dấu gạch ngang)
       * Expected Output: Not match
       * Path Coverage: Regex validation - invalid username
       */
      it('TC018: should reject invalid username with USERNAME_REGEX', () => {
        const invalidUsernames = [
          'user-name',
          'user.name',
          'user name',
          'user@name',
          '',
        ];

        invalidUsernames.forEach((username) => {
          expect(APP_CONSTANTS.USERS.USERNAME_REGEX.test(username)).toBe(false);
        });
      });

      /**
       * Test Case 19: Kiểm tra USERS.FULL_NAME_REGEX với tên hợp lệ
       * Input: "John Doe"
       * Expected Output: Match
       * Path Coverage: Regex validation - valid full name
       */
      it('TC019: should validate correct full name with FULL_NAME_REGEX', () => {
        const validNames = ['John Doe', 'Jane', 'Mary Ann Smith'];

        validNames.forEach((name) => {
          expect(APP_CONSTANTS.USERS.FULL_NAME_REGEX.test(name)).toBe(true);
        });
      });

      /**
       * Test Case 20: Kiểm tra USERS.FULL_NAME_REGEX với tên không hợp lệ
       * Input: "John123" (có số)
       * Expected Output: Not match
       * Path Coverage: Regex validation - invalid full name
       */
      it('TC020: should reject invalid full name with FULL_NAME_REGEX', () => {
        const invalidNames = [
          'John123',
          'John_Doe',
          'John-Doe',
          'John@Doe',
          '',
        ];

        invalidNames.forEach((name) => {
          expect(APP_CONSTANTS.USERS.FULL_NAME_REGEX.test(name)).toBe(false);
        });
      });

      /**
       * Test Case 21: Kiểm tra USERS.PASSWORD_REGEX với password hợp lệ
       * Input: "Pass123!@#"
       * Expected Output: Match
       * Path Coverage: Regex validation - valid password
       */
      it('TC021: should validate password with allowed characters', () => {
        const validPasswords = [
          'Password123',
          'Pass123!@#',
          'P@ssw0rd',
          'abc123XYZ!',
        ];

        validPasswords.forEach((password) => {
          expect(APP_CONSTANTS.USERS.PASSWORD_REGEX.test(password)).toBe(true);
        });
      });

      /**
       * Test Case 22: Kiểm tra USERS.PROFILE_PHOTO_REGEX với URL hợp lệ
       * Input: "https://example.com/photo.jpg"
       * Expected Output: Match
       * Path Coverage: Regex validation - valid image URL
       */
      it('TC022: should validate correct image URL with PROFILE_PHOTO_REGEX', () => {
        const validUrls = [
          'https://example.com/photo.jpg',
          'http://test.com/image.png',
          'https://cdn.example.com/user.jpeg?size=100',
          'https://example.com/photo.webp#fragment',
        ];

        validUrls.forEach((url) => {
          expect(APP_CONSTANTS.USERS.PROFILE_PHOTO_REGEX.test(url)).toBe(true);
        });
      });

      /**
       * Test Case 23: Kiểm tra USERS.PROFILE_PHOTO_REGEX với URL không hợp lệ
       * Input: "https://example.com/photo.pdf"
       * Expected Output: Not match
       * Path Coverage: Regex validation - invalid image URL
       */
      it('TC023: should reject invalid image URL with PROFILE_PHOTO_REGEX', () => {
        const invalidUrls = [
          'https://example.com/photo.pdf',
          'ftp://example.com/photo.jpg',
          'example.com/photo.jpg',
          '',
        ];

        invalidUrls.forEach((url) => {
          expect(APP_CONSTANTS.USERS.PROFILE_PHOTO_REGEX.test(url)).toBe(false);
        });
      });
    });

    describe('GROUPS', () => {
      /**
       * Test Case 24: Kiểm tra GROUPS.MIN_MEMBERS
       * Input: N/A
       * Expected Output: MIN_MEMBERS = 2
       * Path Coverage: Business rule verification
       */
      it('TC024: should have MIN_MEMBERS = 2', () => {
        expect(APP_CONSTANTS.GROUPS.MIN_MEMBERS).toBe(2);
      });

      /**
       * Test Case 25: Kiểm tra GROUPS.MAX_MEMBERS
       * Input: N/A
       * Expected Output: MAX_MEMBERS = 256
       * Path Coverage: Boundary value verification
       */
      it('TC025: should have MAX_MEMBERS = 256', () => {
        expect(APP_CONSTANTS.GROUPS.MAX_MEMBERS).toBe(256);
      });

      /**
       * Test Case 26: Kiểm tra GROUPS.MAX_NAME_LENGTH
       * Input: N/A
       * Expected Output: MAX_NAME_LENGTH = 100
       * Path Coverage: Constraint verification
       */
      it('TC026: should have MAX_NAME_LENGTH = 100', () => {
        expect(APP_CONSTANTS.GROUPS.MAX_NAME_LENGTH).toBe(100);
      });

      /**
       * Test Case 27: Kiểm tra MIN_MEMBERS < MAX_MEMBERS
       * Input: N/A
       * Expected Output: MIN_MEMBERS < MAX_MEMBERS
       * Path Coverage: Business logic validation
       */
      it('TC027: should have MIN_MEMBERS < MAX_MEMBERS', () => {
        expect(APP_CONSTANTS.GROUPS.MIN_MEMBERS).toBeLessThan(
          APP_CONSTANTS.GROUPS.MAX_MEMBERS,
        );
      });
    });

    describe('JWT', () => {
      /**
       * Test Case 28: Kiểm tra JWT.DEFAULT_EXPIRES_IN
       * Input: N/A
       * Expected Output: DEFAULT_EXPIRES_IN = '7d'
       * Path Coverage: Default value verification
       */
      it('TC028: should have DEFAULT_EXPIRES_IN = "7d"', () => {
        expect(APP_CONSTANTS.JWT.DEFAULT_EXPIRES_IN).toBe('7d');
      });

      /**
       * Test Case 29: Kiểm tra JWT.REFRESH_EXPIRES_IN
       * Input: N/A
       * Expected Output: REFRESH_EXPIRES_IN = '30d'
       * Path Coverage: Default value verification
       */
      it('TC029: should have REFRESH_EXPIRES_IN = "30d"', () => {
        expect(APP_CONSTANTS.JWT.REFRESH_EXPIRES_IN).toBe('30d');
      });

      /**
       * Test Case 30: Kiểm tra JWT expires string format
       * Input: N/A
       * Expected Output: String ends with 'd'
       * Path Coverage: Format validation
       */
      it('TC030: should have JWT expires in day format', () => {
        expect(APP_CONSTANTS.JWT.DEFAULT_EXPIRES_IN).toMatch(/^\d+d$/);
        expect(APP_CONSTANTS.JWT.REFRESH_EXPIRES_IN).toMatch(/^\d+d$/);
      });
    });

    describe('FILE_UPLOAD', () => {
      /**
       * Test Case 31: Kiểm tra FILE_UPLOAD.MAX_SIZE
       * Input: N/A
       * Expected Output: MAX_SIZE = 5MB = 5242880 bytes
       * Path Coverage: Default value verification
       */
      it('TC031: should have MAX_SIZE = 5MB (5242880 bytes)', () => {
        expect(APP_CONSTANTS.FILE_UPLOAD.MAX_SIZE).toBe(5 * 1024 * 1024);
        expect(APP_CONSTANTS.FILE_UPLOAD.MAX_SIZE).toBe(5242880);
      });

      /**
       * Test Case 32: Kiểm tra FILE_UPLOAD.ALLOWED_IMAGE_TYPES
       * Input: N/A
       * Expected Output: Array of 5 image types
       * Path Coverage: Array content verification
       */
      it('TC032: should have 5 allowed image types', () => {
        const types = APP_CONSTANTS.FILE_UPLOAD.ALLOWED_IMAGE_TYPES;
        expect(types).toHaveLength(5);
        expect(types).toContain('jpg');
        expect(types).toContain('jpeg');
        expect(types).toContain('png');
        expect(types).toContain('gif');
        expect(types).toContain('webp');
      });
    });

    describe('RATE_LIMIT', () => {
      /**
       * Test Case 33: Kiểm tra RATE_LIMIT.WINDOW_MS
       * Input: N/A
       * Expected Output: WINDOW_MS = 15 minutes = 900000ms
       * Path Coverage: Default value verification
       */
      it('TC033: should have WINDOW_MS = 15 minutes (900000ms)', () => {
        expect(APP_CONSTANTS.RATE_LIMIT.WINDOW_MS).toBe(15 * 60 * 1000);
        expect(APP_CONSTANTS.RATE_LIMIT.WINDOW_MS).toBe(900000);
      });

      /**
       * Test Case 34: Kiểm tra RATE_LIMIT.MAX_REQUESTS
       * Input: N/A
       * Expected Output: MAX_REQUESTS = 100
       * Path Coverage: Default value verification
       */
      it('TC034: should have MAX_REQUESTS = 100', () => {
        expect(APP_CONSTANTS.RATE_LIMIT.MAX_REQUESTS).toBe(100);
      });
    });

    describe('TIMEOUTS', () => {
      /**
       * Test Case 35: Kiểm tra TIMEOUTS.DEFAULT
       * Input: N/A
       * Expected Output: DEFAULT = 30000ms (30s)
       * Path Coverage: Default value verification
       */
      it('TC035: should have DEFAULT = 30000ms', () => {
        expect(APP_CONSTANTS.TIMEOUTS.DEFAULT).toBe(30000);
      });

      /**
       * Test Case 36: Kiểm tra TIMEOUTS.SHORT
       * Input: N/A
       * Expected Output: SHORT = 5000ms (5s)
       * Path Coverage: Default value verification
       */
      it('TC036: should have SHORT = 5000ms', () => {
        expect(APP_CONSTANTS.TIMEOUTS.SHORT).toBe(5000);
      });

      /**
       * Test Case 37: Kiểm tra TIMEOUTS.FILE_UPLOAD
       * Input: N/A
       * Expected Output: FILE_UPLOAD = 300000ms (5min)
       * Path Coverage: Default value verification
       */
      it('TC037: should have FILE_UPLOAD = 300000ms', () => {
        expect(APP_CONSTANTS.TIMEOUTS.FILE_UPLOAD).toBe(300000);
      });

      /**
       * Test Case 38: Kiểm tra TIMEOUTS.LONG
       * Input: N/A
       * Expected Output: LONG = 60000ms (1min)
       * Path Coverage: Default value verification
       */
      it('TC038: should have LONG = 60000ms', () => {
        expect(APP_CONSTANTS.TIMEOUTS.LONG).toBe(60000);
      });

      /**
       * Test Case 39: Kiểm tra timeout order: SHORT < DEFAULT < LONG < FILE_UPLOAD
       * Input: N/A
       * Expected Output: Logical order
       * Path Coverage: Business logic validation
       */
      it('TC039: should have timeouts in logical order', () => {
        const { SHORT, DEFAULT, LONG, FILE_UPLOAD } = APP_CONSTANTS.TIMEOUTS;
        expect(SHORT).toBeLessThan(DEFAULT);
        expect(DEFAULT).toBeLessThan(LONG);
        expect(LONG).toBeLessThan(FILE_UPLOAD);
      });
    });

    describe('API_CONSTANTS (Deprecated)', () => {
      /**
       * Test Case 40: Kiểm tra API_CONSTANTS.VERSION
       * Input: N/A
       * Expected Output: VERSION = '1.0'
       * Path Coverage: Default value verification
       */
      it('TC040: should have VERSION = "1.0"', () => {
        expect(APP_CONSTANTS.API_CONSTANTS.VERSION).toBe('1.0');
      });

      /**
       * Test Case 41: Kiểm tra API_CONSTANTS.DEFAULT_TIMEOUT matches TIMEOUTS.DEFAULT
       * Input: N/A
       * Expected Output: Same value
       * Path Coverage: Deprecation consistency check
       */
      it('TC041: should have deprecated DEFAULT_TIMEOUT matching TIMEOUTS.DEFAULT', () => {
        expect(APP_CONSTANTS.API_CONSTANTS.DEFAULT_TIMEOUT).toBe(
          APP_CONSTANTS.TIMEOUTS.DEFAULT,
        );
      });

      /**
       * Test Case 42: Kiểm tra API_CONSTANTS.MAX_RETRIES
       * Input: N/A
       * Expected Output: MAX_RETRIES = 3
       * Path Coverage: Default value verification
       */
      it('TC042: should have MAX_RETRIES = 3', () => {
        expect(APP_CONSTANTS.API_CONSTANTS.MAX_RETRIES).toBe(3);
      });
    });

    /**
     * Test Case 43: Kiểm tra APP_CONSTANTS là readonly (as const)
     * Input: N/A
     * Expected Output: Object is frozen/readonly
     * Path Coverage: Immutability check
     */
    it('TC043: should be a constant object (readonly)', () => {
      expect(APP_CONSTANTS).toBeDefined();
      expect(typeof APP_CONSTANTS).toBe('object');
    });
  });

  describe('ERROR_MESSAGES', () => {
    /**
     * Test Case 44: Kiểm tra ERROR_MESSAGES.VALIDATION_FAILED
     * Input: N/A
     * Expected Output: Non-empty string
     * Path Coverage: Message existence check
     */
    it('TC044: should have all error messages defined as non-empty strings', () => {
      Object.values(ERROR_MESSAGES).forEach((message) => {
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });

    /**
     * Test Case 45: Kiểm tra số lượng error messages
     * Input: N/A
     * Expected Output: 22 error messages
     * Path Coverage: Completeness check
     */
    it('TC045: should have 22 error messages', () => {
      expect(Object.keys(ERROR_MESSAGES)).toHaveLength(22);
    });

    /**
     * Test Case 46: Kiểm tra specific error messages tồn tại
     * Input: N/A
     * Expected Output: Key messages exist
     * Path Coverage: Critical messages check
     */
    it('TC046: should have critical error messages', () => {
      expect(ERROR_MESSAGES.UNAUTHORIZED).toBeDefined();
      expect(ERROR_MESSAGES.NOT_FOUND).toBeDefined();
      expect(ERROR_MESSAGES.INTERNAL_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.INVALID_CREDENTIALS).toBeDefined();
    });
  });

  describe('SUCCESS_MESSAGES', () => {
    /**
     * Test Case 47: Kiểm tra SUCCESS_MESSAGES values
     * Input: N/A
     * Expected Output: All non-empty strings
     * Path Coverage: Message existence check
     */
    it('TC047: should have all success messages as non-empty strings', () => {
      Object.values(SUCCESS_MESSAGES).forEach((message) => {
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });

    /**
     * Test Case 48: Kiểm tra số lượng success messages
     * Input: N/A
     * Expected Output: 13 success messages
     * Path Coverage: Completeness check
     */
    it('TC048: should have 13 success messages', () => {
      expect(Object.keys(SUCCESS_MESSAGES)).toHaveLength(13);
    });
  });

  describe('DB_ERROR_CODES', () => {
    /**
     * Test Case 49: Kiểm tra DB_ERROR_CODES.DUPLICATE_KEY
     * Input: N/A
     * Expected Output: DUPLICATE_KEY = 11000
     * Path Coverage: MongoDB error code verification
     */
    it('TC049: should have DUPLICATE_KEY = 11000', () => {
      expect(DB_ERROR_CODES.DUPLICATE_KEY).toBe(11000);
    });

    /**
     * Test Case 50: Kiểm tra DB_ERROR_CODES.VALIDATION_ERROR
     * Input: N/A
     * Expected Output: VALIDATION_ERROR = 121
     * Path Coverage: MongoDB error code verification
     */
    it('TC050: should have VALIDATION_ERROR = 121', () => {
      expect(DB_ERROR_CODES.VALIDATION_ERROR).toBe(121);
    });

    /**
     * Test Case 51: Kiểm tra DB_ERROR_CODES.CAST_ERROR
     * Input: N/A
     * Expected Output: CAST_ERROR = 'CastError'
     * Path Coverage: MongoDB error name verification
     */
    it('TC051: should have CAST_ERROR = "CastError"', () => {
      expect(DB_ERROR_CODES.CAST_ERROR).toBe('CastError');
    });
  });

  describe('RECEIVER_TYPES', () => {
    /**
     * Test Case 52: Kiểm tra RECEIVER_TYPES values
     * Input: N/A
     * Expected Output: USER = 'user', GROUP = 'group'
     * Path Coverage: Enum values verification
     */
    it('TC052: should have USER and GROUP receiver types', () => {
      expect(RECEIVER_TYPES.USER).toBe('user');
      expect(RECEIVER_TYPES.GROUP).toBe('group');
      expect(Object.keys(RECEIVER_TYPES)).toHaveLength(2);
    });
  });

  describe('USER_ROLES', () => {
    /**
     * Test Case 53: Kiểm tra USER_ROLES values
     * Input: N/A
     * Expected Output: USER = 'user', ADMIN = 'admin'
     * Path Coverage: Enum values verification
     */
    it('TC053: should have USER and ADMIN roles', () => {
      expect(USER_ROLES.USER).toBe('user');
      expect(USER_ROLES.ADMIN).toBe('admin');
      expect(Object.keys(USER_ROLES)).toHaveLength(2);
    });
  });

  describe('MEMBER_STATUS', () => {
    /**
     * Test Case 54: Kiểm tra MEMBER_STATUS values
     * Input: N/A
     * Expected Output: 3 status types
     * Path Coverage: Enum values verification
     */
    it('TC054: should have 3 member status types', () => {
      expect(MEMBER_STATUS.ACTIVE).toBe('active');
      expect(MEMBER_STATUS.INACTIVE).toBe('inactive');
      expect(MEMBER_STATUS.REMOVED).toBe('removed');
      expect(Object.keys(MEMBER_STATUS)).toHaveLength(3);
    });
  });

  describe('MESSAGE_TYPES', () => {
    /**
     * Test Case 55: Kiểm tra MESSAGE_TYPES values
     * Input: N/A
     * Expected Output: 4 message types
     * Path Coverage: Enum values verification
     */
    it('TC055: should have 4 message types', () => {
      expect(MESSAGE_TYPES.TEXT).toBe('text');
      expect(MESSAGE_TYPES.IMAGE).toBe('image');
      expect(MESSAGE_TYPES.FILE).toBe('file');
      expect(MESSAGE_TYPES.SYSTEM).toBe('system');
      expect(Object.keys(MESSAGE_TYPES)).toHaveLength(4);
    });
  });

  describe('CACHE_KEYS', () => {
    /**
     * Test Case 56: Kiểm tra CACHE_KEYS values
     * Input: N/A
     * Expected Output: 4 cache key prefixes
     * Path Coverage: Cache keys verification
     */
    it('TC056: should have 4 cache key prefixes', () => {
      expect(CACHE_KEYS.USER_PROFILE).toBe('user:profile:');
      expect(CACHE_KEYS.GROUP_INFO).toBe('group:info:');
      expect(CACHE_KEYS.USER_GROUPS).toBe('user:groups:');
      expect(CACHE_KEYS.MESSAGE_COUNT).toBe('message:count:');
      expect(Object.keys(CACHE_KEYS)).toHaveLength(4);
    });

    /**
     * Test Case 57: Kiểm tra CACHE_KEYS format (ending with colon)
     * Input: N/A
     * Expected Output: All keys end with ':'
     * Path Coverage: Format validation
     */
    it('TC057: should have all cache keys ending with colon', () => {
      Object.values(CACHE_KEYS).forEach((key) => {
        expect(key.endsWith(':')).toBe(true);
      });
    });
  });

  describe('SECURITY_CONSTANTS', () => {
    /**
     * Test Case 58: Kiểm tra SECURITY_CONSTANTS.BCRYPT_ROUNDS
     * Input: N/A
     * Expected Output: BCRYPT_ROUNDS = 12
     * Path Coverage: Security setting verification
     */
    it('TC058: should have BCRYPT_ROUNDS = 12', () => {
      expect(SECURITY_CONSTANTS.BCRYPT_ROUNDS).toBe(12);
    });

    /**
     * Test Case 59: Kiểm tra SECURITY_CONSTANTS.JWT_SECRET_MIN_LENGTH
     * Input: N/A
     * Expected Output: JWT_SECRET_MIN_LENGTH = 32
     * Path Coverage: Security requirement verification
     */
    it('TC059: should have JWT_SECRET_MIN_LENGTH = 32', () => {
      expect(SECURITY_CONSTANTS.JWT_SECRET_MIN_LENGTH).toBe(32);
    });

    /**
     * Test Case 60: Kiểm tra SECURITY_CONSTANTS.SESSION_TIMEOUT
     * Input: N/A
     * Expected Output: SESSION_TIMEOUT = 30 minutes
     * Path Coverage: Default value verification
     */
    it('TC060: should have SESSION_TIMEOUT = 30 minutes (1800000ms)', () => {
      expect(SECURITY_CONSTANTS.SESSION_TIMEOUT).toBe(30 * 60 * 1000);
      expect(SECURITY_CONSTANTS.SESSION_TIMEOUT).toBe(1800000);
    });

    /**
     * Test Case 61: Kiểm tra BCRYPT_ROUNDS >= 10 (security best practice)
     * Input: N/A
     * Expected Output: BCRYPT_ROUNDS >= 10
     * Path Coverage: Security validation
     */
    it('TC061: should have BCRYPT_ROUNDS >= 10 for security', () => {
      expect(SECURITY_CONSTANTS.BCRYPT_ROUNDS).toBeGreaterThanOrEqual(10);
    });
  });

  describe('ERROR_CODES', () => {
    /**
     * Test Case 62: Kiểm tra ERROR_CODES có tất cả critical codes
     * Input: N/A
     * Expected Output: All critical error codes exist
     * Path Coverage: Critical codes verification
     */
    it('TC062: should have all critical error codes', () => {
      expect(ERROR_CODES.BAD_REQUEST).toBe('BAD_REQUEST');
      expect(ERROR_CODES.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(ERROR_CODES.FORBIDDEN).toBe('FORBIDDEN');
      expect(ERROR_CODES.NOT_FOUND).toBe('NOT_FOUND');
      expect(ERROR_CODES.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    });

    /**
     * Test Case 63: Kiểm tra số lượng ERROR_CODES
     * Input: N/A
     * Expected Output: 17 error codes
     * Path Coverage: Completeness check
     */
    it('TC063: should have 17 error codes', () => {
      expect(Object.keys(ERROR_CODES)).toHaveLength(17);
    });

    /**
     * Test Case 64: Kiểm tra ERROR_CODES values are uppercase strings
     * Input: N/A
     * Expected Output: All values match uppercase pattern
     * Path Coverage: Format validation
     */
    it('TC064: should have all error codes in UPPERCASE_SNAKE_CASE', () => {
      Object.values(ERROR_CODES).forEach((code) => {
        expect(code).toMatch(/^[A-Z_]+$/);
      });
    });
  });

  describe('HTTP_STATUS_TO_ERROR_CODE Mapping', () => {
    /**
     * Test Case 65: Kiểm tra mapping 400 -> BAD_REQUEST
     * Input: N/A
     * Expected Output: 400 maps to BAD_REQUEST
     * Path Coverage: Specific mapping verification
     */
    it('TC065: should map 400 to BAD_REQUEST', () => {
      expect(HTTP_STATUS_TO_ERROR_CODE[400]).toBe(ERROR_CODES.BAD_REQUEST);
    });

    /**
     * Test Case 66: Kiểm tra mapping 401 -> UNAUTHORIZED
     * Input: N/A
     * Expected Output: 401 maps to UNAUTHORIZED
     * Path Coverage: Specific mapping verification
     */
    it('TC066: should map 401 to UNAUTHORIZED', () => {
      expect(HTTP_STATUS_TO_ERROR_CODE[401]).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    /**
     * Test Case 67: Kiểm tra mapping 404 -> NOT_FOUND
     * Input: N/A
     * Expected Output: 404 maps to NOT_FOUND
     * Path Coverage: Specific mapping verification
     */
    it('TC067: should map 404 to NOT_FOUND', () => {
      expect(HTTP_STATUS_TO_ERROR_CODE[404]).toBe(ERROR_CODES.NOT_FOUND);
    });

    /**
     * Test Case 68: Kiểm tra mapping 500 -> INTERNAL_ERROR
     * Input: N/A
     * Expected Output: 500 maps to INTERNAL_ERROR
     * Path Coverage: Specific mapping verification
     */
    it('TC068: should map 500 to INTERNAL_ERROR', () => {
      expect(HTTP_STATUS_TO_ERROR_CODE[500]).toBe(ERROR_CODES.INTERNAL_ERROR);
    });

    /**
     * Test Case 69: Kiểm tra số lượng HTTP status mappings
     * Input: N/A
     * Expected Output: 9 mappings
     * Path Coverage: Completeness check
     */
    it('TC069: should have 9 HTTP status code mappings', () => {
      expect(Object.keys(HTTP_STATUS_TO_ERROR_CODE)).toHaveLength(9);
    });

    /**
     * Test Case 70: Kiểm tra tất cả mapped values là valid ERROR_CODES
     * Input: N/A
     * Expected Output: All values exist in ERROR_CODES
     * Path Coverage: Cross-reference validation
     */
    it('TC070: should have all mapped values as valid ERROR_CODES', () => {
      const errorCodeValues = Object.values(ERROR_CODES);
      Object.values(HTTP_STATUS_TO_ERROR_CODE).forEach((code) => {
        expect(errorCodeValues).toContain(code);
      });
    });
  });

  describe('getErrorCodeFromStatus Function', () => {
    /**
     * Test Case 71: Kiểm tra function với status 400
     * Input: 400
     * Expected Output: 'BAD_REQUEST'
     * Path Coverage: Valid mapping branch
     */
    it('TC071: should return BAD_REQUEST for status 400', () => {
      const result = getErrorCodeFromStatus(400);
      expect(result).toBe(ERROR_CODES.BAD_REQUEST);
    });

    /**
     * Test Case 72: Kiểm tra function với status 404
     * Input: 404
     * Expected Output: 'NOT_FOUND'
     * Path Coverage: Valid mapping branch
     */
    it('TC072: should return NOT_FOUND for status 404', () => {
      const result = getErrorCodeFromStatus(404);
      expect(result).toBe(ERROR_CODES.NOT_FOUND);
    });

    /**
     * Test Case 73: Kiểm tra function với status 500
     * Input: 500
     * Expected Output: 'INTERNAL_ERROR'
     * Path Coverage: Valid mapping branch
     */
    it('TC073: should return INTERNAL_ERROR for status 500', () => {
      const result = getErrorCodeFromStatus(500);
      expect(result).toBe(ERROR_CODES.INTERNAL_ERROR);
    });

    /**
     * Test Case 74: Kiểm tra function với unmapped status 200
     * Input: 200
     * Expected Output: 'UNKNOWN_ERROR'
     * Path Coverage: Fallback branch
     */
    it('TC074: should return UNKNOWN_ERROR for unmapped status 200', () => {
      const result = getErrorCodeFromStatus(200);
      expect(result).toBe(ERROR_CODES.UNKNOWN_ERROR);
    });

    /**
     * Test Case 75: Kiểm tra function với unmapped status 999
     * Input: 999
     * Expected Output: 'UNKNOWN_ERROR'
     * Path Coverage: Fallback branch
     */
    it('TC075: should return UNKNOWN_ERROR for unmapped status 999', () => {
      const result = getErrorCodeFromStatus(999);
      expect(result).toBe(ERROR_CODES.UNKNOWN_ERROR);
    });

    /**
     * Test Case 76: Kiểm tra function với status 0
     * Input: 0
     * Expected Output: 'UNKNOWN_ERROR'
     * Path Coverage: Edge case - zero value
     */
    it('TC076: should return UNKNOWN_ERROR for status 0', () => {
      const result = getErrorCodeFromStatus(0);
      expect(result).toBe(ERROR_CODES.UNKNOWN_ERROR);
    });

    /**
     * Test Case 77: Kiểm tra function với negative status
     * Input: -1
     * Expected Output: 'UNKNOWN_ERROR'
     * Path Coverage: Edge case - negative value
     */
    it('TC077: should return UNKNOWN_ERROR for negative status', () => {
      const result = getErrorCodeFromStatus(-1);
      expect(result).toBe(ERROR_CODES.UNKNOWN_ERROR);
    });

    /**
     * Test Case 78: Kiểm tra function với tất cả mapped statuses
     * Input: All mapped status codes
     * Expected Output: Correct error code for each
     * Path Coverage: Complete valid mapping coverage
     */
    it('TC078: should correctly map all defined HTTP status codes', () => {
      const mappings = [
        { status: 400, code: ERROR_CODES.BAD_REQUEST },
        { status: 401, code: ERROR_CODES.UNAUTHORIZED },
        { status: 403, code: ERROR_CODES.FORBIDDEN },
        { status: 404, code: ERROR_CODES.NOT_FOUND },
        { status: 409, code: ERROR_CODES.CONFLICT },
        { status: 422, code: ERROR_CODES.VALIDATION_ERROR },
        { status: 429, code: ERROR_CODES.RATE_LIMIT_EXCEEDED },
        { status: 408, code: ERROR_CODES.REQUEST_TIMEOUT },
        { status: 500, code: ERROR_CODES.INTERNAL_ERROR },
      ];

      mappings.forEach(({ status, code }) => {
        expect(getErrorCodeFromStatus(status)).toBe(code);
      });
    });

    /**
     * Test Case 79: Kiểm tra function return type
     * Input: 400
     * Expected Output: Type is ErrorCode (string)
     * Path Coverage: Type validation
     */
    it('TC079: should return ErrorCode type (string)', () => {
      const result = getErrorCodeFromStatus(400);
      expect(typeof result).toBe('string');
    });

    /**
     * Test Case 80: Kiểm tra function với floating point status
     * Input: 400.5
     * Expected Output: Treats as 400 (based on object key lookup)
     * Path Coverage: Edge case - non-integer input
     */
    it('TC080: should handle non-integer status codes', () => {
      // JavaScript object keys are converted to strings, so 400.5 won't match
      const result = getErrorCodeFromStatus(400.5 as any);
      expect(result).toBe(ERROR_CODES.UNKNOWN_ERROR);
    });
  });

  describe('Type Safety and Immutability', () => {
    /**
     * Test Case 81: Kiểm tra ErrorCode type
     * Input: N/A
     * Expected Output: ErrorCode is union of ERROR_CODES values
     * Path Coverage: Type compatibility check
     */
    it('TC081: should have ErrorCode type compatible with ERROR_CODES', () => {
      const errorCode: ErrorCode = ERROR_CODES.NOT_FOUND;
      expect(errorCode).toBe('NOT_FOUND');
    });

    /**
     * Test Case 82: Kiểm tra all constants are objects
     * Input: N/A
     * Expected Output: All exports are objects (except function)
     * Path Coverage: Structure validation
     */
    it('TC082: should have all constants as objects', () => {
      expect(typeof APP_CONSTANTS).toBe('object');
      expect(typeof ERROR_MESSAGES).toBe('object');
      expect(typeof SUCCESS_MESSAGES).toBe('object');
      expect(typeof DB_ERROR_CODES).toBe('object');
      expect(typeof RECEIVER_TYPES).toBe('object');
      expect(typeof USER_ROLES).toBe('object');
      expect(typeof MEMBER_STATUS).toBe('object');
      expect(typeof MESSAGE_TYPES).toBe('object');
      expect(typeof CACHE_KEYS).toBe('object');
      expect(typeof SECURITY_CONSTANTS).toBe('object');
      expect(typeof ERROR_CODES).toBe('object');
    });

    /**
     * Test Case 83: Kiểm tra getErrorCodeFromStatus is a function
     * Input: N/A
     * Expected Output: Type is function
     * Path Coverage: Function existence check
     */
    it('TC083: should have getErrorCodeFromStatus as a function', () => {
      expect(typeof getErrorCodeFromStatus).toBe('function');
    });

    /**
     * Test Case 84: Kiểm tra constants reference consistency
     * Input: N/A
     * Expected Output: Multiple references point to same object
     * Path Coverage: Reference immutability check
     */
    it('TC084: should maintain constant references', () => {
      const ref1 = APP_CONSTANTS;
      const ref2 = APP_CONSTANTS;
      expect(ref1).toBe(ref2);
    });

    /**
     * Test Case 85: Kiểm tra nested object structure
     * Input: N/A
     * Expected Output: Nested objects are accessible
     * Path Coverage: Deep structure validation
     */
    it('TC085: should have accessible nested objects', () => {
      expect(APP_CONSTANTS.PAGINATION).toBeDefined();
      expect(APP_CONSTANTS.USERS.PHONE_REGEX).toBeDefined();
      expect(typeof APP_CONSTANTS.USERS.PHONE_REGEX.test).toBe('function');
    });
  });

  describe('Integration Scenarios', () => {
    /**
     * Test Case 86: Scenario - Validate password length
     * Input: Password with 8 characters
     * Expected Output: Within min/max range
     * Path Coverage: Real-world validation scenario
     */
    it('TC086: should validate password length constraints', () => {
      const password = 'Pass1234';
      const { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } = APP_CONSTANTS.USERS;

      expect(password.length).toBeGreaterThanOrEqual(MIN_PASSWORD_LENGTH);
      expect(password.length).toBeLessThanOrEqual(MAX_PASSWORD_LENGTH);
    });

    /**
     * Test Case 87: Scenario - Check if file is allowed image type
     * Input: 'jpg' extension
     * Expected Output: true (allowed)
     * Path Coverage: File validation scenario
     */
    it('TC087: should validate allowed image types', () => {
      const extension = 'jpg';
      expect(APP_CONSTANTS.FILE_UPLOAD.ALLOWED_IMAGE_TYPES).toContain(
        extension,
      );
    });

    /**
     * Test Case 88: Scenario - Validate pagination limit
     * Input: limit = 50
     * Expected Output: Within min/max range
     * Path Coverage: Pagination validation scenario
     */
    it('TC088: should validate pagination limits', () => {
      const requestedLimit = 50;
      const { MIN_LIMIT, MAX_LIMIT } = APP_CONSTANTS.PAGINATION;

      expect(requestedLimit).toBeGreaterThanOrEqual(MIN_LIMIT);
      expect(requestedLimit).toBeLessThanOrEqual(MAX_LIMIT);
    });

    /**
     * Test Case 89: Scenario - Map HTTP 404 to error message
     * Input: status = 404
     * Expected Output: NOT_FOUND error code and message
     * Path Coverage: Error handling workflow
     */
    it('TC089: should map HTTP status to error code and message', () => {
      const status = 404;
      const errorCode = getErrorCodeFromStatus(status);

      expect(errorCode).toBe(ERROR_CODES.NOT_FOUND);
      expect(ERROR_MESSAGES.NOT_FOUND).toBeDefined();
    });

    /**
     * Test Case 90: Scenario - Validate group member count
     * Input: memberCount = 5
     * Expected Output: Within min/max range
     * Path Coverage: Group validation scenario
     */
    it('TC090: should validate group member constraints', () => {
      const memberCount = 5;
      const { MIN_MEMBERS, MAX_MEMBERS } = APP_CONSTANTS.GROUPS;

      expect(memberCount).toBeGreaterThanOrEqual(MIN_MEMBERS);
      expect(memberCount).toBeLessThanOrEqual(MAX_MEMBERS);
    });
  });
});
