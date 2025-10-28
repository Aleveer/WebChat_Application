import 'reflect-metadata';
import { ValidationErrorDto } from './validation.error.dto';

describe('ValidationErrorDto - White Box Testing', () => {
  describe('Constructor Tests', () => {
    it('should create ValidationErrorDto with required fields only', () => {
      const dto = new ValidationErrorDto('username', 'Username is required');

      expect(dto.field).toBe('username');
      expect(dto.message).toBe('Username is required');
      expect(dto.value).toBeUndefined();
    });

    it('should create ValidationErrorDto with all fields', () => {
      const dto = new ValidationErrorDto(
        'email',
        'Invalid email format',
        'invalid-email',
      );

      expect(dto.field).toBe('email');
      expect(dto.message).toBe('Invalid email format');
      expect(dto.value).toBe('invalid-email');
    });

    it('should create ValidationErrorDto with value set to null', () => {
      const dto = new ValidationErrorDto('phone', 'Phone is required', null);

      expect(dto.field).toBe('phone');
      expect(dto.message).toBe('Phone is required');
      expect(dto.value).toBeNull();
    });

    it('should create ValidationErrorDto with value set to empty string', () => {
      const dto = new ValidationErrorDto('name', 'Name cannot be empty', '');

      expect(dto.field).toBe('name');
      expect(dto.message).toBe('Name cannot be empty');
      expect(dto.value).toBe('');
    });

    it('should create ValidationErrorDto with numeric value', () => {
      const dto = new ValidationErrorDto('age', 'Age must be positive', -5);

      expect(dto.field).toBe('age');
      expect(dto.message).toBe('Age must be positive');
      expect(dto.value).toBe(-5);
    });

    it('should create ValidationErrorDto with boolean value', () => {
      const dto = new ValidationErrorDto(
        'active',
        'Active must be boolean',
        'true',
      );

      expect(dto.field).toBe('active');
      expect(dto.message).toBe('Active must be boolean');
      expect(dto.value).toBe('true');
    });

    it('should create ValidationErrorDto with object value', () => {
      const value = { nested: 'object' };
      const dto = new ValidationErrorDto(
        'config',
        'Invalid configuration',
        value,
      );

      expect(dto.field).toBe('config');
      expect(dto.message).toBe('Invalid configuration');
      expect(dto.value).toEqual(value);
    });

    it('should create ValidationErrorDto with array value', () => {
      const value = [1, 2, 3];
      const dto = new ValidationErrorDto('items', 'Items must be array', value);

      expect(dto.field).toBe('items');
      expect(dto.message).toBe('Items must be array');
      expect(dto.value).toEqual(value);
    });
  });

  describe('Field Property Tests', () => {
    it('should accept valid field name', () => {
      const dto = new ValidationErrorDto('user_id', 'Invalid user ID');
      expect(dto.field).toBe('user_id');
    });

    it('should accept field with special characters', () => {
      const dto = new ValidationErrorDto('user-name', 'Invalid name');
      expect(dto.field).toBe('user-name');
    });

    it('should accept field with camelCase', () => {
      const dto = new ValidationErrorDto('userName', 'Username required');
      expect(dto.field).toBe('userName');
    });

    it('should accept field with snake_case', () => {
      const dto = new ValidationErrorDto('user_name', 'Username required');
      expect(dto.field).toBe('user_name');
    });

    it('should accept field with dots (nested property)', () => {
      const dto = new ValidationErrorDto('user.profile.name', 'Name required');
      expect(dto.field).toBe('user.profile.name');
    });

    it('should accept field with brackets', () => {
      const dto = new ValidationErrorDto('users[0].name', 'Name required');
      expect(dto.field).toBe('users[0].name');
    });

    it('should accept empty field name', () => {
      const dto = new ValidationErrorDto('', 'Empty field name');
      expect(dto.field).toBe('');
    });

    it('should accept long field name', () => {
      const longFieldName = 'a'.repeat(200);
      const dto = new ValidationErrorDto(longFieldName, 'Long field name');
      expect(dto.field).toBe(longFieldName);
    });

    it('should accept field with unicode characters', () => {
      const dto = new ValidationErrorDto('用户名', 'Username error');
      expect(dto.field).toBe('用户名');
    });

    it('should accept field with spaces', () => {
      const dto = new ValidationErrorDto('user name', 'Name required');
      expect(dto.field).toBe('user name');
    });
  });

  describe('Message Property Tests', () => {
    it('should accept valid error message', () => {
      const dto = new ValidationErrorDto('email', 'Email is invalid');
      expect(dto.message).toBe('Email is invalid');
    });

    it('should accept short message', () => {
      const dto = new ValidationErrorDto('id', 'Error');
      expect(dto.message).toBe('Error');
    });

    it('should accept long message', () => {
      const longMessage =
        'This is a very long error message that contains detailed information about why the validation failed'.repeat(
          10,
        );
      const dto = new ValidationErrorDto('data', longMessage);
      expect(dto.message).toBe(longMessage);
    });

    it('should accept message with special characters', () => {
      const message = 'Error! @#$%^&*() Validation failed';
      const dto = new ValidationErrorDto('field', message);
      expect(dto.message).toBe(message);
    });

    it('should accept message with unicode characters', () => {
      const message = '验证失败！❌ 请重新输入';
      const dto = new ValidationErrorDto('field', message);
      expect(dto.message).toBe(message);
    });

    it('should accept message with newlines', () => {
      const message = 'Error:\nFirst line\nSecond line';
      const dto = new ValidationErrorDto('field', message);
      expect(dto.message).toBe(message);
    });

    it('should accept message with tabs', () => {
      const message = 'Error:\tTab\tHere';
      const dto = new ValidationErrorDto('field', message);
      expect(dto.message).toBe(message);
    });

    it('should accept empty message', () => {
      const dto = new ValidationErrorDto('field', '');
      expect(dto.message).toBe('');
    });

    it('should accept message with emoji', () => {
      const message = 'Validation failed 😱';
      const dto = new ValidationErrorDto('field', message);
      expect(dto.message).toBe(message);
    });

    it('should accept message with HTML-like content', () => {
      const message = 'Error: <script>alert("xss")</script>';
      const dto = new ValidationErrorDto('field', message);
      expect(dto.message).toBe(message);
    });
  });

  describe('Value Property Tests', () => {
    it('should handle undefined value', () => {
      const dto = new ValidationErrorDto('field', 'Error');
      expect(dto.value).toBeUndefined();
    });

    it('should handle string value', () => {
      const dto = new ValidationErrorDto('username', 'Invalid', 'invalid-user');
      expect(dto.value).toBe('invalid-user');
    });

    it('should handle number value', () => {
      const dto = new ValidationErrorDto('age', 'Invalid', 999);
      expect(dto.value).toBe(999);
    });

    it('should handle negative number value', () => {
      const dto = new ValidationErrorDto('value', 'Invalid', -100);
      expect(dto.value).toBe(-100);
    });

    it('should handle zero value', () => {
      const dto = new ValidationErrorDto('count', 'Invalid', 0);
      expect(dto.value).toBe(0);
    });

    it('should handle decimal number value', () => {
      const dto = new ValidationErrorDto('price', 'Invalid', 99.99);
      expect(dto.value).toBe(99.99);
    });

    it('should handle boolean value', () => {
      const dto = new ValidationErrorDto('active', 'Invalid', true);
      expect(dto.value).toBe(true);
    });

    it('should handle false boolean value', () => {
      const dto = new ValidationErrorDto('active', 'Invalid', false);
      expect(dto.value).toBe(false);
    });

    it('should handle null value', () => {
      const dto = new ValidationErrorDto('data', 'Invalid', null);
      expect(dto.value).toBeNull();
    });

    it('should handle empty string value', () => {
      const dto = new ValidationErrorDto('name', 'Invalid', '');
      expect(dto.value).toBe('');
    });

    it('should handle object value', () => {
      const value = { id: 1, name: 'Test' };
      const dto = new ValidationErrorDto('user', 'Invalid', value);
      expect(dto.value).toEqual(value);
    });

    it('should handle nested object value', () => {
      const value = {
        user: {
          id: 1,
          profile: {
            name: 'John',
            age: 30,
          },
        },
      };
      const dto = new ValidationErrorDto('data', 'Invalid', value);
      expect(dto.value).toEqual(value);
      expect((dto.value as any).user.profile.name).toBe('John');
    });

    it('should handle array value', () => {
      const value = [1, 2, 3];
      const dto = new ValidationErrorDto('items', 'Invalid', value);
      expect(dto.value).toEqual(value);
    });

    it('should handle array of objects value', () => {
      const value = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];
      const dto = new ValidationErrorDto('items', 'Invalid', value);
      expect(dto.value).toEqual(value);
      expect((dto.value as any[]).length).toBe(2);
    });

    it('should handle Date object value', () => {
      const value = new Date('2024-01-01');
      const dto = new ValidationErrorDto('date', 'Invalid', value);
      expect(dto.value).toBeInstanceOf(Date);
      expect((dto.value as Date).getTime()).toBe(value.getTime());
    });

    it('should handle NaN value', () => {
      const dto = new ValidationErrorDto('number', 'Invalid', NaN);
      expect(dto.value).toBeNaN();
    });

    it('should handle Infinity value', () => {
      const dto = new ValidationErrorDto('number', 'Invalid', Infinity);
      expect(dto.value).toBe(Infinity);
    });

    it('should handle -Infinity value', () => {
      const dto = new ValidationErrorDto('number', 'Invalid', -Infinity);
      expect(dto.value).toBe(-Infinity);
    });

    it('should handle empty array value', () => {
      const dto = new ValidationErrorDto('items', 'Invalid', []);
      expect(dto.value).toEqual([]);
      expect(Array.isArray(dto.value)).toBe(true);
    });

    it('should handle empty object value', () => {
      const dto = new ValidationErrorDto('config', 'Invalid', {});
      expect(dto.value).toEqual({});
      expect(typeof dto.value).toBe('object');
    });

    it('should handle function value', () => {
      const func = () => 'test';
      const dto = new ValidationErrorDto('callback', 'Invalid', func);
      expect(typeof dto.value).toBe('function');
    });

    it('should handle RegExp value', () => {
      const regex = /test/i;
      const dto = new ValidationErrorDto('pattern', 'Invalid', regex);
      expect(dto.value).toBeInstanceOf(RegExp);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should work for email validation error', () => {
      const dto = new ValidationErrorDto(
        'email',
        'Invalid email format',
        'invalid-email@',
      );

      expect(dto.field).toBe('email');
      expect(dto.message).toBe('Invalid email format');
      expect(dto.value).toBe('invalid-email@');
    });

    it('should work for password validation error', () => {
      const dto = new ValidationErrorDto(
        'password',
        'Password must be at least 8 characters',
        'weak',
      );

      expect(dto.field).toBe('password');
      expect(dto.message).toBe('Password must be at least 8 characters');
      expect(dto.value).toBe('weak');
    });

    it('should work for required field error', () => {
      const dto = new ValidationErrorDto('username', 'Username is required');

      expect(dto.field).toBe('username');
      expect(dto.message).toBe('Username is required');
      expect(dto.value).toBeUndefined();
    });

    it('should work for range validation error', () => {
      const dto = new ValidationErrorDto(
        'age',
        'Age must be between 18 and 100',
        150,
      );

      expect(dto.field).toBe('age');
      expect(dto.message).toBe('Age must be between 18 and 100');
      expect(dto.value).toBe(150);
    });

    it('should work for type validation error', () => {
      const dto = new ValidationErrorDto(
        'count',
        'Must be a number',
        'not-a-number',
      );

      expect(dto.field).toBe('count');
      expect(dto.message).toBe('Must be a number');
      expect(dto.value).toBe('not-a-number');
    });

    it('should work for array length validation error', () => {
      const dto = new ValidationErrorDto('tags', 'Must have at least 3 tags', [
        'tag1',
        'tag2',
      ]);

      expect(dto.field).toBe('tags');
      expect(dto.message).toBe('Must have at least 3 tags');
      expect((dto.value as string[]).length).toBe(2);
    });

    it('should work for nested object validation error', () => {
      const user = { name: '', email: 'invalid' };
      const dto = new ValidationErrorDto(
        'user',
        'User object is invalid',
        user,
      );

      expect(dto.field).toBe('user');
      expect(dto.message).toBe('User object is invalid');
      expect((dto.value as any).name).toBe('');
    });

    it('should work for date validation error', () => {
      const date = new Date('2025-01-01');
      const dto = new ValidationErrorDto(
        'birthDate',
        'Date must be in the past',
        date,
      );

      expect(dto.field).toBe('birthDate');
      expect(dto.message).toBe('Date must be in the past');
      expect(dto.value).toBeInstanceOf(Date);
    });

    it('should work for multiple validation errors scenario', () => {
      const errors = [
        new ValidationErrorDto('email', 'Invalid email', 'bad-email'),
        new ValidationErrorDto('password', 'Too short', '123'),
        new ValidationErrorDto('age', 'Must be 18+', 17),
      ];

      expect(errors.length).toBe(3);
      expect(errors[0].field).toBe('email');
      expect(errors[1].message).toBe('Too short');
      expect(errors[2].value).toBe(17);
    });
  });

  describe('Edge Cases', () => {
    it('should handle field name with whitespace only', () => {
      const dto = new ValidationErrorDto('   ', 'Whitespace field');
      expect(dto.field).toBe('   ');
    });

    it('should handle message with whitespace only', () => {
      const dto = new ValidationErrorDto('field', '   ');
      expect(dto.message).toBe('   ');
    });

    it('should handle value with very long string', () => {
      const longString = 'a'.repeat(10000);
      const dto = new ValidationErrorDto('data', 'Too long', longString);
      expect(dto.value).toBe(longString);
    });

    it('should handle value with very large number', () => {
      const dto = new ValidationErrorDto(
        'number',
        'Too large',
        Number.MAX_VALUE,
      );
      expect(dto.value).toBe(Number.MAX_VALUE);
    });

    it('should handle value with very small number', () => {
      const dto = new ValidationErrorDto(
        'number',
        'Too small',
        Number.MIN_VALUE,
      );
      expect(dto.value).toBe(Number.MIN_VALUE);
    });

    it('should handle value with circular reference', () => {
      const data: any = { id: 1 };
      data.self = data;
      const dto = new ValidationErrorDto('data', 'Circular', data);
      expect((dto.value as any).id).toBe(1);
      expect((dto.value as any).self).toBe(data);
    });

    it('should handle value with complex nested structure', () => {
      const value = {
        level1: {
          level2: {
            level3: {
              level4: { deep: 'value' },
            },
          },
        },
      };
      const dto = new ValidationErrorDto('nested', 'Deep nesting', value);
      expect((dto.value as any).level1.level2.level3.level4.deep).toBe('value');
    });

    it('should handle field with same name as method', () => {
      const dto = new ValidationErrorDto('constructor', 'Error');
      expect(dto.field).toBe('constructor');
    });

    it('should handle value with non-serializable objects', () => {
      const value = {
        method: function () {
          return 'test';
        },
        symbol: Symbol('test'),
      };
      const dto = new ValidationErrorDto('data', 'Complex object', value);
      expect(typeof (dto.value as any).method).toBe('function');
    });

    it('should handle field name with special SQL injection pattern', () => {
      const dto = new ValidationErrorDto(
        "'; DROP TABLE users; --",
        'SQL injection',
      );
      expect(dto.field).toBe("'; DROP TABLE users; --");
    });

    it('should handle message with XSS attempt', () => {
      const xssMessage = '<script>alert("xss")</script>';
      const dto = new ValidationErrorDto('input', xssMessage);
      expect(dto.message).toBe(xssMessage);
    });
  });

  describe('JSON Serialization', () => {
    it('should serialize to JSON correctly', () => {
      const dto = new ValidationErrorDto('email', 'Invalid email', 'bad@email');

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.field).toBe('email');
      expect(parsed.message).toBe('Invalid email');
      expect(parsed.value).toBe('bad@email');
    });

    it('should serialize without value property when undefined', () => {
      const dto = new ValidationErrorDto('username', 'Username required');

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.field).toBe('username');
      expect(parsed.message).toBe('Username required');
      expect('value' in parsed).toBe(false);
    });

    it('should serialize with null value correctly', () => {
      const dto = new ValidationErrorDto('data', 'Null value', null);

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.value).toBeNull();
    });

    it('should serialize object value correctly', () => {
      const value = { id: 1, name: 'Test' };
      const dto = new ValidationErrorDto('user', 'Invalid user', value);

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.value).toEqual(value);
    });

    it('should serialize array value correctly', () => {
      const value = [1, 2, 3];
      const dto = new ValidationErrorDto('items', 'Invalid items', value);

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.value).toEqual(value);
    });

    it('should serialize Date value as ISO string', () => {
      const date = new Date('2024-01-01');
      const dto = new ValidationErrorDto('date', 'Invalid date', date);

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.value).toBe(date.toISOString());
    });

    it('should not serialize function in value', () => {
      const value = {
        id: 1,
        callback: function () {
          return 'test';
        },
      };
      const dto = new ValidationErrorDto('data', 'Has function', value);

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.value.id).toBe(1);
      expect('callback' in parsed.value).toBe(false);
    });
  });

  describe('Type Safety', () => {
    it('should maintain correct types for all properties', () => {
      const dto = new ValidationErrorDto('field', 'Error', 'value');

      expect(typeof dto.field).toBe('string');
      expect(typeof dto.message).toBe('string');
      expect(typeof dto.value).toBe('string');
    });

    it('should maintain type for field property', () => {
      const dto = new ValidationErrorDto('user_name', 'Error');
      const field: string = dto.field;

      expect(typeof field).toBe('string');
    });

    it('should maintain type for message property', () => {
      const dto = new ValidationErrorDto('field', 'Error message');
      const message: string = dto.message;

      expect(typeof message).toBe('string');
    });

    it('should allow any type for value property', () => {
      const dto = new ValidationErrorDto('field', 'Error', 'string');
      const value: any = dto.value;

      expect(value).toBe('string');

      const dto2 = new ValidationErrorDto('field', 'Error', 123);
      const value2: any = dto2.value;

      expect(typeof value2).toBe('number');
    });
  });

  describe('Property Assignment', () => {
    it('should allow property modification after creation', () => {
      const dto = new ValidationErrorDto('field', 'Error', 'value');

      dto.field = 'newField';
      dto.message = 'New error';

      expect(dto.field).toBe('newField');
      expect(dto.message).toBe('New error');
    });

    it('should allow value property modification', () => {
      const dto = new ValidationErrorDto('field', 'Error', 'old');

      dto.value = 'new';

      expect(dto.value).toBe('new');
    });

    it('should allow clearing value property', () => {
      const dto = new ValidationErrorDto('field', 'Error', 'value');

      dto.value = undefined;

      expect(dto.value).toBeUndefined();
    });

    it('should allow setting value to null', () => {
      const dto = new ValidationErrorDto('field', 'Error', 'value');

      dto.value = null;

      expect(dto.value).toBeNull();
    });
  });

  describe('Multiple Instances', () => {
    it('should create multiple independent instances', () => {
      const dto1 = new ValidationErrorDto('field1', 'Error 1', 'value1');
      const dto2 = new ValidationErrorDto('field2', 'Error 2', 'value2');

      expect(dto1.field).toBe('field1');
      expect(dto2.field).toBe('field2');
      expect(dto1).not.toEqual(dto2);
    });

    it('should not interfere when modifying one instance', () => {
      const dto1 = new ValidationErrorDto('field1', 'Error 1');
      const dto2 = new ValidationErrorDto('field2', 'Error 2');

      dto1.value = 'modified1';

      expect(dto2.value).toBeUndefined();
    });

    it('should handle array of ValidationErrorDto objects', () => {
      const errors = [
        new ValidationErrorDto('email', 'Invalid email', 'bad@email'),
        new ValidationErrorDto('password', 'Too short', '123'),
        new ValidationErrorDto('username', 'Required'),
      ];

      expect(errors.length).toBe(3);
      expect(errors[0].field).toBe('email');
      expect(errors[1].message).toBe('Too short');
      expect(errors[2].value).toBeUndefined();
    });
  });

  describe('Copying and Equality', () => {
    it('should create copy with same properties', () => {
      const original = new ValidationErrorDto('email', 'Invalid', 'bad@email');
      const copy = new ValidationErrorDto(
        original.field,
        original.message,
        original.value,
      );

      expect(copy.field).toBe(original.field);
      expect(copy.message).toBe(original.message);
      expect(copy.value).toBe(original.value);
    });

    it('should have separate instances even with same values', () => {
      const dto1 = new ValidationErrorDto('field', 'Error', 'value');
      const dto2 = new ValidationErrorDto('field', 'Error', 'value');

      expect(dto1).not.toBe(dto2);
      expect(dto1.field).toBe(dto2.field);
      expect(dto1.message).toBe(dto2.message);
      expect(dto1.value).toBe(dto2.value);
    });
  });
});
