import { validate } from 'class-validator';
import { BulkActionDto, IdParamDto } from '../src/common/dto/bulkaction.dto';

describe('BulkActionDto - White Box Testing (Input-Output)', () => {
  describe('Constructor and Property Assignment', () => {
    /**
     * Test Case 1: Kiểm tra constructor với valid data
     * Input: ids array, valid action
     * Expected Output: Instance created with properties set
     * Path Coverage: Constructor với valid parameters
     */
    it('TC001: should create instance with valid properties', () => {
      const dto = new BulkActionDto();
      dto.ids = ['id1', 'id2', 'id3'];
      dto.action = 'delete';

      expect(dto.ids).toEqual(['id1', 'id2', 'id3']);
      expect(dto.action).toBe('delete');
    });

    /**
     * Test Case 2: Kiểm tra instance type
     * Input: New instance
     * Expected Output: Instance of BulkActionDto
     * Path Coverage: Instance validation
     */
    it('TC002: should be instance of BulkActionDto', () => {
      const dto = new BulkActionDto();

      expect(dto).toBeInstanceOf(BulkActionDto);
    });

    /**
     * Test Case 3: Kiểm tra properties initially undefined
     * Input: New instance without assignment
     * Expected Output: Properties undefined
     * Path Coverage: Default state
     */
    it('TC003: should have undefined properties when not assigned', () => {
      const dto = new BulkActionDto();

      expect(dto.ids).toBeUndefined();
      expect(dto.action).toBeUndefined();
    });
  });

  describe('IDs Array Validation', () => {
    /**
     * Test Case 4: Kiểm tra valid ids array
     * Input: Array with 1 string id
     * Expected Output: Validation passes
     * Path Coverage: Valid ids array
     */
    it('TC004: should pass validation with valid ids array', async () => {
      const dto = new BulkActionDto();
      dto.ids = ['id1'];
      dto.action = 'delete';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 5: Kiểm tra multiple valid ids
     * Input: Array with multiple string ids
     * Expected Output: Validation passes
     * Path Coverage: Multiple ids
     */
    it('TC005: should pass validation with multiple ids', async () => {
      const dto = new BulkActionDto();
      dto.ids = ['id1', 'id2', 'id3', 'id4', 'id5'];
      dto.action = 'update';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 6: Kiểm tra empty ids array
     * Input: Empty array []
     * Expected Output: Validation fails - ArrayMinSize
     * Path Coverage: ArrayMinSize validation
     */
    it('TC006: should fail validation with empty ids array', async () => {
      const dto = new BulkActionDto();
      dto.ids = [];
      dto.action = 'delete';

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('ids');
      expect(errors[0].constraints).toHaveProperty('arrayMinSize');
    });

    /**
     * Test Case 7: Kiểm tra ids array vượt quá 100 items
     * Input: Array with 101 items
     * Expected Output: Validation fails - ArrayMaxSize
     * Path Coverage: ArrayMaxSize validation
     */
    it('TC007: should fail validation with more than 100 ids', async () => {
      const dto = new BulkActionDto();
      dto.ids = Array(101)
        .fill(null)
        .map((_, i) => `id${i}`);
      dto.action = 'delete';

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('ids');
      expect(errors[0].constraints).toHaveProperty('arrayMaxSize');
    });

    /**
     * Test Case 8: Kiểm tra exactly 100 ids (boundary)
     * Input: Array with exactly 100 items
     * Expected Output: Validation passes
     * Path Coverage: Boundary case - max size
     */
    it('TC008: should pass validation with exactly 100 ids', async () => {
      const dto = new BulkActionDto();
      dto.ids = Array(100)
        .fill(null)
        .map((_, i) => `id${i}`);
      dto.action = 'delete';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 9: Kiểm tra exactly 1 id (boundary)
     * Input: Array with exactly 1 item
     * Expected Output: Validation passes
     * Path Coverage: Boundary case - min size
     */
    it('TC009: should pass validation with exactly 1 id', async () => {
      const dto = new BulkActionDto();
      dto.ids = ['single-id'];
      dto.action = 'delete';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 10: Kiểm tra ids not array
     * Input: String instead of array
     * Expected Output: Validation fails - IsArray
     * Path Coverage: IsArray validation
     */
    it('TC010: should fail validation when ids is not an array', async () => {
      const dto = new BulkActionDto();
      (dto as any).ids = 'not-an-array';
      dto.action = 'delete';

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('ids');
      expect(errors[0].constraints).toHaveProperty('isArray');
    });

    /**
     * Test Case 11: Kiểm tra ids contains non-string items
     * Input: Array with numbers
     * Expected Output: Validation fails - IsString each
     * Path Coverage: IsString each validation
     */
    it('TC011: should fail validation when ids contains non-string items', async () => {
      const dto = new BulkActionDto();
      (dto as any).ids = [123, 456];
      dto.action = 'delete';

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('ids');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    /**
     * Test Case 12: Kiểm tra ids contains mixed types
     * Input: Array with strings and numbers
     * Expected Output: Validation fails
     * Path Coverage: Mixed types validation
     */
    it('TC012: should fail validation with mixed types in ids', async () => {
      const dto = new BulkActionDto();
      (dto as any).ids = ['id1', 123, 'id2', null];
      dto.action = 'delete';

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('ids');
    });

    /**
     * Test Case 13: Kiểm tra ids undefined
     * Input: ids = undefined
     * Expected Output: Validation fails
     * Path Coverage: Undefined ids
     */
    it('TC013: should fail validation when ids is undefined', async () => {
      const dto = new BulkActionDto();
      dto.action = 'delete';

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('ids');
    });

    /**
     * Test Case 14: Kiểm tra ids null
     * Input: ids = null
     * Expected Output: Validation fails
     * Path Coverage: Null ids
     */
    it('TC014: should fail validation when ids is null', async () => {
      const dto = new BulkActionDto();
      (dto as any).ids = null;
      dto.action = 'delete';

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('ids');
    });

    /**
     * Test Case 15: Kiểm tra ids with empty strings
     * Input: Array with empty strings
     * Expected Output: Validation passes (empty strings are still strings)
     * Path Coverage: Empty string items
     */
    it('TC015: should pass validation with empty string ids', async () => {
      const dto = new BulkActionDto();
      dto.ids = ['', '', ''];
      dto.action = 'delete';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 16: Kiểm tra ids with special characters
     * Input: IDs with special chars
     * Expected Output: Validation passes
     * Path Coverage: Special characters
     */
    it('TC016: should pass validation with special characters in ids', async () => {
      const dto = new BulkActionDto();
      dto.ids = ['id-123', 'id_456', 'id.789', 'id@abc'];
      dto.action = 'delete';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 17: Kiểm tra ids with duplicate values
     * Input: Array with duplicate ids
     * Expected Output: Validation passes (duplicates allowed)
     * Path Coverage: Duplicate values
     */
    it('TC017: should pass validation with duplicate ids', async () => {
      const dto = new BulkActionDto();
      dto.ids = ['id1', 'id1', 'id1'];
      dto.action = 'delete';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 18: Kiểm tra ids with very long strings
     * Input: IDs with very long strings
     * Expected Output: Validation passes
     * Path Coverage: Long string values
     */
    it('TC018: should pass validation with very long id strings', async () => {
      const dto = new BulkActionDto();
      dto.ids = ['a'.repeat(1000), 'b'.repeat(1000)];
      dto.action = 'delete';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 19: Kiểm tra ids with Unicode characters
     * Input: IDs with Unicode
     * Expected Output: Validation passes
     * Path Coverage: Unicode handling
     */
    it('TC019: should pass validation with Unicode characters in ids', async () => {
      const dto = new BulkActionDto();
      dto.ids = ['用户-123', 'ユーザー-456', '사용자-789'];
      dto.action = 'delete';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });
  });

  describe('Action Validation', () => {
    /**
     * Test Case 20: Kiểm tra valid action 'delete'
     * Input: action = 'delete'
     * Expected Output: Validation passes
     * Path Coverage: Valid delete action
     */
    it('TC020: should pass validation with delete action', async () => {
      const dto = new BulkActionDto();
      dto.ids = ['id1'];
      dto.action = 'delete';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 21: Kiểm tra valid action 'update'
     * Input: action = 'update'
     * Expected Output: Validation passes
     * Path Coverage: Valid update action
     */
    it('TC021: should pass validation with update action', async () => {
      const dto = new BulkActionDto();
      dto.ids = ['id1'];
      dto.action = 'update';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 22: Kiểm tra valid action 'activate'
     * Input: action = 'activate'
     * Expected Output: Validation passes
     * Path Coverage: Valid activate action
     */
    it('TC022: should pass validation with activate action', async () => {
      const dto = new BulkActionDto();
      dto.ids = ['id1'];
      dto.action = 'activate';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 23: Kiểm tra valid action 'deactivate'
     * Input: action = 'deactivate'
     * Expected Output: Validation passes
     * Path Coverage: Valid deactivate action
     */
    it('TC023: should pass validation with deactivate action', async () => {
      const dto = new BulkActionDto();
      dto.ids = ['id1'];
      dto.action = 'deactivate';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 24: Kiểm tra invalid action
     * Input: action = 'invalid'
     * Expected Output: Validation fails - IsIn
     * Path Coverage: IsIn validation failure
     */
    it('TC024: should fail validation with invalid action', async () => {
      const dto = new BulkActionDto();
      dto.ids = ['id1'];
      dto.action = 'invalid';

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('action');
      expect(errors[0].constraints).toHaveProperty('isIn');
    });

    /**
     * Test Case 25: Kiểm tra action case sensitive
     * Input: action = 'DELETE' (uppercase)
     * Expected Output: Validation fails
     * Path Coverage: Case sensitivity
     */
    it('TC025: should fail validation with uppercase action', async () => {
      const dto = new BulkActionDto();
      dto.ids = ['id1'];
      dto.action = 'DELETE';

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('action');
    });

    /**
     * Test Case 26: Kiểm tra action undefined
     * Input: action = undefined
     * Expected Output: Validation fails
     * Path Coverage: Undefined action
     */
    it('TC026: should fail validation when action is undefined', async () => {
      const dto = new BulkActionDto();
      dto.ids = ['id1'];

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('action');
    });

    /**
     * Test Case 27: Kiểm tra action null
     * Input: action = null
     * Expected Output: Validation fails
     * Path Coverage: Null action
     */
    it('TC027: should fail validation when action is null', async () => {
      const dto = new BulkActionDto();
      dto.ids = ['id1'];
      (dto as any).action = null;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('action');
    });

    /**
     * Test Case 28: Kiểm tra action not string
     * Input: action = number
     * Expected Output: Validation fails - IsString
     * Path Coverage: Non-string action
     */
    it('TC028: should fail validation when action is not string', async () => {
      const dto = new BulkActionDto();
      dto.ids = ['id1'];
      (dto as any).action = 123;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('action');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    /**
     * Test Case 29: Kiểm tra action empty string
     * Input: action = ''
     * Expected Output: Validation fails
     * Path Coverage: Empty action
     */
    it('TC029: should fail validation with empty action string', async () => {
      const dto = new BulkActionDto();
      dto.ids = ['id1'];
      dto.action = '';

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('action');
    });

    /**
     * Test Case 30: Kiểm tra action with whitespace
     * Input: action = ' delete '
     * Expected Output: Validation fails
     * Path Coverage: Whitespace in action
     */
    it('TC030: should fail validation with whitespace in action', async () => {
      const dto = new BulkActionDto();
      dto.ids = ['id1'];
      dto.action = ' delete ';

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('action');
    });

    /**
     * Test Case 31: Kiểm tra action with special characters
     * Input: action = 'delete!'
     * Expected Output: Validation fails
     * Path Coverage: Special chars in action
     */
    it('TC031: should fail validation with special characters in action', async () => {
      const dto = new BulkActionDto();
      dto.ids = ['id1'];
      dto.action = 'delete!';

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('action');
    });
  });

  describe('Combined Validation Scenarios', () => {
    /**
     * Test Case 32: Kiểm tra both fields invalid
     * Input: Empty ids array, invalid action
     * Expected Output: Both fields fail validation
     * Path Coverage: Multiple validation errors
     */
    it('TC032: should fail validation when both fields are invalid', async () => {
      const dto = new BulkActionDto();
      dto.ids = [];
      dto.action = 'invalid';

      const errors = await validate(dto);

      expect(errors.length).toBe(2);
      const properties = errors.map((e) => e.property);
      expect(properties).toContain('ids');
      expect(properties).toContain('action');
    });

    /**
     * Test Case 33: Kiểm tra both fields missing
     * Input: No ids, no action
     * Expected Output: Both fields fail validation
     * Path Coverage: All required fields missing
     */
    it('TC033: should fail validation when both fields are missing', async () => {
      const dto = new BulkActionDto();

      const errors = await validate(dto);

      expect(errors.length).toBe(2);
    });

    /**
     * Test Case 34: Kiểm tra complete valid DTO
     * Input: Valid ids and action
     * Expected Output: No validation errors
     * Path Coverage: Complete valid object
     */
    it('TC034: should pass validation with complete valid data', async () => {
      const dto = new BulkActionDto();
      dto.ids = ['id1', 'id2', 'id3'];
      dto.action = 'delete';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 35: Kiểm tra maximum valid scenario
     * Input: 100 ids, valid action
     * Expected Output: Validation passes
     * Path Coverage: Maximum boundary valid
     */
    it('TC035: should pass validation with maximum ids and valid action', async () => {
      const dto = new BulkActionDto();
      dto.ids = Array(100)
        .fill(null)
        .map((_, i) => `id${i}`);
      dto.action = 'update';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 36: Kiểm tra minimum valid scenario
     * Input: 1 id, valid action
     * Expected Output: Validation passes
     * Path Coverage: Minimum boundary valid
     */
    it('TC036: should pass validation with minimum ids and valid action', async () => {
      const dto = new BulkActionDto();
      dto.ids = ['id1'];
      dto.action = 'activate';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });
  });

  describe('Edge Cases and Real-world Scenarios', () => {
    /**
     * Test Case 37: Kiểm tra with MongoDB ObjectId format
     * Input: MongoDB ObjectId strings
     * Expected Output: Validation passes
     * Path Coverage: Real ID format
     */
    it('TC037: should pass validation with MongoDB ObjectId format', async () => {
      const dto = new BulkActionDto();
      dto.ids = [
        '507f1f77bcf86cd799439011',
        '507f191e810c19729de860ea',
        '507f1f77bcf86cd799439012',
      ];
      dto.action = 'delete';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 38: Kiểm tra with UUID format
     * Input: UUID strings
     * Expected Output: Validation passes
     * Path Coverage: UUID format
     */
    it('TC038: should pass validation with UUID format', async () => {
      const dto = new BulkActionDto();
      dto.ids = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      ];
      dto.action = 'update';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 39: Kiểm tra DTO serialization
     * Input: Valid DTO
     * Expected Output: Can be JSON stringified
     * Path Coverage: JSON serialization
     */
    it('TC039: should be JSON serializable', () => {
      const dto = new BulkActionDto();
      dto.ids = ['id1', 'id2'];
      dto.action = 'delete';

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.ids).toEqual(['id1', 'id2']);
      expect(parsed.action).toBe('delete');
    });

    /**
     * Test Case 40: Kiểm tra DTO from JSON parsing
     * Input: JSON object
     * Expected Output: Can create DTO from plain object
     * Path Coverage: From JSON to DTO
     */
    it('TC040: should create DTO from parsed JSON', async () => {
      const jsonData = {
        ids: ['id1', 'id2', 'id3'],
        action: 'activate',
      };

      const dto = Object.assign(new BulkActionDto(), jsonData);

      expect(dto).toBeInstanceOf(BulkActionDto);
      expect(dto.ids).toEqual(jsonData.ids);
      expect(dto.action).toBe(jsonData.action);

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});

describe('IdParamDto - White Box Testing (Input-Output)', () => {
  describe('Constructor and Property Assignment', () => {
    /**
     * Test Case 41: Kiểm tra constructor với valid id
     * Input: id string
     * Expected Output: Instance created with id set
     * Path Coverage: Constructor với valid parameter
     */
    it('TC041: should create instance with valid id', () => {
      const dto = new IdParamDto();
      dto.id = 'test-id-123';

      expect(dto.id).toBe('test-id-123');
    });

    /**
     * Test Case 42: Kiểm tra instance type
     * Input: New instance
     * Expected Output: Instance of IdParamDto
     * Path Coverage: Instance validation
     */
    it('TC042: should be instance of IdParamDto', () => {
      const dto = new IdParamDto();

      expect(dto).toBeInstanceOf(IdParamDto);
    });

    /**
     * Test Case 43: Kiểm tra id initially undefined
     * Input: New instance without assignment
     * Expected Output: id undefined
     * Path Coverage: Default state
     */
    it('TC043: should have undefined id when not assigned', () => {
      const dto = new IdParamDto();

      expect(dto.id).toBeUndefined();
    });
  });

  describe('ID Validation', () => {
    /**
     * Test Case 44: Kiểm tra valid string id
     * Input: id = 'valid-id'
     * Expected Output: Validation passes
     * Path Coverage: Valid string id
     */
    it('TC044: should pass validation with valid string id', async () => {
      const dto = new IdParamDto();
      dto.id = 'valid-id';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 45: Kiểm tra numeric string id
     * Input: id = '12345'
     * Expected Output: Validation passes
     * Path Coverage: Numeric string
     */
    it('TC045: should pass validation with numeric string id', async () => {
      const dto = new IdParamDto();
      dto.id = '12345';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 46: Kiểm tra id undefined
     * Input: id = undefined
     * Expected Output: Validation fails
     * Path Coverage: Undefined id
     */
    it('TC046: should fail validation when id is undefined', async () => {
      const dto = new IdParamDto();

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('id');
    });

    /**
     * Test Case 47: Kiểm tra id null
     * Input: id = null
     * Expected Output: Validation fails
     * Path Coverage: Null id
     */
    it('TC047: should fail validation when id is null', async () => {
      const dto = new IdParamDto();
      (dto as any).id = null;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('id');
    });

    /**
     * Test Case 48: Kiểm tra id not string (number)
     * Input: id = 123
     * Expected Output: Validation fails
     * Path Coverage: Non-string id
     */
    it('TC048: should fail validation when id is not string', async () => {
      const dto = new IdParamDto();
      (dto as any).id = 123;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('id');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    /**
     * Test Case 49: Kiểm tra id empty string
     * Input: id = ''
     * Expected Output: Validation passes (empty string is still string)
     * Path Coverage: Empty string id
     */
    it('TC049: should pass validation with empty string id', async () => {
      const dto = new IdParamDto();
      dto.id = '';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 50: Kiểm tra id with special characters
     * Input: id with special chars
     * Expected Output: Validation passes
     * Path Coverage: Special characters
     */
    it('TC050: should pass validation with special characters in id', async () => {
      const dto = new IdParamDto();
      dto.id = 'id-123_456.789@abc';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 51: Kiểm tra id with whitespace
     * Input: id with spaces
     * Expected Output: Validation passes
     * Path Coverage: Whitespace in id
     */
    it('TC051: should pass validation with whitespace in id', async () => {
      const dto = new IdParamDto();
      dto.id = 'id with spaces';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 52: Kiểm tra very long id
     * Input: Very long string
     * Expected Output: Validation passes
     * Path Coverage: Long string
     */
    it('TC052: should pass validation with very long id', async () => {
      const dto = new IdParamDto();
      dto.id = 'a'.repeat(10000);

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 53: Kiểm tra id with Unicode
     * Input: Unicode characters
     * Expected Output: Validation passes
     * Path Coverage: Unicode
     */
    it('TC053: should pass validation with Unicode characters', async () => {
      const dto = new IdParamDto();
      dto.id = '用户-123-😀';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 54: Kiểm tra id as boolean
     * Input: id = true
     * Expected Output: Validation fails
     * Path Coverage: Boolean type
     */
    it('TC054: should fail validation when id is boolean', async () => {
      const dto = new IdParamDto();
      (dto as any).id = true;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('id');
    });

    /**
     * Test Case 55: Kiểm tra id as object
     * Input: id = {}
     * Expected Output: Validation fails
     * Path Coverage: Object type
     */
    it('TC055: should fail validation when id is object', async () => {
      const dto = new IdParamDto();
      (dto as any).id = { value: 'test' };

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('id');
    });

    /**
     * Test Case 56: Kiểm tra id as array
     * Input: id = []
     * Expected Output: Validation fails
     * Path Coverage: Array type
     */
    it('TC056: should fail validation when id is array', async () => {
      const dto = new IdParamDto();
      (dto as any).id = ['id1', 'id2'];

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('id');
    });
  });

  describe('Real-world ID Formats', () => {
    /**
     * Test Case 57: Kiểm tra MongoDB ObjectId
     * Input: MongoDB ObjectId format
     * Expected Output: Validation passes
     * Path Coverage: ObjectId format
     */
    it('TC057: should pass validation with MongoDB ObjectId', async () => {
      const dto = new IdParamDto();
      dto.id = '507f1f77bcf86cd799439011';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 58: Kiểm tra UUID
     * Input: UUID format
     * Expected Output: Validation passes
     * Path Coverage: UUID format
     */
    it('TC058: should pass validation with UUID', async () => {
      const dto = new IdParamDto();
      dto.id = '550e8400-e29b-41d4-a716-446655440000';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 59: Kiểm tra GUID
     * Input: GUID format
     * Expected Output: Validation passes
     * Path Coverage: GUID format
     */
    it('TC059: should pass validation with GUID', async () => {
      const dto = new IdParamDto();
      dto.id = '{6BA7B810-9DAD-11D1-80B4-00C04FD430C8}';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 60: Kiểm tra custom ID format
     * Input: Custom format like USER_123
     * Expected Output: Validation passes
     * Path Coverage: Custom format
     */
    it('TC060: should pass validation with custom ID format', async () => {
      const dto = new IdParamDto();
      dto.id = 'USER_123_ABC';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });
  });

  describe('Integration Scenarios', () => {
    /**
     * Test Case 61: Kiểm tra DTO serialization
     * Input: Valid DTO
     * Expected Output: Can be JSON stringified
     * Path Coverage: JSON serialization
     */
    it('TC061: should be JSON serializable', () => {
      const dto = new IdParamDto();
      dto.id = 'test-id-123';

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.id).toBe('test-id-123');
    });

    /**
     * Test Case 62: Kiểm tra DTO from JSON
     * Input: JSON object
     * Expected Output: Can create DTO from plain object
     * Path Coverage: From JSON to DTO
     */
    it('TC062: should create DTO from parsed JSON', async () => {
      const jsonData = { id: 'parsed-id-789' };

      const dto = Object.assign(new IdParamDto(), jsonData);

      expect(dto).toBeInstanceOf(IdParamDto);
      expect(dto.id).toBe('parsed-id-789');

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 63: Kiểm tra URL parameter scenario
     * Input: ID from URL param
     * Expected Output: Validation passes
     * Path Coverage: URL param use case
     */
    it('TC063: should validate id from URL parameter', async () => {
      const dto = new IdParamDto();
      dto.id = 'user-profile-12345';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 64: Kiểm tra route parameter with slash
     * Input: ID containing encoded slash
     * Expected Output: Validation passes
     * Path Coverage: Special URL chars
     */
    it('TC064: should pass validation with URL-safe characters', async () => {
      const dto = new IdParamDto();
      dto.id = 'resource%2Fsubresource%2F123';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 65: Kiểm tra multiple DTOs
     * Input: Multiple instances
     * Expected Output: Each instance independent
     * Path Coverage: Multiple instances
     */
    it('TC065: should handle multiple independent instances', async () => {
      const dto1 = new IdParamDto();
      dto1.id = 'id1';

      const dto2 = new IdParamDto();
      dto2.id = 'id2';

      expect(dto1.id).toBe('id1');
      expect(dto2.id).toBe('id2');
      expect(dto1).not.toBe(dto2);

      const errors1 = await validate(dto1);
      const errors2 = await validate(dto2);

      expect(errors1.length).toBe(0);
      expect(errors2.length).toBe(0);
    });
  });
});
