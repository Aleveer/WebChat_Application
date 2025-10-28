import { validate } from 'class-validator';
import { BulkActionDto } from './bulkaction.dto';
import { IdParamDto } from './bulkaction.dto';

describe('BulkActionDto - White Box Testing', () => {
  describe('BulkActionDto - Field Validation', () => {
    describe('ids field validation', () => {
      it('should accept valid string array with minimum size (1)', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['id1'];
        dto.action = 'delete';

        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      });

      it('should accept valid string array with maximum size (100)', async () => {
        const dto = new BulkActionDto();
        dto.ids = Array.from({ length: 100 }, (_, i) => `id${i}`);
        dto.action = 'update';

        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      });

      it('should accept valid string array with medium size', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['id1', 'id2', 'id3'];
        dto.action = 'activate';

        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      });

      it('should reject empty array (violates ArrayMinSize)', async () => {
        const dto = new BulkActionDto();
        dto.ids = [];
        dto.action = 'delete';

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('arrayMinSize');
      });

      it('should reject array with 101 items (violates ArrayMaxSize)', async () => {
        const dto = new BulkActionDto();
        dto.ids = Array.from({ length: 101 }, (_, i) => `id${i}`);
        dto.action = 'delete';

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('arrayMaxSize');
      });

      it('should reject array with non-string values (violates IsString)', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['id1', 123 as any, 'id3'];
        dto.action = 'delete';

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
      });

      it('should reject array with null values', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['id1', null as any, 'id3'];
        dto.action = 'delete';

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
      });

      it('should reject array with undefined values', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['id1', undefined as any, 'id3'];
        dto.action = 'delete';

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
      });

      it('should reject array with object values', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['id1', { id: 'test' } as any, 'id3'];
        dto.action = 'delete';

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
      });

      it('should accept array with empty strings', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['', 'id2', ''];
        dto.action = 'delete';

        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      });

      it('should accept array with UUID strings', async () => {
        const dto = new BulkActionDto();
        dto.ids = [
          '550e8400-e29b-41d4-a716-446655440000',
          '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        ];
        dto.action = 'delete';

        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      });

      it('should accept array with special characters in strings', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['id-1', 'id_2', 'id.3'];
        dto.action = 'delete';

        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      });

      it('should accept array with very long strings', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['a'.repeat(1000)];
        dto.action = 'delete';

        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      });

      it('should reject non-array value', async () => {
        const dto = new BulkActionDto();
        (dto as any).ids = 'not-an-array';
        dto.action = 'delete';

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isArray');
      });

      it('should handle array with exactly 50 items (boundary testing)', async () => {
        const dto = new BulkActionDto();
        dto.ids = Array.from({ length: 50 }, (_, i) => `id${i}`);
        dto.action = 'delete';

        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      });

      it('should handle array with exactly 99 items (one less than max)', async () => {
        const dto = new BulkActionDto();
        dto.ids = Array.from({ length: 99 }, (_, i) => `id${i}`);
        dto.action = 'delete';

        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      });
    });

    describe('action field validation', () => {
      it('should accept valid action "delete"', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['id1'];
        dto.action = 'delete';

        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      });

      it('should accept valid action "update"', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['id1'];
        dto.action = 'update';

        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      });

      it('should accept valid action "activate"', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['id1'];
        dto.action = 'activate';

        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      });

      it('should accept valid action "deactivate"', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['id1'];
        dto.action = 'deactivate';

        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      });

      it('should reject invalid action like "create"', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['id1'];
        dto.action = 'create';

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
        expect(
          errors.find((e) => e.property === 'action')?.constraints,
        ).toHaveProperty('isIn');
      });

      it('should reject invalid action like "remove"', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['id1'];
        dto.action = 'remove';

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
      });

      it('should reject empty string action', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['id1'];
        dto.action = '';

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
      });

      it('should reject null action', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['id1'];
        (dto as any).action = null;

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
      });

      it('should reject undefined action', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['id1'];
        dto.action = undefined as any;

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
      });

      it('should reject non-string action (number)', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['id1'];
        (dto as any).action = 123;

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
      });

      it('should reject non-string action (array)', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['id1'];
        (dto as any).action = ['delete'];

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
      });

      it('should reject action with different casing "Delete"', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['id1'];
        dto.action = 'Delete'; // Capital D

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
      });

      it('should reject action with whitespace " delete "', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['id1'];
        dto.action = ' delete ';

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
      });

      it('should reject action with partial match "delet"', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['id1'];
        dto.action = 'delet';

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
      });

      it('should reject action with extra characters "delete1"', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['id1'];
        dto.action = 'delete1';

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
      });
    });

    describe('Complete object validation', () => {
      it('should validate complete valid BulkActionDto', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['id1', 'id2', 'id3'];
        dto.action = 'update';

        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      });

      it('should fail validation with both fields invalid', async () => {
        const dto = new BulkActionDto();
        dto.ids = [];
        dto.action = 'invalid';

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
      });

      it('should fail validation with only ids invalid', async () => {
        const dto = new BulkActionDto();
        dto.ids = [];
        dto.action = 'delete';

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((e) => e.property === 'ids')).toBe(true);
      });

      it('should fail validation with only action invalid', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['id1'];
        dto.action = 'create';

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((e) => e.property === 'action')).toBe(true);
      });

      it('should handle property access and assignment', () => {
        const dto = new BulkActionDto();
        dto.ids = ['id1'];
        dto.action = 'delete';

        expect(dto.ids).toEqual(['id1']);
        expect(dto.action).toBe('delete');

        // Modify after assignment
        dto.ids.push('id2');
        expect(dto.ids.length).toBe(2);

        dto.action = 'update';
        expect(dto.action).toBe('update');
      });
    });

    describe('Edge Cases and Boundary Testing', () => {
      it('should handle single item array with single valid action', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['single-id'];
        dto.action = 'delete';

        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      });

      it('should handle maximum array size (100) with each action', async () => {
        const actions = ['delete', 'update', 'activate', 'deactivate'];

        for (const action of actions) {
          const dto = new BulkActionDto();
          dto.ids = Array.from({ length: 100 }, (_, i) => `id${i}`);
          dto.action = action;

          const errors = await validate(dto);
          expect(errors.length).toBe(0);
        }
      });

      it('should handle array with duplicate IDs', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['id1', 'id1', 'id1'];
        dto.action = 'delete';

        const errors = await validate(dto);

        expect(errors.length).toBe(0); // Duplicates are allowed
      });

      it('should handle array with special characters in IDs', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['id-1', 'id_2', 'id.3', 'id@4'];
        dto.action = 'update';

        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      });

      it('should handle unicode characters in IDs', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['id-中文', 'id-日本語', 'id-한국어'];
        dto.action = 'activate';

        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      });

      it('should handle emoji in IDs', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['id-🚀', 'id-⭐', 'id-❤️'];
        dto.action = 'deactivate';

        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      });

      it('should handle very large number array (99 items - boundary)', async () => {
        const dto = new BulkActionDto();
        dto.ids = Array.from({ length: 99 }, (_, i) => `id${i}`);
        dto.action = 'update';

        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      });

      it('should fail validation for exactly 101 items (exceeds max)', async () => {
        const dto = new BulkActionDto();
        dto.ids = Array.from({ length: 101 }, (_, i) => `id${i}`);
        dto.action = 'delete';

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
      });
    });

    describe('Type Coercion and Edge Cases', () => {
      it('should handle boolean false as invalid', async () => {
        const dto = new BulkActionDto();
        (dto as any).ids = false;
        dto.action = 'delete';

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
      });

      it('should handle boolean true as invalid', async () => {
        const dto = new BulkActionDto();
        (dto as any).ids = true;
        dto.action = 'delete';

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
      });

      it('should handle object as invalid array', async () => {
        const dto = new BulkActionDto();
        (dto as any).ids = { ids: ['id1'] };
        dto.action = 'delete';

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
      });

      it('should handle undefined ids field', async () => {
        const dto = new BulkActionDto();
        dto.action = 'delete';

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
      });

      it('should handle undefined action field', async () => {
        const dto = new BulkActionDto();
        dto.ids = ['id1'];

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
      });
    });

    describe('Constructor and Instance Tests', () => {
      it('should create instance with new operator', () => {
        const dto = new BulkActionDto();

        expect(dto).toBeInstanceOf(BulkActionDto);
      });

      it('should allow property modification', () => {
        const dto = new BulkActionDto();
        dto.ids = ['id1'];
        dto.action = 'delete';

        dto.ids = ['id2', 'id3'];
        dto.action = 'update';

        expect(dto.ids).toEqual(['id2', 'id3']);
        expect(dto.action).toBe('update');
      });
    });
  });

  describe('IdParamDto - Field Validation', () => {
    describe('id field validation', () => {
      it('should accept valid string id', async () => {
        const dto = new IdParamDto();
        dto.id = 'valid-id-123';

        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      });

      it('should accept UUID as id', async () => {
        const dto = new IdParamDto();
        dto.id = '550e8400-e29b-41d4-a716-446655440000';

        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      });

      it('should accept id with special characters', async () => {
        const dto = new IdParamDto();
        dto.id = 'id-123_test@example';

        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      });

      it('should accept id with unicode characters', async () => {
        const dto = new IdParamDto();
        dto.id = 'id-中文-123';

        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      });

      it('should accept id with emoji', async () => {
        const dto = new IdParamDto();
        dto.id = 'id-🚀-123';

        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      });

      it('should accept empty string id', async () => {
        const dto = new IdParamDto();
        dto.id = '';

        const errors = await validate(dto);

        expect(errors.length).toBe(0); // Empty string is valid string
      });

      it('should accept very long string id', async () => {
        const dto = new IdParamDto();
        dto.id = 'a'.repeat(10000);

        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      });

      it('should reject null id', async () => {
        const dto = new IdParamDto();
        dto.id = null as any;

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isString');
      });

      it('should reject undefined id', async () => {
        const dto = new IdParamDto();
        dto.id = undefined as any;

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
      });

      it('should reject number id', async () => {
        const dto = new IdParamDto();
        (dto as any).id = 123;

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
      });

      it('should reject boolean id', async () => {
        const dto = new IdParamDto();
        (dto as any).id = true;

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
      });

      it('should reject array id', async () => {
        const dto = new IdParamDto();
        (dto as any).id = ['id1', 'id2'];

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
      });

      it('should reject object id', async () => {
        const dto = new IdParamDto();
        (dto as any).id = { id: 'test' };

        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
      });
    });

    describe('Constructor and Instance Tests', () => {
      it('should create instance with new operator', () => {
        const dto = new IdParamDto();

        expect(dto).toBeInstanceOf(IdParamDto);
      });

      it('should allow property modification', () => {
        const dto = new IdParamDto();
        dto.id = 'id1';

        dto.id = 'id2';

        expect(dto.id).toBe('id2');
      });
    });

    describe('Edge Cases', () => {
      it('should handle id with whitespace', async () => {
        const dto = new IdParamDto();
        dto.id = '  id-123  ';

        const errors = await validate(dto);

        expect(errors.length).toBe(0); // Whitespace is part of string
      });

      it('should handle id with numeric characters', async () => {
        const dto = new IdParamDto();
        dto.id = '123456';

        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      });

      it('should handle id with only special characters', async () => {
        const dto = new IdParamDto();
        dto.id = '!@#$%^&*()';

        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      });

      it('should handle id with only alphabetic characters', async () => {
        const dto = new IdParamDto();
        dto.id = 'abcdefghijklmnopqrstuvwxyz';

        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      });
    });
  });
});
