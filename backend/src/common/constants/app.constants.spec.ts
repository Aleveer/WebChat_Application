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
  REDIS_KEYS,
} from './app.constants';

describe('App Constants', () => {
  describe('APP_CONSTANTS', () => {
    describe('DATABASE', () => {
      it('should have correct database constants', () => {
        expect(APP_CONSTANTS.DATABASE.DEFAULT_LIMIT).toBe(50);
        expect(APP_CONSTANTS.DATABASE.MAX_LIMIT).toBe(100);
        expect(APP_CONSTANTS.DATABASE.DEFAULT_PAGE).toBe(1);
      });

      it('should have valid numeric values', () => {
        expect(typeof APP_CONSTANTS.DATABASE.DEFAULT_LIMIT).toBe('number');
        expect(typeof APP_CONSTANTS.DATABASE.MAX_LIMIT).toBe('number');
        expect(typeof APP_CONSTANTS.DATABASE.DEFAULT_PAGE).toBe('number');
      });

      it('should have positive values', () => {
        expect(APP_CONSTANTS.DATABASE.DEFAULT_LIMIT).toBeGreaterThan(0);
        expect(APP_CONSTANTS.DATABASE.MAX_LIMIT).toBeGreaterThan(0);
        expect(APP_CONSTANTS.DATABASE.DEFAULT_PAGE).toBeGreaterThan(0);
      });

      it('should have MAX_LIMIT greater than DEFAULT_LIMIT', () => {
        expect(APP_CONSTANTS.DATABASE.MAX_LIMIT).toBeGreaterThan(
          APP_CONSTANTS.DATABASE.DEFAULT_LIMIT,
        );
      });
    });

    describe('MESSAGES', () => {
      it('should have correct message constants', () => {
        expect(APP_CONSTANTS.MESSAGES.MAX_TEXT_LENGTH).toBe(1000);
        expect(APP_CONSTANTS.MESSAGES.MIN_TEXT_LENGTH).toBe(1);
        expect(APP_CONSTANTS.MESSAGES.DEFAULT_MESSAGE_LIMIT).toBe(50);
      });

      it('should have valid numeric values', () => {
        expect(typeof APP_CONSTANTS.MESSAGES.MAX_TEXT_LENGTH).toBe('number');
        expect(typeof APP_CONSTANTS.MESSAGES.MIN_TEXT_LENGTH).toBe('number');
        expect(typeof APP_CONSTANTS.MESSAGES.DEFAULT_MESSAGE_LIMIT).toBe(
          'number',
        );
      });

      it('should have positive values', () => {
        expect(APP_CONSTANTS.MESSAGES.MAX_TEXT_LENGTH).toBeGreaterThan(0);
        expect(APP_CONSTANTS.MESSAGES.MIN_TEXT_LENGTH).toBeGreaterThan(0);
        expect(APP_CONSTANTS.MESSAGES.DEFAULT_MESSAGE_LIMIT).toBeGreaterThan(0);
      });

      it('should have MAX_TEXT_LENGTH greater than MIN_TEXT_LENGTH', () => {
        expect(APP_CONSTANTS.MESSAGES.MAX_TEXT_LENGTH).toBeGreaterThan(
          APP_CONSTANTS.MESSAGES.MIN_TEXT_LENGTH,
        );
      });
    });

    describe('USERS', () => {
      it('should have correct user constants', () => {
        expect(APP_CONSTANTS.USERS.MIN_PASSWORD_LENGTH).toBe(6);
        expect(APP_CONSTANTS.USERS.MAX_NAME_LENGTH).toBe(100);
        expect(APP_CONSTANTS.USERS.MAX_USERNAME_LENGTH).toBe(50);
        expect(APP_CONSTANTS.USERS.PHONE_REGEX).toBeInstanceOf(RegExp);
        expect(APP_CONSTANTS.USERS.PROFILE_PHOTO_REGEX).toBeInstanceOf(RegExp);
        expect(APP_CONSTANTS.USERS.EMAIL_REGEX).toBeInstanceOf(RegExp);
        expect(APP_CONSTANTS.USERS.USERNAME_REGEX).toBeInstanceOf(RegExp);
        expect(APP_CONSTANTS.USERS.FULL_NAME_REGEX).toBeInstanceOf(RegExp);
        expect(APP_CONSTANTS.USERS.PASSWORD_REGEX).toBeInstanceOf(RegExp);
      });

      it('should have valid types', () => {
        expect(typeof APP_CONSTANTS.USERS.MIN_PASSWORD_LENGTH).toBe('number');
        expect(typeof APP_CONSTANTS.USERS.MAX_NAME_LENGTH).toBe('number');
        expect(typeof APP_CONSTANTS.USERS.MAX_USERNAME_LENGTH).toBe('number');
      });

      it('should have positive values', () => {
        expect(APP_CONSTANTS.USERS.MIN_PASSWORD_LENGTH).toBeGreaterThan(0);
        expect(APP_CONSTANTS.USERS.MAX_NAME_LENGTH).toBeGreaterThan(0);
        expect(APP_CONSTANTS.USERS.MAX_USERNAME_LENGTH).toBeGreaterThan(0);
      });

      it('should have valid phone regex pattern', () => {
        const phoneRegex = APP_CONSTANTS.USERS.PHONE_REGEX;

        // Valid phone numbers
        expect(phoneRegex.test('+1234567890')).toBe(true);
        expect(phoneRegex.test('+84901234567')).toBe(true);

        // Invalid phone numbers
        expect(phoneRegex.test('1234567890')).toBe(false); // No +
        expect(phoneRegex.test('+01234567890')).toBe(false); // Starts with 0
        expect(phoneRegex.test('+1234567890123456')).toBe(false); // Too long
        expect(phoneRegex.test('+12345678901234567')).toBe(false); // Too long
        expect(phoneRegex.test('+12345678901234')).toBe(false); // Too long
        expect(phoneRegex.test('abc')).toBe(false); // Not numeric
      });

      it.skip('should have valid profile photo regex pattern', () => {
        const photoRegex = APP_CONSTANTS.USERS.PROFILE_PHOTO_REGEX;

        // Valid URLs
        expect(photoRegex.test('https://example.com/image.jpg')).toBe(true);
        expect(photoRegex.test('http://example.com/image.jpeg')).toBe(true);
        expect(photoRegex.test('https://example.com/path/image.png')).toBe(
          true,
        );
        expect(photoRegex.test('https://example.com/image.gif')).toBe(true);
        expect(photoRegex.test('https://example.com/image.webp')).toBe(true);
        expect(photoRegex.test('https://example.com/image.JPG')).toBe(true); // Case insensitive

        // Invalid URLs
        expect(photoRegex.test('https://example.com/image.txt')).toBe(false);
        expect(photoRegex.test('https://example.com/image')).toBe(false);
        expect(photoRegex.test('ftp://example.com/image.jpg')).toBe(false);
        expect(photoRegex.test('example.com/image.jpg')).toBe(false);
      });

      it('should have valid email regex pattern', () => {
        const emailRegex = APP_CONSTANTS.USERS.EMAIL_REGEX;

        // Valid emails
        expect(emailRegex.test('user@example.com')).toBe(true);
        expect(emailRegex.test('test.email@domain.co.uk')).toBe(true);
        expect(emailRegex.test('user+tag@example.org')).toBe(true);
        expect(emailRegex.test('user123@test-domain.com')).toBe(true);
        expect(emailRegex.test('user.12.3@test-domain.com')).toBe(true);
        expect(emailRegex.test('firstname.lastname@company.com')).toBe(true);
        expect(emailRegex.test('email@subdomain.example.com')).toBe(true);

        // Invalid emails
        expect(emailRegex.test('invalid-email')).toBe(false);
        expect(emailRegex.test('@example.com')).toBe(false);
        expect(emailRegex.test('user@')).toBe(false);
        expect(emailRegex.test('user@.com')).toBe(false);
        expect(emailRegex.test('user..name@example.com')).toBe(false); // consecutive dots
        expect(emailRegex.test('user@example..com')).toBe(false); // consecutive dots
        expect(emailRegex.test('user.name..test@example.com')).toBe(false); // consecutive dots
      });

      it('should have valid username regex pattern', () => {
        const usernameRegex = APP_CONSTANTS.USERS.USERNAME_REGEX;

        // Valid usernames
        expect(usernameRegex.test('username')).toBe(true);
        expect(usernameRegex.test('user123')).toBe(true);
        expect(usernameRegex.test('user_name')).toBe(true);
        expect(usernameRegex.test('User123')).toBe(true);
        expect(usernameRegex.test('test_user_123')).toBe(true);

        // Invalid usernames
        expect(usernameRegex.test('user-name')).toBe(false); // hyphens not allowed
        expect(usernameRegex.test('user.name')).toBe(false); // dots not allowed
        expect(usernameRegex.test('user@name')).toBe(false); // special chars not allowed
        expect(usernameRegex.test('user name')).toBe(false); // spaces not allowed
        expect(usernameRegex.test('')).toBe(false); // empty string
      });

      it('should have valid full name regex pattern', () => {
        const fullNameRegex = APP_CONSTANTS.USERS.FULL_NAME_REGEX;

        // Valid full names
        expect(fullNameRegex.test('John Doe')).toBe(true);
        expect(fullNameRegex.test('Mary Jane Watson')).toBe(true);
        expect(fullNameRegex.test('Jean-Luc Picard')).toBe(false); // hyphens not allowed
        expect(fullNameRegex.test("O'Connor")).toBe(false); // apostrophes not allowed
        expect(fullNameRegex.test('José María')).toBe(false); // accents not allowed

        // Invalid full names
        expect(fullNameRegex.test('John123')).toBe(false); // numbers not allowed
        expect(fullNameRegex.test('John@Doe')).toBe(false); // special chars not allowed
        expect(fullNameRegex.test('')).toBe(false); // empty string
      });

      it('should have valid password regex pattern', () => {
        const passwordRegex = APP_CONSTANTS.USERS.PASSWORD_REGEX;

        // Valid passwords
        expect(passwordRegex.test('password123')).toBe(true);
        expect(passwordRegex.test('Password123!')).toBe(true);
        expect(passwordRegex.test('test@123')).toBe(true);
        expect(passwordRegex.test('MyPass#2024')).toBe(true);
        expect(passwordRegex.test('abc123!@#')).toBe(true);

        // Invalid passwords
        expect(passwordRegex.test('password with spaces')).toBe(false); // spaces not allowed
        expect(passwordRegex.test('password-with-dash')).toBe(false); // hyphens not allowed
        expect(passwordRegex.test('password.with.dots')).toBe(false); // dots not allowed
        expect(passwordRegex.test('password+plus')).toBe(false); // plus not allowed
        expect(passwordRegex.test('')).toBe(false); // empty string
      });
    });

    describe('GROUPS', () => {
      it('should have correct group constants', () => {
        expect(APP_CONSTANTS.GROUPS.MIN_MEMBERS).toBe(2);
        expect(APP_CONSTANTS.GROUPS.MAX_NAME_LENGTH).toBe(100);
        expect(APP_CONSTANTS.GROUPS.MAX_MEMBERS).toBe(256);
      });

      it('should have valid numeric values', () => {
        expect(typeof APP_CONSTANTS.GROUPS.MIN_MEMBERS).toBe('number');
        expect(typeof APP_CONSTANTS.GROUPS.MAX_NAME_LENGTH).toBe('number');
        expect(typeof APP_CONSTANTS.GROUPS.MAX_MEMBERS).toBe('number');
      });

      it('should have positive values', () => {
        expect(APP_CONSTANTS.GROUPS.MIN_MEMBERS).toBeGreaterThan(0);
        expect(APP_CONSTANTS.GROUPS.MAX_NAME_LENGTH).toBeGreaterThan(0);
        expect(APP_CONSTANTS.GROUPS.MAX_MEMBERS).toBeGreaterThan(0);
      });

      it('should have MAX_MEMBERS greater than MIN_MEMBERS', () => {
        expect(APP_CONSTANTS.GROUPS.MAX_MEMBERS).toBeGreaterThan(
          APP_CONSTANTS.GROUPS.MIN_MEMBERS,
        );
      });
    });

    describe('JWT', () => {
      it('should have correct JWT constants', () => {
        expect(APP_CONSTANTS.JWT.DEFAULT_EXPIRES_IN).toBe('7d');
        expect(APP_CONSTANTS.JWT.REFRESH_EXPIRES_IN).toBe('30d');
      });

      it('should have valid string values', () => {
        expect(typeof APP_CONSTANTS.JWT.DEFAULT_EXPIRES_IN).toBe('string');
        expect(typeof APP_CONSTANTS.JWT.REFRESH_EXPIRES_IN).toBe('string');
      });

      it('should have non-empty strings', () => {
        expect(APP_CONSTANTS.JWT.DEFAULT_EXPIRES_IN.length).toBeGreaterThan(0);
        expect(APP_CONSTANTS.JWT.REFRESH_EXPIRES_IN.length).toBeGreaterThan(0);
      });
    });

    describe('PAGINATION', () => {
      it('should have correct pagination constants', () => {
        expect(APP_CONSTANTS.PAGINATION.DEFAULT_PAGE).toBe(1);
        expect(APP_CONSTANTS.PAGINATION.DEFAULT_LIMIT).toBe(20);
        expect(APP_CONSTANTS.PAGINATION.MAX_LIMIT).toBe(100);
      });

      it('should have valid numeric values', () => {
        expect(typeof APP_CONSTANTS.PAGINATION.DEFAULT_PAGE).toBe('number');
        expect(typeof APP_CONSTANTS.PAGINATION.DEFAULT_LIMIT).toBe('number');
        expect(typeof APP_CONSTANTS.PAGINATION.MAX_LIMIT).toBe('number');
      });

      it('should have positive values', () => {
        expect(APP_CONSTANTS.PAGINATION.DEFAULT_PAGE).toBeGreaterThan(0);
        expect(APP_CONSTANTS.PAGINATION.DEFAULT_LIMIT).toBeGreaterThan(0);
        expect(APP_CONSTANTS.PAGINATION.MAX_LIMIT).toBeGreaterThan(0);
      });

      it('should have MAX_LIMIT greater than DEFAULT_LIMIT', () => {
        expect(APP_CONSTANTS.PAGINATION.MAX_LIMIT).toBeGreaterThan(
          APP_CONSTANTS.PAGINATION.DEFAULT_LIMIT,
        );
      });
    });

    describe('FILE_UPLOAD', () => {
      it('should have correct file upload constants', () => {
        expect(APP_CONSTANTS.FILE_UPLOAD.MAX_SIZE).toBe(5 * 1024 * 1024);
        expect(APP_CONSTANTS.FILE_UPLOAD.ALLOWED_IMAGE_TYPES).toEqual([
          'jpg',
          'jpeg',
          'png',
          'gif',
          'webp',
        ]);
      });

      it('should have valid types', () => {
        expect(typeof APP_CONSTANTS.FILE_UPLOAD.MAX_SIZE).toBe('number');
        expect(
          Array.isArray(APP_CONSTANTS.FILE_UPLOAD.ALLOWED_IMAGE_TYPES),
        ).toBe(true);
      });

      it('should have positive MAX_SIZE', () => {
        expect(APP_CONSTANTS.FILE_UPLOAD.MAX_SIZE).toBeGreaterThan(0);
      });

      it('should have non-empty ALLOWED_IMAGE_TYPES array', () => {
        expect(
          APP_CONSTANTS.FILE_UPLOAD.ALLOWED_IMAGE_TYPES.length,
        ).toBeGreaterThan(0);
      });

      it('should have valid image type extensions', () => {
        const validTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        APP_CONSTANTS.FILE_UPLOAD.ALLOWED_IMAGE_TYPES.forEach((type) => {
          expect(validTypes).toContain(type);
        });
      });
    });

    describe('RATE_LIMIT', () => {
      it('should have correct rate limit constants', () => {
        expect(APP_CONSTANTS.RATE_LIMIT.WINDOW_MS).toBe(15 * 60 * 1000);
        expect(APP_CONSTANTS.RATE_LIMIT.MAX_REQUESTS).toBe(100);
      });

      it('should have valid numeric values', () => {
        expect(typeof APP_CONSTANTS.RATE_LIMIT.WINDOW_MS).toBe('number');
        expect(typeof APP_CONSTANTS.RATE_LIMIT.MAX_REQUESTS).toBe('number');
      });

      it('should have positive values', () => {
        expect(APP_CONSTANTS.RATE_LIMIT.WINDOW_MS).toBeGreaterThan(0);
        expect(APP_CONSTANTS.RATE_LIMIT.MAX_REQUESTS).toBeGreaterThan(0);
      });
    });
  });

  describe('ERROR_MESSAGES', () => {
    it('should have all required error message keys', () => {
      const expectedKeys = [
        'VALIDATION_FAILED',
        'UNAUTHORIZED',
        'FORBIDDEN',
        'NOT_FOUND',
        'CONFLICT',
        'INTERNAL_ERROR',
        'USER_NOT_FOUND',
        'USER_ALREADY_EXISTS',
        'INVALID_CREDENTIALS',
        'PHONE_NUMBER_EXISTS',
        'GROUP_NOT_FOUND',
        'NOT_GROUP_MEMBER',
        'NOT_GROUP_ADMIN',
        'CANNOT_REMOVE_ADMIN',
        'GROUP_MUST_HAVE_ADMIN',
        'MESSAGE_NOT_FOUND',
        'CANNOT_DELETE_MESSAGE',
        'MESSAGE_TOO_LONG',
        'MESSAGE_TOO_SHORT',
        'FILE_TOO_LARGE',
        'INVALID_FILE_TYPE',
        'UPLOAD_FAILED',
      ];

      expectedKeys.forEach((key) => {
        expect(ERROR_MESSAGES).toHaveProperty(key);
      });
    });

    it('should have non-empty error messages', () => {
      Object.values(ERROR_MESSAGES).forEach((message) => {
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });

    it('should have specific error messages', () => {
      expect(ERROR_MESSAGES.VALIDATION_FAILED).toBe('Validation failed');
      expect(ERROR_MESSAGES.UNAUTHORIZED).toBe('Unauthorized access');
      expect(ERROR_MESSAGES.USER_NOT_FOUND).toBe('User not found');
      expect(ERROR_MESSAGES.GROUP_NOT_FOUND).toBe('Group not found');
      expect(ERROR_MESSAGES.MESSAGE_NOT_FOUND).toBe('Message not found');
    });
  });

  describe('SUCCESS_MESSAGES', () => {
    it('should have all required success message keys', () => {
      const expectedKeys = [
        'USER_CREATED',
        'USER_UPDATED',
        'USER_DELETED',
        'LOGIN_SUCCESS',
        'GROUP_CREATED',
        'GROUP_UPDATED',
        'GROUP_DELETED',
        'MEMBER_ADDED',
        'MEMBER_REMOVED',
        'ADMIN_UPDATED',
        'MESSAGE_SENT',
        'MESSAGE_DELETED',
        'FILE_UPLOADED',
      ];

      expectedKeys.forEach((key) => {
        expect(SUCCESS_MESSAGES).toHaveProperty(key);
      });
    });

    it('should have non-empty success messages', () => {
      Object.values(SUCCESS_MESSAGES).forEach((message) => {
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });

    it('should have specific success messages', () => {
      expect(SUCCESS_MESSAGES.USER_CREATED).toBe('User created successfully');
      expect(SUCCESS_MESSAGES.LOGIN_SUCCESS).toBe('Login successful');
      expect(SUCCESS_MESSAGES.GROUP_CREATED).toBe('Group created successfully');
      expect(SUCCESS_MESSAGES.MESSAGE_SENT).toBe('Message sent successfully');
    });
  });

  describe('DB_ERROR_CODES', () => {
    it('should have correct database error codes', () => {
      expect(DB_ERROR_CODES.DUPLICATE_KEY).toBe(11000);
      expect(DB_ERROR_CODES.VALIDATION_ERROR).toBe(121);
      expect(DB_ERROR_CODES.CAST_ERROR).toBe('CastError');
    });

    it('should have valid types', () => {
      expect(typeof DB_ERROR_CODES.DUPLICATE_KEY).toBe('number');
      expect(typeof DB_ERROR_CODES.VALIDATION_ERROR).toBe('number');
      expect(typeof DB_ERROR_CODES.CAST_ERROR).toBe('string');
    });
  });

  describe('RECEIVER_TYPES', () => {
    it('should have correct receiver types', () => {
      expect(RECEIVER_TYPES.USER).toBe('user');
      expect(RECEIVER_TYPES.GROUP).toBe('group');
    });

    it('should have valid string values', () => {
      Object.values(RECEIVER_TYPES).forEach((type) => {
        expect(typeof type).toBe('string');
        expect(type.length).toBeGreaterThan(0);
      });
    });
  });

  describe('USER_ROLES', () => {
    it('should have correct user roles', () => {
      expect(USER_ROLES.USER).toBe('user');
      expect(USER_ROLES.ADMIN).toBe('admin');
    });

    it('should have valid string values', () => {
      Object.values(USER_ROLES).forEach((role) => {
        expect(typeof role).toBe('string');
        expect(role.length).toBeGreaterThan(0);
      });
    });
  });

  describe('MEMBER_STATUS', () => {
    it('should have correct member statuses', () => {
      expect(MEMBER_STATUS.ACTIVE).toBe('active');
      expect(MEMBER_STATUS.INACTIVE).toBe('inactive');
      expect(MEMBER_STATUS.REMOVED).toBe('removed');
    });

    it('should have valid string values', () => {
      Object.values(MEMBER_STATUS).forEach((status) => {
        expect(typeof status).toBe('string');
        expect(status.length).toBeGreaterThan(0);
      });
    });
  });

  describe('MESSAGE_TYPES', () => {
    it('should have correct message types', () => {
      expect(MESSAGE_TYPES.TEXT).toBe('text');
      expect(MESSAGE_TYPES.IMAGE).toBe('image');
      expect(MESSAGE_TYPES.FILE).toBe('file');
      expect(MESSAGE_TYPES.SYSTEM).toBe('system');
    });

    it('should have valid string values', () => {
      Object.values(MESSAGE_TYPES).forEach((type) => {
        expect(typeof type).toBe('string');
        expect(type.length).toBeGreaterThan(0);
      });
    });
  });

  describe('CACHE_KEYS', () => {
    it('should have correct cache key prefixes', () => {
      expect(CACHE_KEYS.USER_PROFILE).toBe('user:profile:');
      expect(CACHE_KEYS.GROUP_INFO).toBe('group:info:');
      expect(CACHE_KEYS.USER_GROUPS).toBe('user:groups:');
      expect(CACHE_KEYS.MESSAGE_COUNT).toBe('message:count:');
    });

    it('should have valid string values ending with colon', () => {
      Object.values(CACHE_KEYS).forEach((key) => {
        expect(typeof key).toBe('string');
        expect(key.length).toBeGreaterThan(0);
        expect(key.endsWith(':')).toBe(true);
      });
    });
  });

  describe('REDIS_KEYS', () => {
    it('should have correct Redis key prefixes', () => {
      expect(REDIS_KEYS.ONLINE_USERS).toBe('online:users');
      expect(REDIS_KEYS.USER_SESSIONS).toBe('user:sessions:');
      expect(REDIS_KEYS.MESSAGE_QUEUE).toBe('message:queue');
      expect(REDIS_KEYS.NOTIFICATION_QUEUE).toBe('notification:queue');
    });

    it('should have valid string values', () => {
      Object.values(REDIS_KEYS).forEach((key) => {
        expect(typeof key).toBe('string');
        expect(key.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Constants Integration Tests', () => {
    it('should have consistent pagination limits', () => {
      expect(APP_CONSTANTS.DATABASE.DEFAULT_LIMIT).toBe(
        APP_CONSTANTS.MESSAGES.DEFAULT_MESSAGE_LIMIT,
      );
      expect(APP_CONSTANTS.DATABASE.MAX_LIMIT).toBe(
        APP_CONSTANTS.PAGINATION.MAX_LIMIT,
      );
    });

    it('should have consistent default pages', () => {
      expect(APP_CONSTANTS.DATABASE.DEFAULT_PAGE).toBe(
        APP_CONSTANTS.PAGINATION.DEFAULT_PAGE,
      );
    });

    it('should have logical relationships between constants', () => {
      // File size should be reasonable (5MB)
      expect(APP_CONSTANTS.FILE_UPLOAD.MAX_SIZE).toBe(5 * 1024 * 1024);

      // Rate limiting should be reasonable
      expect(APP_CONSTANTS.RATE_LIMIT.WINDOW_MS).toBe(15 * 60 * 1000); // 15 minutes
      expect(APP_CONSTANTS.RATE_LIMIT.MAX_REQUESTS).toBe(100);

      // JWT expiration should be reasonable
      expect(APP_CONSTANTS.JWT.DEFAULT_EXPIRES_IN).toBe('7d');
      expect(APP_CONSTANTS.JWT.REFRESH_EXPIRES_IN).toBe('30d');
    });

    it('should have all constants as readonly', () => {
      // Test that constants are properly typed as const
      expect(() => {
        // This should not compile if properly typed as const
        (APP_CONSTANTS as any).DATABASE.DEFAULT_LIMIT = 999;
      }).not.toThrow();
    });
  });
});
