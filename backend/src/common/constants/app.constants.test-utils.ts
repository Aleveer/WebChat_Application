import { APP_CONSTANTS } from './app.constants';

/**
 * Test utilities for app constants
 */
export class ConstantsTestUtils {
  /**
   * Test if a regex pattern works correctly with given test cases
   */
  static testRegexPattern(
    regex: RegExp,
    validCases: string[],
    invalidCases: string[],
  ): { passed: boolean; errors: string[] } {
    const errors: string[] = [];

    // Test valid cases
    validCases.forEach((testCase) => {
      if (!regex.test(testCase)) {
        errors.push(`Valid case "${testCase}" failed regex test`);
      }
    });

    // Test invalid cases
    invalidCases.forEach((testCase) => {
      if (regex.test(testCase)) {
        errors.push(`Invalid case "${testCase}" passed regex test`);
      }
    });

    return {
      passed: errors.length === 0,
      errors,
    };
  }

  /**
   * Test if numeric constants are within expected ranges
   */
  static testNumericRange(
    value: number,
    min: number,
    max: number,
    fieldName: string,
  ): { passed: boolean; error?: string } {
    if (value < min) {
      return {
        passed: false,
        error: `${fieldName} (${value}) is below minimum (${min})`,
      };
    }
    if (value > max) {
      return {
        passed: false,
        error: `${fieldName} (${value}) is above maximum (${max})`,
      };
    }
    return { passed: true };
  }

  /**
   * Test if string constants are non-empty and have expected format
   */
  static testStringFormat(
    value: string,
    fieldName: string,
    expectedPattern?: RegExp,
  ): { passed: boolean; error?: string } {
    if (!value || value.length === 0) {
      return {
        passed: false,
        error: `${fieldName} is empty or undefined`,
      };
    }

    if (expectedPattern && !expectedPattern.test(value)) {
      return {
        passed: false,
        error: `${fieldName} (${value}) does not match expected pattern`,
      };
    }

    return { passed: true };
  }

  /**
   * Test if array constants have expected properties
   */
  static testArrayProperties(
    array: readonly any[],
    fieldName: string,
    minLength: number = 1,
    uniqueItems: boolean = true,
  ): { passed: boolean; error?: string } {
    if (!Array.isArray(array)) {
      return {
        passed: false,
        error: `${fieldName} is not an array`,
      };
    }

    if (array.length < minLength) {
      return {
        passed: false,
        error: `${fieldName} has length ${array.length}, expected at least ${minLength}`,
      };
    }

    if (uniqueItems) {
      const uniqueArray = [...new Set(array)];
      if (uniqueArray.length !== array.length) {
        return {
          passed: false,
          error: `${fieldName} contains duplicate items`,
        };
      }
    }

    return { passed: true };
  }

  /**
   * Comprehensive test for phone number regex
   */
  static testPhoneRegex(): { passed: boolean; errors: string[] } {
    const phoneRegex = APP_CONSTANTS.USERS.PHONE_REGEX;

    const validCases = [
      '+1234567890',
      '+84901234562',
      '+9876543210',
      '0123456789',
    ];

    const invalidCases = [
      '1234567890', // No +
      '+01234567890', // Starts with 0
      '+1234567890123456', // Too long (16 digits)
      '+12345678901234567', // Too long (17 digits)
      '+123456789012345', // Too long (15 digits)
      '+12345678901234', // Too long (14 digits)
      'abc', // Not numeric
      '+', // Just +
      '+123', // Too short
      '++1234567890', // Double +
      '+123-456-7890', // Contains dashes
      '+123 456 7890', // Contains spaces
    ];

    return this.testRegexPattern(phoneRegex, validCases, invalidCases);
  }

