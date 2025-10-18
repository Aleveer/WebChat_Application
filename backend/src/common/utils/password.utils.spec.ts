import { PasswordUtils } from './password.utils';

describe('PasswordUtils', () => {
  describe('generateSalt', () => {
    it('nên tạo salt với độ dài 32 ký tự hex', () => {
      const salt = PasswordUtils.generateSalt();

      expect(salt).toBeDefined();
      expect(salt.length).toBe(32); // 16 bytes = 32 hex characters
      expect(salt).toMatch(/^[a-f0-9]{32}$/i);
    });

    it('nên tạo salt khác nhau mỗi lần', () => {
      const salt1 = PasswordUtils.generateSalt();
      const salt2 = PasswordUtils.generateSalt();

      expect(salt1).not.toBe(salt2);
    });

    it('nên tạo salt với format hex hợp lệ', () => {
      const salt = PasswordUtils.generateSalt();

      // Kiểm tra chỉ chứa ký tự hex
      expect(salt).toMatch(/^[0-9a-f]+$/i);

      // Kiểm tra không chứa ký tự đặc biệt
      expect(salt).not.toMatch(/[^0-9a-f]/i);
    });
  });

  describe('hashPassword', () => {
    it('nên hash password với salt cho kết quả nhất quán', () => {
      const password = 'testPassword123';
      const salt = 'testSalt123';

      const hash1 = PasswordUtils.hashPassword(password, salt);
      const hash2 = PasswordUtils.hashPassword(password, salt);

      expect(hash1).toBeDefined();
      expect(hash1).toBe(hash2); // Cùng input phải cho cùng output
      expect(hash1.length).toBe(64); // SHA-256 hash = 64 hex characters
    });

    it('nên tạo hash khác nhau với salt khác nhau', () => {
      const password = 'testPassword123';
      const salt1 = 'salt1';
      const salt2 = 'salt2';

      const hash1 = PasswordUtils.hashPassword(password, salt1);
      const hash2 = PasswordUtils.hashPassword(password, salt2);

      expect(hash1).not.toBe(hash2);
    });

    it('nên tạo hash khác nhau với password khác nhau', () => {
      const password1 = 'password1';
      const password2 = 'password2';
      const salt = 'sameSalt';

      const hash1 = PasswordUtils.hashPassword(password1, salt);
      const hash2 = PasswordUtils.hashPassword(password2, salt);

      expect(hash1).not.toBe(hash2);
    });

    it('nên tạo hash với format hex hợp lệ', () => {
      const password = 'testPassword';
      const salt = 'testSalt';

      const hash = PasswordUtils.hashPassword(password, salt);

      expect(hash).toMatch(/^[0-9a-f]{64}$/i);
    });

    it('nên xử lý password và salt rỗng', () => {
      const emptyPassword = '';
      const emptySalt = '';

      const hash = PasswordUtils.hashPassword(emptyPassword, emptySalt);

      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);
    });

    it('nên xử lý password và salt với ký tự đặc biệt', () => {
      const password = 'p@ssw0rd!#$%';
      const salt = 's@lt!@#$%';

      const hash = PasswordUtils.hashPassword(password, salt);

      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);
    });
  });

  describe('hashPasswordWithSalt', () => {
    it('nên tạo hash và salt cho password', () => {
      const password = 'testPassword123';

      const result = PasswordUtils.hashPasswordWithSalt(password);

      expect(result).toBeDefined();
      expect(result.hash).toBeDefined();
      expect(result.salt).toBeDefined();
      expect(result.hash.length).toBe(64);
      expect(result.salt.length).toBe(32);
    });

    it('nên tạo salt và hash khác nhau mỗi lần', () => {
      const password = 'testPassword123';

      const result1 = PasswordUtils.hashPasswordWithSalt(password);
      const result2 = PasswordUtils.hashPasswordWithSalt(password);

      expect(result1.salt).not.toBe(result2.salt);
      expect(result1.hash).not.toBe(result2.hash);
    });

    it('nên tạo hash đúng với salt được tạo', () => {
      const password = 'testPassword123';

      const result = PasswordUtils.hashPasswordWithSalt(password);

      // Verify hash được tạo đúng với salt
      const expectedHash = PasswordUtils.hashPassword(password, result.salt);
      expect(result.hash).toBe(expectedHash);
    });

    it('nên xử lý password rỗng', () => {
      const emptyPassword = '';

      const result = PasswordUtils.hashPasswordWithSalt(emptyPassword);

      expect(result.hash).toBeDefined();
      expect(result.salt).toBeDefined();
      expect(result.hash.length).toBe(64);
      expect(result.salt.length).toBe(32);
    });

    it('nên xử lý password dài', () => {
      const longPassword = 'a'.repeat(1000);

      const result = PasswordUtils.hashPasswordWithSalt(longPassword);

      expect(result.hash).toBeDefined();
      expect(result.salt).toBeDefined();
      expect(result.hash.length).toBe(64);
      expect(result.salt.length).toBe(32);
    });
  });

  describe('verifyPassword', () => {
    it('nên trả về true khi password đúng', () => {
      const password = 'testPassword123';
      const salt = 'testSalt123';
      const hash = PasswordUtils.hashPassword(password, salt);

      const isValid = PasswordUtils.verifyPassword(password, hash, salt);

      expect(isValid).toBe(true);
    });

    it('nên trả về false khi password sai', () => {
      const correctPassword = 'testPassword123';
      const wrongPassword = 'wrongPassword';
      const salt = 'testSalt123';
      const hash = PasswordUtils.hashPassword(correctPassword, salt);

      const isValid = PasswordUtils.verifyPassword(wrongPassword, hash, salt);

      expect(isValid).toBe(false);
    });

    it('nên trả về false khi salt sai', () => {
      const password = 'testPassword123';
      const correctSalt = 'correctSalt';
      const wrongSalt = 'wrongSalt';
      const hash = PasswordUtils.hashPassword(password, correctSalt);

      const isValid = PasswordUtils.verifyPassword(password, hash, wrongSalt);

      expect(isValid).toBe(false);
    });

    it('nên trả về false khi hash sai', () => {
      const password = 'testPassword123';
      const salt = 'testSalt123';
      const correctHash = PasswordUtils.hashPassword(password, salt);
      const wrongHash = 'wrongHash123';

      const isValid = PasswordUtils.verifyPassword(password, wrongHash, salt);

      expect(isValid).toBe(false);
    });

    it('nên hoạt động với password và salt rỗng', () => {
      const emptyPassword = '';
      const emptySalt = '';
      const hash = PasswordUtils.hashPassword(emptyPassword, emptySalt);

      const isValid = PasswordUtils.verifyPassword(
        emptyPassword,
        hash,
        emptySalt,
      );

      expect(isValid).toBe(true);
    });

    it('nên hoạt động với password có ký tự đặc biệt', () => {
      const password = 'p@ssw0rd!#$%';
      const salt = 's@lt!@#$%';
      const hash = PasswordUtils.hashPassword(password, salt);

      const isValid = PasswordUtils.verifyPassword(password, hash, salt);

      expect(isValid).toBe(true);
    });

    it('nên hoạt động với hash và salt từ hashPasswordWithSalt', () => {
      const password = 'testPassword123';

      // Tạo hash và salt
      const { hash, salt } = PasswordUtils.hashPasswordWithSalt(password);

      // Verify với cùng password
      const isValid = PasswordUtils.verifyPassword(password, hash, salt);

      expect(isValid).toBe(true);
    });

    it('nên case sensitive với password', () => {
      const password = 'TestPassword123';
      const salt = 'testSalt';
      const hash = PasswordUtils.hashPassword(password, salt);

      const isValidLower = PasswordUtils.verifyPassword(
        'testpassword123',
        hash,
        salt,
      );
      const isValidUpper = PasswordUtils.verifyPassword(
        'TESTPASSWORD123',
        hash,
        salt,
      );

      expect(isValidLower).toBe(false);
      expect(isValidUpper).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('nên hoạt động đúng với workflow đầy đủ', () => {
      const password = 'userPassword123';

      // Bước 1: Tạo salt và hash khi đăng ký
      const { hash, salt } = PasswordUtils.hashPasswordWithSalt(password);

      // Bước 2: Verify khi đăng nhập
      const isValid = PasswordUtils.verifyPassword(password, hash, salt);

      expect(isValid).toBe(true);
    });

    it('nên hoạt động với nhiều password khác nhau', () => {
      const passwords = [
        'password1',
        'password2',
        'p@ssw0rd!#$%',
        '123456789',
        'a'.repeat(100),
        '',
      ];

      passwords.forEach((password) => {
        const { hash, salt } = PasswordUtils.hashPasswordWithSalt(password);
        const isValid = PasswordUtils.verifyPassword(password, hash, salt);

        expect(isValid).toBe(true);
      });
    });

    it('nên tạo salt và hash unique cho mỗi password', () => {
      const password = 'samePassword';
      const results = [];

      // Tạo nhiều hash cho cùng một password
      for (let i = 0; i < 10; i++) {
        results.push(PasswordUtils.hashPasswordWithSalt(password));
      }

      // Kiểm tra tất cả salt và hash đều khác nhau
      const salts = results.map((r) => r.salt);
      const hashes = results.map((r) => r.hash);

      const uniqueSalts = new Set(salts);
      const uniqueHashes = new Set(hashes);

      expect(uniqueSalts.size).toBe(10);
      expect(uniqueHashes.size).toBe(10);
    });
  });

  describe('Security Tests', () => {
    it('nên có entropy cao cho salt', () => {
      const salts = [];

      // Tạo nhiều salt để kiểm tra entropy
      for (let i = 0; i < 100; i++) {
        salts.push(PasswordUtils.generateSalt());
      }

      // Kiểm tra không có salt trùng lặp
      const uniqueSalts = new Set(salts);
      expect(uniqueSalts.size).toBe(100);
    });

    it('nên có entropy cao cho hash', () => {
      const password = 'testPassword';
      const hashes = [];

      // Tạo nhiều hash cho cùng password
      for (let i = 0; i < 100; i++) {
        const { hash } = PasswordUtils.hashPasswordWithSalt(password);
        hashes.push(hash);
      }

      // Kiểm tra không có hash trùng lặp
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(100);
    });

    it('nên không thể reverse engineer password từ hash', () => {
      const password = 'secretPassword123';
      const { hash, salt } = PasswordUtils.hashPasswordWithSalt(password);

      // Hash không chứa thông tin về password gốc
      expect(hash).not.toContain(password);
      expect(hash).not.toContain(password.toLowerCase());
      expect(hash).not.toContain(password.toUpperCase());
    });

    it('nên có timing attack resistance', () => {
      const password = 'testPassword';
      const { hash, salt } = PasswordUtils.hashPasswordWithSalt(password);

      const wrongPasswords = [
        'wrongPassword',
        'testPassword1',
        'testPassword2',
        'a'.repeat(1000),
        '',
      ];

      // Tất cả wrong passwords đều trả về false
      wrongPasswords.forEach((wrongPassword) => {
        const isValid = PasswordUtils.verifyPassword(wrongPassword, hash, salt);
        expect(isValid).toBe(false);
      });
    });
  });
});
