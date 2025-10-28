import { StringUtils } from './string.utils';
import * as crypto from 'crypto';

// Mock crypto module
jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
  randomUUID: jest.fn(),
}));

describe('StringUtils', () => {
  describe('capitalize', () => {
    // Test case 1: Capitalize normal lowercase string
    it('should capitalize first letter and lowercase rest', () => {
      expect(StringUtils.capitalize('hello')).toBe('Hello');
    });

    // Test case 2: All uppercase string
    it('should capitalize all uppercase string', () => {
      expect(StringUtils.capitalize('HELLO')).toBe('Hello');
    });

    // Test case 3: Mixed case string
    it('should capitalize mixed case string', () => {
      expect(StringUtils.capitalize('hELLo')).toBe('Hello');
    });

    // Test case 4: Single character
    it('should capitalize single character', () => {
      expect(StringUtils.capitalize('a')).toBe('A');
      expect(StringUtils.capitalize('Z')).toBe('Z');
    });

    // Test case 5: Empty string
    it('should handle empty string', () => {
      expect(StringUtils.capitalize('')).toBe('');
    });

    // Test case 6: String with numbers
    it('should handle string starting with number', () => {
      expect(StringUtils.capitalize('123hello')).toBe('123hello');
    });

    // Test case 7: String with special characters
    it('should handle string starting with special character', () => {
      expect(StringUtils.capitalize('@hello')).toBe('@hello');
    });

    // Test case 8: Already capitalized string
    it('should handle already capitalized string', () => {
      expect(StringUtils.capitalize('Hello')).toBe('Hello');
    });

    // Test case 9: String with spaces
    it('should only capitalize first character, not after space', () => {
      expect(StringUtils.capitalize('hello world')).toBe('Hello world');
    });

    // Test case 10: Unicode characters
    it('should handle unicode characters', () => {
      expect(StringUtils.capitalize('ñoño')).toBe('Ñoño');
    });
  });

  describe('capitalizeWords', () => {
    // Test case 1: Multiple words lowercase
    it('should capitalize first letter of each word', () => {
      expect(StringUtils.capitalizeWords('hello world test')).toBe(
        'Hello World Test',
      );
    });

    // Test case 2: All uppercase words
    it('should capitalize all uppercase words', () => {
      expect(StringUtils.capitalizeWords('HELLO WORLD')).toBe('Hello World');
    });

    // Test case 3: Mixed case words
    it('should capitalize mixed case words', () => {
      expect(StringUtils.capitalizeWords('hELLo WoRLd')).toBe('Hello World');
    });

    // Test case 4: Single word
    it('should capitalize single word', () => {
      expect(StringUtils.capitalizeWords('hello')).toBe('Hello');
    });

    // Test case 5: Empty string
    it('should handle empty string', () => {
      expect(StringUtils.capitalizeWords('')).toBe('');
    });

    // Test case 6: Multiple spaces between words
    it('should handle multiple spaces between words', () => {
      expect(StringUtils.capitalizeWords('hello  world   test')).toBe(
        'Hello  World   Test',
      );
    });

    // Test case 7: Leading and trailing spaces
    it('should preserve leading and trailing spaces', () => {
      expect(StringUtils.capitalizeWords(' hello world ')).toBe(
        ' Hello World ',
      );
    });

    // Test case 8: Single character words
    it('should capitalize single character words', () => {
      expect(StringUtils.capitalizeWords('a b c')).toBe('A B C');
    });

    // Test case 9: Words with numbers
    it('should handle words with numbers', () => {
      expect(StringUtils.capitalizeWords('hello 123 world')).toBe(
        'Hello 123 World',
      );
    });

    // Test case 10: Words with special characters
    it('should handle words with special characters', () => {
      expect(StringUtils.capitalizeWords('hello-world test_case')).toBe(
        'Hello-world Test_case',
      );
    });
  });

  describe('slugify', () => {
    // Test case 1: Normal string with spaces
    it('should convert spaces to hyphens', () => {
      expect(StringUtils.slugify('Hello World')).toBe('hello-world');
    });

    // Test case 2: String with special characters (branch: replace /[^\w\s-]/g)
    it('should remove special characters', () => {
      expect(StringUtils.slugify('Hello @World! #Test')).toBe(
        'hello-world-test',
      );
    });

    // Test case 3: String with multiple spaces (branch: replace /[\s_-]+/g)
    it('should replace multiple spaces with single hyphen', () => {
      expect(StringUtils.slugify('Hello   World')).toBe('hello-world');
    });

    // Test case 4: String with underscores
    it('should replace underscores with hyphens', () => {
      expect(StringUtils.slugify('hello_world_test')).toBe('hello-world-test');
    });

    // Test case 5: String with hyphens
    it('should preserve single hyphens', () => {
      expect(StringUtils.slugify('hello-world')).toBe('hello-world');
    });

    // Test case 6: String with multiple hyphens
    it('should replace multiple hyphens with single hyphen', () => {
      expect(StringUtils.slugify('hello---world')).toBe('hello-world');
    });

    // Test case 7: Leading and trailing hyphens (branch: replace /^-+|-+$/g)
    it('should remove leading and trailing hyphens', () => {
      expect(StringUtils.slugify('-hello-world-')).toBe('hello-world');
    });

    // Test case 8: Leading and trailing spaces
    it('should handle leading and trailing spaces', () => {
      expect(StringUtils.slugify('  hello world  ')).toBe('hello-world');
    });

    // Test case 9: Empty string
    it('should handle empty string', () => {
      expect(StringUtils.slugify('')).toBe('');
    });

    // Test case 10: String with only special characters
    it('should handle string with only special characters', () => {
      expect(StringUtils.slugify('!@#$%^&*()')).toBe('');
    });

    // Test case 11: Mixed case
    it('should convert to lowercase', () => {
      expect(StringUtils.slugify('Hello WORLD Test')).toBe('hello-world-test');
    });

    // Test case 12: String with numbers
    it('should preserve numbers', () => {
      expect(StringUtils.slugify('Hello World 123')).toBe('hello-world-123');
    });

    // Test case 13: Complex scenario
    it('should handle complex slugification', () => {
      expect(StringUtils.slugify('  Hello___World---Test!!!  ')).toBe(
        'hello-world-test',
      );
    });

    // Test case 14: Unicode characters
    it('should handle unicode characters', () => {
      expect(StringUtils.slugify('Café résumé')).toBe('caf-rsum');
    });
  });

  describe('truncate', () => {
    // Test case 1: String longer than length (branch: str.length > length)
    it('should truncate string longer than length with default suffix', () => {
      expect(StringUtils.truncate('Hello World', 8)).toBe('Hello...');
    });

    // Test case 2: String exactly equal to length (branch: str.length <= length)
    it('should not truncate string equal to length', () => {
      expect(StringUtils.truncate('Hello', 5)).toBe('Hello');
    });

    // Test case 3: String shorter than length (branch: str.length <= length)
    it('should not truncate string shorter than length', () => {
      expect(StringUtils.truncate('Hello', 10)).toBe('Hello');
    });

    // Test case 4: Custom suffix
    it('should truncate with custom suffix', () => {
      expect(StringUtils.truncate('Hello World', 8, '…')).toBe('Hello W…');
    });

    // Test case 5: Empty suffix
    it('should truncate with empty suffix', () => {
      expect(StringUtils.truncate('Hello World', 5, '')).toBe('Hello');
    });

    // Test case 6: Long suffix
    it('should truncate with long suffix', () => {
      expect(StringUtils.truncate('Hello World', 10, ' [more]')).toBe(
        'Hel [more]',
      );
    });

    // Test case 7: Empty string
    it('should handle empty string', () => {
      expect(StringUtils.truncate('', 5)).toBe('');
    });

    // Test case 8: Length = 0
    it('should handle length of 0', () => {
      expect(StringUtils.truncate('Hello', 0, '...')).toBe('...');
    });

    // Test case 9: Length smaller than suffix
    it('should handle length smaller than suffix length', () => {
      expect(StringUtils.truncate('Hello World', 2, '...')).toBe('...');
    });

    // Test case 10: Very long string
    it('should truncate very long string', () => {
      const longString = 'a'.repeat(1000);
      expect(StringUtils.truncate(longString, 50)).toBe('a'.repeat(47) + '...');
    });

    // Test case 11: Default suffix parameter test
    it('should use default suffix when not provided', () => {
      expect(StringUtils.truncate('Hello World', 8)).toBe('Hello...');
    });

    // Test case 12: Negative length (edge case)
    it('should handle negative length', () => {
      expect(StringUtils.truncate('Hello', -5, '...')).toBe('...');
    });
  });

  describe('generateRandomString', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    // Test case 1: Generate random string with specific length
    it('should generate random string with correct length', () => {
      (crypto.randomBytes as jest.Mock).mockReturnValue(
        Buffer.from([0x01, 0x23, 0x45]),
      );

      const result = StringUtils.generateRandomString(3);

      expect(crypto.randomBytes).toHaveBeenCalledWith(3);
      expect(result).toBe('012345'); // 3 bytes = 6 hex chars
    });

    // Test case 2: Different length values
    it('should generate strings with different lengths', () => {
      (crypto.randomBytes as jest.Mock).mockReturnValue(
        Buffer.from([0xaa, 0xbb]),
      );

      const result = StringUtils.generateRandomString(2);

      expect(crypto.randomBytes).toHaveBeenCalledWith(2);
      expect(result).toBe('aabb');
    });

    // Test case 3: Length = 0
    it('should generate empty string for length 0', () => {
      (crypto.randomBytes as jest.Mock).mockReturnValue(Buffer.from([]));

      const result = StringUtils.generateRandomString(0);

      expect(result).toBe('');
    });

    // Test case 4: Length = 1
    it('should generate string for length 1', () => {
      (crypto.randomBytes as jest.Mock).mockReturnValue(Buffer.from([0xff]));

      const result = StringUtils.generateRandomString(1);

      expect(result).toBe('ff');
      expect(result.length).toBe(2); // 1 byte = 2 hex chars
    });

    // Test case 5: Large length
    it('should handle large length', () => {
      const largeBuffer = Buffer.alloc(100);
      (crypto.randomBytes as jest.Mock).mockReturnValue(largeBuffer);

      const result = StringUtils.generateRandomString(100);

      expect(crypto.randomBytes).toHaveBeenCalledWith(100);
      expect(result.length).toBe(200); // 100 bytes = 200 hex chars
    });

    // Test case 6: Verify hex output format
    it('should return hex string', () => {
      (crypto.randomBytes as jest.Mock).mockReturnValue(
        Buffer.from([0x0f, 0xab, 0xcd, 0xef]),
      );

      const result = StringUtils.generateRandomString(4);

      expect(result).toMatch(/^[0-9a-f]+$/);
      expect(result).toBe('0fabcdef');
    });

    // Test case 7: Multiple calls produce different results
    it('should produce different results on multiple calls', () => {
      (crypto.randomBytes as jest.Mock)
        .mockReturnValueOnce(Buffer.from([0x01, 0x02]))
        .mockReturnValueOnce(Buffer.from([0x03, 0x04]));

      const result1 = StringUtils.generateRandomString(2);
      const result2 = StringUtils.generateRandomString(2);

      expect(result1).toBe('0102');
      expect(result2).toBe('0304');
    });

    // Test case 8: Negative length (edge case)
    it('should handle negative length', () => {
      (crypto.randomBytes as jest.Mock).mockReturnValue(Buffer.from([]));

      const result = StringUtils.generateRandomString(-5);

      expect(result).toBe('');
    });
  });

  describe('generateUUID', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    // Test case 1: Generate UUID
    it('should generate valid UUID', () => {
      const mockUUID = '550e8400-e29b-41d4-a716-446655440000';
      (crypto.randomUUID as jest.Mock).mockReturnValue(mockUUID);

      const result = StringUtils.generateUUID();

      expect(crypto.randomUUID).toHaveBeenCalled();
      expect(result).toBe(mockUUID);
    });

    // Test case 2: UUID format validation
    it('should return string in UUID format', () => {
      const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
      (crypto.randomUUID as jest.Mock).mockReturnValue(mockUUID);

      const result = StringUtils.generateUUID();

      expect(result).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    // Test case 3: Multiple calls
    it('should generate different UUIDs on multiple calls', () => {
      (crypto.randomUUID as jest.Mock)
        .mockReturnValueOnce('uuid-1')
        .mockReturnValueOnce('uuid-2')
        .mockReturnValueOnce('uuid-3');

      const result1 = StringUtils.generateUUID();
      const result2 = StringUtils.generateUUID();
      const result3 = StringUtils.generateUUID();

      expect(result1).toBe('uuid-1');
      expect(result2).toBe('uuid-2');
      expect(result3).toBe('uuid-3');
      expect(crypto.randomUUID).toHaveBeenCalledTimes(3);
    });

    // Test case 4: Verify crypto.randomUUID is called
    it('should call crypto.randomUUID', () => {
      (crypto.randomUUID as jest.Mock).mockReturnValue('test-uuid');

      StringUtils.generateUUID();

      expect(crypto.randomUUID).toHaveBeenCalledWith();
    });
  });

  describe('maskEmail', () => {
    // Test case 1: Normal email
    it('should mask middle characters of username', () => {
      expect(StringUtils.maskEmail('john@example.com')).toBe(
        'j**n@example.com',
      );
    });

    // Test case 2: Short username (3 chars)
    it('should mask short username', () => {
      expect(StringUtils.maskEmail('abc@test.com')).toBe('a*c@test.com');
    });

    // Test case 3: Two character username
    it('should mask two character username', () => {
      expect(StringUtils.maskEmail('ab@test.com')).toBe('ab@test.com'); // No middle chars
    });

    // Test case 4: Long username
    it('should mask long username', () => {
      expect(StringUtils.maskEmail('verylongemail@example.com')).toBe(
        'v***********l@example.com',
      );
    });

    // Test case 5: Email with subdomain
    it('should preserve domain with subdomain', () => {
      expect(StringUtils.maskEmail('user@mail.example.com')).toBe(
        'u**r@mail.example.com',
      );
    });

    // Test case 6: Email with numbers
    it('should handle email with numbers', () => {
      expect(StringUtils.maskEmail('user123@test.com')).toBe(
        'u*****3@test.com',
      );
    });

    // Test case 7: Email with special characters in username
    it('should handle special characters in username', () => {
      expect(StringUtils.maskEmail('user.name@test.com')).toBe(
        'u*******e@test.com',
      );
    });

    // Test case 8: Single character username (username.length - 2 = -1, throw error)
    it('should throw error for single character username', () => {
      // repeat(-1) throws RangeError
      expect(() => StringUtils.maskEmail('a@test.com')).toThrow(RangeError);
    });

    // Test case 9: Three character username (minimum for masking)
    it('should mask three character username', () => {
      expect(StringUtils.maskEmail('abc@test.com')).toBe('a*c@test.com');
    });

    // Test case 10: Email with + sign
    it('should handle email with plus sign', () => {
      expect(StringUtils.maskEmail('user+tag@test.com')).toBe(
        'u******g@test.com',
      );
    });

    // Test case 11: Verify charAt and repeat usage
    it('should use charAt for first and last character', () => {
      const result = StringUtils.maskEmail('test@example.com');
      expect(result.startsWith('t')).toBe(true);
      expect(result.includes('**t@')).toBe(true);
    });
  });

  describe('maskPhoneNumber', () => {
    // Test case 1: Normal phone number (branch: length > 4)
    it('should mask middle digits of phone number', () => {
      // 10 digits: first 3 + 5 stars + last 2
      expect(StringUtils.maskPhoneNumber('1234567890')).toBe('123*****90');
    });

    // Test case 2: Phone number with exactly 5 characters (boundary)
    it('should mask phone number with 5 characters', () => {
      expect(StringUtils.maskPhoneNumber('12345')).toBe('12345'); // length <= 4 is false, so mask
    });

    // Test case 3: Phone number with 4 characters (branch: length <= 4)
    it('should not mask phone number with 4 or fewer characters', () => {
      expect(StringUtils.maskPhoneNumber('1234')).toBe('1234');
    });

    // Test case 4: Phone number with 3 characters
    it('should not mask phone number with 3 characters', () => {
      expect(StringUtils.maskPhoneNumber('123')).toBe('123');
    });

    // Test case 5: Long phone number
    it('should mask long phone number', () => {
      expect(StringUtils.maskPhoneNumber('12345678901234')).toBe(
        '123*********34',
      );
    });

    // Test case 6: Phone number with country code
    it('should mask phone number with country code', () => {
      expect(StringUtils.maskPhoneNumber('+84123456789')).toBe('+84*******89');
    });

    // Test case 7: Phone number with 6 characters
    it('should mask phone number with 6 characters', () => {
      expect(StringUtils.maskPhoneNumber('123456')).toBe('123*56');
    });

    // Test case 8: Empty string
    it('should return empty string for empty input', () => {
      expect(StringUtils.maskPhoneNumber('')).toBe('');
    });

    // Test case 9: Single character
    it('should return single character unchanged', () => {
      expect(StringUtils.maskPhoneNumber('1')).toBe('1');
    });

    // Test case 10: Two characters
    it('should return two characters unchanged', () => {
      expect(StringUtils.maskPhoneNumber('12')).toBe('12');
    });

    // Test case 11: Phone with spaces (treated as characters)
    it('should handle phone with spaces', () => {
      // '123 456 7890' has 12 chars: first 3 + 7 stars + last 2
      expect(StringUtils.maskPhoneNumber('123 456 7890')).toBe('123*******90');
    });

    // Test case 12: Phone with hyphens
    it('should handle phone with hyphens', () => {
      // '123-456-7890' has 12 chars: first 3 + 7 stars + last 2
      expect(StringUtils.maskPhoneNumber('123-456-7890')).toBe('123*******90');
    });

    // Test case 13: Verify substring usage
    it('should use substring correctly', () => {
      const result = StringUtils.maskPhoneNumber('1234567890');
      expect(result.startsWith('123')).toBe(true);
      expect(result.endsWith('90')).toBe(true);
    });

    // Test case 14: Verify asterisk count
    it('should have correct number of asterisks', () => {
      const phoneNumber = '1234567890';
      const result = StringUtils.maskPhoneNumber(phoneNumber);
      const asteriskCount = (result.match(/\*/g) || []).length;
      expect(asteriskCount).toBe(phoneNumber.length - 5); // total - 3(start) - 2(end)
    });

    // Test case 15: 11-digit phone number
    it('should mask 11-digit phone number', () => {
      expect(StringUtils.maskPhoneNumber('12345678901')).toBe('123******01');
    });

    // Test case 16: 7-digit phone number
    it('should mask 7-digit phone number', () => {
      expect(StringUtils.maskPhoneNumber('1234567')).toBe('123**67');
    });

    // Test case 17: Verify repeat() usage for asterisks
    it('should create asterisks using repeat', () => {
      const result = StringUtils.maskPhoneNumber('1234567890');
      expect(result).toContain('*');
      expect(result.includes('*****')).toBe(true);
    });
  });

  // Integration tests
  describe('Integration Tests', () => {
    it('should combine capitalize and slugify', () => {
      const text = 'hello world test';
      const capitalized = StringUtils.capitalizeWords(text);
      const slugified = StringUtils.slugify(capitalized);

      expect(capitalized).toBe('Hello World Test');
      expect(slugified).toBe('hello-world-test');
    });

    it('should truncate and capitalize', () => {
      const text = 'hello world this is a long text';
      const truncated = StringUtils.truncate(text, 20);
      const capitalized = StringUtils.capitalize(truncated);

      // truncate: substring(0, 20-3) + '...' = 'hello world this ' + '...'
      expect(truncated).toBe('hello world this ...');
      expect(capitalized).toBe('Hello world this ...');
    });

    it('should generate and mask data', () => {
      (crypto.randomUUID as jest.Mock).mockReturnValue(
        '550e8400-e29b-41d4-a716-446655440000',
      );

      const uuid = StringUtils.generateUUID();
      const email = 'user@example.com';
      const maskedEmail = StringUtils.maskEmail(email);

      expect(uuid).toBeDefined();
      expect(maskedEmail).toBe('u**r@example.com');
    });

    it('should process user data workflow', () => {
      const name = 'JOHN DOE';
      const email = 'john.doe@example.com';
      const phone = '+84123456789';

      const formattedName = StringUtils.capitalizeWords(name.toLowerCase());
      const maskedEmail = StringUtils.maskEmail(email);
      const maskedPhone = StringUtils.maskPhoneNumber(phone);

      // john.doe has 8 chars: first j + 6 stars + last e
      expect(formattedName).toBe('John Doe');
      expect(maskedEmail).toBe('j******e@example.com');
      expect(maskedPhone).toBe('+84*******89');
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    it('should handle null and undefined gracefully', () => {
      // TypeScript prevents these, but runtime might encounter them
      expect(() => StringUtils.capitalize(null as any)).toThrow();
      expect(() => StringUtils.slugify(undefined as any)).toThrow();
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(100000);
      const capitalized = StringUtils.capitalize(longString);
      expect(capitalized.charAt(0)).toBe('A');
      expect(capitalized.length).toBe(100000);
    });

    it('should handle strings with only spaces', () => {
      expect(StringUtils.slugify('     ')).toBe('');
      expect(StringUtils.capitalizeWords('     ')).toBe('     ');
    });

    it('should handle emoji in strings', () => {
      expect(StringUtils.capitalize('😀hello')).toBe('😀hello');
      expect(StringUtils.slugify('hello 😀 world')).toBe('hello-world');
    });

    it('should handle email without @ sign', () => {
      // Edge case - invalid email, split('@') returns ['invalidemail']
      // username = 'invalidemail' (12 chars), domain = undefined
      // masked: i + 10 stars + l
      expect(StringUtils.maskEmail('invalidemail')).toBe(
        'i**********l@undefined',
      );
    });

    it('should handle multiple @ signs in email', () => {
      // split('@') returns ['user', '', 'test', 'example.com']
      // username = 'user', domain = ''
      expect(StringUtils.maskEmail('user@@test@example.com')).toBe('u**r@');
    });

    it('should preserve unicode in capitalize', () => {
      expect(StringUtils.capitalize('école')).toBe('École');
    });
  });
});
