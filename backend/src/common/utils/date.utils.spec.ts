import { DateUtils, ArrayUtils } from './date.utils';

describe('DateUtils', () => {
  describe('now', () => {
    it('should return current date', () => {
      const before = new Date();
      const result = DateUtils.now();
      const after = new Date();

      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should return different instances on multiple calls', () => {
      const date1 = DateUtils.now();
      const date2 = DateUtils.now();

      expect(date1).not.toBe(date2);
    });
  });

  describe('addDays', () => {
    it('should add positive days', () => {
      const date = new Date('2025-01-15T12:00:00Z');
      const result = DateUtils.addDays(date, 5);

      expect(result.getDate()).toBe(20);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getFullYear()).toBe(2025);
    });

    it('should add negative days (subtract)', () => {
      const date = new Date('2025-01-15T12:00:00Z');
      const result = DateUtils.addDays(date, -5);

      expect(result.getDate()).toBe(10);
    });

    it('should handle month overflow', () => {
      const date = new Date('2025-01-30T12:00:00Z');
      const result = DateUtils.addDays(date, 5);

      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(4);
    });

    it('should handle year overflow', () => {
      const date = new Date('2025-12-30T12:00:00Z');
      const result = DateUtils.addDays(date, 5);

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(4);
    });

    it('should not modify original date', () => {
      const date = new Date('2025-01-15T12:00:00Z');
      const originalDate = date.getDate();
      DateUtils.addDays(date, 5);

      expect(date.getDate()).toBe(originalDate);
    });

    it('should handle zero days', () => {
      const date = new Date('2025-01-15T12:00:00Z');
      const result = DateUtils.addDays(date, 0);

      expect(result.getDate()).toBe(15);
      expect(result.getTime()).toBe(date.getTime());
    });

    it('should handle leap year', () => {
      const date = new Date('2024-02-28T12:00:00Z');
      const result = DateUtils.addDays(date, 1);

      expect(result.getDate()).toBe(29);
      expect(result.getMonth()).toBe(1); // Still February
    });

    it('should handle large number of days', () => {
      const date = new Date('2025-01-01T12:00:00Z');
      const result = DateUtils.addDays(date, 365);

      expect(result.getFullYear()).toBe(2026);
    });
  });

  describe('addHours', () => {
    it('should add positive hours', () => {
      const date = new Date(2025, 0, 15, 12, 0, 0);
      const result = DateUtils.addHours(date, 5);

      expect(result.getHours()).toBe(17);
    });

    it('should add negative hours (subtract)', () => {
      const date = new Date(2025, 0, 15, 12, 0, 0);
      const result = DateUtils.addHours(date, -5);

      expect(result.getHours()).toBe(7);
    });

    it('should handle day overflow', () => {
      const date = new Date(2025, 0, 15, 22, 0, 0);
      const result = DateUtils.addHours(date, 5);

      expect(result.getDate()).toBe(16);
      expect(result.getHours()).toBe(3);
    });

    it('should not modify original date', () => {
      const date = new Date(2025, 0, 15, 12, 0, 0);
      const originalHours = date.getHours();
      DateUtils.addHours(date, 5);

      expect(date.getHours()).toBe(originalHours);
    });

    it('should handle zero hours', () => {
      const date = new Date(2025, 0, 15, 12, 0, 0);
      const result = DateUtils.addHours(date, 0);

      expect(result.getHours()).toBe(12);
    });

    it('should handle 24-hour wrap', () => {
      const date = new Date(2025, 0, 15, 12, 0, 0);
      const result = DateUtils.addHours(date, 24);

      expect(result.getDate()).toBe(16);
      expect(result.getHours()).toBe(12);
    });

    it('should handle large number of hours', () => {
      const date = new Date(2025, 0, 15, 12, 0, 0);
      const result = DateUtils.addHours(date, 100);

      expect(result.getDate()).toBe(19);
      expect(result.getHours()).toBe(16);
    });
  });

  describe('addMinutes', () => {
    it('should add positive minutes', () => {
      const date = new Date(2025, 0, 15, 12, 0, 0);
      const result = DateUtils.addMinutes(date, 30);

      expect(result.getMinutes()).toBe(30);
    });

    it('should add negative minutes (subtract)', () => {
      const date = new Date(2025, 0, 15, 12, 30, 0);
      const result = DateUtils.addMinutes(date, -15);

      expect(result.getMinutes()).toBe(15);
    });

    it('should handle hour overflow', () => {
      const date = new Date(2025, 0, 15, 12, 45, 0);
      const result = DateUtils.addMinutes(date, 30);

      expect(result.getHours()).toBe(13);
      expect(result.getMinutes()).toBe(15);
    });

    it('should not modify original date', () => {
      const date = new Date(2025, 0, 15, 12, 0, 0);
      const originalMinutes = date.getMinutes();
      DateUtils.addMinutes(date, 30);

      expect(date.getMinutes()).toBe(originalMinutes);
    });

    it('should handle zero minutes', () => {
      const date = new Date(2025, 0, 15, 12, 30, 0);
      const result = DateUtils.addMinutes(date, 0);

      expect(result.getMinutes()).toBe(30);
    });

    it('should handle large number of minutes', () => {
      const date = new Date(2025, 0, 15, 12, 0, 0);
      const result = DateUtils.addMinutes(date, 1500);

      expect(result.getHours()).toBe(13);
      expect(result.getDate()).toBe(16);
    });
  });

  describe('isExpired', () => {
    it('should return true for past date', () => {
      const pastDate = new Date('2020-01-01T00:00:00Z');
      expect(DateUtils.isExpired(pastDate)).toBe(true);
    });

    it('should return false for future date', () => {
      const futureDate = new Date('2030-01-01T00:00:00Z');
      expect(DateUtils.isExpired(futureDate)).toBe(false);
    });

    it('should return true for date just in the past', () => {
      const pastDate = new Date(Date.now() - 1000);
      expect(DateUtils.isExpired(pastDate)).toBe(true);
    });

    it('should return false for date just in the future', () => {
      const futureDate = new Date(Date.now() + 10000);
      expect(DateUtils.isExpired(futureDate)).toBe(false);
    });

    it('should return true for very old date', () => {
      const oldDate = new Date('1990-01-01T00:00:00Z');
      expect(DateUtils.isExpired(oldDate)).toBe(true);
    });

    it('should return false for far future date', () => {
      const farFutureDate = new Date('2100-01-01T00:00:00Z');
      expect(DateUtils.isExpired(farFutureDate)).toBe(false);
    });
  });

  describe('formatDate', () => {
    it('should format date with default format YYYY-MM-DD', () => {
      const date = new Date(2025, 0, 15, 12, 30, 45);
      const result = DateUtils.formatDate(date);

      expect(result).toBe('2025-01-15');
    });

    it('should format date with YYYY-MM-DD format', () => {
      const date = new Date(2025, 2, 25, 0, 0, 0);
      const result = DateUtils.formatDate(date, 'YYYY-MM-DD');

      expect(result).toBe('2025-03-25');
    });

    it('should format date with YYYY-MM-DD HH:mm:ss format', () => {
      const date = new Date(Date.UTC(2025, 0, 15, 12, 30, 45));
      const result = DateUtils.formatDate(date, 'YYYY-MM-DD HH:mm:ss');

      expect(result).toMatch(/2025-01-15 \d{2}:30:45/);
    });

    it('should pad single digit month', () => {
      const date = new Date('2025-03-15T00:00:00Z');
      const result = DateUtils.formatDate(date, 'MM');

      expect(result).toBe('03');
    });

    it('should pad single digit day', () => {
      const date = new Date('2025-01-05T00:00:00Z');
      const result = DateUtils.formatDate(date, 'DD');

      expect(result).toBe('05');
    });

    it('should pad single digit hours', () => {
      const date = new Date(2025, 0, 15, 5, 0, 0);
      const result = DateUtils.formatDate(date, 'HH');

      expect(result).toBe('05');
    });

    it('should pad single digit minutes', () => {
      const date = new Date(2025, 0, 15, 12, 5, 0);
      const result = DateUtils.formatDate(date, 'mm');

      expect(result).toBe('05');
    });

    it('should pad single digit seconds', () => {
      const date = new Date(2025, 0, 15, 12, 30, 5);
      const result = DateUtils.formatDate(date, 'ss');

      expect(result).toBe('05');
    });

    it('should handle custom format', () => {
      const date = new Date(Date.UTC(2025, 0, 15, 12, 30, 45));
      const result = DateUtils.formatDate(date, 'DD/MM/YYYY');

      expect(result).toBe('15/01/2025');
    });

    it('should handle year-only format', () => {
      const date = new Date('2025-01-15T00:00:00Z');
      const result = DateUtils.formatDate(date, 'YYYY');

      expect(result).toBe('2025');
    });

    it('should handle time-only format', () => {
      const date = new Date(Date.UTC(2025, 0, 15, 12, 30, 45));
      const result = DateUtils.formatDate(date, 'HH:mm:ss');

      expect(result).toMatch(/\d{2}:30:45/);
    });
  });

  describe('getTimeAgo', () => {
    it('should return "just now" for very recent time', () => {
      const date = new Date(Date.now() - 30000); // 30 seconds ago
      const result = DateUtils.getTimeAgo(date);

      expect(result).toBe('just now');
    });

    it('should return "just now" for time within last minute', () => {
      const date = new Date(Date.now() - 59000); // 59 seconds ago
      const result = DateUtils.getTimeAgo(date);

      expect(result).toBe('just now');
    });

    it('should return minutes for time within last hour', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      const result = DateUtils.getTimeAgo(date);

      expect(result).toBe('5 minutes ago');
    });

    it('should return minutes for 59 minutes ago', () => {
      const date = new Date(Date.now() - 59 * 60 * 1000);
      const result = DateUtils.getTimeAgo(date);

      expect(result).toBe('59 minutes ago');
    });

    it('should return hours for time within last day', () => {
      const date = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago
      const result = DateUtils.getTimeAgo(date);

      expect(result).toBe('3 hours ago');
    });

    it('should return hours for 23 hours ago', () => {
      const date = new Date(Date.now() - 23 * 60 * 60 * 1000);
      const result = DateUtils.getTimeAgo(date);

      expect(result).toBe('23 hours ago');
    });

    it('should return days for time within last month', () => {
      const date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const result = DateUtils.getTimeAgo(date);

      expect(result).toBe('7 days ago');
    });

    it('should return days for 29 days ago', () => {
      const date = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
      const result = DateUtils.getTimeAgo(date);

      expect(result).toBe('29 days ago');
    });

    it('should return months for time within last year', () => {
      const date = new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000); // ~3 months ago
      const result = DateUtils.getTimeAgo(date);

      expect(result).toMatch(/\d+ months ago/);
    });

    it('should return years for time over a year ago', () => {
      const date = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000); // ~2 years ago
      const result = DateUtils.getTimeAgo(date);

      expect(result).toMatch(/\d+ years ago/);
    });

    it('should handle exact 1 minute', () => {
      const date = new Date(Date.now() - 60 * 1000);
      const result = DateUtils.getTimeAgo(date);

      expect(result).toBe('1 minutes ago');
    });

    it('should handle exact 1 hour', () => {
      const date = new Date(Date.now() - 60 * 60 * 1000);
      const result = DateUtils.getTimeAgo(date);

      expect(result).toBe('1 hours ago');
    });

    it('should handle exact 1 day', () => {
      const date = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = DateUtils.getTimeAgo(date);

      expect(result).toBe('1 days ago');
    });
  });
});

