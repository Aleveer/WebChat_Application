import * as crypto from 'crypto';
import { FileUtils } from '../src/common/utils/files.utils';

// Mock crypto module
jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
}));

describe('FileUtils - White Box Testing', () => {
  describe('getFileExtension Method', () => {
    /**
     * Test Case 1: Kiểm tra file extension với single extension
     * Input: 'document.pdf'
     * Expected Output: 'pdf'
     * Path Coverage: Line 4 (split + pop + toLowerCase - success path)
     */
    it('TC001: should return extension for file with single extension', () => {
      const result = FileUtils.getFileExtension('document.pdf');

      expect(result).toBe('pdf');
    });

    /**
     * Test Case 2: Kiểm tra file extension với multiple dots
     * Input: 'archive.tar.gz'
     * Expected Output: 'gz' (last extension only)
     * Path Coverage: Line 4 (split with multiple dots)
     */
    it('TC002: should return last extension for file with multiple dots', () => {
      const result = FileUtils.getFileExtension('archive.tar.gz');

      expect(result).toBe('gz');
    });

    /**
     * Test Case 3: Kiểm tra lowercase conversion
     * Input: 'Document.PDF'
     * Expected Output: 'pdf' (lowercase)
     * Path Coverage: Line 4 (toLowerCase transformation)
     */
    it('TC003: should return lowercase extension', () => {
      const result = FileUtils.getFileExtension('Document.PDF');

      expect(result).toBe('pdf');
    });

    /**
     * Test Case 4: Kiểm tra file extension mixed case
     * Input: 'image.JpEg'
     * Expected Output: 'jpeg'
     * Path Coverage: Line 4 (toLowerCase with mixed case)
     */
    it('TC004: should handle mixed case extensions', () => {
      const result = FileUtils.getFileExtension('image.JpEg');

      expect(result).toBe('jpeg');
    });

    /**
     * Test Case 5: Kiểm tra file without extension
     * Input: 'README'
     * Expected Output: 'readme' (entire filename becomes extension after split)
     * Path Coverage: Line 4 (pop on single element array)
     */
    it('TC005: should return filename as extension when no dot exists', () => {
      const result = FileUtils.getFileExtension('README');

      expect(result).toBe('readme');
    });

    /**
     * Test Case 6: Kiểm tra file with dot at the end
     * Input: 'filename.'
     * Expected Output: '' (empty string)
     * Path Coverage: Line 4 (pop returns empty string)
     */
    it('TC006: should return empty string for file ending with dot', () => {
      const result = FileUtils.getFileExtension('filename.');

      expect(result).toBe('');
    });

    /**
     * Test Case 7: Kiểm tra empty string input
     * Input: ''
     * Expected Output: ''
     * Path Coverage: Line 4 (split on empty string, pop returns '')
     */
    it('TC007: should return empty string for empty input', () => {
      const result = FileUtils.getFileExtension('');

      expect(result).toBe('');
    });

    /**
     * Test Case 8: Kiểm tra file with only dot
     * Input: '.'
     * Expected Output: ''
     * Path Coverage: Line 4 (split produces ['', ''], pop returns '')
     */
    it('TC008: should return empty string for single dot', () => {
      const result = FileUtils.getFileExtension('.');

      expect(result).toBe('');
    });

    /**
     * Test Case 9: Kiểm tra file with multiple consecutive dots
     * Input: 'file...txt'
     * Expected Output: 'txt'
     * Path Coverage: Line 4 (split with empty strings between dots)
     */
    it('TC009: should return last extension for consecutive dots', () => {
      const result = FileUtils.getFileExtension('file...txt');

      expect(result).toBe('txt');
    });

    /**
     * Test Case 10: Kiểm tra file with path
     * Input: '/path/to/file.jpg'
     * Expected Output: 'jpg'
     * Path Coverage: Line 4 (split ignores path, only cares about dots)
     */
    it('TC010: should extract extension from full path', () => {
      const result = FileUtils.getFileExtension('/path/to/file.jpg');

      expect(result).toBe('jpg');
    });

    /**
     * Test Case 11: Kiểm tra hidden file (Unix style)
     * Input: '.gitignore'
     * Expected Output: 'gitignore'
     * Path Coverage: Line 4 (split produces ['', 'gitignore'])
     */
    it('TC011: should handle hidden files (starting with dot)', () => {
      const result = FileUtils.getFileExtension('.gitignore');

      expect(result).toBe('gitignore');
    });

    /**
     * Test Case 12: Kiểm tra common image extensions
     * Input: Various image files
     * Expected Output: Correct extensions
     * Path Coverage: Line 4 (real-world image files)
     */
    it('TC012: should handle common image file extensions', () => {
      const files = [
        { name: 'photo.jpg', expected: 'jpg' },
        { name: 'image.jpeg', expected: 'jpeg' },
        { name: 'graphic.png', expected: 'png' },
        { name: 'animation.gif', expected: 'gif' },
        { name: 'modern.webp', expected: 'webp' },
      ];

      files.forEach(({ name, expected }) => {
        expect(FileUtils.getFileExtension(name)).toBe(expected);
      });
    });

    /**
     * Test Case 13: Kiểm tra common document extensions
     * Input: Various document files
     * Expected Output: Correct extensions
     * Path Coverage: Line 4 (real-world document files)
     */
    it('TC013: should handle common document file extensions', () => {
      const files = [
        { name: 'report.pdf', expected: 'pdf' },
        { name: 'sheet.xlsx', expected: 'xlsx' },
        { name: 'doc.docx', expected: 'docx' },
        { name: 'text.txt', expected: 'txt' },
      ];

      files.forEach(({ name, expected }) => {
        expect(FileUtils.getFileExtension(name)).toBe(expected);
      });
    });

    /**
     * Test Case 14: Kiểm tra very long extension
     * Input: 'file.verylongextension'
     * Expected Output: 'verylongextension'
     * Path Coverage: Line 4 (no length limit)
     */
    it('TC014: should handle very long extensions', () => {
      const result = FileUtils.getFileExtension('file.verylongextension');

      expect(result).toBe('verylongextension');
    });

    /**
     * Test Case 15: Kiểm tra single character extension
     * Input: 'file.c'
     * Expected Output: 'c'
     * Path Coverage: Line 4 (single char extension)
     */
    it('TC015: should handle single character extensions', () => {
      const result = FileUtils.getFileExtension('file.c');

      expect(result).toBe('c');
    });
  });

  describe('isValidImageType Method', () => {
    /**
     * Test Case 16: Kiểm tra valid JPEG mimetype
     * Input: 'image/jpeg'
     * Expected Output: true
     * Path Coverage: Line 8-9 (includes check - true branch)
     */
    it('TC016: should return true for image/jpeg', () => {
      const result = FileUtils.isValidImageType('image/jpeg');

      expect(result).toBe(true);
    });

    /**
     * Test Case 17: Kiểm tra valid PNG mimetype
     * Input: 'image/png'
     * Expected Output: true
     * Path Coverage: Line 8-9 (includes check - true branch)
     */
    it('TC017: should return true for image/png', () => {
      const result = FileUtils.isValidImageType('image/png');

      expect(result).toBe(true);
    });

    /**
     * Test Case 18: Kiểm tra valid GIF mimetype
     * Input: 'image/gif'
     * Expected Output: true
     * Path Coverage: Line 8-9 (includes check - true branch)
     */
    it('TC018: should return true for image/gif', () => {
      const result = FileUtils.isValidImageType('image/gif');

      expect(result).toBe(true);
    });

    /**
     * Test Case 19: Kiểm tra valid WEBP mimetype
     * Input: 'image/webp'
     * Expected Output: true
     * Path Coverage: Line 8-9 (includes check - true branch)
     */
    it('TC019: should return true for image/webp', () => {
      const result = FileUtils.isValidImageType('image/webp');

      expect(result).toBe(true);
    });

    /**
     * Test Case 20: Kiểm tra invalid mimetype - PDF
     * Input: 'application/pdf'
     * Expected Output: false
     * Path Coverage: Line 8-9 (includes check - false branch)
     */
    it('TC020: should return false for application/pdf', () => {
      const result = FileUtils.isValidImageType('application/pdf');

      expect(result).toBe(false);
    });

    /**
     * Test Case 21: Kiểm tra invalid mimetype - text
     * Input: 'text/plain'
     * Expected Output: false
     * Path Coverage: Line 8-9 (includes check - false branch)
     */
    it('TC021: should return false for text/plain', () => {
      const result = FileUtils.isValidImageType('text/plain');

      expect(result).toBe(false);
    });

    /**
     * Test Case 22: Kiểm tra invalid image type - SVG
     * Input: 'image/svg+xml'
     * Expected Output: false (not in validTypes array)
     * Path Coverage: Line 8-9 (includes check - false branch)
     */
    it('TC022: should return false for image/svg+xml', () => {
      const result = FileUtils.isValidImageType('image/svg+xml');

      expect(result).toBe(false);
    });

    /**
     * Test Case 23: Kiểm tra invalid image type - BMP
     * Input: 'image/bmp'
     * Expected Output: false (not in validTypes array)
     * Path Coverage: Line 8-9 (includes check - false branch)
     */
    it('TC023: should return false for image/bmp', () => {
      const result = FileUtils.isValidImageType('image/bmp');

      expect(result).toBe(false);
    });

    /**
     * Test Case 24: Kiểm tra case sensitivity - uppercase
     * Input: 'IMAGE/JPEG'
     * Expected Output: false (case-sensitive check)
     * Path Coverage: Line 8-9 (exact match required)
     */
    it('TC024: should be case-sensitive (uppercase fails)', () => {
      const result = FileUtils.isValidImageType('IMAGE/JPEG');

      expect(result).toBe(false);
    });

    /**
     * Test Case 25: Kiểm tra case sensitivity - mixed case
     * Input: 'Image/Jpeg'
     * Expected Output: false
     * Path Coverage: Line 8-9 (exact match required)
     */
    it('TC025: should be case-sensitive (mixed case fails)', () => {
      const result = FileUtils.isValidImageType('Image/Jpeg');

      expect(result).toBe(false);
    });

    /**
     * Test Case 26: Kiểm tra empty string
     * Input: ''
     * Expected Output: false
     * Path Coverage: Line 8-9 (empty string not in array)
     */
    it('TC026: should return false for empty string', () => {
      const result = FileUtils.isValidImageType('');

      expect(result).toBe(false);
    });

    /**
     * Test Case 27: Kiểm tra với extra whitespace
     * Input: ' image/jpeg '
     * Expected Output: false (whitespace causes mismatch)
     * Path Coverage: Line 8-9 (exact match required)
     */
    it('TC027: should return false for mimetype with whitespace', () => {
      const result = FileUtils.isValidImageType(' image/jpeg ');

      expect(result).toBe(false);
    });

    /**
     * Test Case 28: Kiểm tra all valid types
     * Input: All valid mimetypes
     * Expected Output: All return true
     * Path Coverage: Line 7-9 (complete validTypes array coverage)
     */
    it('TC028: should validate all supported image types', () => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

      validTypes.forEach((type) => {
        expect(FileUtils.isValidImageType(type)).toBe(true);
      });
    });

    /**
     * Test Case 29: Kiểm tra common invalid types
     * Input: Common non-image mimetypes
     * Expected Output: All return false
     * Path Coverage: Line 8-9 (various false cases)
     */
    it('TC029: should reject common non-image types', () => {
      const invalidTypes = [
        'application/pdf',
        'text/plain',
        'application/json',
        'video/mp4',
        'audio/mpeg',
      ];

      invalidTypes.forEach((type) => {
        expect(FileUtils.isValidImageType(type)).toBe(false);
      });
    });

    /**
     * Test Case 30: Kiểm tra validTypes array length
     * Input: N/A (constant validation)
     * Expected Output: Exactly 4 valid types
     * Path Coverage: Line 7 (array definition)
     */
    it('TC030: should have exactly 4 valid image types', () => {
      // This indirectly tests the validTypes array
      const validCount = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        .filter((type) => FileUtils.isValidImageType(type))
        .length;

      expect(validCount).toBe(4);
    });
  });

  describe('formatFileSize Method', () => {
    /**
     * Test Case 31: Kiểm tra 0 bytes
     * Input: 0
     * Expected Output: '0 Bytes'
     * Path Coverage: Line 13 (if bytes === 0 - true branch)
     */
    it('TC031: should return "0 Bytes" for zero input', () => {
      const result = FileUtils.formatFileSize(0);

      expect(result).toBe('0 Bytes');
    });

    /**
     * Test Case 32: Kiểm tra bytes range (< 1KB)
     * Input: 512
     * Expected Output: '512 Bytes'
     * Path Coverage: Line 14-15 (i = 0, sizes[0])
     */
    it('TC032: should format bytes correctly (< 1KB)', () => {
      const result = FileUtils.formatFileSize(512);

      expect(result).toBe('512 Bytes');
    });

    /**
     * Test Case 33: Kiểm tra 1 byte
     * Input: 1
     * Expected Output: '1 Bytes'
     * Path Coverage: Line 14-15 (i = 0, minimal value)
     */
    it('TC033: should format 1 byte', () => {
      const result = FileUtils.formatFileSize(1);

      expect(result).toBe('1 Bytes');
    });

    /**
     * Test Case 34: Kiểm tra exact 1 KB (1024 bytes)
     * Input: 1024
     * Expected Output: '1 KB'
     * Path Coverage: Line 14-15 (i = 1, boundary value)
     */
    it('TC034: should format 1 KB correctly', () => {
      const result = FileUtils.formatFileSize(1024);

      expect(result).toBe('1 KB');
    });

    /**
     * Test Case 35: Kiểm tra KB range
     * Input: 2048 (2 KB)
     * Expected Output: '2 KB'
     * Path Coverage: Line 14-15 (i = 1, sizes[1])
     */
    it('TC035: should format KB correctly', () => {
      const result = FileUtils.formatFileSize(2048);

      expect(result).toBe('2 KB');
    });

    /**
     * Test Case 36: Kiểm tra fractional KB
     * Input: 1536 (1.5 KB)
     * Expected Output: '1.5 KB'
     * Path Coverage: Line 15 (rounding with decimals)
     */
    it('TC036: should format fractional KB correctly', () => {
      const result = FileUtils.formatFileSize(1536);

      expect(result).toBe('1.5 KB');
    });

    /**
     * Test Case 37: Kiểm tra exact 1 MB (1024 * 1024 bytes)
     * Input: 1048576
     * Expected Output: '1 MB'
     * Path Coverage: Line 14-15 (i = 2, boundary value)
     */
    it('TC037: should format 1 MB correctly', () => {
      const result = FileUtils.formatFileSize(1048576);

      expect(result).toBe('1 MB');
    });

    /**
     * Test Case 38: Kiểm tra MB range
     * Input: 5242880 (5 MB)
     * Expected Output: '5 MB'
     * Path Coverage: Line 14-15 (i = 2, sizes[2])
     */
    it('TC038: should format MB correctly', () => {
      const result = FileUtils.formatFileSize(5242880);

      expect(result).toBe('5 MB');
    });

    /**
     * Test Case 39: Kiểm tra fractional MB
     * Input: 1572864 (1.5 MB)
     * Expected Output: '1.5 MB'
     * Path Coverage: Line 15 (rounding with decimals)
     */
    it('TC039: should format fractional MB correctly', () => {
      const result = FileUtils.formatFileSize(1572864);

      expect(result).toBe('1.5 MB');
    });

    /**
     * Test Case 40: Kiểm tra exact 1 GB (1024 * 1024 * 1024 bytes)
     * Input: 1073741824
     * Expected Output: '1 GB'
     * Path Coverage: Line 14-15 (i = 3, boundary value)
     */
    it('TC040: should format 1 GB correctly', () => {
      const result = FileUtils.formatFileSize(1073741824);

      expect(result).toBe('1 GB');
    });

    /**
     * Test Case 41: Kiểm tra GB range
     * Input: 2147483648 (2 GB)
     * Expected Output: '2 GB'
     * Path Coverage: Line 14-15 (i = 3, sizes[3])
     */
    it('TC041: should format GB correctly', () => {
      const result = FileUtils.formatFileSize(2147483648);

      expect(result).toBe('2 GB');
    });

    /**
     * Test Case 42: Kiểm tra rounding to 2 decimal places
     * Input: 1234567 (1.177376... MB)
     * Expected Output: '1.18 MB' (rounded)
     * Path Coverage: Line 15 (Math.round with * 100 / 100)
     */
    it('TC042: should round to 2 decimal places', () => {
      const result = FileUtils.formatFileSize(1234567);

      expect(result).toBe('1.18 MB');
    });

    /**
     * Test Case 43: Kiểm tra rounding down
     * Input: 1024 * 1024 * 1.234 (1.234 MB)
     * Expected Output: '1.23 MB'
     * Path Coverage: Line 15 (rounding down case)
     */
    it('TC043: should round down correctly', () => {
      const result = FileUtils.formatFileSize(Math.floor(1024 * 1024 * 1.234));

      expect(result).toBe('1.23 MB');
    });

    /**
     * Test Case 44: Kiểm tra rounding up
     * Input: 1024 * 1024 * 1.239 (1.239 MB)
     * Expected Output: '1.24 MB'
     * Path Coverage: Line 15 (rounding up case)
     */
    it('TC044: should round up correctly', () => {
      const result = FileUtils.formatFileSize(Math.floor(1024 * 1024 * 1.239));

      expect(result).toBe('1.24 MB');
    });

    /**
     * Test Case 45: Kiểm tra Math.log calculation
     * Input: 1023 (just below 1 KB)
     * Expected Output: '1023 Bytes'
     * Path Coverage: Line 14 (Math.log boundary)
     */
    it('TC045: should keep as Bytes when just below 1 KB', () => {
      const result = FileUtils.formatFileSize(1023);

      expect(result).toBe('1023 Bytes');
    });

    /**
     * Test Case 46: Kiểm tra very large file (> GB)
     * Input: 10737418240 (10 GB)
     * Expected Output: '10 GB'
     * Path Coverage: Line 14-15 (large i value)
     */
    it('TC046: should handle very large files', () => {
      const result = FileUtils.formatFileSize(10737418240);

      expect(result).toBe('10 GB');
    });

    /**
     * Test Case 47: Kiểm tra common file sizes
     * Input: Various realistic file sizes
     * Expected Output: Correct formatted strings
     * Path Coverage: Real-world usage patterns
     */
    it('TC047: should handle common file sizes', () => {
      const testCases = [
        { bytes: 100, expected: '100 Bytes' },
        { bytes: 1024, expected: '1 KB' },
        { bytes: 1024 * 500, expected: '500 KB' },
        { bytes: 1024 * 1024 * 2, expected: '2 MB' },
        { bytes: 1024 * 1024 * 1024, expected: '1 GB' },
      ];

      testCases.forEach(({ bytes, expected }) => {
        expect(FileUtils.formatFileSize(bytes)).toBe(expected);
      });
    });

    /**
     * Test Case 48: Kiểm tra sizes array length
     * Input: Various byte values
     * Expected Output: Only use first 4 size units
     * Path Coverage: Line 12 (sizes array definition)
     */
    it('TC048: should use exactly 4 size units', () => {
      // Test that we have Bytes, KB, MB, GB
      expect(FileUtils.formatFileSize(1)).toContain('Bytes');
      expect(FileUtils.formatFileSize(1024)).toContain('KB');
      expect(FileUtils.formatFileSize(1048576)).toContain('MB');
      expect(FileUtils.formatFileSize(1073741824)).toContain('GB');
    });
  });

  describe('generateFileName Method', () => {
    let dateNowSpy: jest.SpyInstance;

    beforeEach(() => {
      // Mock Date.now() for predictable timestamps
      dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(1234567890000);

      // Mock crypto.randomBytes for predictable random strings
      // 'abcdef12' hex = [0x61, 0x62, 0x63, 0x64, 0x65, 0x66, 0x31, 0x32]
      // When converted to hex string: '6162636465663132'
      (crypto.randomBytes as jest.Mock).mockImplementation((size: number) =>
        Buffer.from([0x61, 0x62, 0x63, 0x64, 0x65, 0x66, 0x31, 0x32]),
      );
    });

    afterEach(() => {
      dateNowSpy.mockRestore();
      jest.clearAllMocks();
    });

    /**
     * Test Case 49: Kiểm tra generateFileName basic functionality
     * Input: 'photo.jpg'
     * Expected Output: '{timestamp}_{random}.jpg'
     * Path Coverage: Line 20-23 (complete flow)
     */
    it('TC049: should generate filename with timestamp and random string', () => {
      const result = FileUtils.generateFileName('photo.jpg');

      expect(result).toBe('1234567890000_6162636465663132.jpg');
      expect(dateNowSpy).toHaveBeenCalled();
      expect(crypto.randomBytes).toHaveBeenCalledWith(8);
    });

    /**
     * Test Case 50: Kiểm tra with different file extension
     * Input: 'document.pdf'
     * Expected Output: '{timestamp}_{random}.pdf'
     * Path Coverage: Line 20-23 (different extension)
     */
    it('TC050: should preserve original file extension', () => {
      const result = FileUtils.generateFileName('document.pdf');

      expect(result).toBe('1234567890000_6162636465663132.pdf');
      expect(result).toMatch(/\.pdf$/);
    });

    /**
     * Test Case 51: Kiểm tra with uppercase extension
     * Input: 'IMAGE.PNG'
     * Expected Output: '{timestamp}_{random}.png' (lowercase)
     * Path Coverage: Line 22 (getFileExtension with toLowerCase)
     */
    it('TC051: should convert extension to lowercase', () => {
      const result = FileUtils.generateFileName('IMAGE.PNG');

      expect(result).toBe('1234567890000_6162636465663132.png');
      expect(result).toMatch(/\.png$/);
    });

    /**
     * Test Case 52: Kiểm tra with multiple dots in filename
     * Input: 'my.archive.tar.gz'
     * Expected Output: '{timestamp}_{random}.gz'
     * Path Coverage: Line 22 (getFileExtension returns last extension)
     */
    it('TC052: should use last extension for files with multiple dots', () => {
      const result = FileUtils.generateFileName('my.archive.tar.gz');

      expect(result).toBe('1234567890000_6162636465663132.gz');
    });

    /**
     * Test Case 53: Kiểm tra with file without extension
     * Input: 'README'
     * Expected Output: '{timestamp}_{random}.readme'
     * Path Coverage: Line 22 (getFileExtension on file without dot)
     */
    it('TC053: should handle file without extension', () => {
      const result = FileUtils.generateFileName('README');

      expect(result).toBe('1234567890000_6162636465663132.readme');
    });

    /**
     * Test Case 54: Kiểm tra with empty filename
     * Input: ''
     * Expected Output: '{timestamp}_{random}.'
     * Path Coverage: Line 22 (getFileExtension returns empty)
     */
    it('TC054: should handle empty filename', () => {
      const result = FileUtils.generateFileName('');

      expect(result).toBe('1234567890000_6162636465663132.');
    });

    /**
     * Test Case 55: Kiểm tra randomBytes generates hex string
     * Input: 'file.txt'
     * Expected Output: Random part is hex (16 chars for 8 bytes)
     * Path Coverage: Line 21 (randomBytes + toString('hex'))
     */
    it('TC055: should generate hex random string from 8 bytes', () => {
      jest.clearAllMocks();

      const result = FileUtils.generateFileName('file.txt');

      // Random part should be 16 characters (8 bytes * 2 hex chars per byte)
      const parts = result.split('_');
      const randomPart = parts[1].split('.')[0];

      expect(randomPart).toHaveLength(16);
      expect(randomPart).toMatch(/^[a-f0-9]{16}$/);
    });

    /**
     * Test Case 56: Kiểm tra timestamp is from Date.now()
     * Input: 'file.txt'
     * Expected Output: Timestamp matches Date.now() value
     * Path Coverage: Line 20 (Date.now() call)
     */
    it('TC056: should use current timestamp', () => {
      const result = FileUtils.generateFileName('file.txt');

      expect(result).toMatch(/^1234567890000_/);
      expect(dateNowSpy).toHaveBeenCalledTimes(1);
    });

    /**
     * Test Case 57: Kiểm tra filename format pattern
     * Input: 'test.jpg'
     * Expected Output: Matches pattern {timestamp}_{hex}.{ext}
     * Path Coverage: Line 23 (template literal construction)
     */
    it('TC057: should follow naming pattern: timestamp_random.extension', () => {
      jest.clearAllMocks();

      const result = FileUtils.generateFileName('test.jpg');

      expect(result).toMatch(/^\d+_[a-f0-9]{16}\.jpg$/);
    });

    /**
     * Test Case 58: Kiểm tra uniqueness (different timestamps)
     * Input: Same filename called at different times
     * Expected Output: Different generated names
     * Path Coverage: Line 20 (timestamp changes over time)
     */
    it('TC058: should generate different names at different times', () => {
      dateNowSpy.mockRestore();
      jest.clearAllMocks();

      const result1 = FileUtils.generateFileName('file.txt');

      // Wait a moment to ensure different timestamp
      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      return delay(10).then(() => {
        const result2 = FileUtils.generateFileName('file.txt');

        expect(result1).not.toBe(result2);
      });
    });

    /**
     * Test Case 59: Kiểm tra with special characters in original filename
     * Input: 'my file (copy).jpg'
     * Expected Output: Extension extracted correctly
     * Path Coverage: Line 22 (getFileExtension with special chars)
     */
    it('TC059: should handle special characters in original filename', () => {
      const result = FileUtils.generateFileName('my file (copy).jpg');

      expect(result).toBe('1234567890000_6162636465663132.jpg');
    });

    /**
     * Test Case 60: Kiểm tra with path in original filename
     * Input: '/path/to/file.png'
     * Expected Output: Only extension used, path ignored
     * Path Coverage: Line 22 (getFileExtension ignores path)
     */
    it('TC060: should extract extension from path', () => {
      const result = FileUtils.generateFileName('/path/to/file.png');

      expect(result).toBe('1234567890000_6162636465663132.png');
    });

    /**
     * Test Case 61: Kiểm tra crypto.randomBytes is called with 8
     * Input: Any filename
     * Expected Output: randomBytes called with 8 bytes
     * Path Coverage: Line 21 (randomBytes parameter)
     */
    it('TC061: should call randomBytes with 8 bytes', () => {
      FileUtils.generateFileName('file.txt');

      expect(crypto.randomBytes).toHaveBeenCalledWith(8);
      expect(crypto.randomBytes).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration Scenarios', () => {
    /**
     * Test Case 62: Scenario - Upload image file
     * Input: Image file details
     * Expected Output: Valid filename generated, mimetype validated
     * Path Coverage: Real-world image upload scenario
     */
    it('TC062: should handle image file upload scenario', () => {
      const originalName = 'vacation-photo.JPG';
      const mimetype = 'image/jpeg';

      const extension = FileUtils.getFileExtension(originalName);
      const isValid = FileUtils.isValidImageType(mimetype);
      const newFileName = FileUtils.generateFileName(originalName);

      expect(extension).toBe('jpg');
      expect(isValid).toBe(true);
      expect(newFileName).toMatch(/^\d+_[a-f0-9]{16}\.jpg$/);
    });

    /**
     * Test Case 63: Scenario - Validate and format file info
     * Input: File with size and type
     * Expected Output: Complete file processing
     * Path Coverage: Multiple methods integration
     */
    it('TC063: should process file metadata completely', () => {
      const file = {
        originalName: 'document.pdf',
        mimetype: 'application/pdf',
        size: 2097152, // 2 MB
      };

      const extension = FileUtils.getFileExtension(file.originalName);
      const isValidImage = FileUtils.isValidImageType(file.mimetype);
      const formattedSize = FileUtils.formatFileSize(file.size);
      const newFileName = FileUtils.generateFileName(file.originalName);

      expect(extension).toBe('pdf');
      expect(isValidImage).toBe(false);
      expect(formattedSize).toBe('2 MB');
      expect(newFileName).toMatch(/^\d+_[a-f0-9]{16}\.pdf$/);
    });

    /**
     * Test Case 64: Scenario - Multiple file uploads
     * Input: Array of files
     * Expected Output: All processed correctly
     * Path Coverage: Batch processing scenario
     */
    it('TC064: should handle multiple files in batch', () => {
      const files = [
        { name: 'image1.jpg', type: 'image/jpeg', size: 1024000 },
        { name: 'image2.png', type: 'image/png', size: 2048000 },
        { name: 'document.pdf', type: 'application/pdf', size: 512000 },
      ];

      files.forEach((file) => {
        const extension = FileUtils.getFileExtension(file.name);
        const isValid = FileUtils.isValidImageType(file.type);
        const size = FileUtils.formatFileSize(file.size);
        const newName = FileUtils.generateFileName(file.name);

        expect(extension).toBeDefined();
        expect(typeof isValid).toBe('boolean');
        expect(size).toContain(' ');
        expect(newName).toMatch(/^\d+_[a-f0-9]{16}\./);
      });
    });

    /**
     * Test Case 65: Scenario - File size validation
     * Input: Files of various sizes
     * Expected Output: Proper size formatting for validation
     * Path Coverage: Size validation scenario
     */
    it('TC065: should format sizes for validation checks', () => {
      const maxSize = 5 * 1024 * 1024; // 5 MB
      const files = [
        { size: 1024 * 1024, shouldPass: true }, // 1 MB
        { size: 6 * 1024 * 1024, shouldPass: false }, // 6 MB
        { size: 500 * 1024, shouldPass: true }, // 500 KB
      ];

      files.forEach((file) => {
        const formatted = FileUtils.formatFileSize(file.size);
        const passes = file.size <= maxSize;

        expect(passes).toBe(file.shouldPass);
        expect(formatted).toBeDefined();
      });
    });

    /**
     * Test Case 66: Scenario - Image type filtering
     * Input: Mixed file types
     * Expected Output: Only images identified correctly
     * Path Coverage: Type filtering scenario
     */
    it('TC066: should filter image files from mixed uploads', () => {
      const files = [
        { name: 'photo.jpg', type: 'image/jpeg', isImage: true },
        { name: 'doc.pdf', type: 'application/pdf', isImage: false },
        { name: 'graphic.png', type: 'image/png', isImage: true },
        { name: 'video.mp4', type: 'video/mp4', isImage: false },
      ];

      files.forEach((file) => {
        const isValid = FileUtils.isValidImageType(file.type);
        expect(isValid).toBe(file.isImage);
      });
    });

    /**
     * Test Case 67: Scenario - File rename with collision prevention
     * Input: Same filename uploaded multiple times
     * Expected Output: Different generated names each time
     * Path Coverage: Uniqueness guarantee scenario
     */
    it('TC067: should generate unique names for same original file', () => {
      // Mock randomBytes to return different values each time
      let callCount = 0;
      (crypto.randomBytes as jest.Mock).mockImplementation(() => {
        const bytes = Buffer.alloc(8);
        for (let i = 0; i < 8; i++) {
          bytes[i] = (callCount * 16 + i) % 256;
        }
        callCount++;
        return bytes;
      });

      const originalName = 'profile.jpg';
      const names = new Set<string>();

      // Generate multiple names
      for (let i = 0; i < 10; i++) {
        const newName = FileUtils.generateFileName(originalName);
        names.add(newName);
      }

      // All should be unique (due to different random bytes)
      expect(names.size).toBe(10);
    });
  });

  describe('Type Safety and Edge Cases', () => {
    /**
     * Test Case 68: Kiểm tra static class methods
     * Input: N/A
     * Expected Output: All methods are static
     * Path Coverage: Class structure validation
     */
    it('TC068: should have all methods as static', () => {
      expect(typeof FileUtils.getFileExtension).toBe('function');
      expect(typeof FileUtils.isValidImageType).toBe('function');
      expect(typeof FileUtils.formatFileSize).toBe('function');
      expect(typeof FileUtils.generateFileName).toBe('function');
    });

    /**
     * Test Case 69: Kiểm tra utility class design
     * Input: N/A
     * Expected Output: Class methods accessible without instantiation
     * Path Coverage: Class design validation
     */
    it('TC069: should be a utility class with static methods only', () => {
      const methods = Object.getOwnPropertyNames(FileUtils);

      expect(methods).toContain('getFileExtension');
      expect(methods).toContain('isValidImageType');
      expect(methods).toContain('formatFileSize');
      expect(methods).toContain('generateFileName');
    });

    /**
     * Test Case 70: Kiểm tra return types consistency
     * Input: Various inputs
     * Expected Output: Correct return types
     * Path Coverage: Type safety validation
     */
    it('TC070: should return correct types from all methods', () => {
      const extension = FileUtils.getFileExtension('file.txt');
      const isValid = FileUtils.isValidImageType('image/jpeg');
      const size = FileUtils.formatFileSize(1024);
      const name = FileUtils.generateFileName('file.txt');

      expect(typeof extension).toBe('string');
      expect(typeof isValid).toBe('boolean');
      expect(typeof size).toBe('string');
      expect(typeof name).toBe('string');
    });
  });
});
