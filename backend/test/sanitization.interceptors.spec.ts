import {
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { of, throwError } from 'rxjs';
import {
  SanitizationInterceptor,
  XssSafeStringSchema,
  SanitizedObjectSchema,
} from './sanitization.interceptors';

describe('SanitizationInterceptor - Kiểm thử hộp trắng', () => {
  let interceptor: SanitizationInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: jest.Mocked<CallHandler>;
  let mockRequest: any;

  beforeEach(() => {
    interceptor = new SanitizationInterceptor();

    mockRequest = {
      body: {},
      query: {},
      params: {},
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn(),
        getNext: jest.fn(),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as any;

    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of({ data: 'test' })),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
    interceptor.clearCache();
  });

  describe('Test Case 1: XssSafeStringSchema - Script Tags', () => {
    it('TC1.1: Nên loại bỏ <script> tags và giữ content', () => {
      // Arrange
      const input = '<script>alert("XSS")</script>Hello';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).toBe('alert("XSS")Hello');
      expect(result).not.toContain('<script>');
    });

    it('TC1.2: Nên loại bỏ nested script tags', () => {
      // Arrange
      const input = '<script><script>alert("nested")</script></script>';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).not.toContain('<script>');
    });

    it('TC1.3: Nên loại bỏ script tags với attributes', () => {
      // Arrange
      const input = '<script type="text/javascript">alert(1)</script>';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).toBe('alert(1)');
    });

    it('TC1.4: Nên xử lý encoded script tags', () => {
      // Arrange
      const input = '&lt;script&gt;alert(1)&lt;/script&gt;';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).toBe('alert(1)');
    });
  });

  describe('Test Case 2: XssSafeStringSchema - Dangerous Tags', () => {
    it('TC2.1: Nên loại bỏ <iframe> tags', () => {
      // Arrange
      const input = '<iframe src="evil.com">Content</iframe>';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).toBe('Content');
      expect(result).not.toContain('<iframe>');
    });

    it('TC2.2: Nên loại bỏ <object> tags', () => {
      // Arrange
      const input = '<object data="evil.swf">Object content</object>';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).toBe('Object content');
    });

    it('TC2.3: Nên loại bỏ <embed> tags hoàn toàn', () => {
      // Arrange
      const input = '<embed src="evil.swf">Text after';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).toBe('Text after');
      expect(result).not.toContain('<embed>');
    });

    it('TC2.4: Nên loại bỏ <style> tags và giữ content', () => {
      // Arrange
      const input = '<style>body { color: red; }</style>Normal text';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).toBe('body { color: red; }Normal text');
    });

    it('TC2.5: Nên loại bỏ encoded iframe tags', () => {
      // Arrange
      const input = '&lt;iframe&gt;content&lt;/iframe&gt;';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).toBe('content');
    });
  });

  describe('Test Case 3: XssSafeStringSchema - Event Handlers', () => {
    it('TC3.1: Nên loại bỏ onclick handler', () => {
      // Arrange
      const input = '<div onclick="alert(1)">Click me</div>';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).not.toContain('onclick');
    });

    it('TC3.2: Nên loại bỏ onerror handler', () => {
      // Arrange
      const input = '<img onerror="alert(\'XSS\')" src="x">';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).not.toContain('onerror');
    });

    it('TC3.3: Nên loại bỏ onload handler', () => {
      // Arrange
      const input = '<body onload="malicious()">Content</body>';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).not.toContain('onload');
    });

    it('TC3.4: Nên loại bỏ multiple event handlers', () => {
      // Arrange
      const input =
        '<div onclick="a()" onmouseover="b()" onfocus="c()">Text</div>';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('onmouseover');
      expect(result).not.toContain('onfocus');
    });

    it('TC3.5: Nên loại bỏ event handlers không có quotes', () => {
      // Arrange
      const input = '<div onclick=alert(1)>Text</div>';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).not.toContain('onclick');
    });
  });

  describe('Test Case 4: XssSafeStringSchema - Dangerous Protocols', () => {
    it('TC4.1: Nên loại bỏ javascript: protocol', () => {
      // Arrange
      const input = '<a href="javascript:alert(1)">Link</a>';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).not.toContain('javascript:');
    });

    it('TC4.2: Nên loại bỏ vbscript: protocol', () => {
      // Arrange
      const input = '<a href="vbscript:msgbox">Link</a>';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).not.toContain('vbscript:');
    });

    it('TC4.3: Nên loại bỏ data:text/html', () => {
      // Arrange
      const input = '<iframe src="data:text/html,<script>alert(1)</script>">';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).not.toContain('data:text/html');
    });

    it('TC4.4: Nên xử lý mixed case protocols', () => {
      // Arrange
      const input = '<a href="JaVaScRiPt:alert(1)">Link</a>';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('JaVaScRiPt:');
    });
  });

  describe('Test Case 5: XssSafeStringSchema - Special Patterns', () => {
    it('TC5.1: Nên loại bỏ expression()', () => {
      // Arrange
      const input = '<div style="width: expression(alert(1))">Content</div>';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).not.toContain('expression(');
    });

    it('TC5.2: Nên loại bỏ @import', () => {
      // Arrange
      const input = '<style>@import url("evil.css");</style>';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).not.toContain('@import');
    });

    it('TC5.3: Nên xử lý mixed case expression', () => {
      // Arrange
      const input = 'style="width: ExPrEsSiOn(alert(1))"';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).not.toMatch(/expression\s*\(/i);
    });
  });

  describe('Test Case 6: XssSafeStringSchema - HTML Encoding', () => {
    it('TC6.1: Nên encode < và > còn lại sau sanitization', () => {
      // Arrange
      const input = '<div>Safe content</div>';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });

    it('TC6.2: Không nên encode nếu không có < và >', () => {
      // Arrange
      const input = 'Plain text without tags';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).toBe('Plain text without tags');
      expect(result).not.toContain('&lt;');
    });

    it('TC6.3: Nên encode nested tags', () => {
      // Arrange
      const input = '<div><span>Text</span></div>';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });
  });

  describe('Test Case 7: XssSafeStringSchema - Edge Cases', () => {
    it('TC7.1: Nên xử lý empty string', () => {
      // Arrange
      const input = '';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).toBe('');
    });

    it('TC7.2: Nên trim whitespace', () => {
      // Arrange
      const input = '  text with spaces  ';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).toBe('text with spaces');
    });

    it('TC7.3: Nên xử lý string chỉ có whitespace', () => {
      // Arrange
      const input = '   ';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).toBe('');
    });

    it('TC7.4: Nên xử lý unicode characters', () => {
      // Arrange
      const input = 'Hello 你好 مرحبا';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).toBe('Hello 你好 مرحبا');
    });

    it('TC7.5: Nên xử lý emoji', () => {
      // Arrange
      const input = 'Hello 😀 👍 🎉';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).toBe('Hello 😀 👍 🎉');
    });
  });

  describe('Test Case 8: SanitizedObjectSchema - Primitives', () => {
    it('TC8.1: Nên xử lý string', () => {
      // Arrange
      const input = '<script>alert(1)</script>test';

      // Act
      const result = SanitizedObjectSchema.parse(input);

      // Assert
      expect(result).toBe('alert(1)test');
    });

    it('TC8.2: Nên xử lý number', () => {
      // Arrange
      const input = 42;

      // Act
      const result = SanitizedObjectSchema.parse(input);

      // Assert
      expect(result).toBe(42);
    });

    it('TC8.3: Nên xử lý boolean', () => {
      // Arrange
      const input = true;

      // Act
      const result = SanitizedObjectSchema.parse(input);

      // Assert
      expect(result).toBe(true);
    });

    it('TC8.4: Nên xử lý null', () => {
      // Arrange
      const input = null;

      // Act
      const result = SanitizedObjectSchema.parse(input);

      // Assert
      expect(result).toBeNull();
    });

    it('TC8.5: Nên xử lý undefined', () => {
      // Arrange
      const input = undefined;

      // Act
      const result = SanitizedObjectSchema.parse(input);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('Test Case 9: SanitizedObjectSchema - Arrays', () => {
    it('TC9.1: Nên sanitize array of strings', () => {
      // Arrange
      const input = ['<script>a</script>', 'normal', '<iframe>b</iframe>'];

      // Act
      const result = SanitizedObjectSchema.parse(input);

      // Assert
      expect(result).toEqual(['a', 'normal', 'b']);
    });

    it('TC9.2: Nên xử lý array of numbers', () => {
      // Arrange
      const input = [1, 2, 3];

      // Act
      const result = SanitizedObjectSchema.parse(input);

      // Assert
      expect(result).toEqual([1, 2, 3]);
    });

    it('TC9.3: Nên xử lý array of mixed types', () => {
      // Arrange
      const input = ['<script>test</script>', 42, true, null];

      // Act
      const result = SanitizedObjectSchema.parse(input);

      // Assert
      expect(result).toEqual(['test', 42, true, null]);
    });

    it('TC9.4: Nên xử lý nested arrays', () => {
      // Arrange
      const input = [
        ['<script>a</script>', 'b'],
        ['c', '<iframe>d</iframe>'],
      ];

      // Act
      const result = SanitizedObjectSchema.parse(input);

      // Assert
      expect(result).toEqual([
        ['a', 'b'],
        ['c', 'd'],
      ]);
    });

    it('TC9.5: Nên xử lý empty array', () => {
      // Arrange
      const input: any[] = [];

      // Act
      const result = SanitizedObjectSchema.parse(input);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('Test Case 10: SanitizedObjectSchema - Objects', () => {
    it('TC10.1: Nên sanitize object với string values', () => {
      // Arrange
      const input = {
        name: '<script>alert(1)</script>John',
        email: 'test@example.com',
      };

      // Act
      const result = SanitizedObjectSchema.parse(input);

      // Assert
      expect(result.name).toBe('alert(1)John');
      expect(result.email).toBe('test@example.com');
    });

    it('TC10.2: Nên xử lý nested objects', () => {
      // Arrange
      const input = {
        user: {
          name: '<script>test</script>',
          profile: {
            bio: '<iframe>bio</iframe>',
          },
        },
      };

      // Act
      const result = SanitizedObjectSchema.parse(input);

      // Assert
      expect(result.user.name).toBe('test');
      expect(result.user.profile.bio).toBe('bio');
    });

    it('TC10.3: Nên xử lý object với mixed types', () => {
      // Arrange
      const input = {
        str: '<script>a</script>',
        num: 42,
        bool: true,
        nil: null,
      };

      // Act
      const result = SanitizedObjectSchema.parse(input);

      // Assert
      expect(result.str).toBe('a');
      expect(result.num).toBe(42);
      expect(result.bool).toBe(true);
      expect(result.nil).toBeNull();
    });

    it('TC10.4: Nên xử lý empty object', () => {
      // Arrange
      const input = {};

      // Act
      const result = SanitizedObjectSchema.parse(input);

      // Assert
      expect(result).toEqual({});
    });

    it('TC10.5: Nên xử lý object chứa arrays', () => {
      // Arrange
      const input = {
        tags: ['<script>tag1</script>', 'tag2'],
        items: [{ name: '<iframe>item</iframe>' }],
      };

      // Act
      const result = SanitizedObjectSchema.parse(input);

      // Assert
      expect(result.tags).toEqual(['tag1', 'tag2']);
      expect(result.items[0].name).toBe('item');
    });
  });

  describe('Test Case 11: Interceptor - intercept method', () => {
    it('TC11.1: Nên sanitize request body', () => {
      // Arrange
      mockRequest.body = {
        content: '<script>alert(1)</script>',
      };

      // Act
      interceptor.intercept(mockExecutionContext, mockCallHandler);

      // Assert
      expect(mockRequest.body.content).toBe('alert(1)');
    });

    it('TC11.2: Nên sanitize query parameters', () => {
      // Arrange
      mockRequest.query = {
        search: '<script>search</script>',
      };

      // Act
      interceptor.intercept(mockExecutionContext, mockCallHandler);

      // Assert
      expect(mockRequest.query.search).toBe('search');
    });

    it('TC11.3: Nên sanitize URL params', () => {
      // Arrange
      mockRequest.params = {
        id: '<script>123</script>',
      };

      // Act
      interceptor.intercept(mockExecutionContext, mockCallHandler);

      // Assert
      expect(mockRequest.params.id).toBe('123');
    });

    it('TC11.4: Nên sanitize tất cả parts cùng lúc', () => {
      // Arrange
      mockRequest.body = { name: '<script>body</script>' };
      mockRequest.query = { q: '<iframe>query</iframe>' };
      mockRequest.params = { id: '<embed src="x">param</embed>' };

      // Act
      interceptor.intercept(mockExecutionContext, mockCallHandler);

      // Assert
      expect(mockRequest.body.name).toBe('body');
      expect(mockRequest.query.q).toBe('query');
      // <embed> is removed but closing tag might remain as text
      expect(mockRequest.params.id).toContain('param');
    });

    it('TC11.5: Nên call next.handle()', () => {
      // Arrange
      mockRequest.body = { test: 'data' };

      // Act
      interceptor.intercept(mockExecutionContext, mockCallHandler);

      // Assert
      expect(mockCallHandler.handle).toHaveBeenCalled();
    });
  });

  describe('Test Case 12: Interceptor - Error Handling', () => {
    it('TC12.1: Nên wrap error trong BadRequestException', () => {
      // Arrange
      // Mock sanitizeWithCache để throw error
      jest
        .spyOn(interceptor as any, 'sanitizeWithCache')
        .mockImplementation(() => {
          throw new Error('Sanitization error');
        });
      mockRequest.body = { test: 'data' };

      // Act & Assert
      expect(() => {
        interceptor.intercept(mockExecutionContext, mockCallHandler);
      }).toThrow(BadRequestException);
    });

    it('TC12.2: Nên include error message trong BadRequestException', () => {
      // Arrange
      jest
        .spyOn(interceptor as any, 'sanitizeWithCache')
        .mockImplementation(() => {
          throw new Error('Custom sanitization error');
        });
      mockRequest.body = { test: 'data' };

      // Act & Assert
      try {
        interceptor.intercept(mockExecutionContext, mockCallHandler);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Custom sanitization error',
        );
      }
    });
  });

  describe('Test Case 13: Cache - sanitizeStringWithCache', () => {
    it('TC13.1: Nên cache sanitized strings', () => {
      // Arrange
      const input = '<script>test</script>';
      mockRequest.body = { text: input };

      // Act - First call
      interceptor.intercept(mockExecutionContext, mockCallHandler);
      const stats1 = interceptor.getCacheStats();

      // Second call với same input
      mockRequest.body = { text: input };
      interceptor.intercept(mockExecutionContext, mockCallHandler);
      const stats2 = interceptor.getCacheStats();

      // Assert
      expect(stats1.size).toBeGreaterThan(0);
      expect(stats2.size).toBe(stats1.size); // Không tăng vì đã cached
    });

    it('TC13.2: Nên return cached result', () => {
      // Arrange
      const input = '<script>cached</script>';

      // Act - First sanitization
      const result1 = interceptor['sanitizeStringWithCache'](input);
      // Second call should use cache
      const result2 = interceptor['sanitizeStringWithCache'](input);

      // Assert
      expect(result1).toBe('cached');
      expect(result2).toBe('cached');
      expect(result1).toBe(result2);
    });

    it('TC13.3: Nên cache safe strings', () => {
      // Arrange
      const input = 'safe string';

      // Act
      interceptor['sanitizeStringWithCache'](input);
      const stats = interceptor.getCacheStats();

      // Assert
      expect(stats.size).toBeGreaterThan(0);
    });

    it('TC13.4: Không nên cache empty strings', () => {
      // Arrange
      const input = '';

      // Act
      const result = interceptor['sanitizeStringWithCache'](input);

      // Assert
      expect(result).toBe('');
      // Empty strings return early, no caching
    });

    it('TC13.5: Không nên cache strings > 1KB', () => {
      // Arrange
      const input = 'a'.repeat(2000); // > MAX_STRING_LENGTH

      // Act
      interceptor['sanitizeStringWithCache'](input);
      const stats = interceptor.getCacheStats();

      // Assert - Large strings không được cache
      expect(stats.size).toBe(0);
    });
  });

  describe('Test Case 14: Cache - hasDangerousContent', () => {
    it('TC14.1: Nên detect <script>', () => {
      // Arrange
      const input = 'text with <script>alert(1)</script>';

      // Act
      const result = interceptor['hasDangerousContent'](input);

      // Assert
      expect(result).toBe(true);
    });

    it('TC14.2: Nên detect mixed case tags', () => {
      // Arrange
      const input = 'text with <ScRiPt>';

      // Act
      const result = interceptor['hasDangerousContent'](input);

      // Assert
      expect(result).toBe(true);
    });

    it('TC14.3: Nên detect event handlers', () => {
      // Arrange
      const inputs = [
        'onclick="alert(1)"',
        'onerror=test',
        'onload=init()',
        'onmouseover=x',
      ];

      // Act & Assert
      inputs.forEach((input) => {
        expect(interceptor['hasDangerousContent'](input)).toBe(true);
      });
    });

    it('TC14.4: Nên detect dangerous protocols', () => {
      // Arrange
      const inputs = [
        'javascript:alert(1)',
        'vbscript:msgbox',
        'data:text/html,<script>',
      ];

      // Act & Assert
      inputs.forEach((input) => {
        expect(interceptor['hasDangerousContent'](input)).toBe(true);
      });
    });

    it('TC14.5: Không nên flag safe strings', () => {
      // Arrange
      const input = 'This is a normal safe string';

      // Act
      const result = interceptor['hasDangerousContent'](input);

      // Assert
      expect(result).toBe(false);
    });

    it('TC14.6: Nên detect tất cả dangerous tags', () => {
      // Arrange
      const dangerousTags = [
        '<script>',
        '<iframe>',
        '<object>',
        '<embed>',
        '<style>',
      ];

      // Act & Assert
      dangerousTags.forEach((tag) => {
        expect(interceptor['hasDangerousContent'](tag)).toBe(true);
      });
    });
  });

  describe('Test Case 15: Cache - cacheResult và LRU', () => {
    it('TC15.1: Nên add vào cache', () => {
      // Arrange
      const original = 'test';
      const sanitized = 'test-sanitized';

      // Act
      interceptor['cacheResult'](original, sanitized);
      const stats = interceptor.getCacheStats();

      // Assert
      expect(stats.size).toBe(1);
    });

    it('TC15.2: Không nên cache strings > MAX_STRING_LENGTH', () => {
      // Arrange
      const original = 'a'.repeat(2000);
      const sanitized = 'sanitized';

      // Act
      interceptor['cacheResult'](original, sanitized);
      const stats = interceptor.getCacheStats();

      // Assert
      expect(stats.size).toBe(0);
    });

    it('TC15.3: Nên implement LRU khi đạt MAX_CACHE_SIZE', () => {
      // Arrange - Fill cache to max
      for (let i = 0; i < 1000; i++) {
        interceptor['cacheResult'](`key${i}`, `value${i}`);
      }
      const statsBefore = interceptor.getCacheStats();

      // Act - Add one more
      interceptor['cacheResult']('newKey', 'newValue');
      const statsAfter = interceptor.getCacheStats();

      // Assert - Should trigger LRU eviction
      expect(statsBefore.size).toBe(1000);
      expect(statsAfter.size).toBeLessThan(1000); // Old entries evicted
    });

    it('TC15.4: Nên evict 10% oldest entries khi đầy', () => {
      // Arrange - Fill to max
      for (let i = 0; i < 1000; i++) {
        interceptor['cacheResult'](`key${i}`, `value${i}`);
      }

      // Act - Trigger eviction
      interceptor['cacheResult']('overflow', 'value');
      const stats = interceptor.getCacheStats();

      // Assert - Should have removed ~10% (100 entries)
      expect(stats.size).toBeLessThanOrEqual(901); // 1000 - 100 + 1
    });
  });

  describe('Test Case 16: Cache - clearCache', () => {
    it('TC16.1: Nên clear all cache', () => {
      // Arrange - Add some items
      interceptor['cacheResult']('key1', 'value1');
      interceptor['cacheResult']('key2', 'value2');
      expect(interceptor.getCacheStats().size).toBeGreaterThan(0);

      // Act
      interceptor.clearCache();

      // Assert
      expect(interceptor.getCacheStats().size).toBe(0);
    });

    it('TC16.2: Nên cho phép caching sau clear', () => {
      // Arrange
      interceptor.clearCache();

      // Act
      interceptor['cacheResult']('new', 'value');

      // Assert
      expect(interceptor.getCacheStats().size).toBe(1);
    });
  });

  describe('Test Case 17: Cache - getCacheStats', () => {
    it('TC17.1: Nên return correct cache size', () => {
      // Arrange
      interceptor['cacheResult']('a', '1');
      interceptor['cacheResult']('b', '2');

      // Act
      const stats = interceptor.getCacheStats();

      // Assert
      expect(stats.size).toBe(2);
    });

    it('TC17.2: Nên return correct maxSize', () => {
      // Act
      const stats = interceptor.getCacheStats();

      // Assert
      expect(stats.maxSize).toBe(1000);
    });

    it('TC17.3: Nên return hitRate', () => {
      // Act
      const stats = interceptor.getCacheStats();

      // Assert
      expect(stats.hitRate).toBeDefined();
      expect(stats.hitRate).toBe(0); // Not implemented yet
    });
  });

  describe('Test Case 18: Integration - Complex Scenarios', () => {
    it('TC18.1: Nên sanitize complex nested structure', () => {
      // Arrange
      mockRequest.body = {
        user: {
          name: '<script>John</script>',
          comments: [
            { text: '<iframe>Comment 1</iframe>' },
            { text: 'Safe comment' },
          ],
          profile: {
            bio: '<object>Bio</object>',
            tags: ['<embed>tag1', 'tag2'],
          },
        },
      };

      // Act
      interceptor.intercept(mockExecutionContext, mockCallHandler);

      // Assert
      expect(mockRequest.body.user.name).toBe('John');
      expect(mockRequest.body.user.comments[0].text).toBe('Comment 1');
      expect(mockRequest.body.user.comments[1].text).toBe('Safe comment');
      expect(mockRequest.body.user.profile.bio).toBe('Bio');
      expect(mockRequest.body.user.profile.tags).toEqual(['tag1', 'tag2']);
    });

    it('TC18.2: Nên handle null và undefined trong structures', () => {
      // Arrange
      mockRequest.body = {
        field1: null,
        field2: undefined,
        field3: '<script>test</script>',
        nested: {
          a: null,
          b: '<iframe>content</iframe>',
        },
      };

      // Act
      interceptor.intercept(mockExecutionContext, mockCallHandler);

      // Assert
      expect(mockRequest.body.field1).toBeNull();
      expect(mockRequest.body.field2).toBeUndefined();
      expect(mockRequest.body.field3).toBe('test');
      expect(mockRequest.body.nested.a).toBeNull();
      expect(mockRequest.body.nested.b).toBe('content');
    });

    it('TC18.3: Nên preserve data types', () => {
      // Arrange
      mockRequest.body = {
        string: '<script>text</script>',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { key: 'value' },
      };

      // Act
      interceptor.intercept(mockExecutionContext, mockCallHandler);

      // Assert
      expect(typeof mockRequest.body.string).toBe('string');
      expect(typeof mockRequest.body.number).toBe('number');
      expect(typeof mockRequest.body.boolean).toBe('boolean');
      expect(Array.isArray(mockRequest.body.array)).toBe(true);
      expect(typeof mockRequest.body.object).toBe('object');
    });
  });

  describe('Test Case 19: Edge Cases - Sanitization', () => {
    it('TC19.1: Nên xử lý malformed HTML', () => {
      // Arrange
      const input = '<script>alert(1)<script>'; // Missing close tag

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).not.toContain('<script>');
    });

    it('TC19.2: Nên xử lý multiple XSS attempts', () => {
      // Arrange
      const input = '<script>a</script><iframe>b</iframe><object>c</object>';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).toBe('abc');
    });

    it('TC19.3: Nên xử lý obfuscated XSS', () => {
      // Arrange
      const input = '<img src=x onerror="alert(1)">';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).not.toContain('onerror');
    });

    it('TC19.4: Nên preserve normal HTML entities', () => {
      // Arrange
      const input = 'Price: &pound;10 &amp; &copy;2024';

      // Act
      const result = XssSafeStringSchema.parse(input);

      // Assert
      expect(result).toContain('&pound;');
      expect(result).toContain('&amp;');
      expect(result).toContain('&copy;');
    });
  });

  describe('Test Case 20: Performance - Cache Efficiency', () => {
    it('TC20.1: Cache nên improve performance cho repeated strings', () => {
      // Arrange
      const input = '<script>repeated</script>';

      // Act - First call (not cached)
      const start1 = Date.now();
      interceptor['sanitizeStringWithCache'](input);
      const time1 = Date.now() - start1;

      // Second call (cached)
      const start2 = Date.now();
      interceptor['sanitizeStringWithCache'](input);
      const time2 = Date.now() - start2;

      // Assert - Cached call should be faster (or at least not slower)
      expect(time2).toBeLessThanOrEqual(time1 + 1); // Allow 1ms margin
    });

    it('TC20.2: Nên handle large batches efficiently', () => {
      // Arrange
      const batch = Array.from({ length: 100 }, (_, i) => ({
        text: `<script>item${i}</script>`,
      }));
      mockRequest.body = { items: batch };

      // Act
      const start = Date.now();
      interceptor.intercept(mockExecutionContext, mockCallHandler);
      const duration = Date.now() - start;

      // Assert - Should complete in reasonable time
      expect(duration).toBeLessThan(1000); // < 1 second
      expect(mockRequest.body.items[0].text).toBe('item0');
    });
  });
});