describe('ArrayUtils', () => {
  describe('unique', () => {
    it('should remove duplicate numbers', () => {
      const array = [1, 2, 2, 3, 3, 3, 4];
      const result = ArrayUtils.unique(array);

      expect(result).toEqual([1, 2, 3, 4]);
    });

    it('should remove duplicate strings', () => {
      const array = ['a', 'b', 'b', 'c', 'c', 'c'];
      const result = ArrayUtils.unique(array);

      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should handle empty array', () => {
      const array: number[] = [];
      const result = ArrayUtils.unique(array);

      expect(result).toEqual([]);
    });

    it('should handle array with no duplicates', () => {
      const array = [1, 2, 3, 4, 5];
      const result = ArrayUtils.unique(array);

      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle array with all same values', () => {
      const array = [5, 5, 5, 5];
      const result = ArrayUtils.unique(array);

      expect(result).toEqual([5]);
    });

    it('should preserve order of first occurrence', () => {
      const array = [3, 1, 2, 1, 3, 2];
      const result = ArrayUtils.unique(array);

      expect(result).toEqual([3, 1, 2]);
    });

    it('should handle boolean values', () => {
      const array = [true, false, true, false, true];
      const result = ArrayUtils.unique(array);

      expect(result).toEqual([true, false]);
    });

    it('should not modify original array', () => {
      const array = [1, 2, 2, 3];
      const original = [...array];
      ArrayUtils.unique(array);

      expect(array).toEqual(original);
    });
  });

  describe('chunk', () => {
    it('should split array into chunks of specified size', () => {
      const array = [1, 2, 3, 4, 5, 6];
      const result = ArrayUtils.chunk(array, 2);

      expect(result).toEqual([
        [1, 2],
        [3, 4],
        [5, 6],
      ]);
    });

    it('should handle uneven division', () => {
      const array = [1, 2, 3, 4, 5];
      const result = ArrayUtils.chunk(array, 2);

      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should handle chunk size larger than array', () => {
      const array = [1, 2, 3];
      const result = ArrayUtils.chunk(array, 5);

      expect(result).toEqual([[1, 2, 3]]);
    });

    it('should handle chunk size of 1', () => {
      const array = [1, 2, 3];
      const result = ArrayUtils.chunk(array, 1);

      expect(result).toEqual([[1], [2], [3]]);
    });

    it('should handle empty array', () => {
      const array: number[] = [];
      const result = ArrayUtils.chunk(array, 2);

      expect(result).toEqual([]);
    });

    it('should handle chunk size equal to array length', () => {
      const array = [1, 2, 3, 4];
      const result = ArrayUtils.chunk(array, 4);

      expect(result).toEqual([[1, 2, 3, 4]]);
    });

    it('should work with strings', () => {
      const array = ['a', 'b', 'c', 'd', 'e'];
      const result = ArrayUtils.chunk(array, 2);

      expect(result).toEqual([['a', 'b'], ['c', 'd'], ['e']]);
    });

    it('should not modify original array', () => {
      const array = [1, 2, 3, 4];
      const original = [...array];
      ArrayUtils.chunk(array, 2);

      expect(array).toEqual(original);
    });
  });

  describe('shuffle', () => {
    it('should return array with same length', () => {
      const array = [1, 2, 3, 4, 5];
      const result = ArrayUtils.shuffle(array);

      expect(result.length).toBe(array.length);
    });

    it('should contain all original elements', () => {
      const array = [1, 2, 3, 4, 5];
      const result = ArrayUtils.shuffle(array);

      expect(result.sort()).toEqual([1, 2, 3, 4, 5]);
    });

    it('should not modify original array', () => {
      const array = [1, 2, 3, 4, 5];
      const original = [...array];
      ArrayUtils.shuffle(array);

      expect(array).toEqual(original);
    });

    it('should handle empty array', () => {
      const array: number[] = [];
      const result = ArrayUtils.shuffle(array);

      expect(result).toEqual([]);
    });

    it('should handle single element array', () => {
      const array = [1];
      const result = ArrayUtils.shuffle(array);

      expect(result).toEqual([1]);
    });

    it('should handle array with duplicates', () => {
      const array = [1, 1, 2, 2, 3, 3];
      const result = ArrayUtils.shuffle(array);

      expect(result.sort()).toEqual([1, 1, 2, 2, 3, 3]);
    });

    it('should work with strings', () => {
      const array = ['a', 'b', 'c', 'd'];
      const result = ArrayUtils.shuffle(array);

      expect(result.length).toBe(4);
      expect(result.sort()).toEqual(['a', 'b', 'c', 'd']);
    });
  });

  describe('groupBy', () => {
    it('should group objects by numeric key', () => {
      const array = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 1, name: 'Charlie' },
      ];
      const result = ArrayUtils.groupBy(array, (item) => item.id);

      expect(result[1]).toEqual([
        { id: 1, name: 'Alice' },
        { id: 1, name: 'Charlie' },
      ]);
      expect(result[2]).toEqual([{ id: 2, name: 'Bob' }]);
    });

    it('should group objects by string key', () => {
      const array = [
        { type: 'fruit', name: 'Apple' },
        { type: 'vegetable', name: 'Carrot' },
        { type: 'fruit', name: 'Banana' },
      ];
      const result = ArrayUtils.groupBy(array, (item) => item.type);

      expect(result.fruit).toEqual([
        { type: 'fruit', name: 'Apple' },
        { type: 'fruit', name: 'Banana' },
      ]);
      expect(result.vegetable).toEqual([{ type: 'vegetable', name: 'Carrot' }]);
    });

    it('should handle empty array', () => {
      const array: { id: number }[] = [];
      const result = ArrayUtils.groupBy(array, (item) => item.id);

      expect(result).toEqual({});
    });

    it('should handle array with single group', () => {
      const array = [
        { category: 'A', value: 1 },
        { category: 'A', value: 2 },
      ];
      const result = ArrayUtils.groupBy(array, (item) => item.category);

      expect(result.A).toEqual([
        { category: 'A', value: 1 },
        { category: 'A', value: 2 },
      ]);
    });

    it('should handle array where each element is in separate group', () => {
      const array = [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
        { id: 3, name: 'C' },
      ];
      const result = ArrayUtils.groupBy(array, (item) => item.id);

      expect(Object.keys(result).length).toBe(3);
      expect(result[1]).toEqual([{ id: 1, name: 'A' }]);
      expect(result[2]).toEqual([{ id: 2, name: 'B' }]);
      expect(result[3]).toEqual([{ id: 3, name: 'C' }]);
    });

    it('should preserve order within groups', () => {
      const array = [
        { type: 'A', value: 1 },
        { type: 'B', value: 2 },
        { type: 'A', value: 3 },
        { type: 'A', value: 4 },
      ];
      const result = ArrayUtils.groupBy(array, (item) => item.type);

      expect(result.A).toEqual([
        { type: 'A', value: 1 },
        { type: 'A', value: 3 },
        { type: 'A', value: 4 },
      ]);
    });
  });

  describe('sortBy', () => {
    it('should sort by numeric key ascending', () => {
      const array = [
        { id: 3, name: 'C' },
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
      ];
      const result = ArrayUtils.sortBy(array, 'id', 'asc');

      expect(result).toEqual([
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
        { id: 3, name: 'C' },
      ]);
    });

    it('should sort by numeric key descending', () => {
      const array = [
        { id: 1, name: 'A' },
        { id: 3, name: 'C' },
        { id: 2, name: 'B' },
      ];
      const result = ArrayUtils.sortBy(array, 'id', 'desc');

      expect(result).toEqual([
        { id: 3, name: 'C' },
        { id: 2, name: 'B' },
        { id: 1, name: 'A' },
      ]);
    });

    it('should sort by string key ascending', () => {
      const array = [
        { name: 'Charlie', age: 30 },
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 35 },
      ];
      const result = ArrayUtils.sortBy(array, 'name', 'asc');

      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Charlie');
    });

    it('should sort by string key descending', () => {
      const array = [
        { name: 'Alice', age: 25 },
        { name: 'Charlie', age: 30 },
        { name: 'Bob', age: 35 },
      ];
      const result = ArrayUtils.sortBy(array, 'name', 'desc');

      expect(result[0].name).toBe('Charlie');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Alice');
    });

    it('should use ascending by default', () => {
      const array = [{ value: 3 }, { value: 1 }, { value: 2 }];
      const result = ArrayUtils.sortBy(array, 'value');

      expect(result).toEqual([{ value: 1 }, { value: 2 }, { value: 3 }]);
    });

    it('should handle empty array', () => {
      const array: { id: number }[] = [];
      const result = ArrayUtils.sortBy(array, 'id');

      expect(result).toEqual([]);
    });

    it('should handle single element array', () => {
      const array = [{ id: 1, name: 'A' }];
      const result = ArrayUtils.sortBy(array, 'id');

      expect(result).toEqual([{ id: 1, name: 'A' }]);
    });

    it('should not modify original array', () => {
      const array = [{ id: 3 }, { id: 1 }, { id: 2 }];
      const original = [...array];
      ArrayUtils.sortBy(array, 'id');

      expect(array).toEqual(original);
    });

    it('should handle equal values', () => {
      const array = [
        { id: 1, name: 'A' },
        { id: 1, name: 'B' },
        { id: 1, name: 'C' },
      ];
      const result = ArrayUtils.sortBy(array, 'id', 'asc');

      expect(result.every((item) => item.id === 1)).toBe(true);
    });

    it('should handle negative numbers', () => {
      const array = [{ value: 5 }, { value: -3 }, { value: 0 }, { value: -10 }];
      const result = ArrayUtils.sortBy(array, 'value', 'asc');

      expect(result).toEqual([
        { value: -10 },
        { value: -3 },
        { value: 0 },
        { value: 5 },
      ]);
    });
  });
});