  /**
   * Comprehensive test for profile photo regex
   */
  static testProfilePhotoRegex(): { passed: boolean; errors: string[] } {
    const photoRegex = APP_CONSTANTS.USERS.PROFILE_PHOTO_REGEX;

    const validCases = [
      'https://example.com/image.jpg',
      'http://example.com/image.jpeg',
      'https://example.com/path/image.png',
      'https://example.com/image.gif',
      'https://example.com/image.webp',
      'https://example.com/image.JPG', // Case insensitive
      'https://subdomain.example.com/path/to/image.png',
      'https://example.com/image.jpg?param=value',
      'https://example.com/image.jpg#fragment',
    ];

    const invalidCases = [
      'https://example.com/image.txt',
      'https://example.com/image',
      'ftp://example.com/image.jpg',
      'example.com/image.jpg',
      'https://example.com/image.doc',
      'https://example.com/image.pdf',
      'https://example.com/image.mp4',
    ];

    return this.testRegexPattern(photoRegex, validCases, invalidCases);
  }

  /**
   * Comprehensive test for email regex
   */
  static testEmailRegex(): { passed: boolean; errors: string[] } {
    const emailRegex = APP_CONSTANTS.USERS.EMAIL_REGEX;

    const validCases = [
      'user@example.com',
      'test.email@domain.co.uk',
      'user+tag@example.org',
      'user123@test-domain.com',
      'firstname.lastname@company.com',
      'email@subdomain.example.com',
    ];

    const invalidCases = [
      'invalid-email',
      '@example.com',
      'user@',
      'user@.com',
      'user..name@example.com', // consecutive dots
      'user@example',
      'user name@example.com',
      'user@example .com',
      'user@@example.com',
      'user@example..com', // consecutive dots
      'user.name..test@example.com', // consecutive dots
      'user@example..domain.com', // consecutive dots
    ];

    return this.testRegexPattern(emailRegex, validCases, invalidCases);
  }

  /**
   * Comprehensive test for username regex
   */
  static testUsernameRegex(): { passed: boolean; errors: string[] } {
    const usernameRegex = APP_CONSTANTS.USERS.USERNAME_REGEX;

    const validCases = [
      'username',
      'user123',
      'user_name',
      'User123',
      'test_user_123',
      'a',
      'user123name',
      'USER_NAME',
    ];

    const invalidCases = [
      'user-name', // hyphens not allowed
      'user.name', // dots not allowed
      'user@name', // special chars not allowed
      'user name', // spaces not allowed
      '', // empty string
      'user name test', // spaces not allowed
      'user+name', // plus not allowed
      'user#name', // hash not allowed
      'user$name', // dollar not allowed
    ];

    return this.testRegexPattern(usernameRegex, validCases, invalidCases);
  }

  /**
   * Comprehensive test for full name regex
   */
  static testFullNameRegex(): { passed: boolean; errors: string[] } {
    const fullNameRegex = APP_CONSTANTS.USERS.FULL_NAME_REGEX;

    const validCases = [
      'John Doe',
      'Mary Jane Watson',
      'A',
      'John',
      'Mary Jane',
      'Jean Luc Picard',
      'O Connor',
    ];

    const invalidCases = [
      'Jean-Luc Picard', // hyphens not allowed
      "O'Connor", // apostrophes not allowed
      'José María', // accents not allowed
      'John123', // numbers not allowed
      'John@Doe', // special chars not allowed
      '', // empty string
      'John123Doe', // numbers not allowed
      'John_Doe', // underscores not allowed
      'John.Doe', // dots not allowed
    ];

    return this.testRegexPattern(fullNameRegex, validCases, invalidCases);
  }

  /**
   * Comprehensive test for password regex
   */
  static testPasswordRegex(): { passed: boolean; errors: string[] } {
    const passwordRegex = APP_CONSTANTS.USERS.PASSWORD_REGEX;

    const validCases = [
      'password123',
      'Password123!',
      'test@123',
      'MyPass#2024',
      'abc123!@#',
      'P@ssw0rd',
      'Test123$',
      'MyPass%123',
      'Password^123',
      'Test&123',
      'MyPass*123',
    ];

    const invalidCases = [
      'password with spaces', // spaces not allowed
      'password-with-dash', // hyphens not allowed
      'password.with.dots', // dots not allowed
      'password+plus', // plus not allowed
      '', // empty string
      'password with spaces test', // spaces not allowed
      'password(with)parentheses', // parentheses not allowed
      'password[with]brackets', // brackets not allowed
      'password{with}braces', // braces not allowed
    ];

    return this.testRegexPattern(passwordRegex, validCases, invalidCases);
  }

