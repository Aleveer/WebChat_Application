import {
  sanitizeMongoInput,
  escapeRegexCharacters,
  createSafeRegex,
  sanitizeQueryObject,
  sanitizeObjectId,
  sanitizeObjectIdSafe,
  sanitizeEmail,
  sanitizeEmailSafe,
  sanitizePhoneNumber,
  sanitizePhoneNumberSafe,
  sanitizeUsername,
  sanitizeUsernameSafe,
  sanitizeUrl,
  sanitizeUrlSafe,
  MongoSafeStringSchema,
  MongoObjectIdSchema,
  EmailSchema,
  PhoneNumberSchema,
  RegexSafeStringSchema,
  UsernameSchema,
  UrlSchema,
} from '../src/common/utils/sanitization.utils';
import { z } from 'zod';

describe('Sanitization Utils - White Box Testing', () => {
  /**
   * ============================================
   * SCHEMA TESTS - MongoSafeStringSchema
   * ============================================
   */
  describe('MongoSafeStringSchema', () => {
    describe('Path 1: Valid input với trim', () => {
      it('nên trim whitespace ở đầu và cuối', () => {
        const result = MongoSafeStringSchema.parse('  hello world  ');
        expect(result).toBe('hello world');
      });
    });

    describe('Path 2: Input chứa MongoDB operators', () => {
      it('nên loại bỏ $ signs', () => {
        const result = MongoSafeStringSchema.parse('$set$where$eq');
        expect(result).toBe('setwhereeq');
      });

      it('nên loại bỏ { và }', () => {
        const result = MongoSafeStringSchema.parse('test{value}data');
        expect(result).toBe('testvaluedata');
      });

      it('nên loại bỏ [ và ]', () => {
        const result = MongoSafeStringSchema.parse('test[array]data');
        expect(result).toBe('testarraydata');
      });

      it('nên loại bỏ tất cả special characters cùng lúc', () => {
        const result = MongoSafeStringSchema.parse('  ${test}[array]  ');
        expect(result).toBe('testarray');
      });
    });

    describe('Path 3: Input rỗng', () => {
      it('nên xử lý string rỗng', () => {
        const result = MongoSafeStringSchema.parse('');
        expect(result).toBe('');
      });

      it('nên xử lý string chỉ có whitespace', () => {
        const result = MongoSafeStringSchema.parse('   ');
        expect(result).toBe('');
      });
    });
  });

  /**
   * ============================================
   * SCHEMA TESTS - MongoObjectIdSchema
   * ============================================
   */
  describe('MongoObjectIdSchema', () => {
    describe('Path 1: Valid ObjectId', () => {
      it('nên accept ObjectId hợp lệ 24 hex chars lowercase', () => {
        const result = MongoObjectIdSchema.parse('507f1f77bcf86cd799439011');
        expect(result).toBe('507f1f77bcf86cd799439011');
      });

      it('nên accept ObjectId hợp lệ 24 hex chars uppercase', () => {
        const result = MongoObjectIdSchema.parse('507F1F77BCF86CD799439011');
        expect(result).toBe('507F1F77BCF86CD799439011');
      });

      it('nên accept ObjectId hợp lệ mixed case', () => {
        const result = MongoObjectIdSchema.parse('507f1F77BcF86cD799439011');
        expect(result).toBe('507f1F77BcF86cD799439011');
      });
    });

    describe('Path 2: Invalid ObjectId - Length', () => {
      it('nên reject ObjectId ngắn hơn 24 chars', () => {
        expect(() =>
          MongoObjectIdSchema.parse('507f1f77bcf86cd79943901'),
        ).toThrow('ObjectId phải có đúng 24 ký tự');
      });

      it('nên reject ObjectId dài hơn 24 chars', () => {
        expect(() =>
          MongoObjectIdSchema.parse('507f1f77bcf86cd7994390111'),
        ).toThrow('ObjectId phải có đúng 24 ký tự');
      });

      it('nên reject string rỗng', () => {
        expect(() => MongoObjectIdSchema.parse('')).toThrow(
          'ObjectId phải có đúng 24 ký tự',
        );
      });
    });

    describe('Path 3: Invalid ObjectId - Format', () => {
      it('nên reject ObjectId chứa ký tự không phải hex', () => {
        expect(() =>
          MongoObjectIdSchema.parse('507f1f77bcf86cd799439g11'),
        ).toThrow('ObjectId không hợp lệ');
      });

      it('nên reject ObjectId chứa special characters', () => {
        expect(() =>
          MongoObjectIdSchema.parse('507f1f77-bcf8-6cd7-9943-9011'),
        ).toThrow('ObjectId không hợp lệ');
      });
    });

    describe('Path 4: Trim whitespace', () => {
      it('nên trim whitespace trước khi validate', () => {
        const result = MongoObjectIdSchema.parse(
          '  507f1f77bcf86cd799439011  ',
        );
        expect(result).toBe('507f1f77bcf86cd799439011');
      });
    });
  });

  /**
   * ============================================
   * SCHEMA TESTS - EmailSchema
   * ============================================
   */
  describe('EmailSchema', () => {
    describe('Path 1: Valid email', () => {
      it('nên accept email hợp lệ và chuyển thành lowercase', () => {
        const result = EmailSchema.parse('TEST@EXAMPLE.COM');
        expect(result).toBe('test@example.com');
      });

      it('nên trim whitespace', () => {
        const result = EmailSchema.parse('  test@example.com  ');
        expect(result).toBe('test@example.com');
      });

      it('nên accept email với subdomain', () => {
        const result = EmailSchema.parse('user@mail.example.com');
        expect(result).toBe('user@mail.example.com');
      });
    });

    describe('Path 2: Invalid email format', () => {
      it('nên reject email không có @', () => {
        expect(() => EmailSchema.parse('invalidemail.com')).toThrow(
          'Email không hợp lệ',
        );
      });

      it('nên reject email không có domain', () => {
        expect(() => EmailSchema.parse('test@')).toThrow('Email không hợp lệ');
      });

      it('nên reject email rỗng', () => {
        expect(() => EmailSchema.parse('')).toThrow('Email không hợp lệ');
      });
    });

    describe('Path 3: Email quá dài', () => {
      it('nên reject email vượt quá 255 ký tự', () => {
        const longEmail = 'a'.repeat(250) + '@example.com';
        expect(() => EmailSchema.parse(longEmail)).toThrow(
          'Email không được vượt quá 255 ký tự',
        );
      });
    });
  });

  /**
   * ============================================
   * SCHEMA TESTS - PhoneNumberSchema
   * ============================================
   */
  describe('PhoneNumberSchema', () => {
    describe('Path 1: Valid phone number', () => {
      it('nên accept số điện thoại hợp lệ', () => {
        const result = PhoneNumberSchema.parse('+84901234567');
        expect(result).toBe('+84901234567');
      });

      it('nên loại bỏ ký tự không phải số', () => {
        const result = PhoneNumberSchema.parse('+84 (90) 123-4567');
        expect(result).toBe('+84901234567');
      });

      it('nên trim whitespace', () => {
        const result = PhoneNumberSchema.parse('  +84901234567  ');
        expect(result).toBe('+84901234567');
      });
    });

    describe('Path 2: Invalid phone number format', () => {
      it('nên reject số điện thoại bắt đầu bằng +0', () => {
        expect(() => PhoneNumberSchema.parse('+0901234567')).toThrow(
          'Số điện thoại không hợp lệ',
        );
      });

      it('nên reject số điện thoại không có dấu +', () => {
        expect(() => PhoneNumberSchema.parse('84901234567')).toThrow(
          'Số điện thoại không hợp lệ',
        );
      });

      it('nên reject số điện thoại quá ngắn', () => {
        expect(() => PhoneNumberSchema.parse('+8')).toThrow(
          'Số điện thoại không hợp lệ',
        );
      });

      it('nên reject số điện thoại quá dài', () => {
        const longPhone = '+8' + '1'.repeat(16);
        expect(() => PhoneNumberSchema.parse(longPhone)).toThrow(
          'Số điện thoại không hợp lệ',
        );
      });
    });
  });

  /**
   * ============================================
   * SCHEMA TESTS - RegexSafeStringSchema
   * ============================================
   */
  describe('RegexSafeStringSchema', () => {
    describe('Path 1: Valid input', () => {
      it('nên escape regex special characters', () => {
        const result = RegexSafeStringSchema.parse('test.*pattern?');
        expect(result).toBe('test\\.\\*pattern\\?');
      });

      it('nên escape tất cả regex metacharacters', () => {
        const result = RegexSafeStringSchema.parse('.*+?^${}()|[]\\');
        expect(result).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
      });

      it('nên trim whitespace', () => {
        const result = RegexSafeStringSchema.parse('  test  ');
        expect(result).toBe('test');
      });
    });

    describe('Path 2: Input quá dài', () => {
      it('nên reject input vượt quá 100 ký tự', () => {
        const longInput = 'a'.repeat(101);
        expect(() => RegexSafeStringSchema.parse(longInput)).toThrow(
          'Input quá dài',
        );
      });

      it('nên accept input đúng 100 ký tự', () => {
        const input = 'a'.repeat(100);
        const result = RegexSafeStringSchema.parse(input);
        expect(result).toBe(input);
      });
    });
  });

  /**
   * ============================================
   * SCHEMA TESTS - UsernameSchema
   * ============================================
   */
  describe('UsernameSchema', () => {
    describe('Path 1: Valid username', () => {
      it('nên accept username hợp lệ với chữ và số', () => {
        const result = UsernameSchema.parse('user123');
        expect(result).toBe('user123');
      });

      it('nên accept username với underscore và hyphen', () => {
        const result = UsernameSchema.parse('user_name-123');
        expect(result).toBe('user_name-123');
      });

      it('nên trim whitespace', () => {
        const result = UsernameSchema.parse('  username  ');
        expect(result).toBe('username');
      });
    });

    describe('Path 2: Invalid username - Length', () => {
      it('nên reject username ngắn hơn 3 ký tự', () => {
        expect(() => UsernameSchema.parse('ab')).toThrow(
          'Username phải có ít nhất 3 ký tự',
        );
      });

      it('nên reject username dài hơn 30 ký tự', () => {
        const longUsername = 'a'.repeat(31);
        expect(() => UsernameSchema.parse(longUsername)).toThrow(
          'Username không được vượt quá 30 ký tự',
        );
      });
    });

    describe('Path 3: Invalid username - Characters', () => {
      it('nên reject username chứa ký tự đặc biệt', () => {
        expect(() => UsernameSchema.parse('user@name')).toThrow(
          'Username chỉ được chứa',
        );
      });

      it('nên reject username chứa khoảng trắng', () => {
        expect(() => UsernameSchema.parse('user name')).toThrow(
          'Username chỉ được chứa',
        );
      });

      it('nên reject username chứa dấu chấm', () => {
        expect(() => UsernameSchema.parse('user.name')).toThrow(
          'Username chỉ được chứa',
        );
      });
    });
  });

  /**
   * ============================================
   * SCHEMA TESTS - UrlSchema
   * ============================================
   */
  describe('UrlSchema', () => {
    describe('Path 1: Valid URL', () => {
      it('nên accept URL hợp lệ với http', () => {
        const result = UrlSchema.parse('http://example.com');
        expect(result).toBe('http://example.com');
      });

      it('nên accept URL hợp lệ với https', () => {
        const result = UrlSchema.parse('https://example.com');
        expect(result).toBe('https://example.com');
      });

      it('nên trim whitespace', () => {
        const result = UrlSchema.parse('  https://example.com  ');
        expect(result).toBe('https://example.com');
      });
    });

    describe('Path 2: Invalid URL', () => {
      it('nên reject URL không có protocol', () => {
        expect(() => UrlSchema.parse('example.com')).toThrow(
          'URL không hợp lệ',
        );
      });

      it('nên reject URL không hợp lệ', () => {
        expect(() => UrlSchema.parse('not a url')).toThrow('URL không hợp lệ');
      });
    });

    describe('Path 3: URL quá dài', () => {
      it('nên reject URL vượt quá 2000 ký tự', () => {
        const longUrl = 'https://example.com/' + 'a'.repeat(2000);
        expect(() => UrlSchema.parse(longUrl)).toThrow(
          'URL không được vượt quá 2000 ký tự',
        );
      });
    });
  });

  /**
   * ============================================
   * FUNCTION TESTS - sanitizeMongoInput
   * ============================================
   */
  describe('sanitizeMongoInput', () => {
    describe('Path 1: Success - Valid input', () => {
      it('nên sanitize input thành công', () => {
        const result = sanitizeMongoInput('test$value');
        expect(result).toBe('testvalue');
      });
    });

    describe('Path 2: Error - ZodError', () => {
      it('nên throw error với message từ ZodError', () => {
        // String type mismatch sẽ không xảy ra ở runtime vì TypeScript
        // Nhưng ta có thể test với non-string value bằng cách as any
        expect(() => sanitizeMongoInput(null as any)).toThrow(
          'Validation failed',
        );
      });
    });

    describe('Path 3: Error - Other errors', () => {
      it('nên rethrow non-ZodError', () => {
        const originalParse = MongoSafeStringSchema.parse;
        MongoSafeStringSchema.parse = () => {
          throw new TypeError('Custom error');
        };

        expect(() => sanitizeMongoInput('test')).toThrow('Custom error');

        // Restore
        MongoSafeStringSchema.parse = originalParse;
      });
    });
  });

  /**
   * ============================================
   * FUNCTION TESTS - escapeRegexCharacters
   * ============================================
   */
  describe('escapeRegexCharacters', () => {
    describe('Path 1: Valid string input', () => {
      it('nên escape tất cả regex special characters', () => {
        const result = escapeRegexCharacters('.*+?^${}()|[]\\');
        expect(result).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
      });

      it('nên giữ nguyên string không có special chars', () => {
        const result = escapeRegexCharacters('hello world');
        expect(result).toBe('hello world');
      });
    });

    describe('Path 2: Non-string input', () => {
      it('nên return empty string cho non-string input', () => {
        expect(escapeRegexCharacters(null as any)).toBe('');
        expect(escapeRegexCharacters(undefined as any)).toBe('');
        expect(escapeRegexCharacters(123 as any)).toBe('');
        expect(escapeRegexCharacters({} as any)).toBe('');
      });
    });

    describe('Path 3: Empty string', () => {
      it('nên return empty string cho empty input', () => {
        const result = escapeRegexCharacters('');
        expect(result).toBe('');
      });
    });
  });

  /**
   * ============================================
   * FUNCTION TESTS - createSafeRegex
   * ============================================
   */
  describe('createSafeRegex', () => {
    describe('Path 1: Success - Valid input', () => {
      it('nên tạo RegExp với default flags', () => {
        const result = createSafeRegex('test');
        expect(result).toBeInstanceOf(RegExp);
        expect(result.flags).toBe('i');
        expect(result.source).toBe('test');
      });

      it('nên tạo RegExp với custom flags', () => {
        const result = createSafeRegex('test', 'gi');
        expect(result).toBeInstanceOf(RegExp);
        expect(result.flags).toBe('gi');
      });

      it('nên escape special characters trong pattern', () => {
        const result = createSafeRegex('test.*pattern');
        expect(result.source).toBe('test\\.\\*pattern');
      });
    });

    describe('Path 2: Error - ZodError', () => {
      it('nên throw error cho input quá dài', () => {
        const longInput = 'a'.repeat(101);
        expect(() => createSafeRegex(longInput)).toThrow(
          'Regex validation failed',
        );
      });
    });

    describe('Path 3: Error - Other errors', () => {
      it('nên rethrow non-ZodError', () => {
        const originalParse = RegexSafeStringSchema.parse;
        RegexSafeStringSchema.parse = () => {
          throw new TypeError('Custom error');
        };

        expect(() => createSafeRegex('test')).toThrow('Custom error');

        // Restore
        RegexSafeStringSchema.parse = originalParse;
      });
    });
  });

  /**
   * ============================================
   * FUNCTION TESTS - sanitizeQueryObject
   * ============================================
   */
  describe('sanitizeQueryObject', () => {
    describe('Path 1: Non-object input', () => {
      it('nên return input nguyên vẹn cho null', () => {
        expect(sanitizeQueryObject(null as any)).toBeNull();
      });

      it('nên return input nguyên vẹn cho primitive values', () => {
        expect(sanitizeQueryObject('string' as any)).toBe('string');
        expect(sanitizeQueryObject(123 as any)).toBe(123);
      });
    });

    describe('Path 2: Object với keys bình thường', () => {
      it('nên giữ nguyên keys không có $', () => {
        const input = { name: 'John', age: 30 };
        const result = sanitizeQueryObject(input);
        expect(result).toEqual({ name: 'John', age: 30 });
      });
    });

    describe('Path 3: Object với $ operators', () => {
      it('nên loại bỏ $ từ key names', () => {
        const input = { $set: 'value', $where: 'condition' };
        const result = sanitizeQueryObject(input);
        expect(result).toEqual({ set: 'value', where: 'condition' });
      });
    });

    describe('Path 4: Nested objects', () => {
      it('nên recursively sanitize nested objects', () => {
        const input = {
          user: {
            $set: { name: 'John' },
            data: { $where: 'admin' },
          },
        };
        const result = sanitizeQueryObject(input);
        expect(result).toEqual({
          user: {
            set: { name: 'John' },
            data: { where: 'admin' },
          },
        });
      });
    });

    describe('Path 5: Arrays trong object', () => {
      it('nên giữ nguyên array values', () => {
        const input = { items: [1, 2, 3], tags: ['a', 'b'] };
        const result = sanitizeQueryObject(input);
        expect(result).toEqual({ items: [1, 2, 3], tags: ['a', 'b'] });
      });
    });

    describe('Path 6: Mixed nested structures', () => {
      it('nên xử lý complex nested structures', () => {
        const input = {
          $query: {
            name: 'test',
            nested: {
              $operator: 'value',
              array: [1, 2, 3],
            },
          },
          normalKey: 'normalValue',
        };
        const result = sanitizeQueryObject(input);
        expect(result).toEqual({
          query: {
            name: 'test',
            nested: {
              operator: 'value',
              array: [1, 2, 3],
            },
          },
          normalKey: 'normalValue',
        });
      });
    });
  });

  /**
   * ============================================
   * FUNCTION TESTS - sanitizeObjectId
   * ============================================
   */
  describe('sanitizeObjectId', () => {
    describe('Path 1: Valid ObjectId', () => {
      it('nên return ObjectId hợp lệ', () => {
        const result = sanitizeObjectId('507f1f77bcf86cd799439011');
        expect(result).toBe('507f1f77bcf86cd799439011');
      });
    });

    describe('Path 2: Invalid ObjectId - Throw error', () => {
      it('nên throw error cho ObjectId không hợp lệ', () => {
        expect(() => sanitizeObjectId('invalid')).toThrow();
      });

      it('nên throw error cho ObjectId sai length', () => {
        expect(() => sanitizeObjectId('507f1f77bcf86cd79943901')).toThrow();
      });
    });
  });

  /**
   * ============================================
   * FUNCTION TESTS - sanitizeObjectIdSafe
   * ============================================
   */
  describe('sanitizeObjectIdSafe', () => {
    describe('Path 1: Valid ObjectId - Success path', () => {
      it('nên return ObjectId hợp lệ', () => {
        const result = sanitizeObjectIdSafe('507f1f77bcf86cd799439011');
        expect(result).toBe('507f1f77bcf86cd799439011');
      });
    });

    describe('Path 2: Invalid ObjectId - Failure path', () => {
      it('nên return null cho ObjectId không hợp lệ', () => {
        const result = sanitizeObjectIdSafe('invalid');
        expect(result).toBeNull();
      });

      it('nên return null cho ObjectId sai length', () => {
        const result = sanitizeObjectIdSafe('507f1f77');
        expect(result).toBeNull();
      });
    });
  });

  /**
   * ============================================
   * FUNCTION TESTS - sanitizeEmail
   * ============================================
   */
  describe('sanitizeEmail', () => {
    describe('Path 1: Valid email', () => {
      it('nên return email hợp lệ lowercase', () => {
        const result = sanitizeEmail('TEST@EXAMPLE.COM');
        expect(result).toBe('test@example.com');
      });
    });

    describe('Path 2: Invalid email - Throw error', () => {
      it('nên throw error cho email không hợp lệ', () => {
        expect(() => sanitizeEmail('invalid')).toThrow();
      });
    });
  });

  /**
   * ============================================
   * FUNCTION TESTS - sanitizeEmailSafe
   * ============================================
   */
  describe('sanitizeEmailSafe', () => {
    describe('Path 1: Valid email - Success path', () => {
      it('nên return email hợp lệ', () => {
        const result = sanitizeEmailSafe('test@example.com');
        expect(result).toBe('test@example.com');
      });
    });

    describe('Path 2: Invalid email - Failure path', () => {
      it('nên return null cho email không hợp lệ', () => {
        const result = sanitizeEmailSafe('invalid');
        expect(result).toBeNull();
      });
    });
  });

  /**
   * ============================================
   * FUNCTION TESTS - sanitizePhoneNumber
   * ============================================
   */
  describe('sanitizePhoneNumber', () => {
    describe('Path 1: Valid phone', () => {
      it('nên return phone number hợp lệ', () => {
        const result = sanitizePhoneNumber('+84901234567');
        expect(result).toBe('+84901234567');
      });
    });

    describe('Path 2: Invalid phone - Throw error', () => {
      it('nên throw error cho phone không hợp lệ', () => {
        expect(() => sanitizePhoneNumber('invalid')).toThrow();
      });
    });
  });

  /**
   * ============================================
   * FUNCTION TESTS - sanitizePhoneNumberSafe
   * ============================================
   */
  describe('sanitizePhoneNumberSafe', () => {
    describe('Path 1: Valid phone - Success path', () => {
      it('nên return phone number hợp lệ', () => {
        const result = sanitizePhoneNumberSafe('+84901234567');
        expect(result).toBe('+84901234567');
      });
    });

    describe('Path 2: Invalid phone - Failure path', () => {
      it('nên return null cho phone không hợp lệ', () => {
        const result = sanitizePhoneNumberSafe('invalid');
        expect(result).toBeNull();
      });
    });
  });

  /**
   * ============================================
   * FUNCTION TESTS - sanitizeUsername
   * ============================================
   */
  describe('sanitizeUsername', () => {
    describe('Path 1: Valid username', () => {
      it('nên return username hợp lệ', () => {
        const result = sanitizeUsername('user_name-123');
        expect(result).toBe('user_name-123');
      });
    });

    describe('Path 2: Invalid username - Throw error', () => {
      it('nên throw error cho username không hợp lệ', () => {
        expect(() => sanitizeUsername('ab')).toThrow();
      });
    });
  });

  /**
   * ============================================
   * FUNCTION TESTS - sanitizeUsernameSafe
   * ============================================
   */
  describe('sanitizeUsernameSafe', () => {
    describe('Path 1: Valid username - Success path', () => {
      it('nên return username hợp lệ', () => {
        const result = sanitizeUsernameSafe('username');
        expect(result).toBe('username');
      });
    });

    describe('Path 2: Invalid username - Failure path', () => {
      it('nên return null cho username không hợp lệ', () => {
        const result = sanitizeUsernameSafe('ab');
        expect(result).toBeNull();
      });
    });
  });

  /**
   * ============================================
   * FUNCTION TESTS - sanitizeUrl
   * ============================================
   */
  describe('sanitizeUrl', () => {
    describe('Path 1: Valid URL', () => {
      it('nên return URL hợp lệ', () => {
        const result = sanitizeUrl('https://example.com');
        expect(result).toBe('https://example.com');
      });
    });

    describe('Path 2: Invalid URL - Throw error', () => {
      it('nên throw error cho URL không hợp lệ', () => {
        expect(() => sanitizeUrl('invalid')).toThrow();
      });
    });
  });

  /**
   * ============================================
   * FUNCTION TESTS - sanitizeUrlSafe
   * ============================================
   */
  describe('sanitizeUrlSafe', () => {
    describe('Path 1: Valid URL - Success path', () => {
      it('nên return URL hợp lệ', () => {
        const result = sanitizeUrlSafe('https://example.com');
        expect(result).toBe('https://example.com');
      });
    });

    describe('Path 2: Invalid URL - Failure path', () => {
      it('nên return null cho URL không hợp lệ', () => {
        const result = sanitizeUrlSafe('invalid');
        expect(result).toBeNull();
      });
    });
  });

  /**
   * ============================================
   * EDGE CASES & BOUNDARY TESTS
   * ============================================
   */
  describe('Edge Cases và Boundary Tests', () => {
    describe('MongoSafeString - Boundary', () => {
      it('nên xử lý string chỉ chứa special characters', () => {
        const result = MongoSafeStringSchema.parse('${}[]');
        expect(result).toBe('');
      });

      it('nên xử lý multiple consecutive special characters', () => {
        const result = MongoSafeStringSchema.parse('test$$$value');
        expect(result).toBe('testvalue');
      });
    });

    describe('RegexSafeString - Boundary', () => {
      it('nên xử lý string ở boundary 100 chars', () => {
        const input = 'a'.repeat(100);
        const result = RegexSafeStringSchema.parse(input);
        expect(result).toHaveLength(100);
      });
    });

    describe('Username - Boundary', () => {
      it('nên accept username ở min length 3', () => {
        const result = UsernameSchema.parse('abc');
        expect(result).toBe('abc');
      });

      it('nên accept username ở max length 30', () => {
        const username = 'a'.repeat(30);
        const result = UsernameSchema.parse(username);
        expect(result).toHaveLength(30);
      });
    });

    describe('Email - Boundary', () => {
      it('nên accept email ở boundary 255 chars', () => {
        const localPart = 'a'.repeat(240);
        const email = `${localPart}@example.com`;
        const result = EmailSchema.parse(email);
        expect(result).toBe(email.toLowerCase());
      });
    });

    describe('PhoneNumber - Boundary', () => {
      it('nên accept phone number ở min length', () => {
        const result = PhoneNumberSchema.parse('+123');
        expect(result).toBe('+123');
      });

      it('nên accept phone number ở max length', () => {
        const phone = '+1' + '2'.repeat(14);
        const result = PhoneNumberSchema.parse(phone);
        expect(result).toBe(phone);
      });
    });
  });

  /**
   * ============================================
   * INTEGRATION TESTS
   * ============================================
   */
  describe('Integration Tests - Multiple operations', () => {
    it('nên sanitize query object với multiple fields', () => {
      const input = {
        $where: sanitizeMongoInput('admin$role'),
        email: 'TEST@EXAMPLE.COM',
        phone: '+84 (90) 123-4567',
      };

      const sanitized = sanitizeQueryObject(input) as any;
      expect(sanitized).toHaveProperty('where');
      expect(sanitized.where).toBe('adminrole');
    });

    it('nên handle complex nested sanitization', () => {
      const input = {
        $query: {
          user: {
            $match: {
              email: 'test@example.com',
              $or: [{ status: 'active' }],
            },
          },
        },
      };

      const result = sanitizeQueryObject(input);
      expect(result).toEqual({
        query: {
          user: {
            match: {
              email: 'test@example.com',
              or: [{ status: 'active' }],
            },
          },
        },
      });
    });
  });
});
