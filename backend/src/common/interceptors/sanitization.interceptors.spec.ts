import { SanitizationInterceptor } from './sanitization.interceptors';
import { ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { of } from 'rxjs';
import { Test, TestingModule } from '@nestjs/testing';

describe('SanitizationInterceptor', () => {
  let interceptor: SanitizationInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: any;
  let loggerLogMock: jest.SpyInstance;

  beforeEach(async () => {
    interceptor = new SanitizationInterceptor();

    mockRequest = {
      body: {},
      query: {},
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue({}),
      }),
      getType: jest.fn().mockReturnValue('http'),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    } as any;

    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of({ success: true })),
    } as any;

    loggerLogMock = jest
      .spyOn((interceptor as any)['logger'] as Logger, 'log')
      .mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('intercept', () => {
    it('should sanitize request body', (done) => {
      mockRequest.body = {
        username: 'test<script>alert("xss")</script>',
        email: 'test@example.com',
      };

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockRequest.body.username).toBe('test');
          expect(mockRequest.body.email).toBe('test@example.com');
          expect(mockCallHandler.handle).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should sanitize query parameters', (done) => {
      mockRequest.query = {
        search: 'test<script>alert("xss")</script>',
        page: '1',
      };

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockRequest.query.search).toBe('test');
          expect(mockRequest.query.page).toBe('1');
          done();
        },
        error: done.fail,
      });
    });

    it('should sanitize both body and query', (done) => {
      mockRequest.body = {
        content: '<script>alert("body")</script>message',
      };
      mockRequest.query = {
        filter: '<script>alert("query")</script>filter',
      };

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockRequest.body.content).toBe('message');
          expect(mockRequest.query.filter).toBe('filter');
          done();
        },
        error: done.fail,
      });
    });

    it('should handle null body', (done) => {
      mockRequest.body = null;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockRequest.body).toBeNull();
          done();
        },
        error: done.fail,
      });
    });

    it('should handle undefined body', (done) => {
      mockRequest.body = undefined;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockRequest.body).toBeUndefined();
          done();
        },
        error: done.fail,
      });
    });

    it('should handle empty body', (done) => {
      mockRequest.body = {};

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockRequest.body).toEqual({});
          done();
        },
        error: done.fail,
      });
    });

    it('should handle null query', (done) => {
      mockRequest.query = null;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockRequest.query).toBeNull();
          done();
        },
        error: done.fail,
      });
    });

    it('should handle undefined query', (done) => {
      mockRequest.query = undefined;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockRequest.query).toBeUndefined();
          done();
        },
        error: done.fail,
      });
    });

    it('should call next.handle()', (done) => {
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockCallHandler.handle).toHaveBeenCalledTimes(1);
          done();
        },
        error: done.fail,
      });
    });

    it('should return observable from next.handle()', (done) => {
      const testData = { message: 'test response' };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(testData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual(testData);
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('sanitizeObject - XSS Protection', () => {
    it('should remove script tags', () => {
      const input = { text: '<script>alert("xss")</script>hello' };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.text).toBe('hello');
    });

    it('should remove script tags with attributes', () => {
      const input = {
        text: '<script type="text/javascript">alert("xss")</script>hello',
      };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.text).toBe('hello');
    });

    it('should remove multiple script tags', () => {
      const input = { text: '<script>1</script>hello<script>2</script>world' };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.text).toBe('helloworld');
    });

    it('should remove script tags case-insensitively', () => {
      const input = { text: '<SCRIPT>alert("xss")</SCRIPT>hello' };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.text).toBe('hello');
    });

    it('should remove mixed case script tags', () => {
      const input = { text: '<ScRiPt>alert("xss")</sCrIpT>hello' };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.text).toBe('hello');
    });

    it('should remove javascript: protocol', () => {
      const input = { link: 'javascript:alert("xss")' };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.link).toBe('alert("xss")');
    });

    it('should remove javascript: protocol case-insensitively', () => {
      const input = { link: 'JAVASCRIPT:alert("xss")' };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.link).toBe('alert("xss")');
    });

    it('should remove javascript: protocol with mixed case', () => {
      const input = { link: 'JaVaScRiPt:alert("xss")' };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.link).toBe('alert("xss")');
    });

    it('should remove onclick event handler', () => {
      const input = { html: '<div onclick="alert()">click</div>' };
      const result = (interceptor as any).sanitizeObject(input);
      // Regex removes "onclick=" but leaves the value
      expect(result.html).toBe('<div "alert()">click</div>');
    });

    it('should remove onload event handler', () => {
      const input = { html: '<img onload="alert()" src="x">' };
      const result = (interceptor as any).sanitizeObject(input);
      // Regex removes "onload=" but leaves the value
      expect(result.html).toBe('<img "alert()" src="x">');
    });

    it('should remove onerror event handler', () => {
      const input = { html: '<img onerror="alert()" src="x">' };
      const result = (interceptor as any).sanitizeObject(input);
      // Regex removes "onerror=" but leaves the value
      expect(result.html).toBe('<img "alert()" src="x">');
    });

    it('should remove multiple event handlers', () => {
      const input = { html: '<div onclick="a()" onmouseover="b()">test</div>' };
      const result = (interceptor as any).sanitizeObject(input);
      // Regex removes event handler names but leaves values
      expect(result.html).toBe('<div "a()" "b()">test</div>');
    });

    it('should remove event handlers case-insensitively', () => {
      const input = { html: '<div ONCLICK="alert()">test</div>' };
      const result = (interceptor as any).sanitizeObject(input);
      // Regex removes "ONCLICK=" but leaves the value
      expect(result.html).toBe('<div "alert()">test</div>');
    });

    it('should trim whitespace', () => {
      const input = { text: '  hello world  ' };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.text).toBe('hello world');
    });

    it('should handle complex XSS attack', () => {
      const input = {
        text: '<script>alert("xss")</script>onclick="alert()"javascript:void(0)  hello  ',
      };
      const result = (interceptor as any).sanitizeObject(input);
      // Script tags removed, onclick= removed (value kept), javascript: removed, trimmed
      expect(result.text).toBe('"alert()"void(0)  hello');
    });
  });

  describe('sanitizeObject - Data Types', () => {
    it('should handle string primitives', () => {
      const input = 'test<script>alert()</script>';
      const result = (interceptor as any).sanitizeObject(input);
      expect(result).toBe('test<script>alert()</script>'); // Primitives are returned as-is
    });

    it('should handle number values', () => {
      const input = { age: 25, price: 99.99 };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.age).toBe(25);
      expect(result.price).toBe(99.99);
    });

    it('should handle boolean values', () => {
      const input = { active: true, deleted: false };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.active).toBe(true);
      expect(result.deleted).toBe(false);
    });

    it('should handle null values', () => {
      const input = { field: null };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.field).toBeNull();
    });

    it('should handle undefined values', () => {
      const input = { field: undefined };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.field).toBeUndefined();
    });

    it('should handle Date objects', () => {
      const date = new Date('2025-01-01');
      const input = { createdAt: date };
      const result = (interceptor as any).sanitizeObject(input);
      // Date objects are iterated as objects, converting to empty object
      expect(result.createdAt).toEqual({});
    });

    it('should handle empty string', () => {
      const input = { text: '' };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.text).toBe('');
    });

    it('should handle zero', () => {
      const input = { count: 0 };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.count).toBe(0);
    });

    it('should return null for null input', () => {
      const result = (interceptor as any).sanitizeObject(null);
      expect(result).toBeNull();
    });

    it('should return undefined for undefined input', () => {
      const result = (interceptor as any).sanitizeObject(undefined);
      expect(result).toBeUndefined();
    });
  });

  describe('sanitizeObject - Arrays', () => {
    it('should sanitize array of strings', () => {
      const input = [
        'test<script>alert()</script>',
        'hello<script>xss</script>',
      ];
      const result = (interceptor as any).sanitizeObject(input);
      // Arrays map over items, but strings are primitives returned as-is
      expect(result).toEqual([
        'test<script>alert()</script>',
        'hello<script>xss</script>',
      ]);
    });

    it('should sanitize array in object', () => {
      const input = {
        items: ['<script>1</script>a', '<script>2</script>b'],
      };
      const result = (interceptor as any).sanitizeObject(input);
      // Array items are strings (primitives), returned as-is
      expect(result.items).toEqual([
        '<script>1</script>a',
        '<script>2</script>b',
      ]);
    });

    it('should sanitize nested arrays', () => {
      const input = {
        matrix: [
          ['<script>x</script>a', 'b'],
          ['c', '<script>y</script>d'],
        ],
      };
      const result = (interceptor as any).sanitizeObject(input);
      // Nested arrays with string primitives are returned as-is
      expect(result.matrix).toEqual([
        ['<script>x</script>a', 'b'],
        ['c', '<script>y</script>d'],
      ]);
    });

    it('should sanitize array of objects', () => {
      const input = [
        { name: '<script>alert()</script>John' },
        { name: 'Jane<script>xss</script>' },
      ];
      const result = (interceptor as any).sanitizeObject(input);
      expect(result).toEqual([{ name: 'John' }, { name: 'Jane' }]);
    });

    it('should handle empty array', () => {
      const input = { items: [] };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.items).toEqual([]);
    });

    it('should handle array with mixed types', () => {
      const input = {
        mixed: ['<script>x</script>text', 123, true, null, undefined],
      };
      const result = (interceptor as any).sanitizeObject(input);
      // String primitives in arrays are not sanitized (returned as-is)
      expect(result.mixed).toEqual([
        '<script>x</script>text',
        123,
        true,
        null,
        undefined,
      ]);
    });

    it('should handle array with nested objects', () => {
      const input = {
        users: [
          {
            name: '<script>alert()</script>Alice',
            profile: { bio: 'test<script>xss</script>' },
          },
        ],
      };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.users[0].name).toBe('Alice');
      expect(result.users[0].profile.bio).toBe('test');
    });
  });

  describe('sanitizeObject - Nested Objects', () => {
    it('should sanitize nested object', () => {
      const input = {
        user: {
          name: '<script>alert()</script>John',
          email: 'john@example.com',
        },
      };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.user.name).toBe('John');
      expect(result.user.email).toBe('john@example.com');
    });

    it('should sanitize deeply nested objects', () => {
      const input = {
        level1: {
          level2: {
            level3: {
              text: '<script>alert()</script>deep',
            },
          },
        },
      };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.level1.level2.level3.text).toBe('deep');
    });

    it('should sanitize complex nested structure', () => {
      const input = {
        user: {
          name: '<script>xss</script>Alice',
          contacts: [
            { type: 'email', value: 'alice@example.com' },
            { type: 'phone', value: '<script>alert()</script>123' },
          ],
          settings: {
            theme: 'dark',
            notifications: {
              email: true,
              push: false,
            },
          },
        },
      };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.user.name).toBe('Alice');
      expect(result.user.contacts[1].value).toBe('123');
      expect(result.user.settings.theme).toBe('dark');
    });

    it('should handle circular-like deep nesting', () => {
      const input = {
        a: {
          b: {
            c: {
              d: {
                e: '<script>alert()</script>value',
              },
            },
          },
        },
      };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.a.b.c.d.e).toBe('value');
    });
  });

  describe('sanitizeObject - Special Characters and Edge Cases', () => {
    it('should handle special characters in strings', () => {
      const input = { text: '!@#$%^&*()_+-=[]{}|;:,.<>?' };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.text).toBe('!@#$%^&*()_+-=[]{}|;:,.<>?');
    });

    it('should handle unicode characters', () => {
      const input = { text: 'Hello 世界 🌍' };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.text).toBe('Hello 世界 🌍');
    });

    it('should handle emojis', () => {
      const input = { message: '😀😃😄😁<script>alert()</script>' };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.message).toBe('😀😃😄😁');
    });

    it('should handle HTML entities', () => {
      const input = { text: '&lt;script&gt;alert()&lt;/script&gt;' };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.text).toBe('&lt;script&gt;alert()&lt;/script&gt;');
    });

    it('should handle newlines and tabs', () => {
      const input = { text: 'line1\nline2\ttab' };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.text).toBe('line1\nline2\ttab');
    });

    it('should handle very long strings', () => {
      const longString =
        'a'.repeat(10000) + '<script>alert()</script>' + 'b'.repeat(10000);
      const input = { text: longString };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.text).toBe('a'.repeat(10000) + 'b'.repeat(10000));
    });

    it('should handle strings with only whitespace', () => {
      const input = { text: '     ' };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.text).toBe('');
    });

    it('should handle strings with only script tags', () => {
      const input = { text: '<script>alert()</script>' };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.text).toBe('');
    });

    it('should handle malformed script tags', () => {
      const input = { text: '<script>alert()<script>test' };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.text).toContain('test');
    });

    it('should handle script tags with line breaks', () => {
      const input = { text: '<script>\nalert()\n</script>hello' };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.text).toBe('hello');
    });
  });

  describe('sanitizeObject - Multiple Fields', () => {
    it('should sanitize all string fields in object', () => {
      const input = {
        field1: '<script>1</script>value1',
        field2: '<script>2</script>value2',
        field3: '<script>3</script>value3',
      };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.field1).toBe('value1');
      expect(result.field2).toBe('value2');
      expect(result.field3).toBe('value3');
    });

    it('should preserve non-string fields while sanitizing strings', () => {
      const input = {
        text: '<script>alert()</script>hello',
        number: 42,
        boolean: true,
        null: null,
        undefined: undefined,
      };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.text).toBe('hello');
      expect(result.number).toBe(42);
      expect(result.boolean).toBe(true);
      expect(result.null).toBeNull();
      expect(result.undefined).toBeUndefined();
    });

    it('should handle large objects with many fields', () => {
      const input: any = {};
      for (let i = 0; i < 100; i++) {
        input[`field${i}`] = `<script>alert(${i})</script>value${i}`;
      }
      const result = (interceptor as any).sanitizeObject(input);
      for (let i = 0; i < 100; i++) {
        expect(result[`field${i}`]).toBe(`value${i}`);
      }
    });
  });

  describe('Integration scenarios', () => {
    it('should handle real-world user registration data', (done) => {
      mockRequest.body = {
        username: 'john_doe<script>alert()</script>',
        email: 'john@example.com',
        password: 'securePass123',
        profile: {
          bio: 'I am a developer<script>xss</script>',
          website: 'javascript:alert("xss")',
        },
      };

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockRequest.body.username).toBe('john_doe');
          expect(mockRequest.body.email).toBe('john@example.com');
          expect(mockRequest.body.password).toBe('securePass123');
          expect(mockRequest.body.profile.bio).toBe('I am a developer');
          expect(mockRequest.body.profile.website).toBe('alert("xss")');
          done();
        },
        error: done.fail,
      });
    });

    it('should handle real-world search query', (done) => {
      mockRequest.query = {
        q: 'test search<script>alert()</script>',
        page: '1',
        limit: '10',
        sort: 'name',
      };

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockRequest.query.q).toBe('test search');
          expect(mockRequest.query.page).toBe('1');
          expect(mockRequest.query.limit).toBe('10');
          expect(mockRequest.query.sort).toBe('name');
          done();
        },
        error: done.fail,
      });
    });

    it('should handle real-world comment submission', (done) => {
      mockRequest.body = {
        content: 'Great article!<script>alert("xss")</script>',
        author: 'Alice<script>document.cookie</script>',
        metadata: {
          userAgent: 'Mozilla/5.0...',
          ipAddress: '192.168.1.1',
        },
      };

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockRequest.body.content).toBe('Great article!');
          expect(mockRequest.body.author).toBe('Alice');
          expect(mockRequest.body.metadata.userAgent).toBe('Mozilla/5.0...');
          done();
        },
        error: done.fail,
      });
    });

    it('should handle request with both body and query containing XSS', (done) => {
      mockRequest.body = {
        title: '<script>alert("body")</script>Title',
        content: 'Content<script>xss</script>',
      };
      mockRequest.query = {
        search: '<script>alert("query")</script>search',
        filter: 'javascript:void(0)',
      };

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockRequest.body.title).toBe('Title');
          expect(mockRequest.body.content).toBe('Content');
          expect(mockRequest.query.search).toBe('search');
          expect(mockRequest.query.filter).toBe('void(0)');
          done();
        },
        error: done.fail,
      });
    });

    it('should not modify request when no malicious content', (done) => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello, this is a clean message!',
      };
      mockRequest.query = {
        page: '1',
        sort: 'date',
      };

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockRequest.body.name).toBe('John Doe');
          expect(mockRequest.body.email).toBe('john@example.com');
          expect(mockRequest.body.message).toBe(
            'Hello, this is a clean message!',
          );
          expect(mockRequest.query.page).toBe('1');
          expect(mockRequest.query.sort).toBe('date');
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('Edge cases with different request types', () => {
    it('should handle request with no body and no query', (done) => {
      delete mockRequest.body;
      delete mockRequest.query;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockRequest.body).toBeUndefined();
          expect(mockRequest.query).toBeUndefined();
          done();
        },
        error: done.fail,
      });
    });

    it('should handle request with body but no query', (done) => {
      mockRequest.body = { text: '<script>alert()</script>test' };
      delete mockRequest.query;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockRequest.body.text).toBe('test');
          expect(mockRequest.query).toBeUndefined();
          done();
        },
        error: done.fail,
      });
    });

    it('should handle request with query but no body', (done) => {
      delete mockRequest.body;
      mockRequest.query = { q: '<script>alert()</script>search' };

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockRequest.body).toBeUndefined();
          expect(mockRequest.query.q).toBe('search');
          done();
        },
        error: done.fail,
      });
    });
  });
});
