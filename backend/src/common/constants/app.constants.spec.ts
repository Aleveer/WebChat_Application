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
} from './app.constants';

describe('App Constants', () => {
  describe('APP_CONSTANTS', () => {
    describe('DATABASE constants', () => {
      it('should have correct default limit', () => {
        expect(APP_CONSTANTS.DATABASE.DEFAULT_LIMIT).toBe(50);
      });

      it('should have correct max limit', () => {
        expect(APP_CONSTANTS.DATABASE.MAX_LIMIT).toBe(100);
      });

      it('should have correct default page', () => {
        expect(APP_CONSTANTS.DATABASE.DEFAULT_PAGE).toBe(1);
      });
    });

    describe('MESSAGES constants', () => {
      it('should have correct max text length', () => {
        expect(APP_CONSTANTS.MESSAGES.MAX_TEXT_LENGTH).toBe(2000);
        expect(APP_CONSTANTS.MESSAGES.MAX_TEXT_LENGTH).toBeGreaterThan(0);
      });

      it('should have correct min text length', () => {
        expect(APP_CONSTANTS.MESSAGES.MIN_TEXT_LENGTH).toBe(1);
      });

      it('should have correct default message limit', () => {
        expect(APP_CONSTANTS.MESSAGES.DEFAULT_MESSAGE_LIMIT).toBe(50);
      });

      it('should have max text length greater than min text length', () => {
        expect(APP_CONSTANTS.MESSAGES.MAX_TEXT_LENGTH).toBeGreaterThan(
          APP_CONSTANTS.MESSAGES.MIN_TEXT_LENGTH,
        );
      });
    });

    describe('USERS constants', () => {
      it('should have correct min password length', () => {
        expect(APP_CONSTANTS.USERS.MIN_PASSWORD_LENGTH).toBe(8);
        expect(APP_CONSTANTS.USERS.MIN_PASSWORD_LENGTH).toBeGreaterThan(0);
      });

      it('should have correct min name length', () => {
        expect(APP_CONSTANTS.USERS.MIN_NAME_LENGTH).toBe(1);
      });

      it('should have correct max name length', () => {
        expect(APP_CONSTANTS.USERS.MAX_NAME_LENGTH).toBe(100);
      });

      it('should have correct max username length', () => {
        expect(APP_CONSTANTS.USERS.MAX_USERNAME_LENGTH).toBe(50);
      });

      it('should have max name length greater than min name length', () => {
        expect(APP_CONSTANTS.USERS.MAX_NAME_LENGTH).toBeGreaterThan(
          APP_CONSTANTS.USERS.MIN_NAME_LENGTH,
        );
      });

      describe('PHONE_REGEX validation', () => {
        it('should accept valid international phone numbers', () => {
          const validPhones = [
            '+1234567890',
            '+84123456789',
            '+84987654321',
            '+123456789012345',
          ];
          validPhones.forEach((phone) => {
            expect(APP_CONSTANTS.USERS.PHONE_REGEX.test(phone)).toBe(true);
          });
        });

        it('should reject invalid phone numbers', () => {
          const invalidPhones = [
            '1234567890', // Missing +
            '+0123456789', // Leading zero (after country code must be 1-9)
            '++1234567890', // Double plus
            'phone', // Not a number
            '+', // Just plus sign
          ];
          invalidPhones.forEach((phone) => {
            expect(APP_CONSTANTS.USERS.PHONE_REGEX.test(phone)).toBe(false);
          });
        });

        it('should validate phone format: + followed by 1-9, then 1-14 digits', () => {
          // +123 is valid: + (prefix) + 1 (country code 1-9) + 23 (2 digits)
          expect(APP_CONSTANTS.USERS.PHONE_REGEX.test('+123')).toBe(true);
          // Minimum valid format: + followed by one digit from 1-9
          expect(APP_CONSTANTS.USERS.PHONE_REGEX.test('+12')).toBe(true);
          // But +1 is valid (1-9 followed by 1 more digit = 2 total)
          expect(APP_CONSTANTS.USERS.PHONE_REGEX.test('+1')).toBe(false);
        });
      });

      describe('PROFILE_PHOTO_REGEX validation', () => {
        it('should accept valid image URLs', () => {
          const validUrls = [
            'https://example.com/image.jpg',
            'http://example.com/image.jpeg',
            'https://cdn.example.com/photo.png',
            'https://example.com/image.gif?v=1',
            'https://example.com/image.webp?size=large',
            'https://example.com/image.jpg#fragment',
            'https://example.com/image.png?v=1#anchor',
          ];
          validUrls.forEach((url) => {
            expect(APP_CONSTANTS.USERS.PROFILE_PHOTO_REGEX.test(url)).toBe(
              true,
            );
          });
        });

        it('should reject invalid image URLs', () => {
          const invalidUrls = [
            'not-a-url',
            'ftp://example.com/image.jpg',
            'https://example.com/image.txt',
            'https://example.com/no-extension',
            'https://example.com/image.jp', // Invalid extension
          ];
          invalidUrls.forEach((url) => {
            expect(APP_CONSTANTS.USERS.PROFILE_PHOTO_REGEX.test(url)).toBe(
              false,
            );
          });
        });
      });

      describe('EMAIL_REGEX validation', () => {
        it('should accept valid email addresses', () => {
          const validEmails = [
            'user@example.com',
            'test.email@domain.co.uk',
            'user123@test-domain.com',
          ];
          validEmails.forEach((email) => {
            expect(APP_CONSTANTS.USERS.EMAIL_REGEX.test(email)).toBe(true);
          });
        });

        it('should reject invalid email addresses', () => {
          const invalidEmails = [
            'not-an-email',
            'user@domain',
            '@domain.com',
            'user@',
            'user..name@domain.com', // Consecutive dots
            'user@domain..com', // Consecutive dots
            'user name@domain.com', // Space in email
          ];
          invalidEmails.forEach((email) => {
            expect(APP_CONSTANTS.USERS.EMAIL_REGEX.test(email)).toBe(false);
          });
        });
      });

      describe('USERNAME_REGEX validation', () => {
        it('should accept valid usernames', () => {
          const validUsernames = [
            'user123',
            'username',
            'user_name',
            'User123',
            '123user',
            '_username',
          ];
          validUsernames.forEach((username) => {
            expect(APP_CONSTANTS.USERS.USERNAME_REGEX.test(username)).toBe(
              true,
            );
          });
        });

        it('should reject invalid usernames', () => {
          const invalidUsernames = [
            'user name', // Space
            'user-name', // Hyphen
            'user.name', // Dot
            'user@name', // Special character
            'user!name', // Special character
            '', // Empty
          ];
          invalidUsernames.forEach((username) => {
            expect(APP_CONSTANTS.USERS.USERNAME_REGEX.test(username)).toBe(
              false,
            );
          });
        });
      });

      describe('FULL_NAME_REGEX validation', () => {
        it('should accept valid full names', () => {
          const validNames = [
            'John Doe',
            'Jane',
            'Mary Jane Watson',
            'Jean Claude',
            'Van Der Berg',
          ];
          validNames.forEach((name) => {
            expect(APP_CONSTANTS.USERS.FULL_NAME_REGEX.test(name)).toBe(true);
          });
        });

        it('should reject names with numbers or special characters', () => {
          const invalidNames = [
            'John123',
            'Jane@Doe',
            'Mary_Jo',
            'User.Name',
            'Jean-Claude', // Hyphen not allowed
            "O'Brien", // Apostrophe not allowed
          ];
          invalidNames.forEach((name) => {
            expect(APP_CONSTANTS.USERS.FULL_NAME_REGEX.test(name)).toBe(false);
          });
        });
      });

      describe('PASSWORD_REGEX validation', () => {
        it('should accept valid passwords', () => {
          const validPasswords = [
            'password123',
            'Password123',
            'P@ssw0rd',
            'MyP@ss!',
            '123456789',
          ];
          validPasswords.forEach((password) => {
            expect(APP_CONSTANTS.USERS.PASSWORD_REGEX.test(password)).toBe(
              true,
            );
          });
        });

        it('should reject passwords with unsupported characters', () => {
          const invalidPasswords = [
            'password with spaces',
            'pass-word', // Hyphen not in regex
            'user.name', // Dot not in regex
            'user_name', // Underscore not in regex
          ];
          invalidPasswords.forEach((password) => {
            expect(APP_CONSTANTS.USERS.PASSWORD_REGEX.test(password)).toBe(
              false,
            );
          });
        });
      });
    });

    describe('GROUPS constants', () => {
      it('should have correct min members', () => {
        expect(APP_CONSTANTS.GROUPS.MIN_MEMBERS).toBe(2);
      });

      it('should have correct max name length', () => {
        expect(APP_CONSTANTS.GROUPS.MAX_NAME_LENGTH).toBe(100);
      });

      it('should have correct max members', () => {
        expect(APP_CONSTANTS.GROUPS.MAX_MEMBERS).toBe(256);
      });

      it('should have max members greater than min members', () => {
        expect(APP_CONSTANTS.GROUPS.MAX_MEMBERS).toBeGreaterThan(
          APP_CONSTANTS.GROUPS.MIN_MEMBERS,
        );
      });
    });

    describe('JWT constants', () => {
      it('should have default expires in', () => {
        expect(APP_CONSTANTS.JWT.DEFAULT_EXPIRES_IN).toBe('7d');
      });

      it('should have refresh expires in', () => {
        expect(APP_CONSTANTS.JWT.REFRESH_EXPIRES_IN).toBe('30d');
      });

      it('should have valid expires in format', () => {
        expect(APP_CONSTANTS.JWT.DEFAULT_EXPIRES_IN).toMatch(/^\d+[dhm]$/);
        expect(APP_CONSTANTS.JWT.REFRESH_EXPIRES_IN).toMatch(/^\d+[dhm]$/);
      });
    });

    describe('PAGINATION constants', () => {
      it('should have correct default page', () => {
        expect(APP_CONSTANTS.PAGINATION.DEFAULT_PAGE).toBe(1);
      });

      it('should have correct default limit', () => {
        expect(APP_CONSTANTS.PAGINATION.DEFAULT_LIMIT).toBe(20);
      });

      it('should have correct max limit', () => {
        expect(APP_CONSTANTS.PAGINATION.MAX_LIMIT).toBe(100);
      });

      it('should have max limit greater than default limit', () => {
        expect(APP_CONSTANTS.PAGINATION.MAX_LIMIT).toBeGreaterThan(
          APP_CONSTANTS.PAGINATION.DEFAULT_LIMIT,
        );
      });
    });

    describe('FILE_UPLOAD constants', () => {
      it('should have correct max size (5MB)', () => {
        expect(APP_CONSTANTS.FILE_UPLOAD.MAX_SIZE).toBe(5 * 1024 * 1024);
      });

      it('should have allowed image types', () => {
        expect(APP_CONSTANTS.FILE_UPLOAD.ALLOWED_IMAGE_TYPES).toEqual([
          'jpg',
          'jpeg',
          'png',
          'gif',
          'webp',
        ]);
      });

      it('should have at least one allowed image type', () => {
        expect(
          APP_CONSTANTS.FILE_UPLOAD.ALLOWED_IMAGE_TYPES.length,
        ).toBeGreaterThan(0);
      });
    });

    describe('RATE_LIMIT constants', () => {
      it('should have correct window in milliseconds (15 minutes)', () => {
        expect(APP_CONSTANTS.RATE_LIMIT.WINDOW_MS).toBe(15 * 60 * 1000);
      });

      it('should have correct max requests', () => {
        expect(APP_CONSTANTS.RATE_LIMIT.MAX_REQUESTS).toBe(100);
      });

      it('should have positive values', () => {
        expect(APP_CONSTANTS.RATE_LIMIT.WINDOW_MS).toBeGreaterThan(0);
        expect(APP_CONSTANTS.RATE_LIMIT.MAX_REQUESTS).toBeGreaterThan(0);
      });
    });

    describe('API_CONSTANTS', () => {
      it('should have correct version', () => {
        expect(APP_CONSTANTS.API_CONSTANTS.VERSION).toBe('1.0');
      });

      it('should have correct default timeout (30 seconds)', () => {
        expect(APP_CONSTANTS.API_CONSTANTS.DEFAULT_TIMEOUT).toBe(30000);
      });

      it('should have correct max retries', () => {
        expect(APP_CONSTANTS.API_CONSTANTS.MAX_RETRIES).toBe(3);
      });

      it('should have positive values', () => {
        expect(APP_CONSTANTS.API_CONSTANTS.DEFAULT_TIMEOUT).toBeGreaterThan(0);
        expect(APP_CONSTANTS.API_CONSTANTS.MAX_RETRIES).toBeGreaterThan(0);
      });
    });

    describe('TIMEOUTS constants', () => {
      it('should have correct file upload timeout (5 minutes)', () => {
        expect(APP_CONSTANTS.TIMEOUTS.FILE_UPLOAD).toBe(300000);
      });

      it('should have correct default timeout (30 seconds)', () => {
        expect(APP_CONSTANTS.TIMEOUTS.DEFAULT).toBe(30000);
      });

      it('should have correct short timeout (5 seconds)', () => {
        expect(APP_CONSTANTS.TIMEOUTS.SHORT).toBe(5000);
      });

      it('should have timeouts in correct order', () => {
        expect(APP_CONSTANTS.TIMEOUTS.FILE_UPLOAD).toBeGreaterThan(
          APP_CONSTANTS.TIMEOUTS.DEFAULT,
        );
        expect(APP_CONSTANTS.TIMEOUTS.DEFAULT).toBeGreaterThan(
          APP_CONSTANTS.TIMEOUTS.SHORT,
        );
      });
    });
  });

  describe('ERROR_MESSAGES', () => {
    it('should have all required common error messages', () => {
      expect(ERROR_MESSAGES.VALIDATION_FAILED).toBe('Validation failed');
      expect(ERROR_MESSAGES.UNAUTHORIZED).toBe('Unauthorized access');
      expect(ERROR_MESSAGES.FORBIDDEN).toBe('Access forbidden');
      expect(ERROR_MESSAGES.NOT_FOUND).toBe('Resource not found');
      expect(ERROR_MESSAGES.CONFLICT).toBe('Resource already exists');
      expect(ERROR_MESSAGES.INTERNAL_ERROR).toBe('Internal server error');
    });

    it('should have all required user-specific error messages', () => {
      expect(ERROR_MESSAGES.USER_NOT_FOUND).toBe('User not found');
      expect(ERROR_MESSAGES.USER_ALREADY_EXISTS).toBe('User already exists');
      expect(ERROR_MESSAGES.INVALID_CREDENTIALS).toBe('Invalid credentials');
      expect(ERROR_MESSAGES.PHONE_NUMBER_EXISTS).toBe(
        'Phone number already exists',
      );
    });

    it('should have all required group-specific error messages', () => {
      expect(ERROR_MESSAGES.GROUP_NOT_FOUND).toBe('Group not found');
      expect(ERROR_MESSAGES.NOT_GROUP_MEMBER).toBe(
        'You are not a member of this group',
      );
      expect(ERROR_MESSAGES.NOT_GROUP_ADMIN).toBe(
        'Only group admins can perform this action',
      );
      expect(ERROR_MESSAGES.CANNOT_REMOVE_ADMIN).toBe(
        'Cannot remove other admins',
      );
      expect(ERROR_MESSAGES.GROUP_MUST_HAVE_ADMIN).toBe(
        'Group must have at least one admin',
      );
    });

    it('should have all required message-specific error messages', () => {
      expect(ERROR_MESSAGES.MESSAGE_NOT_FOUND).toBe('Message not found');
      expect(ERROR_MESSAGES.CANNOT_DELETE_MESSAGE).toBe(
        'You can only delete your own messages',
      );
      expect(ERROR_MESSAGES.MESSAGE_TOO_LONG).toBe('Message is too long');
      expect(ERROR_MESSAGES.MESSAGE_TOO_SHORT).toBe('Message cannot be empty');
    });

    it('should have all required file-specific error messages', () => {
      expect(ERROR_MESSAGES.FILE_TOO_LARGE).toBe('File is too large');
      expect(ERROR_MESSAGES.INVALID_FILE_TYPE).toBe('Invalid file type');
      expect(ERROR_MESSAGES.UPLOAD_FAILED).toBe('File upload failed');
    });

    it('should have all error messages as non-empty strings', () => {
      Object.values(ERROR_MESSAGES).forEach((message) => {
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });
  });

  describe('SUCCESS_MESSAGES', () => {
    it('should have all required user success messages', () => {
      expect(SUCCESS_MESSAGES.USER_CREATED).toBe('User created successfully');
      expect(SUCCESS_MESSAGES.USER_UPDATED).toBe('User updated successfully');
      expect(SUCCESS_MESSAGES.USER_DELETED).toBe('User deleted successfully');
      expect(SUCCESS_MESSAGES.LOGIN_SUCCESS).toBe('Login successful');
    });

    it('should have all required group success messages', () => {
      expect(SUCCESS_MESSAGES.GROUP_CREATED).toBe('Group created successfully');
      expect(SUCCESS_MESSAGES.GROUP_UPDATED).toBe('Group updated successfully');
      expect(SUCCESS_MESSAGES.GROUP_DELETED).toBe('Group deleted successfully');
      expect(SUCCESS_MESSAGES.MEMBER_ADDED).toBe('Member added successfully');
      expect(SUCCESS_MESSAGES.MEMBER_REMOVED).toBe(
        'Member removed successfully',
      );
      expect(SUCCESS_MESSAGES.ADMIN_UPDATED).toBe(
        'Admin status updated successfully',
      );
    });

    it('should have all required message success messages', () => {
      expect(SUCCESS_MESSAGES.MESSAGE_SENT).toBe('Message sent successfully');
      expect(SUCCESS_MESSAGES.MESSAGE_DELETED).toBe(
        'Message deleted successfully',
      );
    });

    it('should have all required file success messages', () => {
      expect(SUCCESS_MESSAGES.FILE_UPLOADED).toBe('File uploaded successfully');
    });

    it('should have all success messages as non-empty strings', () => {
      Object.values(SUCCESS_MESSAGES).forEach((message) => {
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });
  });

  describe('DB_ERROR_CODES', () => {
    it('should have correct duplicate key error code', () => {
      expect(DB_ERROR_CODES.DUPLICATE_KEY).toBe(11000);
    });

    it('should have correct validation error code', () => {
      expect(DB_ERROR_CODES.VALIDATION_ERROR).toBe(121);
    });

    it('should have correct cast error code', () => {
      expect(DB_ERROR_CODES.CAST_ERROR).toBe('CastError');
    });

    it('should have numeric error codes as numbers', () => {
      expect(typeof DB_ERROR_CODES.DUPLICATE_KEY).toBe('number');
      expect(typeof DB_ERROR_CODES.VALIDATION_ERROR).toBe('number');
    });
  });

  describe('RECEIVER_TYPES', () => {
    it('should have user receiver type', () => {
      expect(RECEIVER_TYPES.USER).toBe('user');
    });

    it('should have group receiver type', () => {
      expect(RECEIVER_TYPES.GROUP).toBe('group');
    });

    it('should have all types as non-empty strings', () => {
      Object.values(RECEIVER_TYPES).forEach((type) => {
        expect(typeof type).toBe('string');
        expect(type.length).toBeGreaterThan(0);
      });
    });
  });

  describe('USER_ROLES', () => {
    it('should have user role', () => {
      expect(USER_ROLES.USER).toBe('user');
    });

    it('should have admin role', () => {
      expect(USER_ROLES.ADMIN).toBe('admin');
    });

    it('should have all roles as non-empty strings', () => {
      Object.values(USER_ROLES).forEach((role) => {
        expect(typeof role).toBe('string');
        expect(role.length).toBeGreaterThan(0);
      });
    });
  });

  describe('MEMBER_STATUS', () => {
    it('should have active status', () => {
      expect(MEMBER_STATUS.ACTIVE).toBe('active');
    });

    it('should have inactive status', () => {
      expect(MEMBER_STATUS.INACTIVE).toBe('inactive');
    });

    it('should have removed status', () => {
      expect(MEMBER_STATUS.REMOVED).toBe('removed');
    });

    it('should have all statuses as non-empty strings', () => {
      Object.values(MEMBER_STATUS).forEach((status) => {
        expect(typeof status).toBe('string');
        expect(status.length).toBeGreaterThan(0);
      });
    });
  });

  describe('MESSAGE_TYPES', () => {
    it('should have text message type', () => {
      expect(MESSAGE_TYPES.TEXT).toBe('text');
    });

    it('should have image message type', () => {
      expect(MESSAGE_TYPES.IMAGE).toBe('image');
    });

    it('should have file message type', () => {
      expect(MESSAGE_TYPES.FILE).toBe('file');
    });

    it('should have system message type', () => {
      expect(MESSAGE_TYPES.SYSTEM).toBe('system');
    });

    it('should have all types as non-empty strings', () => {
      Object.values(MESSAGE_TYPES).forEach((type) => {
        expect(typeof type).toBe('string');
        expect(type.length).toBeGreaterThan(0);
      });
    });
  });

  describe('CACHE_KEYS', () => {
    it('should have user profile cache key', () => {
      expect(CACHE_KEYS.USER_PROFILE).toBe('user:profile:');
    });

    it('should have group info cache key', () => {
      expect(CACHE_KEYS.GROUP_INFO).toBe('group:info:');
    });

    it('should have user groups cache key', () => {
      expect(CACHE_KEYS.USER_GROUPS).toBe('user:groups:');
    });

    it('should have message count cache key', () => {
      expect(CACHE_KEYS.MESSAGE_COUNT).toBe('message:count:');
    });

    it('should have all keys ending with colon', () => {
      Object.values(CACHE_KEYS).forEach((key) => {
        expect(typeof key).toBe('string');
        expect(key.endsWith(':')).toBe(true);
      });
    });
  });

  describe('SECURITY_CONSTANTS', () => {
    it('should have correct bcrypt rounds', () => {
      expect(SECURITY_CONSTANTS.BCRYPT_ROUNDS).toBe(12);
    });

    it('should have correct JWT secret min length', () => {
      expect(SECURITY_CONSTANTS.JWT_SECRET_MIN_LENGTH).toBe(32);
    });

    it('should have correct session timeout (30 minutes)', () => {
      expect(SECURITY_CONSTANTS.SESSION_TIMEOUT).toBe(30 * 60 * 1000);
    });

    it('should have bcrypt rounds in acceptable range', () => {
      expect(SECURITY_CONSTANTS.BCRYPT_ROUNDS).toBeGreaterThanOrEqual(10);
      expect(SECURITY_CONSTANTS.BCRYPT_ROUNDS).toBeLessThanOrEqual(15);
    });

    it('should have JWT secret min length sufficient', () => {
      expect(SECURITY_CONSTANTS.JWT_SECRET_MIN_LENGTH).toBeGreaterThanOrEqual(
        32,
      );
    });

    it('should have positive values', () => {
      expect(SECURITY_CONSTANTS.BCRYPT_ROUNDS).toBeGreaterThan(0);
      expect(SECURITY_CONSTANTS.JWT_SECRET_MIN_LENGTH).toBeGreaterThan(0);
      expect(SECURITY_CONSTANTS.SESSION_TIMEOUT).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    it('should have consistent limits across constants', () => {
      expect(APP_CONSTANTS.DATABASE.MAX_LIMIT).toBe(
        APP_CONSTANTS.PAGINATION.MAX_LIMIT,
      );
    });

    it('should have consistent default page values', () => {
      expect(APP_CONSTANTS.DATABASE.DEFAULT_PAGE).toBe(
        APP_CONSTANTS.PAGINATION.DEFAULT_PAGE,
      );
    });

    it('should have consistent timeout values', () => {
      expect(APP_CONSTANTS.TIMEOUTS.DEFAULT).toBe(
        APP_CONSTANTS.API_CONSTANTS.DEFAULT_TIMEOUT,
      );
    });

    it('should have file upload timeout greater than default timeout', () => {
      expect(APP_CONSTANTS.TIMEOUTS.FILE_UPLOAD).toBeGreaterThan(
        APP_CONSTANTS.TIMEOUTS.DEFAULT,
      );
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle empty string validation properly', () => {
      const emptyRegexTest = APP_CONSTANTS.USERS.EMAIL_REGEX.test('');
      const emptyUsernameTest = APP_CONSTANTS.USERS.USERNAME_REGEX.test('');
      const emptyNameTest = APP_CONSTANTS.USERS.FULL_NAME_REGEX.test('');

      expect(emptyRegexTest).toBe(false);
      expect(emptyUsernameTest).toBe(false);
      expect(emptyNameTest).toBe(false);
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(1000);
      const emailTest = APP_CONSTANTS.USERS.EMAIL_REGEX.test(longString);
      expect(emailTest).toBe(false);
    });

    it('should validate message length constraints', () => {
      const minLengthMessage = 'a'.repeat(
        APP_CONSTANTS.MESSAGES.MIN_TEXT_LENGTH,
      );
      const maxLengthMessage = 'a'.repeat(
        APP_CONSTANTS.MESSAGES.MAX_TEXT_LENGTH,
      );
      const tooLongMessage = 'a'.repeat(
        APP_CONSTANTS.MESSAGES.MAX_TEXT_LENGTH + 1,
      );

      expect(minLengthMessage.length).toBe(
        APP_CONSTANTS.MESSAGES.MIN_TEXT_LENGTH,
      );
      expect(maxLengthMessage.length).toBe(
        APP_CONSTANTS.MESSAGES.MAX_TEXT_LENGTH,
      );
      expect(tooLongMessage.length).toBeGreaterThan(
        APP_CONSTANTS.MESSAGES.MAX_TEXT_LENGTH,
      );
    });
  });
});
