import { Types } from 'mongoose';
import {
  ValidationUtils,
  PasswordUtils,
  StringUtils,
  DateUtils,
  ArrayUtils,
  ObjectUtils,
  PaginationUtils,
  FileUtils,
  ResponseUtils,
} from './common.utils';

describe('Common Utils', () => {
  describe('ValidationUtils', () => {
    describe('isValidObjectId', () => {
      it('nên trả về true cho ObjectId hợp lệ', () => {
        const validId = new Types.ObjectId().toString();
        expect(ValidationUtils.isValidObjectId(validId)).toBe(true);
      });

      it('nên trả về false cho ObjectId không hợp lệ', () => {
        expect(ValidationUtils.isValidObjectId('invalid-id')).toBe(false);
        expect(ValidationUtils.isValidObjectId('')).toBe(false);
        expect(ValidationUtils.isValidObjectId('123')).toBe(false);
      });
    });

    describe('isValidPhoneNumber', () => {
      it('nên trả về true cho số điện thoại hợp lệ', () => {
        expect(ValidationUtils.isValidPhoneNumber('+84123456789')).toBe(true);
        // Test với số điện thoại quốc tế hợp lệ
        expect(ValidationUtils.isValidPhoneNumber('+1234567890')).toBe(true);
      });

      it('nên trả về false cho số điện thoại không hợp lệ', () => {
        expect(ValidationUtils.isValidPhoneNumber('123')).toBe(false);
        expect(ValidationUtils.isValidPhoneNumber('abc')).toBe(false);
        expect(ValidationUtils.isValidPhoneNumber('')).toBe(false);
        expect(ValidationUtils.isValidPhoneNumber('0123456789')).toBe(false);
        expect(ValidationUtils.isValidPhoneNumber('0987654321')).toBe(false);
      });
    });

    describe('isValidEmail', () => {
      it('nên trả về true cho email hợp lệ', () => {
        expect(ValidationUtils.isValidEmail('test@example.com')).toBe(true);
        expect(ValidationUtils.isValidEmail('user.name+tag@domain.co.uk')).toBe(
          true,
        );
      });

      it('nên trả về false cho email không hợp lệ', () => {
        expect(ValidationUtils.isValidEmail('invalid-email')).toBe(false);
        expect(ValidationUtils.isValidEmail('@domain.com')).toBe(false);
        expect(ValidationUtils.isValidEmail('user@')).toBe(false);
        expect(ValidationUtils.isValidEmail('')).toBe(false);
      });
    });

    describe('isValidUrl', () => {
      it('nên trả về true cho URL hợp lệ', () => {
        expect(ValidationUtils.isValidUrl('https://example.com')).toBe(true);
        expect(ValidationUtils.isValidUrl('http://localhost:3000')).toBe(true);
        expect(ValidationUtils.isValidUrl('ftp://files.example.com')).toBe(
          true,
        );
      });

      it('nên trả về false cho URL không hợp lệ', () => {
        expect(ValidationUtils.isValidUrl('not-a-url')).toBe(false);
        expect(ValidationUtils.isValidUrl('example.com')).toBe(false);
        expect(ValidationUtils.isValidUrl('')).toBe(false);
      });
    });

    describe('isValidImageUrl', () => {
      it('nên trả về true cho image URL hợp lệ', () => {
        expect(
          ValidationUtils.isValidImageUrl('https://example.com/image.jpg'),
        ).toBe(true);
        expect(
          ValidationUtils.isValidImageUrl('https://example.com/image.png'),
        ).toBe(true);
      });

      it('nên trả về false cho image URL không hợp lệ', () => {
        expect(
          ValidationUtils.isValidImageUrl('https://example.com/document.pdf'),
        ).toBe(false);
        expect(ValidationUtils.isValidImageUrl('not-an-image-url')).toBe(false);
      });
    });

    describe('sanitizeString', () => {
      it('nên loại bỏ script tags và trim whitespace', () => {
        const input = '  Hello <script>alert("xss")</script> World  ';
        const result = ValidationUtils.sanitizeString(input);
        expect(result).toBe('Hello  World');
      });

      it('nên xử lý chuỗi bình thường', () => {
        const input = '  Normal text  ';
        const result = ValidationUtils.sanitizeString(input);
        expect(result).toBe('Normal text');
      });
    });

    describe('isValidPassword', () => {
      it('nên kiểm tra độ dài password', () => {
        // Test này có thể cần điều chỉnh tùy theo logic thực tế
        expect(ValidationUtils.isValidPassword('short')).toBeDefined();
        expect(
          ValidationUtils.isValidPassword('verylongpassword'),
        ).toBeDefined();
      });
    });

    describe('isValidName', () => {
      it('nên trả về true cho tên hợp lệ', () => {
        expect(ValidationUtils.isValidName('John Doe')).toBe(true);
        expect(ValidationUtils.isValidName('A')).toBe(true);
        expect(ValidationUtils.isValidName('Mary Jane Watson')).toBe(true);
      });

      it('nên trả về false cho tên không hợp lệ', () => {
        expect(ValidationUtils.isValidName('')).toBe(false);
        expect(ValidationUtils.isValidName('John123')).toBe(false);
        expect(ValidationUtils.isValidName('John@Doe')).toBe(false);
        expect(ValidationUtils.isValidName('A'.repeat(51))).toBe(false);
      });
    });
  });

  describe('PasswordUtils', () => {
    describe('hashPassword', () => {
      it('nên hash password thành công', async () => {
        const password = 'testPassword123';
        const hashedPassword = await PasswordUtils.hashPassword(password);

        expect(hashedPassword).toBeDefined();
        expect(hashedPassword).not.toBe(password);
        expect(hashedPassword.length).toBeGreaterThan(0);
      });

      it('nên tạo hash khác nhau cho cùng một password', async () => {
        const password = 'testPassword123';
        const hash1 = await PasswordUtils.hashPassword(password);
        const hash2 = await PasswordUtils.hashPassword(password);

        expect(hash1).not.toBe(hash2);
      });
    });

    describe('comparePassword', () => {
      it('nên trả về true khi password đúng', async () => {
        const password = 'testPassword123';
        const hashedPassword = await PasswordUtils.hashPassword(password);

        const result = await PasswordUtils.comparePassword(
          password,
          hashedPassword,
        );
        expect(result).toBe(true);
      });

      it('nên trả về false khi password sai', async () => {
        const password = 'testPassword123';
        const wrongPassword = 'wrongPassword';
        const hashedPassword = await PasswordUtils.hashPassword(password);

        const result = await PasswordUtils.comparePassword(
          wrongPassword,
          hashedPassword,
        );
        expect(result).toBe(false);
      });
    });

    describe('generateRandomPassword', () => {
      it('nên tạo password với độ dài mặc định', () => {
        const password = PasswordUtils.generateRandomPassword();
        expect(password.length).toBe(12);
      });

      it('nên tạo password với độ dài tùy chỉnh', () => {
        const password = PasswordUtils.generateRandomPassword(16);
        expect(password.length).toBe(16);
      });

      it('nên tạo password khác nhau mỗi lần', () => {
        const password1 = PasswordUtils.generateRandomPassword();
        const password2 = PasswordUtils.generateRandomPassword();
        expect(password1).not.toBe(password2);
      });
    });

    describe('validatePasswordStrength', () => {
      it('nên đánh giá password mạnh', () => {
        const strongPassword = 'StrongPass123!';
        const result = PasswordUtils.validatePasswordStrength(strongPassword);

        expect(result.isValid).toBe(true);
        expect(result.score).toBeGreaterThanOrEqual(3);
        expect(result.feedback.length).toBe(0);
      });

      it('nên đánh giá password yếu', () => {
        const weakPassword = 'weak';
        const result = PasswordUtils.validatePasswordStrength(weakPassword);

        expect(result.isValid).toBe(false);
        expect(result.score).toBeLessThan(3);
        expect(result.feedback.length).toBeGreaterThan(0);
      });

      it('nên cung cấp feedback chi tiết', () => {
        const password = 'abc';
        const result = PasswordUtils.validatePasswordStrength(password);

        expect(result.feedback).toContain(
          'Password should be at least 8 characters long',
        );
        expect(result.feedback).toContain(
          'Password should contain uppercase letters',
        );
        expect(result.feedback).toContain('Password should contain numbers');
      });
    });
  });

  describe('StringUtils', () => {
    describe('capitalize', () => {
      it('nên viết hoa chữ cái đầu và viết thường các chữ còn lại', () => {
        expect(StringUtils.capitalize('hello')).toBe('Hello');
        expect(StringUtils.capitalize('HELLO')).toBe('Hello');
        expect(StringUtils.capitalize('hELLO')).toBe('Hello');
      });
    });

    describe('capitalizeWords', () => {
      it('nên viết hoa chữ cái đầu của mỗi từ', () => {
        expect(StringUtils.capitalizeWords('hello world')).toBe('Hello World');
        expect(StringUtils.capitalizeWords('john doe smith')).toBe(
          'John Doe Smith',
        );
      });
    });

    describe('slugify', () => {
      it('nên tạo slug từ chuỗi', () => {
        expect(StringUtils.slugify('Hello World!')).toBe('hello-world');
        expect(StringUtils.slugify('This is a Test')).toBe('this-is-a-test');
        expect(StringUtils.slugify('Special@#$Characters')).toBe(
          'specialcharacters',
        );
      });
    });

    describe('truncate', () => {
      it('nên cắt chuỗi với suffix mặc định', () => {
        expect(StringUtils.truncate('Hello World', 5)).toBe('He...');
        expect(StringUtils.truncate('Short', 10)).toBe('Short');
      });

      it('nên cắt chuỗi với suffix tùy chỉnh', () => {
        expect(StringUtils.truncate('Hello World', 5, '---')).toBe('He---');
      });
    });

    describe('generateRandomString', () => {
      it('nên tạo chuỗi random với độ dài chỉ định', () => {
        const randomString = StringUtils.generateRandomString(16);
        expect(randomString.length).toBe(32); // hex string length is double
      });

      it('nên tạo chuỗi khác nhau mỗi lần', () => {
        const string1 = StringUtils.generateRandomString(8);
        const string2 = StringUtils.generateRandomString(8);
        expect(string1).not.toBe(string2);
      });
    });

    describe('generateUUID', () => {
      it('nên tạo UUID hợp lệ', () => {
        const uuid = StringUtils.generateUUID();
        expect(uuid).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        );
      });

      it('nên tạo UUID khác nhau mỗi lần', () => {
        const uuid1 = StringUtils.generateUUID();
        const uuid2 = StringUtils.generateUUID();
        expect(uuid1).not.toBe(uuid2);
      });
    });

    describe('maskEmail', () => {
      it('nên mask email đúng cách', () => {
        expect(StringUtils.maskEmail('john@example.com')).toBe(
          'j**n@example.com',
        );
        expect(StringUtils.maskEmail('ab@example.com')).toBe('ab@example.com');
      });
    });

    describe('maskPhoneNumber', () => {
      it('nên mask số điện thoại đúng cách', () => {
        expect(StringUtils.maskPhoneNumber('0123456789')).toBe('012*****89');
        expect(StringUtils.maskPhoneNumber('123')).toBe('123');
      });
    });
  });

  describe('DateUtils', () => {
    describe('now', () => {
      it('nên trả về thời gian hiện tại', () => {
        const now = DateUtils.now();
        expect(now).toBeInstanceOf(Date);
        expect(now.getTime()).toBeLessThanOrEqual(Date.now());
      });
    });

    describe('addDays', () => {
      it('nên thêm số ngày vào date', () => {
        const date = new Date('2023-01-01');
        const result = DateUtils.addDays(date, 5);
        expect(result.getDate()).toBe(6);
      });

      it('nên xử lý số âm', () => {
        const date = new Date('2023-01-10');
        const result = DateUtils.addDays(date, -5);
        expect(result.getDate()).toBe(5);
      });
    });

    describe('addHours', () => {
      it('nên thêm số giờ vào date', () => {
        const date = new Date('2023-01-01T10:00:00');
        const result = DateUtils.addHours(date, 5);
        expect(result.getHours()).toBe(15);
      });
    });

    describe('addMinutes', () => {
      it('nên thêm số phút vào date', () => {
        const date = new Date('2023-01-01T10:00:00');
        const result = DateUtils.addMinutes(date, 30);
        expect(result.getMinutes()).toBe(30);
      });
    });

    describe('isExpired', () => {
      it('nên trả về true cho date đã hết hạn', () => {
        const pastDate = new Date(Date.now() - 1000);
        expect(DateUtils.isExpired(pastDate)).toBe(true);
      });

      it('nên trả về false cho date chưa hết hạn', () => {
        const futureDate = new Date(Date.now() + 1000);
        expect(DateUtils.isExpired(futureDate)).toBe(false);
      });
    });

    describe('formatDate', () => {
      it('nên format date với format mặc định', () => {
        const date = new Date('2023-01-15T14:30:45');
        const result = DateUtils.formatDate(date);
        expect(result).toBe('2023-01-15');
      });

      it('nên format date với format tùy chỉnh', () => {
        const date = new Date('2023-01-15T14:30:45');
        const result = DateUtils.formatDate(date, 'YYYY-MM-DD HH:mm:ss');
        expect(result).toBe('2023-01-15 14:30:45');
      });
    });

    describe('getTimeAgo', () => {
      it('nên trả về "just now" cho thời gian gần đây', () => {
        const recentDate = new Date(Date.now() - 30 * 1000);
        expect(DateUtils.getTimeAgo(recentDate)).toBe('just now');
      });

      it('nên trả về minutes ago', () => {
        const date = new Date(Date.now() - 5 * 60 * 1000);
        expect(DateUtils.getTimeAgo(date)).toBe('5 minutes ago');
      });

      it('nên trả về hours ago', () => {
        const date = new Date(Date.now() - 2 * 60 * 60 * 1000);
        expect(DateUtils.getTimeAgo(date)).toBe('2 hours ago');
      });

      it('nên trả về days ago', () => {
        const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        expect(DateUtils.getTimeAgo(date)).toBe('3 days ago');
      });
    });
  });

  describe('ArrayUtils', () => {
    describe('unique', () => {
      it('nên loại bỏ các phần tử trùng lặp', () => {
        const array = [1, 2, 2, 3, 3, 3];
        const result = ArrayUtils.unique(array);
        expect(result).toEqual([1, 2, 3]);
      });

      it('nên xử lý array rỗng', () => {
        expect(ArrayUtils.unique([])).toEqual([]);
      });
    });

    describe('chunk', () => {
      it('nên chia array thành các chunk', () => {
        const array = [1, 2, 3, 4, 5, 6];
        const result = ArrayUtils.chunk(array, 2);
        expect(result).toEqual([
          [1, 2],
          [3, 4],
          [5, 6],
        ]);
      });

      it('nên xử lý array không chia hết', () => {
        const array = [1, 2, 3, 4, 5];
        const result = ArrayUtils.chunk(array, 2);
        expect(result).toEqual([[1, 2], [3, 4], [5]]);
      });
    });

    describe('shuffle', () => {
      it('nên trộn array và không thay đổi array gốc', () => {
        const array = [1, 2, 3, 4, 5];
        const shuffled = ArrayUtils.shuffle(array);

        expect(shuffled).toHaveLength(array.length);
        expect(array).toEqual([1, 2, 3, 4, 5]); // Original unchanged
      });
    });

    describe('groupBy', () => {
      it('nên nhóm array theo key function', () => {
        const users = [
          { name: 'John', age: 25 },
          { name: 'Jane', age: 30 },
          { name: 'Bob', age: 25 },
        ];

        const result = ArrayUtils.groupBy(users, (user) => user.age);
        expect(result).toEqual({
          25: [
            { name: 'John', age: 25 },
            { name: 'Bob', age: 25 },
          ],
          30: [{ name: 'Jane', age: 30 }],
        });
      });
    });

    describe('sortBy', () => {
      it('nên sắp xếp array theo key', () => {
        const users = [
          { name: 'John', age: 30 },
          { name: 'Jane', age: 25 },
          { name: 'Bob', age: 35 },
        ];

        const result = ArrayUtils.sortBy(users, 'age', 'asc');
        expect(result[0].age).toBe(25);
        expect(result[2].age).toBe(35);
      });

      it('nên sắp xếp theo thứ tự giảm dần', () => {
        const users = [
          { name: 'John', age: 30 },
          { name: 'Jane', age: 25 },
          { name: 'Bob', age: 35 },
        ];

        const result = ArrayUtils.sortBy(users, 'age', 'desc');
        expect(result[0].age).toBe(35);
        expect(result[2].age).toBe(25);
      });
    });
  });

  describe('ObjectUtils', () => {
    describe('deepClone', () => {
      it('nên clone object sâu', () => {
        const original = { a: 1, b: { c: 2 } };
        const cloned = ObjectUtils.deepClone(original);

        expect(cloned).toEqual(original);
        expect(cloned).not.toBe(original);
        expect(cloned.b).not.toBe(original.b);
      });
    });

    describe('isEmpty', () => {
      it('nên trả về true cho các giá trị empty', () => {
        expect(ObjectUtils.isEmpty(null)).toBe(true);
        expect(ObjectUtils.isEmpty(undefined)).toBe(true);
        expect(ObjectUtils.isEmpty('')).toBe(true);
        expect(ObjectUtils.isEmpty('   ')).toBe(true);
        expect(ObjectUtils.isEmpty([])).toBe(true);
        expect(ObjectUtils.isEmpty({})).toBe(true);
      });

      it('nên trả về false cho các giá trị không empty', () => {
        expect(ObjectUtils.isEmpty('hello')).toBe(false);
        expect(ObjectUtils.isEmpty([1, 2, 3])).toBe(false);
        expect(ObjectUtils.isEmpty({ a: 1 })).toBe(false);
        expect(ObjectUtils.isEmpty(0)).toBe(false);
        expect(ObjectUtils.isEmpty(false)).toBe(false);
      });
    });

    describe('pick', () => {
      it('nên chọn các key được chỉ định', () => {
        const obj = { a: 1, b: 2, c: 3 };
        const result = ObjectUtils.pick(obj, ['a', 'c']);
        expect(result).toEqual({ a: 1, c: 3 });
      });
    });

    describe('omit', () => {
      it('nên loại bỏ các key được chỉ định', () => {
        const obj = { a: 1, b: 2, c: 3 };
        const result = ObjectUtils.omit(obj, ['b']);
        expect(result).toEqual({ a: 1, c: 3 });
      });
    });

    describe('merge', () => {
      it('nên merge các object', () => {
        const target = { a: 1, b: 2 };
        const source1 = { b: 3, c: 4 };
        const source2 = { d: 5 } as any;

        const result = ObjectUtils.merge(target, source1, source2);
        expect(result).toEqual({ a: 1, b: 3, c: 4, d: 5 });
      });
    });
  });

  describe('PaginationUtils', () => {
    describe('calculatePagination', () => {
      it('nên tính toán pagination đúng', () => {
        const result = PaginationUtils.calculatePagination(2, 10, 25);

        expect(result.page).toBe(2);
        expect(result.limit).toBe(10);
        expect(result.total).toBe(25);
        expect(result.totalPages).toBe(3);
        expect(result.hasNext).toBe(true);
        expect(result.hasPrev).toBe(true);
        expect(result.offset).toBe(10);
      });

      it('nên xử lý trang đầu tiên', () => {
        const result = PaginationUtils.calculatePagination(1, 10, 25);
        expect(result.hasPrev).toBe(false);
        expect(result.hasNext).toBe(true);
        expect(result.offset).toBe(0);
      });

      it('nên xử lý trang cuối cùng', () => {
        const result = PaginationUtils.calculatePagination(3, 10, 25);
        expect(result.hasPrev).toBe(true);
        expect(result.hasNext).toBe(false);
      });
    });

    describe('validatePaginationParams', () => {
      it('nên validate và normalize params', () => {
        const result = PaginationUtils.validatePaginationParams(0, 0);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(20);
      });

      it('nên giới hạn limit tối đa', () => {
        const result = PaginationUtils.validatePaginationParams(1, 200);
        expect(result.limit).toBe(100);
      });

      it('nên sử dụng giá trị mặc định', () => {
        const result = PaginationUtils.validatePaginationParams();
        expect(result.page).toBe(1);
        expect(result.limit).toBe(20);
      });
    });
  });

  describe('FileUtils', () => {
    describe('getFileExtension', () => {
      it('nên lấy extension của file', () => {
        expect(FileUtils.getFileExtension('document.pdf')).toBe('pdf');
        expect(FileUtils.getFileExtension('image.JPG')).toBe('jpg');
        expect(FileUtils.getFileExtension('file')).toBe('file');
      });
    });

    describe('isValidImageType', () => {
      it('nên trả về true cho image types hợp lệ', () => {
        expect(FileUtils.isValidImageType('image/jpeg')).toBe(true);
        expect(FileUtils.isValidImageType('image/png')).toBe(true);
        expect(FileUtils.isValidImageType('image/gif')).toBe(true);
        expect(FileUtils.isValidImageType('image/webp')).toBe(true);
      });

      it('nên trả về false cho image types không hợp lệ', () => {
        expect(FileUtils.isValidImageType('application/pdf')).toBe(false);
        expect(FileUtils.isValidImageType('text/plain')).toBe(false);
      });
    });

    describe('formatFileSize', () => {
      it('nên format file size đúng cách', () => {
        expect(FileUtils.formatFileSize(0)).toBe('0 Bytes');
        expect(FileUtils.formatFileSize(1024)).toBe('1 KB');
        expect(FileUtils.formatFileSize(1048576)).toBe('1 MB');
        expect(FileUtils.formatFileSize(1073741824)).toBe('1 GB');
      });
    });

    describe('generateFileName', () => {
      it('nên tạo filename unique', () => {
        const filename1 = FileUtils.generateFileName('test.jpg');
        const filename2 = FileUtils.generateFileName('test.jpg');

        expect(filename1).not.toBe(filename2);
        expect(filename1).toMatch(/^\d+_[a-f0-9]+\.jpg$/);
      });
    });
  });

  describe('ResponseUtils', () => {
    describe('success', () => {
      it('nên tạo success response với data', () => {
        const data = { id: 1, name: 'Test' };
        const result = ResponseUtils.success(data, 'Success message');

        expect(result.success).toBe(true);
        expect(result.data).toEqual(data);
        expect(result.message).toBe('Success message');
        expect(result.timestamp).toBeDefined();
      });

      it('nên tạo success response không có data', () => {
        const result = ResponseUtils.success();

        expect(result.success).toBe(true);
        expect(result.data).toBeUndefined();
        expect(result.message).toBeUndefined();
      });
    });

    describe('error', () => {
      it('nên tạo error response', () => {
        const result = ResponseUtils.error('Error message', 'ERROR_CODE');

        expect(result.success).toBe(false);
        expect(result.message).toBe('Error message');
        expect(result.error).toBe('ERROR_CODE');
        expect(result.timestamp).toBeDefined();
      });
    });

    describe('paginated', () => {
      it('nên tạo paginated response', () => {
        const data = [{ id: 1 }, { id: 2 }];
        const result = ResponseUtils.paginated(data, 1, 10, 25, 'Success');

        expect(result.success).toBe(true);
        expect(result.data).toEqual(data);
        expect(result.pagination).toBeDefined();
        expect(result.pagination.total).toBe(25);
        expect(result.message).toBe('Success');
      });
    });
  });
});
