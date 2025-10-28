import { ErrorResponseDto } from './error.response.dto';
import { BaseResponseDto } from './base.response.dto';

describe('ErrorResponseDto - White Box Testing', () => {
  describe('Constructor Tests', () => {
    describe('With all parameters', () => {
      it('should create ErrorResponseDto with message, code, and details', () => {
        const details = { field: 'email', reason: 'Invalid format' };
        const dto = new ErrorResponseDto(
          'Validation failed',
          'VALIDATION_ERROR',
          details,
        );

        expect(dto).toBeInstanceOf(ErrorResponseDto);
        expect(dto).toBeInstanceOf(BaseResponseDto);
        expect(dto.success).toBe(false);
        expect(dto.message).toBe('Validation failed');
        expect(dto.data).toBeUndefined();
        expect(dto.error?.code).toBe('VALIDATION_ERROR');
        expect(dto.error?.details).toEqual(details);
        expect(dto.timestamp).toBeDefined();
      });

      it('should create ErrorResponseDto with object details', () => {
        const details = {
          errors: ['Email is required', 'Password too short'],
          timestamp: new Date().toISOString(),
        };
        const dto = new ErrorResponseDto(
          'Multiple errors',
          'MULTI_ERROR',
          details,
        );

        expect(dto.success).toBe(false);
        expect(dto.error?.details).toEqual(details);
        expect((dto.error?.details as any)?.errors).toHaveLength(2);
      });

      it('should create ErrorResponseDto with array details', () => {
        const details = ['error1', 'error2', 'error3'];
        const dto = new ErrorResponseDto(
          'Errors occurred',
          'ARRAY_ERROR',
          details,
        );

        expect(dto.error?.details).toEqual(details);
        expect(Array.isArray(dto.error?.details)).toBe(true);
      });

      it('should create ErrorResponseDto with number details', () => {
        const dto = new ErrorResponseDto('Timeout', 'TIMEOUT_ERROR', 5000);

        expect(dto.error?.details).toBe(5000);
        expect(typeof dto.error?.details).toBe('number');
      });

      it('should create ErrorResponseDto with string details', () => {
        const dto = new ErrorResponseDto(
          'Connection failed',
          'CONNECTION_ERROR',
          'Database unavailable',
        );

        expect(dto.error?.details).toBe('Database unavailable');
        expect(typeof dto.error?.details).toBe('string');
      });

      it('should create ErrorResponseDto with boolean details', () => {
        const dto = new ErrorResponseDto(
          'Feature disabled',
          'FEATURE_ERROR',
          false,
        );

        expect(dto.error?.details).toBe(false);
        expect(typeof dto.error?.details).toBe('boolean');
      });

      it('should create ErrorResponseDto with null details', () => {
        const dto = new ErrorResponseDto('Error occurred', 'ERROR', null);

        expect(dto.error?.details).toBeNull();
      });
    });

    describe('With message and code only', () => {
      it('should create ErrorResponseDto with custom code', () => {
        const dto = new ErrorResponseDto('Not found', 'NOT_FOUND');

        expect(dto.success).toBe(false);
        expect(dto.message).toBe('Not found');
        expect(dto.error?.code).toBe('NOT_FOUND');
        expect(dto.error?.details).toBeUndefined();
      });

      it('should create ErrorResponseDto with different error codes', () => {
        const codes = [
          'AUTH_ERROR',
          'VALIDATION_ERROR',
          'NOT_FOUND',
          'INTERNAL_ERROR',
          'TIMEOUT',
          'RATE_LIMIT',
          'FORBIDDEN',
          'BAD_REQUEST',
        ];

        codes.forEach((code) => {
          const dto = new ErrorResponseDto(`Error with code ${code}`, code);
          expect(dto.error?.code).toBe(code);
        });
      });
    });

    describe('With message only (using default code)', () => {
      it('should create ErrorResponseDto with default code "ERROR"', () => {
        const dto = new ErrorResponseDto('An error occurred');

        expect(dto.success).toBe(false);
        expect(dto.message).toBe('An error occurred');
        expect(dto.error?.code).toBe('ERROR');
        expect(dto.error?.details).toBeUndefined();
      });

      it('should use default code when not provided', () => {
        const dto = new ErrorResponseDto('Default error message');

        expect(dto.error?.code).toBe('ERROR');
        expect(dto.error?.details).toBeUndefined();
      });
    });

    describe('Inheritance behavior', () => {
      it('should inherit from BaseResponseDto', () => {
        const dto = new ErrorResponseDto('Test', 'TEST_CODE');

        expect(dto instanceof BaseResponseDto).toBe(true);
      });

      it('should have all BaseResponseDto properties', () => {
        const dto = new ErrorResponseDto('Test', 'TEST_CODE', 'details');

        expect(dto).toHaveProperty('success');
        expect(dto).toHaveProperty('message');
        expect(dto).toHaveProperty('data');
        expect(dto).toHaveProperty('error');
        expect(dto).toHaveProperty('timestamp');
        expect(dto).toHaveProperty('requestId');
      });

      it('should set success always to false', () => {
        const dto = new ErrorResponseDto('Test');

        expect(dto.success).toBe(false);
      });

      it('should set data always to undefined', () => {
        const dto = new ErrorResponseDto('Test', 'CODE', 'details');

        expect(dto.data).toBeUndefined();
      });
    });
  });

  describe('Edge Cases and Special Values', () => {
    it('should handle empty string message', () => {
      const dto = new ErrorResponseDto('');

      expect(dto.message).toBe('');
      expect(dto.message).toHaveLength(0);
    });

    it('should handle very long message', () => {
      const longMessage = 'a'.repeat(10000);
      const dto = new ErrorResponseDto(longMessage);

      expect(dto.message).toBe(longMessage);
      expect(dto.message.length).toBe(10000);
    });

    it('should handle message with special characters', () => {
      const message = 'Error! 🚫 Special chars: @#$%^&*()';
      const dto = new ErrorResponseDto(message);

      expect(dto.message).toBe(message);
    });

    it('should handle message with newlines and tabs', () => {
      const message = 'Error\non\nmultiple\nlines';
      const dto = new ErrorResponseDto(message);

      expect(dto.message).toBe(message);
      expect(dto.message).toContain('\n');
    });

    it('should handle unicode characters in message', () => {
      const message = '中文错误消息 日本語エラー 한국어 오류';
      const dto = new ErrorResponseDto(message);

      expect(dto.message).toBe(message);
    });

    it('should handle empty string code', () => {
      const dto = new ErrorResponseDto('Error', '');

      expect(dto.error?.code).toBe('');
    });

    it('should handle very long code', () => {
      const code = 'VERY_LONG_ERROR_CODE_'.repeat(50);
      const dto = new ErrorResponseDto('Error', code);

      expect(dto.error?.code).toBe(code);
    });

    it('should handle code with special characters', () => {
      const code = 'ERROR_CODE@#$%';
      const dto = new ErrorResponseDto('Error', code);

      expect(dto.error?.code).toBe(code);
    });

    it('should handle complex nested details object', () => {
      const details = {
        context: {
          userId: '123',
          timestamp: new Date().toISOString(),
        },
        errors: [
          { field: 'email', message: 'Invalid' },
          { field: 'password', message: 'Too short' },
        ],
        metadata: {
          requestId: 'req-123',
          stack: ['line1', 'line2'],
        },
      };
      const dto = new ErrorResponseDto(
        'Complex error',
        'COMPLEX_ERROR',
        details,
      );

      expect(dto.error?.details).toEqual(details);
      expect((dto.error?.details as any)?.context?.userId).toBe('123');
      expect((dto.error?.details as any)?.errors).toHaveLength(2);
    });

    it('should handle circular reference in details (if possible)', () => {
      const details: any = { message: 'Error' };
      details.self = details;

      const dto = new ErrorResponseDto('Circular', 'CIRCULAR', details);

      expect(dto.error?.details).toBeDefined();
      expect((dto.error?.details as any)?.message).toBe('Error');
    });
  });

  describe('Timestamp and Metadata', () => {
    it('should auto-generate ISO timestamp', () => {
      const beforeTime = new Date();
      const dto = new ErrorResponseDto('Test');
      const afterTime = new Date();

      const timestamp = new Date(dto.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp >= beforeTime).toBe(true);
      expect(timestamp <= afterTime).toBe(true);
    });

    it('should generate different timestamps for different instances', async () => {
      const dto1 = new ErrorResponseDto('First');
      await new Promise((resolve) => setTimeout(resolve, 10));
      const dto2 = new ErrorResponseDto('Second');

      expect(dto1.timestamp).not.toBe(dto2.timestamp);
    });

    it('should have valid ISO timestamp format', () => {
      const dto = new ErrorResponseDto('Test');

      expect(dto.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should not have requestId by default', () => {
      const dto = new ErrorResponseDto('Test');

      expect(dto.requestId).toBeUndefined();
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should work for authentication error', () => {
      const details = {
        attemptedAt: new Date().toISOString(),
        ip: '192.168.1.1',
      };
      const dto = new ErrorResponseDto(
        'Authentication failed',
        'AUTH_ERROR',
        details,
      );

      expect(dto.success).toBe(false);
      expect(dto.message).toBe('Authentication failed');
      expect(dto.error?.code).toBe('AUTH_ERROR');
      expect((dto.error?.details as any)?.attemptedAt).toBeDefined();
    });

    it('should work for validation error', () => {
      const details = {
        fields: [
          { field: 'email', errors: ['Required', 'Invalid format'] },
          { field: 'password', errors: ['Too short', 'Needs special char'] },
        ],
      };
      const dto = new ErrorResponseDto(
        'Validation failed',
        'VALIDATION_ERROR',
        details,
      );

      expect(dto.error?.code).toBe('VALIDATION_ERROR');
      expect((dto.error?.details as any)?.fields).toBeDefined();
      expect((dto.error?.details as any)?.fields?.length).toBe(2);
    });

    it('should work for database error', () => {
      const details = {
        database: 'postgres',
        query: 'SELECT * FROM users',
        timeout: 5000,
      };
      const dto = new ErrorResponseDto('Database error', 'DB_ERROR', details);

      expect(dto.error?.details).toEqual(details);
    });

    it('should work for rate limit error', () => {
      const details = {
        limit: 100,
        current: 101,
        resetAt: new Date().toISOString(),
      };
      const dto = new ErrorResponseDto(
        'Rate limit exceeded',
        'RATE_LIMIT',
        details,
      );

      expect(dto.error?.code).toBe('RATE_LIMIT');
      expect((dto.error?.details as any)?.current).toBe(101);
    });

    it('should work for not found error with simple message', () => {
      const dto = new ErrorResponseDto('User not found', 'NOT_FOUND');

      expect(dto.message).toBe('User not found');
      expect(dto.error?.code).toBe('NOT_FOUND');
      expect(dto.error?.details).toBeUndefined();
    });

    it('should work for internal server error', () => {
      const details = {
        stack: 'Error stack trace...',
        file: 'server.ts',
        line: 42,
      };
      const dto = new ErrorResponseDto(
        'Internal server error',
        'INTERNAL_ERROR',
        details,
      );

      expect(dto.error?.code).toBe('INTERNAL_ERROR');
      expect((dto.error?.details as any)?.stack).toBeDefined();
    });

    it('should work for permission denied', () => {
      const details = { resource: 'users', action: 'delete', userId: '123' };
      const dto = new ErrorResponseDto(
        'Permission denied',
        'FORBIDDEN',
        details,
      );

      expect(dto.error?.code).toBe('FORBIDDEN');
      expect((dto.error?.details as any)?.action).toBe('delete');
    });

    it('should work for timeout error with number details', () => {
      const dto = new ErrorResponseDto('Request timeout', 'TIMEOUT', 30000);

      expect(dto.error?.details).toBe(30000);
    });
  });

  describe('JSON Serialization', () => {
    it('should serialize correctly to JSON', () => {
      const dto = new ErrorResponseDto('Test error', 'TEST_CODE', {
        info: 'details',
      });

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.success).toBe(false);
      expect(parsed.message).toBe('Test error');
      expect(parsed.error.code).toBe('TEST_CODE');
      expect(parsed.error.details.info).toBe('details');
      expect(parsed.data).toBeUndefined();
    });

    it('should serialize with array details to JSON', () => {
      const details = ['error1', 'error2'];
      const dto = new ErrorResponseDto('Errors', 'ERRORS', details);

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.error.details).toEqual(['error1', 'error2']);
    });

    it('should serialize with nested object details to JSON', () => {
      const details = {
        context: { userId: '123' },
        errors: [{ field: 'email', message: 'Invalid' }],
      };
      const dto = new ErrorResponseDto('Complex error', 'COMPLEX', details);

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.error.details.context.userId).toBe('123');
      expect(parsed.error.details.errors[0].field).toBe('email');
    });

    it('should serialize timestamp in ISO format', () => {
      const dto = new ErrorResponseDto('Test');

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.timestamp).toBeDefined();
      expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('Property Assignment', () => {
    it('should allow property modification', () => {
      const dto = new ErrorResponseDto('Initial');

      dto.message = 'Modified';
      dto.error!.code = 'MODIFIED_CODE';
      dto.error!.details = { new: 'details' };

      expect(dto.message).toBe('Modified');
      expect(dto.error?.code).toBe('MODIFIED_CODE');
      expect(dto.error?.details).toEqual({ new: 'details' });
    });

    it('should allow adding requestId', () => {
      const dto = new ErrorResponseDto('Test');

      dto.requestId = 'req-123';

      expect(dto.requestId).toBe('req-123');
    });

    it('should not allow changing success to true', () => {
      const dto = new ErrorResponseDto('Test');

      dto.success = true;

      expect(dto.success).toBe(true); // Property can be modified, but it's an error response
    });
  });

  describe('Type Safety', () => {
    it('should preserve data as undefined', () => {
      const dto = new ErrorResponseDto('Test', 'CODE', 'details');

      expect(dto.data).toBeUndefined();
      expect(typeof dto.data).toBe('undefined');
    });

    it('should handle any type for details', () => {
      const stringDetails = new ErrorResponseDto('Test', 'CODE', 'string');
      const numberDetails = new ErrorResponseDto('Test', 'CODE', 123);
      const objectDetails = new ErrorResponseDto('Test', 'CODE', {
        key: 'value',
      });
      const arrayDetails = new ErrorResponseDto('Test', 'CODE', [1, 2, 3]);

      expect(stringDetails.error?.details).toBe('string');
      expect(numberDetails.error?.details).toBe(123);
      expect(objectDetails.error?.details).toEqual({ key: 'value' });
      expect(arrayDetails.error?.details).toEqual([1, 2, 3]);
    });
  });

  describe('Default Parameters Behavior', () => {
    it('should use default code "ERROR" when not provided', () => {
      const dto1 = new ErrorResponseDto('Test');
      const dto2 = new ErrorResponseDto('Test', 'ERROR');

      expect(dto1.error?.code).toBe('ERROR');
      expect(dto2.error?.code).toBe('ERROR');
      expect(dto1.error?.code).toBe(dto2.error?.code);
    });

    it('should allow undefined details', () => {
      const dto1 = new ErrorResponseDto('Test');
      const dto2 = new ErrorResponseDto('Test', 'CODE');
      const dto3 = new ErrorResponseDto('Test', 'CODE', undefined);

      expect(dto1.error?.details).toBeUndefined();
      expect(dto2.error?.details).toBeUndefined();
      expect(dto3.error?.details).toBeUndefined();
    });
  });

  describe('Multiple Instances', () => {
    it('should create multiple independent instances', () => {
      const dto1 = new ErrorResponseDto('Error 1', 'CODE1', 'details1');
      const dto2 = new ErrorResponseDto('Error 2', 'CODE2', 'details2');
      const dto3 = new ErrorResponseDto('Error 3', 'CODE3', 'details3');

      expect(dto1.message).toBe('Error 1');
      expect(dto2.message).toBe('Error 2');
      expect(dto3.message).toBe('Error 3');

      expect(dto1.error?.code).toBe('CODE1');
      expect(dto2.error?.code).toBe('CODE2');
      expect(dto3.error?.code).toBe('CODE3');
    });

    it('should have different timestamps for different instances', async () => {
      const dto1 = new ErrorResponseDto('First');
      await new Promise((resolve) => setTimeout(resolve, 10));
      const dto2 = new ErrorResponseDto('Second');
      await new Promise((resolve) => setTimeout(resolve, 10));
      const dto3 = new ErrorResponseDto('Third');

      expect(dto1.timestamp).not.toBe(dto2.timestamp);
      expect(dto2.timestamp).not.toBe(dto3.timestamp);
      expect(dto1.timestamp).not.toBe(dto3.timestamp);
    });
  });

  describe('Edge Cases with Complex Details', () => {
    it('should handle details with Date objects', () => {
      const details = { timestamp: new Date() };
      const dto = new ErrorResponseDto('Date error', 'DATE_ERROR', details);

      expect(dto.error?.details).toBeDefined();
      expect((dto.error?.details as any)?.timestamp).toBeInstanceOf(Date);
    });

    it('should handle details with function (will be lost on JSON)', () => {
      const details = { func: () => 'test' };
      const dto = new ErrorResponseDto('Func error', 'FUNC_ERROR', details);

      expect(dto.error?.details).toBeDefined();
    });

    it('should handle details with Symbol', () => {
      const details = { symbol: Symbol('test') };
      const dto = new ErrorResponseDto('Symbol error', 'SYMBOL_ERROR', details);

      expect(dto.error?.details).toBeDefined();
    });

    it('should handle details with BigInt', () => {
      const details = { big: BigInt(123) };
      const dto = new ErrorResponseDto('BigInt error', 'BIGINT_ERROR', details);

      expect(dto.error?.details).toBeDefined();
    });
  });
});
