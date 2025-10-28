import { ExecutionContext, CallHandler } from '@nestjs/common';
import { SanitizationInterceptor } from './sanitization.interceptors';
import { of } from 'rxjs';
import { Request } from 'express';

describe('SanitizationInterceptor - White Box Testing', () => {
  let interceptor: SanitizationInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: Partial<Request>;

  beforeEach(() => {
    interceptor = new SanitizationInterceptor();
    mockCallHandler = {
      handle: jest.fn(() => of({})),
    };

    mockRequest = {
      body: {},
      query: {},
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as any;
  });

  describe('intercept() - Main Entry Point', () => {
    it('should sanitize request body when present', (done) => {
      mockRequest.body = {
        message: '<script>alert("XSS")</script>Hello',
      };

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          expect(mockRequest.body.message).toBe('Hello');
          done();
        },
      });
    });

    it('should sanitize query parameters when present', (done) => {
      mockRequest.query = {
        search: '<iframe>malicious</iframe>',
      };

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          expect(mockRequest.query.search).toBe('');
          done();
        },
      });
    });

    it('should handle request with no body or query', (done) => {
      mockRequest.body = undefined;
      mockRequest.query = undefined;

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          expect(mockRequest.body).toBeUndefined();
          expect(mockRequest.query).toBeUndefined();
          done();
        },
      });
    });

    it('should sanitize both body and query simultaneously', (done) => {
      mockRequest.body = { text: '<script>evil</script>' };
      mockRequest.query = { param: 'javascript:alert(1)' };

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          expect(mockRequest.body.text).toBe('');
          expect(mockRequest.query.param).toBe('alert(1)');
          done();
        },
      });
    });
  });

  describe('sanitizeObject() - Path Coverage', () => {
    it('should handle string input directly', () => {
      const result = (interceptor as any).sanitizeObject('<script>test</script>');
      expect(result).toBe('test');
    });

    it('should handle null input', () => {
      const result = (interceptor as any).sanitizeObject(null);
      expect(result).toBeNull();
    });

    it('should handle undefined input', () => {
      const result = (interceptor as any).sanitizeObject(undefined);
      expect(result).toBeUndefined();
    });

    it('should handle number input', () => {
      const result = (interceptor as any).sanitizeObject(42);
      expect(result).toBe(42);
    });

    it('should handle boolean input', () => {
      const result = (interceptor as any).sanitizeObject(true);
      expect(result).toBe(true);
    });

    it('should handle array of strings', () => {
      const input = ['<script>alert(1)</script>', 'safe text', '<iframe>bad</iframe>'];
      const result = (interceptor as any).sanitizeObject(input);
      expect(result).toEqual(['alert(1)', 'safe text', '']);
    });

    it('should handle nested arrays', () => {
      const input = [
        ['<script>test</script>', 'normal'],
        ['<iframe>frame</iframe>'],
      ];
      const result = (interceptor as any).sanitizeObject(input);
      expect(result).toEqual([['test', 'normal'], ['']]);
    });

    it('should handle object with string values', () => {
      const input = {
        name: '<script>John</script>',
        email: 'test@example.com',
        bio: '<iframe>bio</iframe>',
      };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result).toEqual({
        name: 'John',
        email: 'test@example.com',
        bio: '',
      });
    });

    it('should handle deeply nested objects', () => {
      const input = {
        user: {
          profile: {
            name: '<script>alert("XSS")</script>Test',
            settings: {
              theme: 'dark',
              bio: 'javascript:void(0)',
            },
          },
        },
      };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.user.profile.name).toBe('Test');
      expect(result.user.profile.settings.bio).toBe('void(0)');
    });

    it('should handle mixed object with arrays and nested objects', () => {
      const input = {
        messages: ['<script>msg1</script>', '<iframe>msg2</iframe>'],
        user: {
          name: '<script>name</script>',
        },
        count: 10,
        active: true,
      };
      const result = (interceptor as any).sanitizeObject(input);
      expect(result.messages).toEqual(['msg1', '']);
      expect(result.user.name).toBe('name');
      expect(result.count).toBe(10);
      expect(result.active).toBe(true);
    });
  });

  describe('sanitizeString() - Branch Coverage', () => {
    describe('Empty and Safe Strings', () => {
      it('should return empty string as-is', () => {
        const result = (interceptor as any).sanitizeString('');
        expect(result).toBe('');
      });

      it('should return safe string without modification', () => {
        const result = (interceptor as any).sanitizeString('Hello World');
        expect(result).toBe('Hello World');
      });

      it('should handle string with only whitespace', () => {
        const result = (interceptor as any).sanitizeString('   ');
        expect(result).toBe('');
      });

      it('should trim safe strings', () => {
        const result = (interceptor as any).sanitizeString('  Hello  ');
        expect(result).toBe('Hello');
      });
    });

    describe('Encoded Script Tags', () => {
      it('should extract content from encoded script tags', () => {
        const input = '&lt;script&gt;alert("test")&lt;/script&gt;';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).toBe('alert("test")');
      });

      it('should extract content from encoded script tags with attributes', () => {
        const input = '&lt;script type="text/javascript"&gt;var x = 1;&lt;/script&gt;';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).toBe('var x = 1;');
      });

      it('should extract content from encoded iframe tags', () => {
        const input = '&lt;iframe src="evil.com"&gt;content&lt;/iframe&gt;';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).toBe('content');
      });

      it('should handle multiple encoded script tags', () => {
        const input = '&lt;script&gt;alert(1)&lt;/script&gt;text&lt;script&gt;alert(2)&lt;/script&gt;';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).toBe('alert(1)textalert(2)');
      });
    });

    describe('HTML Script Tags', () => {
      it('should extract content from script tags', () => {
        const input = '<script>alert("XSS")</script>Safe Text';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).toBe('alert("XSS")Safe Text');
      });

      it('should handle script tags with attributes', () => {
        const input = '<script type="text/javascript" src="evil.js">content</script>';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).toBe('content');
      });

      it('should handle multiline script tags', () => {
        const input = `<script>
          var x = 1;
          alert(x);
        </script>Text`;
        const result = (interceptor as any).sanitizeString(input);
        expect(result).toContain('var x = 1;');
      });

      it('should handle nested content in script tags', () => {
        const input = '<script><div>content</div></script>';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).toBe('&lt;div&gt;content&lt;/div&gt;');
      });
    });

    describe('Style Tags', () => {
      it('should extract content from style tags', () => {
        const input = '<style>body { color: red; }</style>Text';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).toBe('body { color: red; }Text');
      });

      it('should handle style tags with attributes', () => {
        const input = '<style type="text/css">div { margin: 0; }</style>';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).toBe('div { margin: 0; }');
      });

      it('should handle multiline style content', () => {
        const input = `<style>
          .class {
            color: blue;
          }
        </style>`;
        const result = (interceptor as any).sanitizeString(input);
        expect(result).toContain('color: blue;');
      });
    });

    describe('Iframe Tags', () => {
      it('should extract content from iframe tags', () => {
        const input = '<iframe src="malicious.com">Fallback Content</iframe>';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).toBe('Fallback Content');
      });

      it('should handle iframe with multiple attributes', () => {
        const input = '<iframe width="100" height="100" src="evil.com">text</iframe>';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).toBe('text');
      });

      it('should handle empty iframe tags', () => {
        const input = '<iframe src="test.com"></iframe>';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).toBe('');
      });
    });

    describe('Object and Embed Tags', () => {
      it('should extract content from object tags', () => {
        const input = '<object data="evil.swf">Content</object>';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).toBe('Content');
      });

      it('should remove embed tags completely', () => {
        const input = 'Before<embed src="malicious.swf">After';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).toBe('BeforeAfter');
      });

      it('should handle embed with attributes', () => {
        const input = '<embed type="application/x-shockwave-flash" src="test.swf">';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).toBe('');
      });
    });

    describe('Event Handlers', () => {
      it('should remove onclick event handlers with double quotes', () => {
        const input = '<div onclick="alert(1)">Click me</div>';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).not.toContain('onclick');
        expect(result).toContain('Click me');
      });

      it('should remove onclick event handlers with single quotes', () => {
        const input = "<div onclick='alert(1)'>Click me</div>";
        const result = (interceptor as any).sanitizeString(input);
        expect(result).not.toContain('onclick');
      });

      it('should remove onerror event handlers', () => {
        const input = '<img src="x" onerror="alert(1)">';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).not.toContain('onerror');
      });

      it('should remove onload event handlers', () => {
        const input = '<body onload="malicious()">Content</body>';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).not.toContain('onload');
      });

      it('should remove event handlers without quotes', () => {
        const input = '<div onmouseover=alert(1)>Hover</div>';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).not.toContain('onmouseover');
      });

      it('should remove multiple event handlers', () => {
        const input = '<div onclick="a()" onmouseover="b()" onload="c()">Text</div>';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).not.toContain('onclick');
        expect(result).not.toContain('onmouseover');
        expect(result).not.toContain('onload');
      });
    });

    describe('Dangerous Protocols', () => {
      it('should remove javascript: protocol', () => {
        const input = 'javascript:alert(1)';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).toBe('alert(1)');
      });

      it('should remove javascript: protocol case-insensitive', () => {
        const input = 'JaVaScRiPt:alert(1)';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).toBe('alert(1)');
      });

      it('should remove vbscript: protocol', () => {
        const input = 'vbscript:msgbox("XSS")';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).toBe('msgbox("XSS")');
      });

      it('should remove data:text/html protocol', () => {
        const input = 'data:text/html,<script>alert(1)</script>';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).toContain('alert(1)');
      });

      it('should handle multiple dangerous protocols', () => {
        const input = 'javascript:void(0) vbscript:test()';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).not.toContain('javascript:');
        expect(result).not.toContain('vbscript:');
      });
    });

    describe('Special Patterns', () => {
      it('should remove expression() pattern', () => {
        const input = 'width: expression(alert(1))';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).not.toContain('expression');
      });

      it('should remove expression() case-insensitive', () => {
        const input = 'width: EXPRESSION(alert(1))';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).not.toContain('EXPRESSION');
      });

      it('should remove @import statement', () => {
        const input = '@import url("evil.css")';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).not.toContain('@import');
      });

      it('should handle @import with spaces', () => {
        const input = '@import   url("test.css")';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).not.toContain('@import');
      });
    });

    describe('HTML Entity Encoding', () => {
      it('should encode < and > when present after sanitization', () => {
        const input = '<div>Content</div>';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).toContain('&lt;');
        expect(result).toContain('&gt;');
      });

      it('should not double-encode already safe content', () => {
        const input = 'Normal text without brackets';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).toBe('Normal text without brackets');
      });

      it('should encode remaining tags after script removal', () => {
        const input = '<script>alert(1)</script><div>Text</div>';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).toContain('&lt;div&gt;');
      });
    });

    describe('Complex Attack Vectors', () => {
      it('should handle mixed attack vectors', () => {
        const input = '<script>alert(1)</script><iframe src="evil"></iframe>javascript:void(0)';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).not.toContain('<script');
        expect(result).not.toContain('<iframe');
        expect(result).not.toContain('javascript:');
      });

      it('should handle obfuscated script tags', () => {
        const input = '<scr<script>ipt>alert(1)</scr</script>ipt>';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).not.toContain('alert(1)');
      });

      it('should handle multiple layers of encoding', () => {
        const input = '&lt;script&gt;alert(1)&lt;/script&gt;<script>alert(2)</script>';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).toContain('alert(1)');
        expect(result).toContain('alert(2)');
      });

      it('should preserve legitimate content while removing threats', () => {
        const input = 'Hello <script>alert("XSS")</script> World <b>Bold</b>';
        const result = (interceptor as any).sanitizeString(input);
        expect(result).toContain('Hello');
        expect(result).toContain('World');
        expect(result).toContain('alert');
      });
    });
  });

  describe('hasDangerousContent() - Conditional Coverage', () => {
    it('should return true for strings with < character', () => {
      const result = (interceptor as any).hasDangerousContent('Hello < World');
      expect(result).toBe(true);
    });

    it('should return true for strings with > character', () => {
      const result = (interceptor as any).hasDangerousContent('Hello > World');
      expect(result).toBe(true);
    });

    it('should return true for strings with javascript:', () => {
      const result = (interceptor as any).hasDangerousContent('javascript:alert(1)');
      expect(result).toBe(true);
    });

    it('should return true for strings with onerror', () => {
      const result = (interceptor as any).hasDangerousContent('onerror=alert(1)');
      expect(result).toBe(true);
    });

    it('should return true for strings with onclick', () => {
      const result = (interceptor as any).hasDangerousContent('onclick=malicious()');
      expect(result).toBe(true);
    });

    it('should return true for strings with onload', () => {
      const result = (interceptor as any).hasDangerousContent('onload=evil()');
      expect(result).toBe(true);
    });

    it('should return true for case-insensitive matches', () => {
      const result = (interceptor as any).hasDangerousContent('JAVASCRIPT:alert(1)');
      expect(result).toBe(true);
    });

    it('should return false for safe strings', () => {
      const result = (interceptor as any).hasDangerousContent('Hello World 123');
      expect(result).toBe(false);
    });

    it('should return false for empty string', () => {
      const result = (interceptor as any).hasDangerousContent('');
      expect(result).toBe(false);
    });
  });

  describe('cacheResult() - Cache Management', () => {
    it('should cache strings under 1KB', () => {
      const original = '<script>test</script>';
      const sanitized = 'test';
      (interceptor as any).cacheResult(original, sanitized);

      const cache = (interceptor as any).sanitizationCache;
      expect(cache.get(original)).toBe(sanitized);
    });

    it('should not cache strings over 1KB', () => {
      const original = 'a'.repeat(1025);
      const sanitized = 'a'.repeat(1025);
      (interceptor as any).cacheResult(original, sanitized);

      const cache = (interceptor as any).sanitizationCache;
      expect(cache.has(original)).toBe(false);
    });

    it('should implement LRU-like behavior when cache is full', () => {
      // Fill cache to max size
      for (let i = 0; i < 1000; i++) {
        (interceptor as any).cacheResult(`string${i}`, `sanitized${i}`);
      }

      const cache = (interceptor as any).sanitizationCache;
      expect(cache.size).toBe(1000);

      // Add one more to trigger cleanup
      (interceptor as any).cacheResult('new_string', 'new_sanitized');

      // Cache should have removed 100 old entries and added the new one
      expect(cache.size).toBeLessThan(1000);
      expect(cache.has('new_string')).toBe(true);
    });

    it('should delete oldest 100 entries when cache is full', () => {
      // Fill cache
      for (let i = 0; i < 1000; i++) {
        (interceptor as any).cacheResult(`string${i}`, `sanitized${i}`);
      }

      const cache = (interceptor as any).sanitizationCache;
      const firstKey = cache.keys().next().value;

      // Trigger cleanup
      (interceptor as any).cacheResult('trigger', 'cleanup');

      // First entries should be removed
      expect(cache.has('string0')).toBe(false);
      expect(cache.has('string99')).toBe(false);
      // Later entries should remain
      expect(cache.has('string999')).toBe(true);
    });
  });

  describe('Cache Utilization - Integration Tests', () => {
    it('should use cached result for repeated sanitization', () => {
      const input = '<script>alert("test")</script>';

      // First call - should cache
      const result1 = (interceptor as any).sanitizeString(input);

      const cache = (interceptor as any).sanitizationCache;
      expect(cache.has(input)).toBe(true);

      // Second call - should use cache
      const result2 = (interceptor as any).sanitizeString(input);

      expect(result1).toBe(result2);
      expect(cache.get(input)).toBe(result1);
    });

    it('should cache safe strings', () => {
      const input = 'Hello World';

      const result = (interceptor as any).sanitizeString(input);
      const cache = (interceptor as any).sanitizationCache;

      expect(cache.has(input)).toBe(true);
      expect(cache.get(input)).toBe(input);
    });

    it('should handle cache hits for dangerous content', () => {
      const input = 'javascript:alert(1)';

      // First sanitization
      (interceptor as any).sanitizeString(input);

      const cache = (interceptor as any).sanitizationCache;
      expect(cache.has(input)).toBe(true);

      // Verify cached result is used
      const cachedResult = cache.get(input);
      expect(cachedResult).toBe('alert(1)');
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle extremely long strings', () => {
      const longString = 'a'.repeat(10000);
      const result = (interceptor as any).sanitizeString(longString);
      expect(result.length).toBe(10000);
    });

    it('should handle strings with only dangerous characters', () => {
      const input = '<><><>';
      const result = (interceptor as any).sanitizeString(input);
      expect(result).toBe('&lt;&gt;&lt;&gt;&lt;&gt;');
    });

    it('should handle Unicode characters', () => {
      const input = '你好 <script>alert("XSS")</script> 世界';
      const result = (interceptor as any).sanitizeString(input);
      expect(result).toContain('你好');
      expect(result).toContain('世界');
    });

    it('should handle emojis', () => {
      const input = '😀 <script>alert(1)</script> 😎';
      const result = (interceptor as any).sanitizeString(input);
      expect(result).toContain('😀');
      expect(result).toContain('😎');
    });

    it('should handle newlines and special characters', () => {
      const input = 'Line1\nLine2\r\nLine3\tTab';
      const result = (interceptor as any).sanitizeString(input);
      expect(result).toContain('Line1');
      expect(result).toContain('Line2');
      expect(result).toContain('Tab');
    });

    it('should handle null bytes', () => {
      const input = 'test\x00null';
      const result = (interceptor as any).sanitizeString(input);
      expect(result).toBeDefined();
    });

    it('should handle mixed quotes', () => {
      const input = `<div onclick="alert('XSS')">Text</div>`;
      const result = (interceptor as any).sanitizeString(input);
      expect(result).not.toContain('onclick');
    });
  });

  describe('Performance and Optimization Tests', () => {
    it('should handle rapid repeated sanitization efficiently', () => {
      const input = '<script>alert(1)</script>';

      for (let i = 0; i < 100; i++) {
        const result = (interceptor as any).sanitizeString(input);
        expect(result).toBe('alert(1)');
      }

      // Should only have one cache entry
      const cache = (interceptor as any).sanitizationCache;
      expect(cache.size).toBe(1);
    });

    it('should handle batch sanitization of different strings', () => {
      const inputs = [
        '<script>alert(1)</script>',
        '<iframe>test</iframe>',
        'javascript:void(0)',
        'Safe string',
        '<div>Content</div>',
      ];

      inputs.forEach((input) => {
        const result = (interceptor as any).sanitizeString(input);
        expect(result).toBeDefined();
      });

      const cache = (interceptor as any).sanitizationCache;
      expect(cache.size).toBe(inputs.length);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should sanitize user registration data', (done) => {
      mockRequest.body = {
        username: 'john_doe',
        email: 'john@example.com',
        bio: '<script>alert("XSS")</script>I am a developer',
        website: 'javascript:alert(1)',
      };

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          expect(mockRequest.body.username).toBe('john_doe');
          expect(mockRequest.body.email).toBe('john@example.com');
          expect(mockRequest.body.bio).toBe('I am a developer');
          expect(mockRequest.body.website).toBe('alert(1)');
          done();
        },
      });
    });

    it('should sanitize chat messages', (done) => {
      mockRequest.body = {
        messages: [
          { text: 'Hello!', sender: 'user1' },
          { text: '<script>alert("XSS")</script>Hi there', sender: 'user2' },
          { text: 'How are you?', sender: 'user1' },
        ],
      };

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          expect(mockRequest.body.messages[0].text).toBe('Hello!');
          expect(mockRequest.body.messages[1].text).toBe('Hi there');
          expect(mockRequest.body.messages[2].text).toBe('How are you?');
          done();
        },
      });
    });

    it('should sanitize search queries with filters', (done) => {
      mockRequest.query = {
        q: '<script>search term</script>',
        category: 'books',
        sort: 'javascript:alert(1)',
        page: '1',
      };

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          expect(mockRequest.query.q).toBe('search term');
          expect(mockRequest.query.category).toBe('books');
          expect(mockRequest.query.sort).toBe('alert(1)');
          expect(mockRequest.query.page).toBe('1');
          done();
        },
      });
    });

    it('should sanitize file upload metadata', (done) => {
      mockRequest.body = {
        filename: 'document<script>.pdf',
        description: '<iframe>File description</iframe>',
        tags: ['tag1', '<script>tag2</script>', 'tag3'],
        metadata: {
          author: 'John Doe',
          title: '<script>Title</script>',
        },
      };

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          expect(mockRequest.body.filename).toContain('document');
          expect(mockRequest.body.description).toBe('File description');
          expect(mockRequest.body.tags[1]).toBe('tag2');
          expect(mockRequest.body.metadata.title).toBe('Title');
          done();
        },
      });
    });

    it('should handle API request with mixed safe and malicious data', (done) => {
      mockRequest.body = {
        safe: 'This is safe',
        malicious: '<script>alert("XSS")</script>',
        nested: {
          safe: 'Also safe',
          malicious: 'javascript:void(0)',
        },
        array: ['safe1', '<iframe>bad</iframe>', 'safe2'],
      };

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          expect(mockRequest.body.safe).toBe('This is safe');
          expect(mockRequest.body.malicious).toContain('alert');
          expect(mockRequest.body.malicious).not.toContain('<script');
          expect(mockRequest.body.nested.safe).toBe('Also safe');
          expect(mockRequest.body.nested.malicious).toBe('void(0)');
          expect(mockRequest.body.array[0]).toBe('safe1');
          expect(mockRequest.body.array[1]).toBe('');
          expect(mockRequest.body.array[2]).toBe('safe2');
          done();
        },
      });
    });
  });
});