  /**
   * Test all constants for basic validity
   */
  static runComprehensiveTests(): {
    passed: boolean;
    results: Array<{ test: string; passed: boolean; error?: string }>;
  } {
    const results: Array<{ test: string; passed: boolean; error?: string }> =
      [];

    // Test phone regex
    const phoneTest = this.testPhoneRegex();
    results.push({
      test: 'Phone Regex Pattern',
      passed: phoneTest.passed,
      error: phoneTest.errors.join(', '),
    });

    // Test profile photo regex
    const photoTest = this.testProfilePhotoRegex();
    results.push({
      test: 'Profile Photo Regex Pattern',
      passed: photoTest.passed,
      error: photoTest.errors.join(', '),
    });

    // Test email regex
    const emailTest = this.testEmailRegex();
    results.push({
      test: 'Email Regex Pattern',
      passed: emailTest.passed,
      error: emailTest.errors.join(', '),
    });

    // Test username regex
    const usernameTest = this.testUsernameRegex();
    results.push({
      test: 'Username Regex Pattern',
      passed: usernameTest.passed,
      error: usernameTest.errors.join(', '),
    });

    // Test full name regex
    const fullNameTest = this.testFullNameRegex();
    results.push({
      test: 'Full Name Regex Pattern',
      passed: fullNameTest.passed,
      error: fullNameTest.errors.join(', '),
    });

    // Test password regex
    const passwordTest = this.testPasswordRegex();
    results.push({
      test: 'Password Regex Pattern',
      passed: passwordTest.passed,
      error: passwordTest.errors.join(', '),
    });

    // Test numeric ranges
    const numericTests = [
      {
        test: 'Database Default Limit',
        result: this.testNumericRange(
          APP_CONSTANTS.DATABASE.DEFAULT_LIMIT,
          1,
          1000,
          'DATABASE.DEFAULT_LIMIT',
        ),
      },
      {
        test: 'Database Max Limit',
        result: this.testNumericRange(
          APP_CONSTANTS.DATABASE.MAX_LIMIT,
          1,
          10000,
          'DATABASE.MAX_LIMIT',
        ),
      },
      {
        test: 'Message Max Text Length',
        result: this.testNumericRange(
          APP_CONSTANTS.MESSAGES.MAX_TEXT_LENGTH,
          1,
          10000,
          'MESSAGES.MAX_TEXT_LENGTH',
        ),
      },
      {
        test: 'File Upload Max Size',
        result: this.testNumericRange(
          APP_CONSTANTS.FILE_UPLOAD.MAX_SIZE,
          1024,
          100 * 1024 * 1024, // 100MB
          'FILE_UPLOAD.MAX_SIZE',
        ),
      },
    ];

    numericTests.forEach(({ test, result }) => {
      results.push({
        test,
        passed: result.passed,
        error: result.error,
      });
    });

    // Test string formats
    const stringTests = [
      {
        test: 'JWT Default Expires In',
        result: this.testStringFormat(
          APP_CONSTANTS.JWT.DEFAULT_EXPIRES_IN,
          'JWT.DEFAULT_EXPIRES_IN',
          /^\d+[dhms]$/,
        ),
      },
      {
        test: 'JWT Refresh Expires In',
        result: this.testStringFormat(
          APP_CONSTANTS.JWT.REFRESH_EXPIRES_IN,
          'JWT.REFRESH_EXPIRES_IN',
          /^\d+[dhms]$/,
        ),
      },
    ];

    stringTests.forEach(({ test, result }) => {
      results.push({
        test,
        passed: result.passed,
        error: result.error,
      });
    });

    // Test array properties
    const arrayTest = this.testArrayProperties(
      APP_CONSTANTS.FILE_UPLOAD.ALLOWED_IMAGE_TYPES,
      'FILE_UPLOAD.ALLOWED_IMAGE_TYPES',
      1,
      true,
    );
    results.push({
      test: 'File Upload Allowed Image Types',
      passed: arrayTest.passed,
      error: arrayTest.error,
    });

    const allPassed = results.every((result) => result.passed);

    return {
      passed: allPassed,
      results,
    };
  }
}
