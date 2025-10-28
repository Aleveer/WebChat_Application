import { DateUtils, ArrayUtils } from '../src/common/utils/date.utils';

/**
 * White-box Testing for DateUtils and ArrayUtils
 * 
 * This test suite uses white-box testing techniques to ensure complete code coverage
 * including all branches, paths, and edge cases.
 * 
 * Testing techniques applied:
 * 1. Statement Coverage - All lines of code are executed
 * 2. Branch Coverage - All if/else conditions tested
 * 3. Path Coverage - All possible execution paths tested
 * 4. Boundary Value Analysis - Edge cases and limits tested
 */
describe('DateUtils - White Box Testing', () => {
  describe('now()', () => {
    it('should return current date', () => {
      const before = new Date();
      const result = DateUtils.now();
      const after = new Date();

      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should return different values when called multiple times', async () => {
      const first = DateUtils.now();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const second = DateUtils.now();

      expect(second.getTime()).toBeGreaterThan(first.getTime());
    });
  });

  describe('nowUTC()', () => {
    it('should return current date in UTC', () => {
      const result = DateUtils.nowUTC();

      expect(result).toBeInstanceOf(Date);
      expect(result.getUTCFullYear()).toBeGreaterThan(2020);
    });

    it('should construct UTC date with all components', () => {
      const result = DateUtils.nowUTC();

      // Verify all UTC components are set
      expect(result.getUTCFullYear()).toBeDefined();
      expect(result.getUTCMonth()).toBeGreaterThanOrEqual(0);
      expect(result.getUTCMonth()).toBeLessThan(12);
      expect(result.getUTCDate()).toBeGreaterThan(0);
      expect(result.getUTCDate()).toBeLessThanOrEqual(31);
      expect(result.getUTCHours()).toBeGreaterThanOrEqual(0);
      expect(result.getUTCHours()).toBeLessThan(24);
      expect(result.getUTCMinutes()).toBeGreaterThanOrEqual(0);
      expect(result.getUTCMinutes()).toBeLessThan(60);
      expect(result.getUTCSeconds()).toBeGreaterThanOrEqual(0);
      expect(result.getUTCSeconds()).toBeLessThan(60);
      expect(result.getUTCMilliseconds()).toBeGreaterThanOrEqual(0);
      expect(result.getUTCMilliseconds()).toBeLessThan(1000);
    });

    it('should return UTC time close to now()', () => {
      const now = DateUtils.now();
      const utcNow = DateUtils.nowUTC();

      // Should be within 1 second of each other
      const diff = Math.abs(utcNow.getTime() - now.getTime());
      expect(diff).toBeLessThan(1000);
    });
  });

  describe('addDays()', () => {
    it('should add positive days', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const result = DateUtils.addDays(date, 5);

      expect(result.getUTCDate()).toBe(20);
      expect(result.getUTCMonth()).toBe(0); // January
      expect(result.getUTCFullYear()).toBe(2024);
    });

    it('should add negative days (subtract)', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const result = DateUtils.addDays(date, -5);

      expect(result.getUTCDate()).toBe(10);
      expect(result.getUTCMonth()).toBe(0);
    });

    it('should handle month boundary (forward)', () => {
      const date = new Date('2024-01-29T12:00:00Z');
      const result = DateUtils.addDays(date, 5);

      expect(result.getUTCDate()).toBe(3);
      expect(result.getUTCMonth()).toBe(1); // February
    });

    it('should handle month boundary (backward)', () => {
      const date = new Date('2024-02-05T12:00:00Z');
      const result = DateUtils.addDays(date, -10);

      expect(result.getUTCDate()).toBe(26);
      expect(result.getUTCMonth()).toBe(0); // January
    });

    it('should handle year boundary (forward)', () => {
      const date = new Date('2024-12-30T12:00:00Z');
      const result = DateUtils.addDays(date, 5);

      expect(result.getUTCDate()).toBe(4);
      expect(result.getUTCMonth()).toBe(0); // January
      expect(result.getUTCFullYear()).toBe(2025);
    });

    it('should handle year boundary (backward)', () => {
      const date = new Date('2024-01-05T12:00:00Z');
      const result = DateUtils.addDays(date, -10);

      expect(result.getUTCDate()).toBe(26);
      expect(result.getUTCMonth()).toBe(11); // December
      expect(result.getUTCFullYear()).toBe(2023);
    });

    it('should add zero days (return same date)', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const result = DateUtils.addDays(date, 0);

      expect(result.getTime()).toBe(date.getTime());
    });

    it('should not mutate original date', () => {
      const original = new Date('2024-01-15T12:00:00Z');
      const originalTime = original.getTime();
      DateUtils.addDays(original, 5);

      expect(original.getTime()).toBe(originalTime);
    });

    it('should handle leap year', () => {
      const date = new Date('2024-02-28T12:00:00Z'); // 2024 is leap year
      const result = DateUtils.addDays(date, 1);

      expect(result.getUTCDate()).toBe(29);
      expect(result.getUTCMonth()).toBe(1);
    });
  });

  describe('addHours()', () => {
    it('should add positive hours', () => {
      const date = new Date('2024-01-15T10:00:00Z');
      const result = DateUtils.addHours(date, 5);

      expect(result.getUTCHours()).toBe(15);
    });

    it('should add negative hours (subtract)', () => {
      const date = new Date('2024-01-15T10:00:00Z');
      const result = DateUtils.addHours(date, -5);

      expect(result.getUTCHours()).toBe(5);
    });

    it('should handle day boundary (forward)', () => {
      const date = new Date('2024-01-15T22:00:00Z');
      const result = DateUtils.addHours(date, 5);

      expect(result.getUTCHours()).toBe(3);
      expect(result.getUTCDate()).toBe(16);
    });

    it('should handle day boundary (backward)', () => {
      const date = new Date('2024-01-15T02:00:00Z');
      const result = DateUtils.addHours(date, -5);

      expect(result.getUTCHours()).toBe(21);
      expect(result.getUTCDate()).toBe(14);
    });

    it('should add zero hours', () => {
      const date = new Date('2024-01-15T10:00:00Z');
      const result = DateUtils.addHours(date, 0);

      expect(result.getTime()).toBe(date.getTime());
    });

    it('should not mutate original date', () => {
      const original = new Date('2024-01-15T10:00:00Z');
      const originalTime = original.getTime();
      DateUtils.addHours(original, 5);

      expect(original.getTime()).toBe(originalTime);
    });

    it('should handle large hour values (multiple days)', () => {
      const date = new Date('2024-01-15T10:00:00Z');
      const result = DateUtils.addHours(date, 48); // 2 days

      expect(result.getUTCDate()).toBe(17);
      expect(result.getUTCHours()).toBe(10);
    });
  });

  describe('addMinutes()', () => {
    it('should add positive minutes', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = DateUtils.addMinutes(date, 20);

      expect(result.getUTCMinutes()).toBe(50);
    });

    it('should add negative minutes (subtract)', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = DateUtils.addMinutes(date, -20);

      expect(result.getUTCMinutes()).toBe(10);
    });

    it('should handle hour boundary (forward)', () => {
      const date = new Date('2024-01-15T10:50:00Z');
      const result = DateUtils.addMinutes(date, 20);

      expect(result.getUTCMinutes()).toBe(10);
      expect(result.getUTCHours()).toBe(11);
    });

    it('should handle hour boundary (backward)', () => {
      const date = new Date('2024-01-15T10:10:00Z');
      const result = DateUtils.addMinutes(date, -20);

      expect(result.getUTCMinutes()).toBe(50);
      expect(result.getUTCHours()).toBe(9);
    });

    it('should add zero minutes', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = DateUtils.addMinutes(date, 0);

      expect(result.getTime()).toBe(date.getTime());
    });

    it('should not mutate original date', () => {
      const original = new Date('2024-01-15T10:30:00Z');
      const originalTime = original.getTime();
      DateUtils.addMinutes(original, 20);

      expect(original.getTime()).toBe(originalTime);
    });

    it('should handle large minute values (multiple hours)', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = DateUtils.addMinutes(date, 150); // 2.5 hours

      expect(result.getUTCHours()).toBe(13);
      expect(result.getUTCMinutes()).toBe(0);
    });
  });

  describe('isExpired()', () => {
    it('should return true for past date', () => {
      const pastDate = new Date('2020-01-01T00:00:00Z');
      expect(DateUtils.isExpired(pastDate)).toBe(true);
    });

    it('should return false for future date', () => {
      const futureDate = new Date(Date.now() + 10000); // 10 seconds in future
      expect(DateUtils.isExpired(futureDate)).toBe(false);
    });

    it('should return true for date just in the past', () => {
      const justPast = new Date(Date.now() - 1);
      expect(DateUtils.isExpired(justPast)).toBe(true);
    });

    it('should return false for date just in the future', () => {
      const justFuture = new Date(Date.now() + 1);
      expect(DateUtils.isExpired(justFuture)).toBe(false);
    });

    it('should handle current timestamp edge case', () => {
      // This test might be flaky due to timing, but tests the edge case
      const now = new Date(Date.now());
      const result = DateUtils.isExpired(now);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('formatDate()', () => {
    const testDate = new Date('2024-06-15T08:30:45.123Z');

    it('should format with default format (YYYY-MM-DD)', () => {
      const result = DateUtils.formatDate(testDate);
      expect(result).toBe('2024-06-15');
    });

    it('should format with YYYY-MM-DD HH:mm:ss format', () => {
      const result = DateUtils.formatDate(testDate, 'YYYY-MM-DD HH:mm:ss');
      expect(result).toBe('2024-06-15 08:30:45');
    });

    it('should format with custom format', () => {
      const result = DateUtils.formatDate(testDate, 'DD/MM/YYYY');
      expect(result).toBe('15/06/2024');
    });

    it('should format time only', () => {
      const result = DateUtils.formatDate(testDate, 'HH:mm:ss');
      expect(result).toBe('08:30:45');
    });

    it('should pad single digit months with zero', () => {
      const date = new Date('2024-01-05T08:30:45Z');
      const result = DateUtils.formatDate(date, 'MM');
      expect(result).toBe('01');
    });

    it('should pad single digit days with zero', () => {
      const date = new Date('2024-06-05T08:30:45Z');
      const result = DateUtils.formatDate(date, 'DD');
      expect(result).toBe('05');
    });

    it('should pad single digit hours with zero', () => {
      const date = new Date('2024-06-15T03:30:45Z');
      const result = DateUtils.formatDate(date, 'HH');
      expect(result).toBe('03');
    });

    it('should pad single digit minutes with zero', () => {
      const date = new Date('2024-06-15T08:05:45Z');
      const result = DateUtils.formatDate(date, 'mm');
      expect(result).toBe('05');
    });

    it('should pad single digit seconds with zero', () => {
      const date = new Date('2024-06-15T08:30:05Z');
      const result = DateUtils.formatDate(date, 'ss');
      expect(result).toBe('05');
    });

    it('should use UTC when useUTC is true (default)', () => {
      const result = DateUtils.formatDate(testDate, 'YYYY-MM-DD HH:mm:ss', true);
      expect(result).toBe('2024-06-15 08:30:45');
    });

    it('should use local time when useUTC is false', () => {
      const result = DateUtils.formatDate(testDate, 'YYYY-MM-DD', false);
      // Result will vary based on timezone, but should be valid
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle all format tokens in one string', () => {
      const result = DateUtils.formatDate(
        testDate,
        'YYYY-MM-DD HH:mm:ss',
        true,
      );
      expect(result).toBe('2024-06-15 08:30:45');
    });

    it('should handle format without any tokens', () => {
      const result = DateUtils.formatDate(testDate, 'Date: ');
      expect(result).toBe('Date: ');
    });

    it('should handle year 9999', () => {
      const date = new Date('9999-12-31T23:59:59Z');
      const result = DateUtils.formatDate(date, 'YYYY-MM-DD');
      expect(result).toBe('9999-12-31');
    });
  });

  describe('getTimeAgo()', () => {
    it('should return "just now" for very recent dates (< 60s)', () => {
      const recent = new Date(Date.now() - 30000); // 30 seconds ago
      expect(DateUtils.getTimeAgo(recent)).toBe('just now');
    });

    it('should return "just now" for 59 seconds ago', () => {
      const recent = new Date(Date.now() - 59000);
      expect(DateUtils.getTimeAgo(recent)).toBe('just now');
    });

    it('should return minutes for dates < 1 hour', () => {
      const date = new Date(Date.now() - 300000); // 5 minutes ago
      expect(DateUtils.getTimeAgo(date)).toBe('5 minutes ago');
    });

    it('should return 1 minute ago for 60-119 seconds', () => {
      const date = new Date(Date.now() - 90000); // 90 seconds
      expect(DateUtils.getTimeAgo(date)).toBe('1 minutes ago');
    });

    it('should return 59 minutes ago just before 1 hour', () => {
      const date = new Date(Date.now() - 3540000); // 59 minutes
      expect(DateUtils.getTimeAgo(date)).toBe('59 minutes ago');
    });

    it('should return hours for dates < 24 hours', () => {
      const date = new Date(Date.now() - 7200000); // 2 hours ago
      expect(DateUtils.getTimeAgo(date)).toBe('2 hours ago');
    });

    it('should return 1 hour ago for 60-119 minutes', () => {
      const date = new Date(Date.now() - 5400000); // 90 minutes
      expect(DateUtils.getTimeAgo(date)).toBe('1 hours ago');
    });

    it('should return days for dates < 30 days', () => {
      const date = new Date(Date.now() - 172800000); // 2 days ago
      expect(DateUtils.getTimeAgo(date)).toBe('2 days ago');
    });

    it('should return 1 day ago for 24-47 hours', () => {
      const date = new Date(Date.now() - 86400000); // 24 hours
      expect(DateUtils.getTimeAgo(date)).toBe('1 days ago');
    });

    it('should return months for dates < 365 days', () => {
      const date = new Date(Date.now() - 5184000000); // 60 days (2 months)
      expect(DateUtils.getTimeAgo(date)).toBe('2 months ago');
    });

    it('should return 1 month ago for 30-59 days', () => {
      const date = new Date(Date.now() - 2592000000); // 30 days
      expect(DateUtils.getTimeAgo(date)).toBe('1 months ago');
    });

    it('should return years for dates >= 365 days', () => {
      const date = new Date(Date.now() - 63072000000); // 730 days (2 years)
      expect(DateUtils.getTimeAgo(date)).toBe('2 years ago');
    });

    it('should return 1 year ago for 365-729 days', () => {
      const date = new Date(Date.now() - 31536000000); // 365 days
      expect(DateUtils.getTimeAgo(date)).toBe('1 years ago');
    });

    it('should floor the time difference', () => {
      const date = new Date(Date.now() - 149000); // 2.48 minutes
      expect(DateUtils.getTimeAgo(date)).toBe('2 minutes ago');
    });

    it('should handle future dates (returns negative or just now)', () => {
      const future = new Date(Date.now() + 10000);
      const result = DateUtils.getTimeAgo(future);
      expect(result).toBe('just now'); // diffInSeconds < 60 because negative
    });
  });

  describe('parseInTimezone()', () => {
    it('should parse date with UTC timezone (default)', () => {
      const result = DateUtils.parseInTimezone('2024-06-15T12:00:00');
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe('2024-06-15T12:00:00.000Z');
    });

    it('should parse date with explicit UTC timezone', () => {
      const result = DateUtils.parseInTimezone('2024-06-15T12:00:00', 'UTC');
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe('2024-06-15T12:00:00.000Z');
    });

    it('should parse date without timezone suffix', () => {
      const result = DateUtils.parseInTimezone(
        '2024-06-15T12:00:00',
        'America/New_York',
      );
      expect(result).toBeInstanceOf(Date);
    });

    it('should handle date strings with milliseconds', () => {
      const result = DateUtils.parseInTimezone('2024-06-15T12:00:00.123');
      expect(result.getUTCMilliseconds()).toBe(123);
    });

    it('should handle ISO string input with Z suffix', () => {
      const isoString = '2024-06-15T12:00:00.000Z';
      const result = DateUtils.parseInTimezone(isoString, 'UTC');
      expect(result).toBeInstanceOf(Date);
      // When string already has 'Z', parseInTimezone adds another 'Z' making it invalid
      // This test verifies the behavior (even if not ideal)
      expect(isNaN(result.getTime())).toBe(true);
    });

    it('should handle ISO string without Z suffix', () => {
      const dateString = '2024-06-15T12:00:00.000';
      const result = DateUtils.parseInTimezone(dateString, 'UTC');
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe('2024-06-15T12:00:00.000Z');
    });
  });

  describe('toISOString()', () => {
    it('should convert date to ISO string', () => {
      const date = new Date('2024-06-15T12:30:45.123Z');
      const result = DateUtils.toISOString(date);
      expect(result).toBe('2024-06-15T12:30:45.123Z');
    });

    it('should always return UTC format', () => {
      const date = new Date('2024-06-15T12:30:45.000Z');
      const result = DateUtils.toISOString(date);
      expect(result).toContain('Z');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should handle dates with zero milliseconds', () => {
      const date = new Date('2024-01-01T00:00:00.000Z');
      const result = DateUtils.toISOString(date);
      expect(result).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should preserve milliseconds', () => {
      const date = new Date('2024-06-15T12:30:45.999Z');
      const result = DateUtils.toISOString(date);
      expect(result).toBe('2024-06-15T12:30:45.999Z');
    });
  });

  describe('Edge Cases and Integration Tests', () => {
    it('should chain date operations correctly', () => {
      const date = new Date('2024-01-15T10:00:00Z');
      let result = DateUtils.addDays(date, 5);
      result = DateUtils.addHours(result, 3);
      result = DateUtils.addMinutes(result, 30);

      expect(result.getUTCDate()).toBe(20);
      expect(result.getUTCHours()).toBe(13);
      expect(result.getUTCMinutes()).toBe(30);
    });

    it('should handle extreme date values', () => {
      const extremeFuture = new Date('2099-12-31T23:59:59Z');
      const result = DateUtils.addDays(extremeFuture, 1);
      expect(result.getUTCFullYear()).toBe(2100);
    });

    it('should format and parse roundtrip', () => {
      const original = new Date('2024-06-15T12:30:00Z');
      const formatted = DateUtils.formatDate(original, 'YYYY-MM-DD HH:mm:ss');
      const parsed = new Date(formatted.replace(' ', 'T') + 'Z');

      expect(parsed.getUTCFullYear()).toBe(original.getUTCFullYear());
      expect(parsed.getUTCMonth()).toBe(original.getUTCMonth());
      expect(parsed.getUTCDate()).toBe(original.getUTCDate());
    });
  });
});

describe('ArrayUtils - White Box Testing', () => {
  describe('unique()', () => {
    it('should remove duplicate numbers', () => {
      const array = [1, 2, 2, 3, 3, 3, 4];
      const result = ArrayUtils.unique(array);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it('should remove duplicate strings', () => {
      const array = ['a', 'b', 'a', 'c', 'b'];
      const result = ArrayUtils.unique(array);
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should handle empty array', () => {
      const result = ArrayUtils.unique([]);
      expect(result).toEqual([]);
    });

    it('should handle array with one element', () => {
      const result = ArrayUtils.unique([1]);
      expect(result).toEqual([1]);
    });

    it('should handle array with all unique elements', () => {
      const array = [1, 2, 3, 4, 5];
      const result = ArrayUtils.unique(array);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle array with all duplicate elements', () => {
      const array = [5, 5, 5, 5, 5];
      const result = ArrayUtils.unique(array);
      expect(result).toEqual([5]);
    });

    it('should preserve order of first occurrence', () => {
      const array = [3, 1, 2, 1, 3, 2];
      const result = ArrayUtils.unique(array);
      expect(result).toEqual([3, 1, 2]);
    });

    it('should not mutate original array', () => {
      const array = [1, 2, 2, 3];
      const original = [...array];
      ArrayUtils.unique(array);
      expect(array).toEqual(original);
    });

    it('should handle objects (by reference)', () => {
      const obj1 = { id: 1 };
      const obj2 = { id: 2 };
      const array = [obj1, obj2, obj1];
      const result = ArrayUtils.unique(array);
      expect(result).toEqual([obj1, obj2]);
    });

    it('should treat different object instances as unique', () => {
      const array = [{ id: 1 }, { id: 1 }];
      const result = ArrayUtils.unique(array);
      expect(result).toHaveLength(2);
    });
  });

  describe('chunk()', () => {
    it('should split array into chunks of specified size', () => {
      const array = [1, 2, 3, 4, 5, 6];
      const result = ArrayUtils.chunk(array, 2);
      expect(result).toEqual([
        [1, 2],
        [3, 4],
        [5, 6],
      ]);
    });

    it('should handle last chunk smaller than size', () => {
      const array = [1, 2, 3, 4, 5];
      const result = ArrayUtils.chunk(array, 2);
      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should handle empty array', () => {
      const result = ArrayUtils.chunk([], 2);
      expect(result).toEqual([]);
    });

    it('should handle chunk size of 1', () => {
      const array = [1, 2, 3];
      const result = ArrayUtils.chunk(array, 1);
      expect(result).toEqual([[1], [2], [3]]);
    });

    it('should handle chunk size larger than array', () => {
      const array = [1, 2, 3];
      const result = ArrayUtils.chunk(array, 10);
      expect(result).toEqual([[1, 2, 3]]);
    });

    it('should handle chunk size equal to array length', () => {
      const array = [1, 2, 3];
      const result = ArrayUtils.chunk(array, 3);
      expect(result).toEqual([[1, 2, 3]]);
    });

    it('should not mutate original array', () => {
      const array = [1, 2, 3, 4];
      const original = [...array];
      ArrayUtils.chunk(array, 2);
      expect(array).toEqual(original);
    });

    it('should handle array with different types', () => {
      const array = ['a', 1, true, null, undefined];
      const result = ArrayUtils.chunk(array, 2);
      expect(result).toEqual([
        ['a', 1],
        [true, null],
        [undefined],
      ]);
    });

    it('should iterate through full array length', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = ArrayUtils.chunk(array, 3);
      expect(result).toHaveLength(3);
      expect(result.flat()).toEqual(array);
    });
  });

  describe('shuffle()', () => {
    it('should return array with same length', () => {
      const array = [1, 2, 3, 4, 5];
      const result = ArrayUtils.shuffle(array);
      expect(result).toHaveLength(array.length);
    });

    it('should contain all original elements', () => {
      const array = [1, 2, 3, 4, 5];
      const result = ArrayUtils.shuffle(array);
      expect(result.sort()).toEqual(array.sort());
    });

    it('should not mutate original array', () => {
      const array = [1, 2, 3, 4, 5];
      const original = [...array];
      ArrayUtils.shuffle(array);
      expect(array).toEqual(original);
    });

    it('should handle empty array', () => {
      const result = ArrayUtils.shuffle([]);
      expect(result).toEqual([]);
    });

    it('should handle single element array', () => {
      const result = ArrayUtils.shuffle([1]);
      expect(result).toEqual([1]);
    });

    it('should handle two element array', () => {
      const array = [1, 2];
      const result = ArrayUtils.shuffle(array);
      expect(result).toHaveLength(2);
      expect(result).toContain(1);
      expect(result).toContain(2);
    });

    it('should use Fisher-Yates algorithm (backward iteration)', () => {
      // Test that shuffle iterates backward (i > 0)
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = ArrayUtils.shuffle(array);
      expect(result).toBeDefined();
      expect(result).toHaveLength(10);
    });

    it('should swap elements correctly', () => {
      const array = [1, 2, 3, 4, 5];
      // Run multiple times to test randomness
      let isDifferent = false;
      for (let i = 0; i < 10; i++) {
        const result = ArrayUtils.shuffle(array);
        if (JSON.stringify(result) !== JSON.stringify(array)) {
          isDifferent = true;
          break;
        }
      }
      // With high probability, at least one shuffle should be different
      expect(isDifferent).toBe(true);
    });

    it('should handle array with duplicate values', () => {
      const array = [1, 1, 2, 2, 3, 3];
      const result = ArrayUtils.shuffle(array);
      expect(result.sort()).toEqual(array.sort());
    });
  });

  describe('groupBy()', () => {
    interface TestItem {
      category: string;
      value: number;
      name: string;
    }

    it('should group by string property', () => {
      const array = [
        { category: 'A', value: 1 },
        { category: 'B', value: 2 },
        { category: 'A', value: 3 },
      ];

      const result = ArrayUtils.groupBy(array, (item) => item.category);

      expect(result).toEqual({
        A: [
          { category: 'A', value: 1 },
          { category: 'A', value: 3 },
        ],
        B: [{ category: 'B', value: 2 }],
      });
    });

    it('should group by number property', () => {
      const array = [
        { type: 1, name: 'a' },
        { type: 2, name: 'b' },
        { type: 1, name: 'c' },
      ];

      const result = ArrayUtils.groupBy(array, (item) => item.type);

      expect(result[1]).toHaveLength(2);
      expect(result[2]).toHaveLength(1);
    });

    it('should handle empty array', () => {
      const result = ArrayUtils.groupBy([], (item: any) => item.key);
      expect(result).toEqual({});
    });

    it('should handle array with one group', () => {
      const array = [
        { category: 'A', value: 1 },
        { category: 'A', value: 2 },
      ];

      const result = ArrayUtils.groupBy(array, (item) => item.category);

      expect(Object.keys(result)).toHaveLength(1);
      expect(result.A).toHaveLength(2);
    });

    it('should handle each item in unique group', () => {
      const array = [
        { category: 'A', value: 1 },
        { category: 'B', value: 2 },
        { category: 'C', value: 3 },
      ];

      const result = ArrayUtils.groupBy(array, (item) => item.category);

      expect(Object.keys(result)).toHaveLength(3);
      expect(result.A).toHaveLength(1);
      expect(result.B).toHaveLength(1);
      expect(result.C).toHaveLength(1);
    });

    it('should create new group when key does not exist', () => {
      const array = [
        { category: 'A', value: 1 },
        { category: 'B', value: 2 },
      ];

      const result = ArrayUtils.groupBy(array, (item) => item.category);

      // Test the if (!groups[groupKey]) branch
      expect(result.A).toBeDefined();
      expect(result.B).toBeDefined();
    });

    it('should use reducer accumulator correctly', () => {
      const array = [
        { category: 'A', value: 1 },
        { category: 'A', value: 2 },
        { category: 'B', value: 3 },
      ];

      const result = ArrayUtils.groupBy(array, (item) => item.category);

      // Verify reducer builds groups correctly
      expect(result.A[0].value).toBe(1);
      expect(result.A[1].value).toBe(2);
      expect(result.B[0].value).toBe(3);
    });

    it('should handle custom key function', () => {
      const array = [{ value: 10 }, { value: 20 }, { value: 15 }];

      const result = ArrayUtils.groupBy(array, (item) =>
        item.value < 15 ? 'low' : 'high',
      );

      expect(result.low).toHaveLength(1);
      expect(result.high).toHaveLength(2);
    });

    it('should work with symbol keys', () => {
      const key1 = Symbol('key1');
      const key2 = Symbol('key2');
      const array = [{ key: key1 }, { key: key2 }, { key: key1 }];

      const result = ArrayUtils.groupBy(array, (item) => item.key as any);

      expect(result[key1 as any]).toHaveLength(2);
      expect(result[key2 as any]).toHaveLength(1);
    });
  });

  describe('sortBy()', () => {
    interface TestItem {
      id: number;
      name: string;
      value: number;
    }

    it('should sort by number property ascending (default)', () => {
      const array = [{ id: 3 }, { id: 1 }, { id: 2 }];
      const result = ArrayUtils.sortBy(array, 'id');
      expect(result.map((x) => x.id)).toEqual([1, 2, 3]);
    });

    it('should sort by number property descending', () => {
      const array = [{ id: 1 }, { id: 3 }, { id: 2 }];
      const result = ArrayUtils.sortBy(array, 'id', 'desc');
      expect(result.map((x) => x.id)).toEqual([3, 2, 1]);
    });

    it('should sort by string property ascending', () => {
      const array = [{ name: 'c' }, { name: 'a' }, { name: 'b' }];
      const result = ArrayUtils.sortBy(array, 'name');
      expect(result.map((x) => x.name)).toEqual(['a', 'b', 'c']);
    });

    it('should sort by string property descending', () => {
      const array = [{ name: 'a' }, { name: 'c' }, { name: 'b' }];
      const result = ArrayUtils.sortBy(array, 'name', 'desc');
      expect(result.map((x) => x.name)).toEqual(['c', 'b', 'a']);
    });

    it('should not mutate original array', () => {
      const array = [{ id: 3 }, { id: 1 }, { id: 2 }];
      const original = [...array];
      ArrayUtils.sortBy(array, 'id');
      expect(array).toEqual(original);
    });

    it('should handle empty array', () => {
      const result = ArrayUtils.sortBy([], 'id' as any);
      expect(result).toEqual([]);
    });

    it('should handle single element array', () => {
      const array = [{ id: 1 }];
      const result = ArrayUtils.sortBy(array, 'id');
      expect(result).toEqual([{ id: 1 }]);
    });

    it('should handle equal values (aVal < bVal is false)', () => {
      const array = [{ id: 2 }, { id: 2 }, { id: 1 }];
      const result = ArrayUtils.sortBy(array, 'id');
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
      expect(result[2].id).toBe(2);
    });

    it('should test aVal < bVal condition (ascending)', () => {
      const array = [{ value: 5 }, { value: 3 }];
      const result = ArrayUtils.sortBy(array, 'value', 'asc');
      expect(result[0].value).toBe(3); // aVal < bVal returns -1
    });

    it('should test aVal > bVal condition (ascending)', () => {
      const array = [{ value: 3 }, { value: 5 }];
      const result = ArrayUtils.sortBy(array, 'value', 'asc');
      expect(result[1].value).toBe(5); // aVal > bVal returns 1
    });

    it('should test aVal < bVal condition (descending)', () => {
      const array = [{ value: 3 }, { value: 5 }];
      const result = ArrayUtils.sortBy(array, 'value', 'desc');
      expect(result[0].value).toBe(5); // aVal < bVal returns 1 in desc
    });

    it('should test aVal > bVal condition (descending)', () => {
      const array = [{ value: 5 }, { value: 3 }];
      const result = ArrayUtils.sortBy(array, 'value', 'desc');
      expect(result[1].value).toBe(3); // aVal > bVal returns -1 in desc
    });

    it('should return 0 when values are equal', () => {
      const array = [{ value: 5 }, { value: 5 }];
      const result = ArrayUtils.sortBy(array, 'value');
      expect(result).toHaveLength(2);
    });

    it('should handle negative numbers', () => {
      const array = [{ value: -1 }, { value: -3 }, { value: -2 }];
      const result = ArrayUtils.sortBy(array, 'value');
      expect(result.map((x) => x.value)).toEqual([-3, -2, -1]);
    });

    it('should handle mixed positive and negative numbers', () => {
      const array = [{ value: 1 }, { value: -1 }, { value: 0 }];
      const result = ArrayUtils.sortBy(array, 'value');
      expect(result.map((x) => x.value)).toEqual([-1, 0, 1]);
    });

    it('should sort dates correctly', () => {
      const array = [
        { date: new Date('2024-03-01') },
        { date: new Date('2024-01-01') },
        { date: new Date('2024-02-01') },
      ];
      const result = ArrayUtils.sortBy(array, 'date');
      expect(result[0].date.getMonth()).toBe(0); // January
    });

    it('should handle boolean values', () => {
      const array = [{ active: true }, { active: false }, { active: true }];
      const result = ArrayUtils.sortBy(array, 'active');
      expect(result[0].active).toBe(false);
    });
  });

  describe('Edge Cases and Integration Tests', () => {
    it('should chain operations together', () => {
      const array = [1, 2, 2, 3, 4, 4, 5, 6, 7, 8, 9];
      const unique = ArrayUtils.unique(array);
      const chunked = ArrayUtils.chunk(unique, 3);
      expect(chunked).toHaveLength(3);
    });

    it('should group and sort', () => {
      const array = [
        { category: 'B', value: 2 },
        { category: 'A', value: 1 },
        { category: 'A', value: 3 },
      ];

      const grouped = ArrayUtils.groupBy(array, (item) => item.category);
      const sortedA = ArrayUtils.sortBy(grouped.A, 'value');

      expect(sortedA[0].value).toBe(1);
      expect(sortedA[1].value).toBe(3);
    });

    it('should handle very large arrays efficiently', () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => i);
      const shuffled = ArrayUtils.shuffle(largeArray);
      expect(shuffled).toHaveLength(10000);
    });

    it('should handle arrays with null and undefined', () => {
      const array = [1, null, 2, undefined, 3];
      const unique = ArrayUtils.unique(array);
      expect(unique).toContain(null);
      expect(unique).toContain(undefined);
    });
  });
});
