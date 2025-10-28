import { ObjectUtils } from './object.utils';

describe('ObjectUtils', () => {
  describe('deepClone', () => {
    // Test case 1: Clone object đơn giản
    it('should deep clone a simple object', () => {
      const obj = { name: 'John', age: 30 };
      const cloned = ObjectUtils.deepClone(obj);

      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj); // Khác reference
    });

    // Test case 2: Clone nested object
    it('should deep clone nested objects', () => {
      const obj = {
        user: {
          name: 'John',
          address: {
            city: 'Hanoi',
            country: 'Vietnam',
          },
        },
      };
      const cloned = ObjectUtils.deepClone(obj);

      expect(cloned).toEqual(obj);
      expect(cloned.user).not.toBe(obj.user);
      expect(cloned.user.address).not.toBe(obj.user.address);
    });

    // Test case 3: Clone array
    it('should deep clone arrays', () => {
      const arr = [1, 2, 3, { nested: true }];
      const cloned = ObjectUtils.deepClone(arr);

      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
      expect(cloned[3]).not.toBe(arr[3]);
    });

    // Test case 4: Clone với các kiểu dữ liệu khác nhau
    it('should clone objects with different data types', () => {
      const obj = {
        string: 'text',
        number: 42,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        nested: { key: 'value' },
      };
      const cloned = ObjectUtils.deepClone(obj);

      expect(cloned).toEqual(obj);
    });

    // Test case 5: Clone empty object
    it('should clone empty object', () => {
      const obj = {};
      const cloned = ObjectUtils.deepClone(obj);

      expect(cloned).toEqual({});
      expect(cloned).not.toBe(obj);
    });

    // Test case 6: Clone empty array
    it('should clone empty array', () => {
      const arr: any[] = [];
      const cloned = ObjectUtils.deepClone(arr);

      expect(cloned).toEqual([]);
      expect(cloned).not.toBe(arr);
    });

    // Test case 7: Không clone được function (JSON.stringify limitation)
    it('should not clone functions (JSON limitation)', () => {
      const obj = {
        name: 'test',
        method: () => 'hello',
      };
      const cloned = ObjectUtils.deepClone(obj);

      expect(cloned.name).toBe('test');
      expect(cloned.method).toBeUndefined(); // Function bị loại bỏ
    });

    // Test case 8: Không clone được Date (chuyển thành string)
    it('should convert Date to string (JSON limitation)', () => {
      const obj = { date: new Date('2025-10-27') };
      const cloned = ObjectUtils.deepClone(obj);

      expect(typeof cloned.date).toBe('string');
    });

    // Test case 9: Không clone được undefined values
    it('should remove undefined values (JSON limitation)', () => {
      const obj = { a: 1, b: undefined, c: 3 };
      const cloned = ObjectUtils.deepClone(obj);

      expect(cloned.a).toBe(1);
      expect(cloned.b).toBeUndefined();
      expect('b' in cloned).toBe(false); // Key b bị loại bỏ
      expect(cloned.c).toBe(3);
    });

    // Test case 10: Clone với circular reference sẽ throw error
    it('should throw error for circular references', () => {
      const obj: any = { name: 'test' };
      obj.self = obj; // Circular reference

      expect(() => ObjectUtils.deepClone(obj)).toThrow();
    });

    // Test case 11: Clone number primitive
    it('should clone primitive number', () => {
      const num = 42;
      const cloned = ObjectUtils.deepClone(num);
      expect(cloned).toBe(42);
    });

    // Test case 12: Clone string primitive
    it('should clone primitive string', () => {
      const str = 'hello';
      const cloned = ObjectUtils.deepClone(str);
      expect(cloned).toBe('hello');
    });

    // Test case 13: Clone boolean primitive
    it('should clone primitive boolean', () => {
      const bool = true;
      const cloned = ObjectUtils.deepClone(bool);
      expect(cloned).toBe(true);
    });

    // Test case 14: Clone null
    it('should clone null', () => {
      const cloned = ObjectUtils.deepClone(null);
      expect(cloned).toBe(null);
    });
  });

  describe('isEmpty', () => {
    // Test case 1: null (branch: obj == null)
    it('should return true for null', () => {
      expect(ObjectUtils.isEmpty(null)).toBe(true);
    });

    // Test case 2: undefined (branch: obj == null)
    it('should return true for undefined', () => {
      expect(ObjectUtils.isEmpty(undefined)).toBe(true);
    });

    // Test case 3: Empty string (branch: typeof obj === 'string' && trim().length === 0)
    it('should return true for empty string', () => {
      expect(ObjectUtils.isEmpty('')).toBe(true);
    });

    // Test case 4: String chỉ có whitespace
    it('should return true for whitespace-only string', () => {
      expect(ObjectUtils.isEmpty('   ')).toBe(true);
      expect(ObjectUtils.isEmpty('\t\n')).toBe(true);
    });

    // Test case 5: String không rỗng (branch: typeof obj === 'string' && trim().length > 0)
    it('should return false for non-empty string', () => {
      expect(ObjectUtils.isEmpty('hello')).toBe(false);
      expect(ObjectUtils.isEmpty(' text ')).toBe(false);
    });

    // Test case 6: Empty array (branch: Array.isArray && length === 0)
    it('should return true for empty array', () => {
      expect(ObjectUtils.isEmpty([])).toBe(true);
    });

    // Test case 7: Non-empty array (branch: Array.isArray && length > 0)
    it('should return false for non-empty array', () => {
      expect(ObjectUtils.isEmpty([1, 2, 3])).toBe(false);
      expect(ObjectUtils.isEmpty([null])).toBe(false);
    });

    // Test case 8: Empty object (branch: typeof obj === 'object' && keys.length === 0)
    it('should return true for empty object', () => {
      expect(ObjectUtils.isEmpty({})).toBe(true);
    });

    // Test case 9: Non-empty object (branch: typeof obj === 'object' && keys.length > 0)
    it('should return false for non-empty object', () => {
      expect(ObjectUtils.isEmpty({ key: 'value' })).toBe(false);
      expect(ObjectUtils.isEmpty({ a: 1, b: 2 })).toBe(false);
    });

    // Test case 10: Number (branch: default false)
    it('should return false for numbers', () => {
      expect(ObjectUtils.isEmpty(0)).toBe(false);
      expect(ObjectUtils.isEmpty(42)).toBe(false);
      expect(ObjectUtils.isEmpty(-1)).toBe(false);
    });

    // Test case 11: Boolean (branch: default false)
    it('should return false for booleans', () => {
      expect(ObjectUtils.isEmpty(true)).toBe(false);
      expect(ObjectUtils.isEmpty(false)).toBe(false);
    });

    // Test case 12: Function (branch: default false)
    it('should return false for functions', () => {
      expect(ObjectUtils.isEmpty(() => {})).toBe(false);
    });

    // Test case 13: Date object (branch: typeof obj === 'object')
    it('should return true for Date objects (no own enumerable properties)', () => {
      // Date là object nhưng Object.keys(new Date()) = [] nên isEmpty trả về true
      expect(ObjectUtils.isEmpty(new Date())).toBe(true);
    });

    // Test case 14: Object với prototype properties
    it('should only check own properties for objects', () => {
      const obj = Object.create({ inherited: 'value' });
      expect(ObjectUtils.isEmpty(obj)).toBe(true); // Không có own properties
    });
  });

  describe('pick', () => {
    // Test case 1: Pick một key (branch: key in obj - true)
    it('should pick single key from object', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = ObjectUtils.pick(obj, ['a']);

      expect(result).toEqual({ a: 1 });
      expect(Object.keys(result).length).toBe(1);
    });

    // Test case 2: Pick nhiều keys
    it('should pick multiple keys from object', () => {
      const obj = { name: 'John', age: 30, city: 'Hanoi', country: 'Vietnam' };
      const result = ObjectUtils.pick(obj, ['name', 'city']);

      expect(result).toEqual({ name: 'John', city: 'Hanoi' });
      expect(Object.keys(result).length).toBe(2);
    });

    // Test case 3: Pick tất cả keys
    it('should pick all keys', () => {
      const obj = { a: 1, b: 2 };
      const result = ObjectUtils.pick(obj, ['a', 'b']);

      expect(result).toEqual({ a: 1, b: 2 });
    });

    // Test case 4: Pick key không tồn tại (branch: key in obj - false)
    it('should skip non-existent keys', () => {
      const obj = { a: 1, b: 2 };
      const result = ObjectUtils.pick(obj, ['a', 'c' as any]);

      expect(result).toEqual({ a: 1 });
      expect('c' in result).toBe(false);
    });

    // Test case 5: Pick từ empty object
    it('should return empty object when picking from empty object', () => {
      const obj: Record<string, any> = {};
      const result = ObjectUtils.pick(obj, ['a']);

      expect(result).toEqual({});
    });

    // Test case 6: Pick với empty keys array
    it('should return empty object when keys array is empty', () => {
      const obj = { a: 1, b: 2 };
      const result = ObjectUtils.pick(obj, []);

      expect(result).toEqual({});
    });

    // Test case 7: Pick với undefined values
    it('should pick keys with undefined values', () => {
      const obj = { a: undefined, b: 2 };
      const result = ObjectUtils.pick(obj, ['a', 'b']);

      expect(result).toEqual({ a: undefined, b: 2 });
      expect('a' in result).toBe(true);
    });

    // Test case 8: Pick với null values
    it('should pick keys with null values', () => {
      const obj = { a: null, b: 2 };
      const result = ObjectUtils.pick(obj, ['a']);

      expect(result).toEqual({ a: null });
    });

    // Test case 9: Pick không thay đổi object gốc
    it('should not mutate original object', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const original = { ...obj };
      ObjectUtils.pick(obj, ['a']);

      expect(obj).toEqual(original);
    });

    // Test case 10: Pick với nested object
    it('should pick nested objects (shallow reference)', () => {
      const obj = { a: { nested: true }, b: 2 };
      const result = ObjectUtils.pick(obj, ['a']);

      expect(result).toEqual({ a: { nested: true } });
      expect(result.a).toBe(obj.a); // Same reference
    });

    // Test case 11: Type safety với TypeScript
    it('should maintain type safety', () => {
      interface User {
        id: number;
        name: string;
        email: string;
      }
      const user: User = { id: 1, name: 'John', email: 'john@example.com' };
      const result = ObjectUtils.pick(user, ['id', 'name']);

      expect(result.id).toBe(1);
      expect(result.name).toBe('John');
      expect('email' in result).toBe(false);
    });
  });

  describe('omit', () => {
    // Test case 1: Omit một key (branch: forEach delete)
    it('should omit single key from object', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = ObjectUtils.omit(obj, ['a']);

      expect(result).toEqual({ b: 2, c: 3 });
      expect('a' in result).toBe(false);
    });

    // Test case 2: Omit nhiều keys
    it('should omit multiple keys from object', () => {
      const obj = { name: 'John', age: 30, city: 'Hanoi', country: 'Vietnam' };
      const result = ObjectUtils.omit(obj, ['age', 'country']);

      expect(result).toEqual({ name: 'John', city: 'Hanoi' });
    });

    // Test case 3: Omit tất cả keys
    it('should omit all keys', () => {
      const obj = { a: 1, b: 2 };
      const result = ObjectUtils.omit(obj, ['a', 'b']);

      expect(result).toEqual({});
    });

    // Test case 4: Omit key không tồn tại
    it('should handle omitting non-existent keys', () => {
      const obj = { a: 1, b: 2 };
      const result = ObjectUtils.omit(obj, ['c' as any]);

      expect(result).toEqual({ a: 1, b: 2 });
    });

    // Test case 5: Omit từ empty object
    it('should return empty object when omitting from empty object', () => {
      const obj: Record<string, any> = {};
      const result = ObjectUtils.omit(obj, ['a']);

      expect(result).toEqual({});
    });

    // Test case 6: Omit với empty keys array
    it('should return copy of object when keys array is empty', () => {
      const obj = { a: 1, b: 2 };
      const result = ObjectUtils.omit(obj, []);

      expect(result).toEqual({ a: 1, b: 2 });
      expect(result).not.toBe(obj); // Different reference
    });

    // Test case 7: Omit không thay đổi object gốc
    it('should not mutate original object', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const original = { ...obj };
      ObjectUtils.omit(obj, ['a']);

      expect(obj).toEqual(original);
    });

    // Test case 8: Omit với nested object (shallow copy)
    it('should create shallow copy when omitting', () => {
      const obj = { a: { nested: true }, b: 2, c: 3 };
      const result = ObjectUtils.omit(obj, ['b']);

      expect(result).toEqual({ a: { nested: true }, c: 3 });
      expect(result.a).toBe(obj.a); // Same reference vì shallow copy
    });

    // Test case 9: Omit với undefined values
    it('should omit keys with undefined values', () => {
      const obj = { a: undefined, b: 2, c: 3 };
      const result = ObjectUtils.omit(obj, ['a']);

      expect(result).toEqual({ b: 2, c: 3 });
      expect('a' in result).toBe(false);
    });

    // Test case 10: Type safety với TypeScript
    it('should maintain type safety', () => {
      interface User {
        id: number;
        name: string;
        email: string;
        password: string;
      }
      const user: User = {
        id: 1,
        name: 'John',
        email: 'john@example.com',
        password: 'secret',
      };
      const result = ObjectUtils.omit(user, ['password']);

      expect('password' in result).toBe(false);
      expect(result).toEqual({
        id: 1,
        name: 'John',
        email: 'john@example.com',
      });
    });
  });

  describe('merge', () => {
    // Test case 1: Merge với một source (branch: Object.assign với 1 source)
    it('should merge single source object', () => {
      const target: Record<string, any> = { a: 1, b: 2 };
      const source = { c: 3 };
      const result = ObjectUtils.merge(target, source as any);

      expect(result).toEqual({ a: 1, b: 2, c: 3 });
      expect(result).toBe(target); // Mutates target
    });

    // Test case 2: Merge với nhiều sources
    it('should merge multiple source objects', () => {
      const target: Record<string, any> = { a: 1 };
      const source1 = { b: 2 };
      const source2 = { c: 3 };
      const source3 = { d: 4 };
      const result = ObjectUtils.merge(
        target,
        source1 as any,
        source2 as any,
        source3 as any,
      );

      expect(result).toEqual({ a: 1, b: 2, c: 3, d: 4 });
    });

    // Test case 3: Merge ghi đè properties
    it('should overwrite properties from later sources', () => {
      const target: Record<string, any> = { a: 1, b: 2 };
      const source1 = { b: 3, c: 4 };
      const source2 = { c: 5, d: 6 };
      const result = ObjectUtils.merge(target, source1 as any, source2 as any);

      expect(result).toEqual({ a: 1, b: 3, c: 5, d: 6 });
    });

    // Test case 4: Merge mutates target
    it('should mutate the target object', () => {
      const target: Record<string, any> = { a: 1 };
      const source = { b: 2 };
      const result = ObjectUtils.merge(target, source as any);

      expect(result).toBe(target);
      expect(target).toEqual({ a: 1, b: 2 });
    });

    // Test case 5: Merge với empty target
    it('should merge into empty target', () => {
      const target: Record<string, any> = {};
      const source = { a: 1, b: 2 };
      const result = ObjectUtils.merge(target, source as any);

      expect(result).toEqual({ a: 1, b: 2 });
    });

    // Test case 6: Merge với empty source
    it('should handle empty source objects', () => {
      const target = { a: 1, b: 2 };
      const result = ObjectUtils.merge(target, {});

      expect(result).toEqual({ a: 1, b: 2 });
    });

    // Test case 7: Merge với no sources (spread operator rỗng)
    it('should return target when no sources provided', () => {
      const target = { a: 1, b: 2 };
      const result = ObjectUtils.merge(target);

      expect(result).toEqual({ a: 1, b: 2 });
      expect(result).toBe(target);
    });

    // Test case 8: Merge với undefined values
    it('should merge undefined values', () => {
      const target = { a: 1, b: 2 };
      const source = { b: undefined, c: 3 };
      const result = ObjectUtils.merge(target, source);

      expect(result).toEqual({ a: 1, b: undefined, c: 3 });
    });

    // Test case 9: Merge với null values
    it('should merge null values', () => {
      const target = { a: 1, b: 2 };
      const source = { b: null, c: 3 };
      const result = ObjectUtils.merge(target, source);

      expect(result).toEqual({ a: 1, b: null, c: 3 });
    });

    // Test case 10: Merge không deep merge (shallow)
    it('should perform shallow merge (not deep merge)', () => {
      const target: Record<string, any> = { a: { x: 1, y: 2 } };
      const source = { a: { z: 3 } };
      const result = ObjectUtils.merge(target, source as any);

      // a.x và a.y bị mất vì shallow merge
      expect(result).toEqual({ a: { z: 3 } });
      expect(result.a).toBe(source.a);
    });

    // Test case 11: Merge với nested objects (shallow reference)
    it('should merge nested objects as shallow references', () => {
      const nested = { inner: true };
      const target: Record<string, any> = { a: 1 };
      const source = { b: nested };
      const result = ObjectUtils.merge(target, source as any);

      expect(result.b).toBe(nested); // Same reference
    });

    // Test case 12: Merge order matters
    it('should apply sources in order (left to right)', () => {
      const target = { a: 0 };
      const result = ObjectUtils.merge(target, { a: 1 }, { a: 2 }, { a: 3 });

      expect(result.a).toBe(3); // Last source wins
    });

    // Test case 13: Type safety với Partial
    it('should work with Partial types', () => {
      interface Config {
        host: string;
        port: number;
        debug: boolean;
      }
      const defaults: Config = { host: 'localhost', port: 3000, debug: false };
      const overrides: Partial<Config> = { port: 8080 };
      const result = ObjectUtils.merge(defaults, overrides);

      expect(result).toEqual({ host: 'localhost', port: 8080, debug: false });
    });
  });

  // Integration tests
  describe('Integration Tests', () => {
    it('should work together in a complete workflow', () => {
      // Tạo object gốc
      const original = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret',
        settings: {
          theme: 'dark',
          notifications: true,
        },
      };

      // Deep clone để tránh mutation
      const cloned = ObjectUtils.deepClone(original);

      // Pick chỉ thông tin public
      const publicInfo = ObjectUtils.pick(cloned, ['id', 'name', 'email']);

      // Omit sensitive data
      const safeData = ObjectUtils.omit(original, ['password']);

      // Merge với updates
      const updated = ObjectUtils.merge({ ...safeData }, { name: 'Jane Doe' });

      expect(publicInfo).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      });
      expect('password' in safeData).toBe(false);
      expect(updated.name).toBe('Jane Doe');
      expect(original.name).toBe('John Doe'); // Original không thay đổi
    });

    it('should check emptiness in various scenarios', () => {
      expect(ObjectUtils.isEmpty({})).toBe(true);
      expect(ObjectUtils.isEmpty(ObjectUtils.pick({ a: 1 }, []))).toBe(true);
      expect(ObjectUtils.isEmpty(ObjectUtils.omit({ a: 1 }, ['a']))).toBe(true);

      const merged = ObjectUtils.merge({}, { a: 1 });
      expect(ObjectUtils.isEmpty(merged)).toBe(false);
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    it('should handle objects with symbol keys', () => {
      const sym = Symbol('test');
      const obj = { [sym]: 'value', regular: 'prop' };

      const picked = ObjectUtils.pick(obj, ['regular']);
      expect(picked).toEqual({ regular: 'prop' });
    });

    it('should handle objects with numeric keys', () => {
      const obj = { 1: 'one', 2: 'two', 3: 'three' };
      const result = ObjectUtils.pick(obj, ['1', '2'] as any);

      expect(result).toEqual({ 1: 'one', 2: 'two' });
    });

    it('should handle very large objects', () => {
      const largeObj: Record<string, number> = {};
      for (let i = 0; i < 10000; i++) {
        largeObj[`key${i}`] = i;
      }

      const cloned = ObjectUtils.deepClone(largeObj);
      expect(Object.keys(cloned).length).toBe(10000);
      expect(cloned).not.toBe(largeObj);
    });

    it('should handle objects with special characters in keys', () => {
      const obj = {
        'key-with-dash': 1,
        'key.with.dot': 2,
        'key with space': 3,
        'key@special!': 4,
      };

      const result = ObjectUtils.pick(obj, ['key-with-dash', 'key.with.dot']);
      expect(Object.keys(result).length).toBe(2);
    });
  });
});
