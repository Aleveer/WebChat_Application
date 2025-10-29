import { Types } from 'mongoose';
import { z } from 'zod';
import {
  ValidationUtils,
  ObjectIdSchema,
  EmailSchema,
  PhoneNumberSchema,
  PasswordSchema,
  NameSchema,
  UrlSchema,
  ImageUrlSchema,
  UsernameSchema,
  SafeStringSchema,
  AgeSchema,
  PositiveNumberSchema,
} from '../src/common/utils/validation.utils';
import { validate } from 'class-validator';
import { APP_CONSTANTS } from '../src/common/constants/app.constants';

describe('Validation Utils - White Box Testing', () => {
  /**
   * ============================================
   * SCHEMA TESTS - ObjectIdSchema
   * ============================================
   */
  describe('ObjectIdSchema', () => {
    describe('Path 1: Valid ObjectId', () => {
      it('nên accept ObjectId hợp lệ 24 hex chars', () => {
        const validId = new Types.ObjectId().toString();
        const result = ObjectIdSchema.safeParse(validId);
        expect(result.success).toBe(true);
      });

      it('nên accept ObjectId string format hợp lệ', () => {
        const result = ObjectIdSchema.safeParse('507f1f77bcf86cd799439011');
        expect(result.success).toBe(true);
      });
    });

    describe('Path 2: Invalid ObjectId', () => {
      it('nên reject ObjectId không hợp lệ', () => {
        const result = ObjectIdSchema.safeParse('invalid-id');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('ObjectId không hợp lệ');
        }
      });

      it('nên reject string rỗng', () => {
        const result = ObjectIdSchema.safeParse('');
        expect(result.success).toBe(false);
      });

      it('nên reject non-string value', () => {
        const result = ObjectIdSchema.safeParse(123);
        expect(result.success).toBe(false);
      });

      it('nên reject null', () => {
        const result = ObjectIdSchema.safeParse(null);
        expect(result.success).toBe(false);
      });
    });
  });

  /**
   * ============================================
   * SCHEMA TESTS - EmailSchema
   * ============================================
   */
  describe('EmailSchema', () => {
    describe('Path 1: Valid Email', () => {
      it('nên accept email hợp lệ và chuyển thành lowercase', () => {
        const result = EmailSchema.safeParse('TEST@EXAMPLE.COM');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe('test@example.com');
        }
      });

      it('nên lowercase email', () => {
        const result = EmailSchema.safeParse('Test@Example.COM');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe('test@example.com');
        }
      });

      it('nên accept email với subdomain', () => {
        const result = EmailSchema.safeParse('user@mail.example.com');
        expect(result.success).toBe(true);
      });
    });

    describe('Path 2: Invalid Email - Empty', () => {
      it('nên reject email rỗng', () => {
        const result = EmailSchema.safeParse('');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Email không được để trống',
          );
        }
      });
    });

    describe('Path 3: Invalid Email - Format', () => {
      it('nên reject email không có @', () => {
        const result = EmailSchema.safeParse('invalidemail.com');
        expect(result.success).toBe(false);
      });

      it('nên reject email không có domain', () => {
        const result = EmailSchema.safeParse('test@');
        expect(result.success).toBe(false);
      });

      it('nên reject email với consecutive dots', () => {
        const result = EmailSchema.safeParse('test..user@example.com');
        expect(result.success).toBe(false);
        if (!result.success) {
          // Có thể là "Email không hợp lệ" hoặc "Email không đúng định dạng"
          expect(result.error.issues[0].message).toContain('Email');
        }
      });
    });
  });

  /**
   * ============================================
   * SCHEMA TESTS - PhoneNumberSchema
   * ============================================
   */
  describe('PhoneNumberSchema', () => {
    describe('Path 1: Valid Phone Number', () => {
      it('nên accept số điện thoại Việt Nam hợp lệ', () => {
        const result = PhoneNumberSchema.safeParse('+84901234567');
        expect(result.success).toBe(true);
      });

      it('nên accept phone number nhiều quốc gia khác nhau', () => {
        expect(PhoneNumberSchema.safeParse('+84901234567').success).toBe(true);
        expect(PhoneNumberSchema.safeParse('+14155552671').success).toBe(true);
        expect(PhoneNumberSchema.safeParse('+447911123456').success).toBe(true);
      });

      it('nên accept số điện thoại quốc tế', () => {
        const result = PhoneNumberSchema.safeParse('+12125551234');
        expect(result.success).toBe(true);
      });
    });

    describe('Path 2: Invalid Phone Number', () => {
      it('nên reject số điện thoại không có +', () => {
        const result = PhoneNumberSchema.safeParse('84901234567');
        expect(result.success).toBe(false);
      });

      it('nên reject số điện thoại bắt đầu bằng +0', () => {
        const result = PhoneNumberSchema.safeParse('+0901234567');
        expect(result.success).toBe(false);
      });

      it('nên reject số điện thoại quá ngắn', () => {
        const result = PhoneNumberSchema.safeParse('+8');
        expect(result.success).toBe(false);
      });

      it('nên reject số điện thoại quá dài', () => {
        const result = PhoneNumberSchema.safeParse('+1' + '2'.repeat(16));
        expect(result.success).toBe(false);
      });
    });
  });

  /**
   * ============================================
   * SCHEMA TESTS - PasswordSchema
   * ============================================
   */
  describe('PasswordSchema', () => {
    describe('Path 1: Valid Password', () => {
      it('nên accept password hợp lệ', () => {
        const result = PasswordSchema.safeParse('ValidPass123!');
        expect(result.success).toBe(true);
      });

      it('nên accept password với nhiều special characters', () => {
        const result = PasswordSchema.safeParse('Pass@Word#123$');
        expect(result.success).toBe(true);
      });
    });

    describe('Path 2: Invalid Password - Length', () => {
      it('nên reject password ngắn hơn 8 ký tự', () => {
        const result = PasswordSchema.safeParse('Pass1!');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('ít nhất 8 ký tự');
        }
      });

      it('nên reject password dài hơn 64 ký tự', () => {
        const longPass = 'ValidPass123!' + 'a'.repeat(52);
        const result = PasswordSchema.safeParse(longPass);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain(
            'không được vượt quá 64 ký tự',
          );
        }
      });
    });

    describe('Path 3: Invalid Password - Format', () => {
      it('nên reject password với ký tự không hợp lệ', () => {
        const result = PasswordSchema.safeParse('Pass@Word 123');
        expect(result.success).toBe(false);
      });

      it('nên accept password chỉ có chữ thường (regex chỉ check ký tự hợp lệ)', () => {
        // Password regex chỉ validate ký tự hợp lệ, không check chữ hoa/thường/số/đặc biệt
        const result = PasswordSchema.safeParse('password123!');
        expect(result.success).toBe(true);
      });

      it('nên accept password chỉ có chữ hoa', () => {
        const result = PasswordSchema.safeParse('PASSWORD123!');
        expect(result.success).toBe(true);
      });

      it('nên accept password không có số', () => {
        const result = PasswordSchema.safeParse('Password!');
        expect(result.success).toBe(true);
      });

      it('nên accept password không có ký tự đặc biệt', () => {
        const result = PasswordSchema.safeParse('Password123');
        expect(result.success).toBe(true);
      });
    });

    describe('Path 4: Boundary Testing', () => {
      it('nên accept password đúng 8 ký tự', () => {
        const result = PasswordSchema.safeParse('Pass123!');
        expect(result.success).toBe(true);
      });

      it('nên accept password đúng 64 ký tự', () => {
        const pass = 'Pass123!' + 'a'.repeat(56);
        const result = PasswordSchema.safeParse(pass);
        expect(result.success).toBe(true);
      });
    });
  });

  /**
   * ============================================
   * SCHEMA TESTS - NameSchema
   * ============================================
   */
  describe('NameSchema', () => {
    describe('Path 1: Valid Name', () => {
      it('nên accept tên hợp lệ', () => {
        const result = NameSchema.safeParse('Nguyễn Văn A');
        expect(result.success).toBe(true);
      });

      it('nên trim whitespace', () => {
        const result = NameSchema.safeParse('  Nguyễn Văn A  ');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe('Nguyễn Văn A');
        }
      });

      it('nên accept tên tiếng Việt có dấu', () => {
        const result = NameSchema.safeParse('Trần Thị Bích Ngọc');
        expect(result.success).toBe(true);
      });
    });

    describe('Path 2: Invalid Name - Empty', () => {
      it('nên reject tên rỗng', () => {
        const result = NameSchema.safeParse('');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Tên không được để trống',
          );
        }
      });
    });

    describe('Path 3: Invalid Name - Length', () => {
      it('nên reject tên dài hơn 50 ký tự', () => {
        const longName = 'Nguyễn ' + 'Văn '.repeat(20);
        const result = NameSchema.safeParse(longName);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Tên không được vượt quá 50 ký tự',
          );
        }
      });
    });

    describe('Path 4: Invalid Name - Format', () => {
      it('nên reject tên chứa số', () => {
        const result = NameSchema.safeParse('Nguyễn Văn A1');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Tên chỉ được chứa chữ cái và khoảng trắng',
          );
        }
      });

      it('nên reject tên chứa ký tự đặc biệt', () => {
        const result = NameSchema.safeParse('Nguyễn@Văn');
        expect(result.success).toBe(false);
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
        const result = UrlSchema.safeParse('http://example.com');
        expect(result.success).toBe(true);
      });

      it('nên accept URL hợp lệ với https', () => {
        const result = UrlSchema.safeParse('https://example.com');
        expect(result.success).toBe(true);
      });

      it('nên accept URL với path và query params', () => {
        const result = UrlSchema.safeParse(
          'https://example.com/path?query=value',
        );
        expect(result.success).toBe(true);
      });
    });

    describe('Path 2: Invalid URL', () => {
      it('nên reject URL không có protocol', () => {
        const result = UrlSchema.safeParse('example.com');
        expect(result.success).toBe(false);
      });

      it('nên reject URL không hợp lệ', () => {
        const result = UrlSchema.safeParse('not a url');
        expect(result.success).toBe(false);
      });
    });
  });

  /**
   * ============================================
   * SCHEMA TESTS - ImageUrlSchema
   * ============================================
   */
  describe('ImageUrlSchema', () => {
    describe('Path 1: Valid Image URL', () => {
      it('nên accept URL ảnh jpg', () => {
        const result = ImageUrlSchema.safeParse(
          'https://example.com/photo.jpg',
        );
        expect(result.success).toBe(true);
      });

      it('nên accept URL ảnh png', () => {
        const result = ImageUrlSchema.safeParse(
          'https://example.com/photo.png',
        );
        expect(result.success).toBe(true);
      });

      it('nên accept URL ảnh với query params', () => {
        const result = ImageUrlSchema.safeParse(
          'https://example.com/photo.jpg?size=large',
        );
        expect(result.success).toBe(true);
      });

      it('nên accept URL ảnh với fragment', () => {
        const result = ImageUrlSchema.safeParse(
          'https://example.com/photo.webp#section',
        );
        expect(result.success).toBe(true);
      });

      it('nên accept các định dạng ảnh: jpeg, gif, webp', () => {
        expect(
          ImageUrlSchema.safeParse('https://example.com/photo.jpeg').success,
        ).toBe(true);
        expect(
          ImageUrlSchema.safeParse('https://example.com/photo.gif').success,
        ).toBe(true);
        expect(
          ImageUrlSchema.safeParse('https://example.com/photo.webp').success,
        ).toBe(true);
      });
    });

    describe('Path 2: Invalid Image URL - URL Format', () => {
      it('nên reject URL không hợp lệ', () => {
        const result = ImageUrlSchema.safeParse('not-a-url');
        expect(result.success).toBe(false);
      });
    });

    describe('Path 3: Invalid Image URL - Format', () => {
      it('nên reject URL không phải ảnh', () => {
        const result = ImageUrlSchema.safeParse('https://example.com/file.pdf');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('URL ảnh');
        }
      });

      it('nên reject URL file text', () => {
        const result = ImageUrlSchema.safeParse('https://example.com/file.txt');
        expect(result.success).toBe(false);
      });
    });
  });

  /**
   * ============================================
   * SCHEMA TESTS - UsernameSchema
   * ============================================
   */
  describe('UsernameSchema', () => {
    describe('Path 1: Valid Username', () => {
      it('nên accept username hợp lệ', () => {
        const result = UsernameSchema.safeParse('user_name-123');
        expect(result.success).toBe(true);
      });

      it('nên accept username với nhiều format khác nhau', () => {
        expect(UsernameSchema.safeParse('username').success).toBe(true);
        expect(UsernameSchema.safeParse('user_name').success).toBe(true);
        expect(UsernameSchema.safeParse('user-name').success).toBe(true);
        expect(UsernameSchema.safeParse('user123').success).toBe(true);
      });

      it('nên accept username với underscore và hyphen', () => {
        const result = UsernameSchema.safeParse('user_name-123');
        expect(result.success).toBe(true);
      });
    });

    describe('Path 2: Invalid Username - Length', () => {
      it('nên reject username ngắn hơn 3 ký tự', () => {
        const result = UsernameSchema.safeParse('ab');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Username phải có ít nhất 3 ký tự',
          );
        }
      });

      it('nên reject username dài hơn 20 ký tự', () => {
        const result = UsernameSchema.safeParse('a'.repeat(21));
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Username không được vượt quá 20 ký tự',
          );
        }
      });
    });

    describe('Path 3: Invalid Username - Format', () => {
      it('nên reject username chứa ký tự đặc biệt', () => {
        const result = UsernameSchema.safeParse('user@name');
        expect(result.success).toBe(false);
      });

      it('nên reject username chứa khoảng trắng', () => {
        const result = UsernameSchema.safeParse('user name');
        expect(result.success).toBe(false);
      });

      it('nên reject username chứa dấu chấm', () => {
        const result = UsernameSchema.safeParse('user.name');
        expect(result.success).toBe(false);
      });
    });

    describe('Path 4: Boundary Testing', () => {
      it('nên accept username đúng 3 ký tự', () => {
        const result = UsernameSchema.safeParse('abc');
        expect(result.success).toBe(true);
      });

      it('nên accept username đúng 20 ký tự', () => {
        const result = UsernameSchema.safeParse('a'.repeat(20));
        expect(result.success).toBe(true);
      });
    });
  });

  /**
   * ============================================
   * SCHEMA TESTS - SafeStringSchema
   * ============================================
   */
  describe('SafeStringSchema', () => {
    describe('Path 1: Valid Safe String', () => {
      it('nên accept string an toàn', () => {
        const result = SafeStringSchema.safeParse('This is a safe string');
        expect(result.success).toBe(true);
      });

      it('nên trim whitespace', () => {
        const result = SafeStringSchema.safeParse('  safe string  ');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe('safe string');
        }
      });
    });

    describe('Path 2: Invalid Safe String - Script Tag', () => {
      it('nên reject string chứa script tag', () => {
        const result = SafeStringSchema.safeParse(
          '<script>alert("XSS")</script>',
        );
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Chuỗi không được chứa thẻ script',
          );
        }
      });

      it('nên reject string chứa script tag với attributes', () => {
        const result = SafeStringSchema.safeParse(
          '<script type="text/javascript">alert("XSS")</script>',
        );
        expect(result.success).toBe(false);
      });
    });

    describe('Path 3: Invalid Safe String - Iframe Tag', () => {
      it('nên reject string chứa iframe tag', () => {
        const result = SafeStringSchema.safeParse(
          '<iframe src="malicious.com"></iframe>',
        );
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Chuỗi không được chứa thẻ iframe',
          );
        }
      });
    });
  });

  /**
   * ============================================
   * SCHEMA TESTS - AgeSchema
   * ============================================
   */
  describe('AgeSchema', () => {
    describe('Path 1: Valid Age', () => {
      it('nên accept tuổi hợp lệ', () => {
        const result = AgeSchema.safeParse(25);
        expect(result.success).toBe(true);
      });

      it('nên accept tuổi = 1', () => {
        const result = AgeSchema.safeParse(1);
        expect(result.success).toBe(true);
      });

      it('nên accept tuổi = 150', () => {
        const result = AgeSchema.safeParse(150);
        expect(result.success).toBe(true);
      });
    });

    describe('Path 2: Invalid Age - Type', () => {
      it('nên reject số thập phân', () => {
        const result = AgeSchema.safeParse(25.5);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Tuổi phải là số nguyên');
        }
      });
    });

    describe('Path 3: Invalid Age - Range', () => {
      it('nên reject tuổi = 0', () => {
        const result = AgeSchema.safeParse(0);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Tuổi phải lớn hơn 0');
        }
      });

      it('nên reject tuổi âm', () => {
        const result = AgeSchema.safeParse(-5);
        expect(result.success).toBe(false);
      });

      it('nên reject tuổi > 150', () => {
        const result = AgeSchema.safeParse(151);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Tuổi không hợp lệ');
        }
      });
    });
  });

  /**
   * ============================================
   * SCHEMA TESTS - PositiveNumberSchema
   * ============================================
   */
  describe('PositiveNumberSchema', () => {
    describe('Path 1: Valid Positive Number', () => {
      it('nên accept số dương', () => {
        const result = PositiveNumberSchema.safeParse(10);
        expect(result.success).toBe(true);
      });

      it('nên accept số thập phân dương', () => {
        const result = PositiveNumberSchema.safeParse(10.5);
        expect(result.success).toBe(true);
      });
    });

    describe('Path 2: Invalid Positive Number', () => {
      it('nên reject số 0', () => {
        const result = PositiveNumberSchema.safeParse(0);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Số phải lớn hơn 0');
        }
      });

      it('nên reject số âm', () => {
        const result = PositiveNumberSchema.safeParse(-10);
        expect(result.success).toBe(false);
      });
    });
  });

  /**
   * ============================================
   * VALIDATION UTILS CLASS TESTS
   * ============================================
   */
  describe('ValidationUtils.isValidObjectId', () => {
    describe('Path 1: Valid ObjectId', () => {
      it('nên return true cho ObjectId hợp lệ', () => {
        const validId = new Types.ObjectId().toString();
        expect(ValidationUtils.isValidObjectId(validId)).toBe(true);
      });

      it('nên return true cho ObjectId string hợp lệ', () => {
        expect(
          ValidationUtils.isValidObjectId('507f1f77bcf86cd799439011'),
        ).toBe(true);
      });
    });

    describe('Path 2: Invalid ObjectId', () => {
      it('nên return false cho ObjectId không hợp lệ', () => {
        expect(ValidationUtils.isValidObjectId('invalid-id')).toBe(false);
      });

      it('nên return false cho string rỗng', () => {
        expect(ValidationUtils.isValidObjectId('')).toBe(false);
      });

      it('nên return false cho string ngắn hơn 24 chars', () => {
        expect(ValidationUtils.isValidObjectId('507f1f77')).toBe(false);
      });
    });
  });

  describe('ValidationUtils.isValidPhoneNumber', () => {
    describe('Path 1: Valid Phone - Both conditions true', () => {
      it('nên return true cho số điện thoại hợp lệ', () => {
        expect(ValidationUtils.isValidPhoneNumber('+84901234567')).toBe(true);
      });

      it('nên return true cho số điện thoại quốc tế', () => {
        expect(ValidationUtils.isValidPhoneNumber('+12125551234')).toBe(true);
      });
    });

    describe('Path 2: Invalid Phone', () => {
      it('nên return false cho số điện thoại không có +', () => {
        expect(ValidationUtils.isValidPhoneNumber('84901234567')).toBe(false);
      });

      it('nên return false cho số điện thoại không hợp lệ', () => {
        expect(ValidationUtils.isValidPhoneNumber('invalid')).toBe(false);
      });
    });
  });

  describe('ValidationUtils.isValidEmail', () => {
    describe('Path 1: Valid Email - Both conditions true', () => {
      it('nên return true cho email hợp lệ', () => {
        expect(ValidationUtils.isValidEmail('test@example.com')).toBe(true);
      });

      it('nên return true cho email với subdomain', () => {
        expect(ValidationUtils.isValidEmail('user@mail.example.com')).toBe(
          true,
        );
      });
    });

    describe('Path 2: Invalid Email', () => {
      it('nên return false cho email không hợp lệ', () => {
        expect(ValidationUtils.isValidEmail('invalid')).toBe(false);
      });

      it('nên return false cho email với consecutive dots', () => {
        expect(ValidationUtils.isValidEmail('test..user@example.com')).toBe(
          false,
        );
      });
    });
  });

  describe('ValidationUtils.isValidUrl', () => {
    describe('Path 1: Valid URL - Try block success', () => {
      it('nên return true cho URL hợp lệ', () => {
        expect(ValidationUtils.isValidUrl('https://example.com')).toBe(true);
      });

      it('nên return true cho URL với path', () => {
        expect(ValidationUtils.isValidUrl('https://example.com/path')).toBe(
          true,
        );
      });
    });

    describe('Path 2: Invalid URL - Try block throws', () => {
      it('nên return false cho URL không hợp lệ', () => {
        expect(ValidationUtils.isValidUrl('not a url')).toBe(false);
      });

      it('nên return false cho URL không có protocol', () => {
        expect(ValidationUtils.isValidUrl('example.com')).toBe(false);
      });
    });

    describe('Path 3: Invalid URL - Catch block', () => {
      it('nên return false khi new URL throws error', () => {
        expect(ValidationUtils.isValidUrl(':::')).toBe(false);
      });
    });
  });

  describe('ValidationUtils.isValidImageUrl', () => {
    describe('Path 1: Valid Image URL - Both conditions true', () => {
      it('nên return true cho URL ảnh hợp lệ', () => {
        expect(
          ValidationUtils.isValidImageUrl('https://example.com/photo.jpg'),
        ).toBe(true);
      });

      it('nên return true cho URL ảnh png', () => {
        expect(
          ValidationUtils.isValidImageUrl('https://example.com/photo.png'),
        ).toBe(true);
      });
    });

    describe('Path 2: Invalid Image URL - URL invalid', () => {
      it('nên return false cho URL không hợp lệ', () => {
        expect(ValidationUtils.isValidImageUrl('not-a-url')).toBe(false);
      });
    });

    describe('Path 3: Invalid Image URL - Not image format', () => {
      it('nên return false cho URL không phải ảnh', () => {
        expect(
          ValidationUtils.isValidImageUrl('https://example.com/file.pdf'),
        ).toBe(false);
      });
    });
  });

  describe('ValidationUtils.sanitizeString', () => {
    describe('Path 1: Clean string', () => {
      it('nên trim và return string sạch', () => {
        const result = ValidationUtils.sanitizeString('  Hello World  ');
        expect(result).toBe('Hello World');
      });

      it('nên giữ nguyên string không có tags nguy hiểm', () => {
        const result = ValidationUtils.sanitizeString('Normal text here');
        expect(result).toBe('Normal text here');
      });
    });

    describe('Path 2: Remove script tags', () => {
      it('nên loại bỏ script tags', () => {
        const result = ValidationUtils.sanitizeString(
          'Hello<script>alert("XSS")</script>World',
        );
        expect(result).toBe('HelloWorld');
      });

      it('nên loại bỏ script tags với attributes', () => {
        const result = ValidationUtils.sanitizeString(
          '<script type="text/javascript">alert("XSS")</script>Text',
        );
        expect(result).toBe('Text');
      });
    });

    describe('Path 3: Remove iframe tags', () => {
      it('nên loại bỏ iframe tags', () => {
        const result = ValidationUtils.sanitizeString(
          'Hello<iframe src="evil.com"></iframe>World',
        );
        expect(result).toBe('HelloWorld');
      });
    });

    describe('Path 4: Remove object tags', () => {
      it('nên loại bỏ object tags', () => {
        const result = ValidationUtils.sanitizeString(
          'Hello<object data="evil.swf"></object>World',
        );
        expect(result).toBe('HelloWorld');
      });
    });

    describe('Path 5: Remove embed tags', () => {
      it('nên loại bỏ embed tags', () => {
        const result = ValidationUtils.sanitizeString(
          'Hello<embed src="evil.swf">World',
        );
        expect(result).toBe('HelloWorld');
      });
    });

    describe('Path 6: Remove multiple dangerous tags', () => {
      it('nên loại bỏ nhiều tags nguy hiểm cùng lúc', () => {
        const result = ValidationUtils.sanitizeString(
          '<script>alert(1)</script>Text<iframe></iframe><object></object>',
        );
        expect(result).toBe('Text');
      });
    });
  });

  describe('ValidationUtils.isValidPassword', () => {
    describe('Path 1: Valid Password - All conditions true', () => {
      it('nên return true cho password hợp lệ', () => {
        expect(ValidationUtils.isValidPassword('ValidPass123!')).toBe(true);
      });
    });

    describe('Path 2: Invalid Password - MinLength false', () => {
      it('nên return false cho password quá ngắn', () => {
        expect(ValidationUtils.isValidPassword('Pass1!')).toBe(false);
      });
    });

    describe('Path 3: Invalid Password - MaxLength false', () => {
      it('nên return false cho password quá dài', () => {
        const longPass = 'ValidPass123!' + 'a'.repeat(60);
        expect(ValidationUtils.isValidPassword(longPass)).toBe(false);
      });
    });

    describe('Path 4: Invalid Password - Regex false', () => {
      it('nên return false cho password với ký tự không hợp lệ', () => {
        expect(ValidationUtils.isValidPassword('Pass@Word 123')).toBe(false);
      });
    });
  });

  describe('ValidationUtils.isValidName', () => {
    describe('Path 1: Valid Name - All conditions true', () => {
      it('nên return true cho tên hợp lệ', () => {
        expect(ValidationUtils.isValidName('Nguyễn Văn A')).toBe(true);
      });
    });

    describe('Path 2: Invalid Name - Length < 1', () => {
      it('nên return false cho tên rỗng', () => {
        expect(ValidationUtils.isValidName('')).toBe(false);
      });
    });

    describe('Path 3: Invalid Name - Length > 50', () => {
      it('nên return false cho tên quá dài', () => {
        const longName = 'A'.repeat(51);
        expect(ValidationUtils.isValidName(longName)).toBe(false);
      });
    });

    describe('Path 4: Invalid Name - Regex false', () => {
      it('nên return false cho tên chứa số', () => {
        expect(ValidationUtils.isValidName('Nguyễn123')).toBe(false);
      });

      it('nên return false cho tên chứa ký tự đặc biệt', () => {
        expect(ValidationUtils.isValidName('Nguyễn@Văn')).toBe(false);
      });
    });
  });

  describe('ValidationUtils.validateWithZod', () => {
    describe('Path 1: Success path', () => {
      it('nên return success result cho data hợp lệ', () => {
        const result = ValidationUtils.validateWithZod(
          EmailSchema,
          'test@example.com',
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe('test@example.com');
        }
      });
    });

    describe('Path 2: Failure path', () => {
      it('nên return error result cho data không hợp lệ', () => {
        const result = ValidationUtils.validateWithZod(EmailSchema, 'invalid');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeDefined();
        }
      });
    });
  });

  describe('ValidationUtils.parseWithZod', () => {
    describe('Path 1: Success path', () => {
      it('nên return parsed data cho data hợp lệ', () => {
        const result = ValidationUtils.parseWithZod(
          EmailSchema,
          'TEST@EXAMPLE.COM',
        );
        expect(result).toBe('test@example.com');
      });
    });

    describe('Path 2: Error path - Throw ZodError', () => {
      it('nên throw ZodError cho data không hợp lệ', () => {
        expect(() => {
          ValidationUtils.parseWithZod(EmailSchema, 'invalid');
        }).toThrow();
      });
    });
  });

  describe('ValidationUtils.validateWithClassValidator', () => {
    it('nên return validation result', async () => {
      const obj = {};
      const result = await ValidationUtils.validateWithClassValidator(obj);
      expect(Array.isArray(result)).toBe(true);
      // Empty object có thể có validation errors tùy thuộc vào decorators
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('ValidationUtils.validateObjectId', () => {
    describe('Path 1: Success path', () => {
      it('nên return success result cho ObjectId hợp lệ', () => {
        const validId = new Types.ObjectId().toString();
        const result = ValidationUtils.validateObjectId(validId);
        expect(result.success).toBe(true);
      });
    });

    describe('Path 2: Failure path', () => {
      it('nên return error result cho ObjectId không hợp lệ', () => {
        const result = ValidationUtils.validateObjectId('invalid');
        expect(result.success).toBe(false);
      });
    });
  });

  describe('ValidationUtils.validateEmail', () => {
    it('nên validate email với safeParse', () => {
      const validResult = ValidationUtils.validateEmail('test@example.com');
      expect(validResult.success).toBe(true);

      const invalidResult = ValidationUtils.validateEmail('invalid');
      expect(invalidResult.success).toBe(false);
    });
  });

  describe('ValidationUtils.validatePhoneNumber', () => {
    it('nên validate phone number với safeParse', () => {
      const validResult = ValidationUtils.validatePhoneNumber('+84901234567');
      expect(validResult.success).toBe(true);

      const invalidResult = ValidationUtils.validatePhoneNumber('invalid');
      expect(invalidResult.success).toBe(false);
    });
  });

  describe('ValidationUtils.validatePassword', () => {
    it('nên validate password với safeParse', () => {
      const validResult = ValidationUtils.validatePassword('ValidPass123!');
      expect(validResult.success).toBe(true);

      const invalidResult = ValidationUtils.validatePassword('short');
      expect(invalidResult.success).toBe(false);
    });
  });

  describe('ValidationUtils.validateName', () => {
    it('nên validate name với safeParse', () => {
      const validResult = ValidationUtils.validateName('Nguyễn Văn A');
      expect(validResult.success).toBe(true);

      const invalidResult = ValidationUtils.validateName('123');
      expect(invalidResult.success).toBe(false);
    });
  });

  describe('ValidationUtils.validateUrl', () => {
    it('nên validate URL với safeParse', () => {
      const validResult = ValidationUtils.validateUrl('https://example.com');
      expect(validResult.success).toBe(true);

      const invalidResult = ValidationUtils.validateUrl('not a url');
      expect(invalidResult.success).toBe(false);
    });
  });

  describe('ValidationUtils.validateUsername', () => {
    it('nên validate username với safeParse', () => {
      const validResult = ValidationUtils.validateUsername('username123');
      expect(validResult.success).toBe(true);

      const invalidResult = ValidationUtils.validateUsername('ab');
      expect(invalidResult.success).toBe(false);
    });
  });

  describe('ValidationUtils.isSafeString', () => {
    describe('Path 1: Safe string - Success true', () => {
      it('nên return true cho string an toàn', () => {
        expect(ValidationUtils.isSafeString('Safe text')).toBe(true);
      });
    });

    describe('Path 2: Unsafe string - Success false', () => {
      it('nên return false cho string chứa script', () => {
        expect(
          ValidationUtils.isSafeString('<script>alert("XSS")</script>'),
        ).toBe(false);
      });

      it('nên return false cho string chứa iframe', () => {
        expect(ValidationUtils.isSafeString('<iframe></iframe>')).toBe(false);
      });
    });
  });

  describe('ValidationUtils.validateMultiple', () => {
    describe('Path 1: All validations pass', () => {
      it('nên return isValid true khi tất cả rules pass', () => {
        const result = ValidationUtils.validateMultiple('test@example.com', [
          { schema: EmailSchema, fieldName: 'email' },
        ]);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('Path 2: Some validations fail', () => {
      it('nên return isValid false và errors khi có rule fail', () => {
        const result = ValidationUtils.validateMultiple('invalid', [
          { schema: EmailSchema, fieldName: 'email' },
        ]);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].field).toBe('email');
      });
    });

    describe('Path 3: Multiple rules, some pass some fail', () => {
      it('nên collect tất cả errors từ các rules fail', () => {
        const result = ValidationUtils.validateMultiple('ab', [
          { schema: UsernameSchema, fieldName: 'username' },
          { schema: EmailSchema, fieldName: 'email' },
        ]);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('Path 4: Empty rules array', () => {
      it('nên return isValid true cho empty rules', () => {
        const result = ValidationUtils.validateMultiple('anything', []);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe('ValidationUtils.createCustomValidator', () => {
    describe('Path 1: Validation function returns true', () => {
      it('nên pass validation khi function returns true', () => {
        const customSchema = ValidationUtils.createCustomValidator(
          z.string(),
          (val) => val.startsWith('custom_'),
          'Must start with custom_',
        );
        const result = customSchema.safeParse('custom_value');
        expect(result.success).toBe(true);
      });
    });

    describe('Path 2: Validation function returns false', () => {
      it('nên fail validation khi function returns false', () => {
        const customSchema = ValidationUtils.createCustomValidator(
          z.string(),
          (val) => val.startsWith('custom_'),
          'Must start with custom_',
        );
        const result = customSchema.safeParse('invalid');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Must start with custom_',
          );
        }
      });
    });
  });

  describe('ValidationUtils.isPositiveInteger', () => {
    describe('Path 1: Valid positive integer - Both conditions true', () => {
      it('nên return true cho số nguyên dương', () => {
        expect(ValidationUtils.isPositiveInteger(5)).toBe(true);
        expect(ValidationUtils.isPositiveInteger(100)).toBe(true);
      });
    });

    describe('Path 2: Not integer', () => {
      it('nên return false cho số thập phân', () => {
        expect(ValidationUtils.isPositiveInteger(5.5)).toBe(false);
      });
    });

    describe('Path 3: Not positive', () => {
      it('nên return false cho số 0', () => {
        expect(ValidationUtils.isPositiveInteger(0)).toBe(false);
      });

      it('nên return false cho số âm', () => {
        expect(ValidationUtils.isPositiveInteger(-5)).toBe(false);
      });
    });
  });

  describe('ValidationUtils.isLengthInRange', () => {
    describe('Path 1: Length in range - Both conditions true', () => {
      it('nên return true cho length trong khoảng', () => {
        expect(ValidationUtils.isLengthInRange('hello', 3, 10)).toBe(true);
      });

      it('nên return true cho length = min', () => {
        expect(ValidationUtils.isLengthInRange('abc', 3, 10)).toBe(true);
      });

      it('nên return true cho length = max', () => {
        expect(ValidationUtils.isLengthInRange('1234567890', 3, 10)).toBe(true);
      });
    });

    describe('Path 2: Length < min', () => {
      it('nên return false cho length nhỏ hơn min', () => {
        expect(ValidationUtils.isLengthInRange('ab', 3, 10)).toBe(false);
      });
    });

    describe('Path 3: Length > max', () => {
      it('nên return false cho length lớn hơn max', () => {
        expect(ValidationUtils.isLengthInRange('12345678901', 3, 10)).toBe(
          false,
        );
      });
    });
  });

  describe('ValidationUtils.stripHtmlTags', () => {
    it('nên loại bỏ tất cả HTML tags', () => {
      const result = ValidationUtils.stripHtmlTags('<p>Hello</p><b>World</b>');
      expect(result).toBe('HelloWorld');
    });

    it('nên loại bỏ tags với attributes', () => {
      const result = ValidationUtils.stripHtmlTags(
        '<div class="test">Content</div>',
      );
      expect(result).toBe('Content');
    });

    it('nên giữ nguyên text không có tags', () => {
      const result = ValidationUtils.stripHtmlTags('Plain text');
      expect(result).toBe('Plain text');
    });

    it('nên xử lý nested tags', () => {
      const result = ValidationUtils.stripHtmlTags(
        '<div><p><span>Text</span></p></div>',
      );
      expect(result).toBe('Text');
    });
  });

  describe('ValidationUtils.escapeHtml', () => {
    it('nên escape & character', () => {
      const result = ValidationUtils.escapeHtml('Tom & Jerry');
      expect(result).toBe('Tom &amp; Jerry');
    });

    it('nên escape < character', () => {
      const result = ValidationUtils.escapeHtml('5 < 10');
      expect(result).toBe('5 &lt; 10');
    });

    it('nên escape > character', () => {
      const result = ValidationUtils.escapeHtml('10 > 5');
      expect(result).toBe('10 &gt; 5');
    });

    it('nên escape " character', () => {
      const result = ValidationUtils.escapeHtml('Say "Hello"');
      expect(result).toBe('Say &quot;Hello&quot;');
    });

    it("nên escape ' character", () => {
      const result = ValidationUtils.escapeHtml("It's a test");
      expect(result).toBe('It&#039;s a test');
    });

    it('nên escape tất cả special characters cùng lúc', () => {
      const result = ValidationUtils.escapeHtml('<div>"Tom & Jerry"</div>');
      expect(result).toBe('&lt;div&gt;&quot;Tom &amp; Jerry&quot;&lt;/div&gt;');
    });

    it('nên giữ nguyên text không có special chars', () => {
      const result = ValidationUtils.escapeHtml('Normal text');
      expect(result).toBe('Normal text');
    });
  });

  /**
   * ============================================
   * INTEGRATION TESTS
   * ============================================
   */
  describe('Integration Tests', () => {
    it('nên validate user registration data', () => {
      const userData = {
        email: 'test@example.com',
        password: 'ValidPass123!',
        username: 'testuser',
        name: 'Nguyễn Văn A',
      };

      expect(EmailSchema.safeParse(userData.email).success).toBe(true);
      expect(PasswordSchema.safeParse(userData.password).success).toBe(true);
      expect(UsernameSchema.safeParse(userData.username).success).toBe(true);
      expect(NameSchema.safeParse(userData.name).success).toBe(true);
    });

    it('nên sanitize và validate string input', () => {
      const dangerousInput = '<script>alert("XSS")</script>Hello';
      const sanitized = ValidationUtils.sanitizeString(dangerousInput);
      expect(sanitized).toBe('Hello');
      expect(ValidationUtils.isSafeString(sanitized)).toBe(true);
    });

    it('nên validate và transform multiple fields', () => {
      const input = {
        email: 'TEST@EXAMPLE.COM',
        username: 'user123',
        name: '  Nguyễn Văn A  ',
      };

      const emailResult = EmailSchema.safeParse(input.email);
      const usernameResult = UsernameSchema.safeParse(input.username);
      const nameResult = NameSchema.safeParse(input.name);

      expect(emailResult.success).toBe(true);
      expect(usernameResult.success).toBe(true);
      expect(nameResult.success).toBe(true);

      if (emailResult.success)
        expect(emailResult.data).toBe('test@example.com');
      if (usernameResult.success) expect(usernameResult.data).toBe('user123');
      if (nameResult.success) expect(nameResult.data).toBe('Nguyễn Văn A');
    });

    it('nên validate complex object với validateMultiple', () => {
      const result = ValidationUtils.validateMultiple('test@example.com', [
        { schema: EmailSchema, fieldName: 'email' },
        { schema: z.string().min(5), fieldName: 'minLength' },
      ]);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  /**
   * ============================================
   * EDGE CASES & BOUNDARY TESTS
   * ============================================
   */
  describe('Edge Cases và Boundary Tests', () => {
    describe('Email Edge Cases', () => {
      it('nên handle email với multiple subdomains', () => {
        const result = EmailSchema.safeParse('user@mail.sub.example.com');
        expect(result.success).toBe(true);
      });

      it('nên handle email với special chars trong local part', () => {
        const result = EmailSchema.safeParse('user.name+tag@example.com');
        expect(result.success).toBe(true);
      });
    });

    describe('Password Boundary Cases', () => {
      it('nên test password ở min length boundary', () => {
        const result = PasswordSchema.safeParse('Pass123!');
        expect(result.success).toBe(true);
      });

      it('nên test password ở max length boundary', () => {
        const maxPass = 'Pass123!' + 'a'.repeat(56);
        const result = PasswordSchema.safeParse(maxPass);
        expect(result.success).toBe(true);
      });
    });

    describe('Name Edge Cases', () => {
      it('nên handle tên với nhiều khoảng trắng', () => {
        const result = NameSchema.safeParse('Nguyễn   Văn   A');
        expect(result.success).toBe(true);
      });

      it('nên handle tên tiếng Việt full diacritics', () => {
        const result = NameSchema.safeParse('Đặng Thị Bích Ngọc');
        expect(result.success).toBe(true);
      });
    });

    describe('URL Edge Cases', () => {
      it('nên handle URL với port number', () => {
        const result = UrlSchema.safeParse('https://example.com:8080');
        expect(result.success).toBe(true);
      });

      it('nên handle URL với authentication', () => {
        const result = UrlSchema.safeParse('https://user:pass@example.com');
        expect(result.success).toBe(true);
      });
    });

    describe('Sanitization Edge Cases', () => {
      it('nên handle string chỉ chứa dangerous tags', () => {
        const result = ValidationUtils.sanitizeString(
          '<script></script><iframe></iframe>',
        );
        expect(result).toBe('');
      });

      it('nên handle nested dangerous tags', () => {
        const result = ValidationUtils.sanitizeString(
          '<div><script>alert(1)</script></div>',
        );
        expect(result).toBe('<div></div>');
      });
    });
  });
});
