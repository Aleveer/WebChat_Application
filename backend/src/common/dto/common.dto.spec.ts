import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  BaseResponseDto,
  PaginationDto,
  PaginatedResponseDto,
  SearchDto,
  DateRangeDto,
  FileUploadDto,
  BulkActionDto,
  IdParamDto,
  QueryParamsDto,
  SuccessResponseDto,
  ErrorResponseDto,
  ValidationErrorDto,
  ApiResponseDto,
} from './common.dto';

describe('Common DTOs', () => {
  describe('BaseResponseDto', () => {
    describe('Constructor', () => {
      it('should create success response with all parameters', () => {
        const data = { id: 1, name: 'test' };
        const message = 'Success message';
        const response = new BaseResponseDto(true, data, message);

        expect(response.success).toBe(true);
        expect(response.data).toEqual(data);
        expect(response.message).toBe(message);
        expect(response.error).toBeUndefined();
        expect(response.timestamp).toBeDefined();
        expect(new Date(response.timestamp)).toBeInstanceOf(Date);
      });

      it('should create error response with error message', () => {
        const error = 'Error occurred';
        const message = 'Error message';
        const response = new BaseResponseDto(false, undefined, message, error);

        expect(response.success).toBe(false);
        expect(response.data).toBeUndefined();
        expect(response.message).toBe(message);
        expect(response.error).toBe(error);
        expect(response.timestamp).toBeDefined();
      });

      it('should create response with minimal parameters', () => {
        const response = new BaseResponseDto(true);

        expect(response.success).toBe(true);
        expect(response.data).toBeUndefined();
        expect(response.message).toBeUndefined();
        expect(response.error).toBeUndefined();
        expect(response.timestamp).toBeDefined();
      });
    });

    describe('Static Methods', () => {
      it('should create success response using static method', () => {
        const data = { id: 1 };
        const message = 'Success';
        const response = BaseResponseDto.success(data, message);

        expect(response.success).toBe(true);
        expect(response.data).toEqual(data);
        expect(response.message).toBe(message);
        expect(response.error).toBeUndefined();
        expect(response.timestamp).toBeDefined();
      });

      it('should create error response using static method', () => {
        const error = 'Validation failed';
        const message = 'Error occurred';
        const response = BaseResponseDto.error(error, message);

        expect(response.success).toBe(false);
        expect(response.data).toBeUndefined();
        expect(response.message).toBe(message);
        expect(response.error).toBe(error);
        expect(response.timestamp).toBeDefined();
      });

      it('should create success response without message', () => {
        const data = { id: 1 };
        const response = BaseResponseDto.success(data);

        expect(response.success).toBe(true);
        expect(response.data).toEqual(data);
        expect(response.message).toBeUndefined();
      });

      it('should create error response without message', () => {
        const error = 'Error';
        const response = BaseResponseDto.error(error);

        expect(response.success).toBe(false);
        expect(response.error).toBe(error);
        expect(response.message).toBeUndefined();
      });
    });
  });

  describe('PaginationDto', () => {
    let paginationDto: PaginationDto;

    beforeEach(() => {
      paginationDto = new PaginationDto();
    });

    it('should have default values', () => {
      expect(paginationDto.page).toBe(1);
      expect(paginationDto.limit).toBe(20);
      expect(paginationDto.sortOrder).toBe('desc');
      expect(paginationDto.sortBy).toBeUndefined();
    });

    it('should validate valid page number', async () => {
      paginationDto.page = 5;
      const errors = await validate(paginationDto);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid page number (less than 1)', async () => {
      paginationDto.page = 0;
      const errors = await validate(paginationDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('page');
    });

    it('should validate valid limit', async () => {
      paginationDto.limit = 50;
      const errors = await validate(paginationDto);
      expect(errors).toHaveLength(0);
    });

    it('should reject limit greater than 100', async () => {
      paginationDto.limit = 150;
      const errors = await validate(paginationDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('limit');
    });

    it('should reject limit less than 1', async () => {
      paginationDto.limit = 0;
      const errors = await validate(paginationDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('limit');
    });

    it('should validate valid sort order', async () => {
      paginationDto.sortOrder = 'asc';
      const errors = await validate(paginationDto);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid sort order', async () => {
      paginationDto.sortOrder = 'invalid' as any;
      const errors = await validate(paginationDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('sortOrder');
    });

    it('should validate optional sortBy', async () => {
      paginationDto.sortBy = 'createdAt';
      const errors = await validate(paginationDto);
      expect(errors).toHaveLength(0);
    });

    it('should transform string numbers to numbers', () => {
      const plainObject = { page: '5', limit: '10' };
      const transformed = plainToClass(PaginationDto, plainObject);

      expect(transformed.page).toBe(5);
      expect(transformed.limit).toBe(10);
    });
  });

  describe('PaginatedResponseDto', () => {
    it('should create paginated response with all data', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const pagination = {
        page: 1,
        limit: 20,
        total: 50,
        totalPages: 3,
        hasNext: true,
        hasPrev: false,
      };
      const message = 'Data retrieved successfully';
      const response = new PaginatedResponseDto(data, pagination, message);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.message).toBe(message);
      expect(response.pagination).toEqual(pagination);
      expect(response.timestamp).toBeDefined();
    });

    it('should create paginated response without message', () => {
      const data = [{ id: 1 }];
      const pagination = {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };
      const response = new PaginatedResponseDto(data, pagination);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.message).toBeUndefined();
      expect(response.pagination).toEqual(pagination);
    });

    it('should handle empty data array', () => {
      const data: any[] = [];
      const pagination = {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      };
      const response = new PaginatedResponseDto(data, pagination);

      expect(response.data).toEqual([]);
      expect(response.pagination.total).toBe(0);
    });
  });

  describe('SearchDto', () => {
    let searchDto: SearchDto;

    beforeEach(() => {
      searchDto = new SearchDto();
    });

    it('should inherit pagination properties', () => {
      expect(searchDto.page).toBe(1);
      expect(searchDto.limit).toBe(20);
      expect(searchDto.sortOrder).toBe('desc');
    });

    it('should validate optional query string', async () => {
      searchDto.q = 'search term';
      const errors = await validate(searchDto);
      expect(errors).toHaveLength(0);
    });

    it('should validate optional filter string', async () => {
      searchDto.filter = 'active';
      const errors = await validate(searchDto);
      expect(errors).toHaveLength(0);
    });

    it('should trim query string', () => {
      const plainObject = { q: '  search term  ' };
      const transformed = plainToClass(SearchDto, plainObject);

      expect(transformed.q).toBe('search term');
    });

    it('should handle undefined query string', () => {
      const plainObject = { q: undefined };
      const transformed = plainToClass(SearchDto, plainObject);

      expect(transformed.q).toBeUndefined();
    });
  });

  describe('DateRangeDto', () => {
    let dateRangeDto: DateRangeDto;

    beforeEach(() => {
      dateRangeDto = new DateRangeDto();
    });

    it('should validate optional start date', async () => {
      dateRangeDto.startDate = new Date('2023-01-01');
      const errors = await validate(dateRangeDto);
      expect(errors).toHaveLength(0);
    });

    it('should validate optional end date', async () => {
      dateRangeDto.endDate = new Date('2023-12-31');
      const errors = await validate(dateRangeDto);
      expect(errors).toHaveLength(0);
    });

    it('should validate both dates', async () => {
      dateRangeDto.startDate = new Date('2023-01-01');
      dateRangeDto.endDate = new Date('2023-12-31');
      const errors = await validate(dateRangeDto);
      expect(errors).toHaveLength(0);
    });

    it('should transform string dates to Date objects', () => {
      const plainObject = {
        startDate: '2023-01-01',
        endDate: '2023-12-31',
      };
      const transformed = plainToClass(DateRangeDto, plainObject);

      expect(transformed.startDate).toBeInstanceOf(Date);
      expect(transformed.endDate).toBeInstanceOf(Date);
    });
  });

  describe('FileUploadDto', () => {
    let fileUploadDto: FileUploadDto;

    beforeEach(() => {
      fileUploadDto = new FileUploadDto();
    });

    it('should validate required filename', async () => {
      fileUploadDto.filename = 'test.jpg';
      fileUploadDto.mimetype = 'image/jpeg';
      fileUploadDto.size = 1024;
      fileUploadDto.path = '/uploads/test.jpg';

      const errors = await validate(fileUploadDto);
      expect(errors).toHaveLength(0);
    });

    it('should reject missing filename', async () => {
      fileUploadDto.mimetype = 'image/jpeg';
      fileUploadDto.size = 1024;
      fileUploadDto.path = '/uploads/test.jpg';

      const errors = await validate(fileUploadDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('filename');
    });

    it('should reject missing mimetype', async () => {
      fileUploadDto.filename = 'test.jpg';
      fileUploadDto.size = 1024;
      fileUploadDto.path = '/uploads/test.jpg';

      const errors = await validate(fileUploadDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('mimetype');
    });

    it('should reject invalid size (not a number)', async () => {
      fileUploadDto.filename = 'test.jpg';
      fileUploadDto.mimetype = 'image/jpeg';
      fileUploadDto.size = 'invalid' as any;
      fileUploadDto.path = '/uploads/test.jpg';

      const errors = await validate(fileUploadDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('size');
    });

    it('should reject missing path', async () => {
      fileUploadDto.filename = 'test.jpg';
      fileUploadDto.mimetype = 'image/jpeg';
      fileUploadDto.size = 1024;

      const errors = await validate(fileUploadDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('path');
    });
  });

  describe('BulkActionDto', () => {
    let bulkActionDto: BulkActionDto;

    beforeEach(() => {
      bulkActionDto = new BulkActionDto();
    });

    it('should validate required ids array', async () => {
      bulkActionDto.ids = ['id1', 'id2', 'id3'];
      bulkActionDto.action = 'delete';

      const errors = await validate(bulkActionDto);
      expect(errors).toHaveLength(0);
    });

    it('should reject missing ids', async () => {
      bulkActionDto.action = 'delete';

      const errors = await validate(bulkActionDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('ids');
    });

    it('should reject missing action', async () => {
      bulkActionDto.ids = ['id1', 'id2'];

      const errors = await validate(bulkActionDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('action');
    });

    it('should reject non-string ids', async () => {
      bulkActionDto.ids = [1, 2, 3] as any;
      bulkActionDto.action = 'delete';

      const errors = await validate(bulkActionDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('ids');
    });

    it('should handle empty ids array', async () => {
      bulkActionDto.ids = [];
      bulkActionDto.action = 'delete';

      const errors = await validate(bulkActionDto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('IdParamDto', () => {
    let idParamDto: IdParamDto;

    beforeEach(() => {
      idParamDto = new IdParamDto();
    });

    it('should validate required id', async () => {
      idParamDto.id = 'valid-id';

      const errors = await validate(idParamDto);
      expect(errors).toHaveLength(0);
    });

    it('should reject missing id', async () => {
      const errors = await validate(idParamDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('id');
    });

    it('should reject non-string id', async () => {
      idParamDto.id = 123 as any;

      const errors = await validate(idParamDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('id');
    });
  });

  describe('QueryParamsDto', () => {
    let queryParamsDto: QueryParamsDto;

    beforeEach(() => {
      queryParamsDto = new QueryParamsDto();
    });

    it('should have default values', () => {
      expect(queryParamsDto.page).toBe(1);
      expect(queryParamsDto.limit).toBe(20);
      expect(queryParamsDto.order).toBe('desc');
    });

    it('should validate all optional parameters', async () => {
      queryParamsDto.page = 2;
      queryParamsDto.limit = 50;
      queryParamsDto.search = 'test search';
      queryParamsDto.sort = 'name';
      queryParamsDto.order = 'asc';

      const errors = await validate(queryParamsDto);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid page number', async () => {
      queryParamsDto.page = 0;

      const errors = await validate(queryParamsDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('page');
    });

    it('should reject invalid limit', async () => {
      queryParamsDto.limit = 200;

      const errors = await validate(queryParamsDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('limit');
    });

    it('should reject invalid order', async () => {
      queryParamsDto.order = 'invalid' as any;

      const errors = await validate(queryParamsDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('order');
    });
  });

  describe('SuccessResponseDto', () => {
    it('should create success response', () => {
      const data = { id: 1, name: 'test' };
      const message = 'Success';
      const response = new SuccessResponseDto(data, message);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.message).toBe(message);
      expect(response.error).toBeUndefined();
      expect(response.timestamp).toBeDefined();
    });

    it('should create success response without message', () => {
      const data = { id: 1 };
      const response = new SuccessResponseDto(data);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.message).toBeUndefined();
    });
  });

  describe('ErrorResponseDto', () => {
    it('should create error response', () => {
      const error = 'Something went wrong';
      const message = 'Error occurred';
      const response = new ErrorResponseDto(error, message);

      expect(response.success).toBe(false);
      expect(response.data).toBeUndefined();
      expect(response.message).toBe(message);
      expect(response.error).toBe(error);
      expect(response.timestamp).toBeDefined();
    });

    it('should create error response without message', () => {
      const error = 'Error';
      const response = new ErrorResponseDto(error);

      expect(response.success).toBe(false);
      expect(response.error).toBe(error);
      expect(response.message).toBeUndefined();
    });
  });

  describe('ValidationErrorDto', () => {
    it('should create validation error with all parameters', () => {
      const field = 'email';
      const message = 'Invalid email format';
      const value = 'invalid-email';
      const error = new ValidationErrorDto(field, message, value);

      expect(error.field).toBe(field);
      expect(error.message).toBe(message);
      expect(error.value).toBe(value);
    });

    it('should create validation error without value', () => {
      const field = 'password';
      const message = 'Password is required';
      const error = new ValidationErrorDto(field, message);

      expect(error.field).toBe(field);
      expect(error.message).toBe(message);
      expect(error.value).toBeUndefined();
    });
  });

  describe('ApiResponseDto', () => {
    describe('Constructor', () => {
      it('should create success response with all parameters', () => {
        const data = { id: 1 };
        const message = 'Success';
        const errors = [new ValidationErrorDto('field', 'message')];
        const meta = {
          timestamp: '2023-01-01T00:00:00.000Z',
          requestId: 'req-123',
          version: '2.0.0',
        };
        const response = new ApiResponseDto(true, data, message, errors, meta);

        expect(response.success).toBe(true);
        expect(response.data).toEqual(data);
        expect(response.message).toBe(message);
        expect(response.errors).toEqual(errors);
        expect(response.meta).toEqual(meta);
      });

      it('should create response with default meta', () => {
        const response = new ApiResponseDto(true);

        expect(response.success).toBe(true);
        expect(response.meta).toBeDefined();
        expect(response.meta.timestamp).toBeDefined();
        expect(response.meta.version).toBe('1.0.0');
        expect(response.meta.requestId).toBeUndefined();
      });

      it('should create error response', () => {
        const message = 'Error occurred';
        const errors = [new ValidationErrorDto('field', 'message')];
        const response = new ApiResponseDto(false, undefined, message, errors);

        expect(response.success).toBe(false);
        expect(response.data).toBeUndefined();
        expect(response.message).toBe(message);
        expect(response.errors).toEqual(errors);
      });
    });

    describe('Static Methods', () => {
      it('should create success response using static method', () => {
        const data = { id: 1 };
        const message = 'Success';
        const response = ApiResponseDto.success(data, message);

        expect(response.success).toBe(true);
        expect(response.data).toEqual(data);
        expect(response.message).toBe(message);
        expect(response.errors).toBeUndefined();
        expect(response.meta).toBeDefined();
      });

      it('should create error response using static method', () => {
        const message = 'Validation failed';
        const errors = [new ValidationErrorDto('field', 'message')];
        const response = ApiResponseDto.error(message, errors);

        expect(response.success).toBe(false);
        expect(response.data).toBeUndefined();
        expect(response.message).toBe(message);
        expect(response.errors).toEqual(errors);
        expect(response.meta).toBeDefined();
      });

      it('should create success response without message', () => {
        const data = { id: 1 };
        const response = ApiResponseDto.success(data);

        expect(response.success).toBe(true);
        expect(response.data).toEqual(data);
        expect(response.message).toBeUndefined();
      });

      it('should create error response without errors', () => {
        const message = 'Error';
        const response = ApiResponseDto.error(message);

        expect(response.success).toBe(false);
        expect(response.message).toBe(message);
        expect(response.errors).toBeUndefined();
      });
    });

    describe('Meta Property', () => {
      it('should generate timestamp automatically', () => {
        const response = new ApiResponseDto(true);
        const timestamp = new Date(response.meta.timestamp);

        expect(timestamp).toBeInstanceOf(Date);
        expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
      });

      it('should use provided meta', () => {
        const customMeta = {
          timestamp: '2023-01-01T00:00:00.000Z',
          requestId: 'custom-req-id',
          version: '3.0.0',
        };
        const response = new ApiResponseDto(
          true,
          undefined,
          undefined,
          undefined,
          customMeta,
        );

        expect(response.meta).toEqual(customMeta);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null and undefined values in BaseResponseDto', () => {
      const response = new BaseResponseDto(true, null, undefined, null);

      expect(response.success).toBe(true);
      expect(response.data).toBeNull();
      expect(response.message).toBeUndefined();
      expect(response.error).toBeNull();
    });

    it('should handle empty arrays in BulkActionDto', async () => {
      const bulkActionDto = new BulkActionDto();
      bulkActionDto.ids = [];
      bulkActionDto.action = 'test';

      const errors = await validate(bulkActionDto);
      expect(errors).toHaveLength(0);
    });

    it('should handle very large numbers in PaginationDto', async () => {
      const paginationDto = new PaginationDto();
      paginationDto.page = Number.MAX_SAFE_INTEGER;
      paginationDto.limit = 100;

      const errors = await validate(paginationDto);
      expect(errors).toHaveLength(0);
    });

    it('should handle special characters in SearchDto', async () => {
      const searchDto = new SearchDto();
      searchDto.q = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      searchDto.filter = 'special-chars';

      const errors = await validate(searchDto);
      expect(errors).toHaveLength(0);
    });

    it('should handle future dates in DateRangeDto', async () => {
      const dateRangeDto = new DateRangeDto();
      dateRangeDto.startDate = new Date('2030-01-01');
      dateRangeDto.endDate = new Date('2030-12-31');

      const errors = await validate(dateRangeDto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Type Safety and Generic Types', () => {
    it('should maintain type safety with BaseResponseDto generic', () => {
      interface User {
        id: number;
        name: string;
      }

      const user: User = { id: 1, name: 'John' };
      const response = BaseResponseDto.success<User>(user);

      expect(response.data).toEqual(user);
      expect(response.data?.id).toBe(1);
      expect(response.data?.name).toBe('John');
    });

    it('should maintain type safety with PaginatedResponseDto generic', () => {
      interface Product {
        id: number;
        title: string;
      }

      const products: Product[] = [
        { id: 1, title: 'Product 1' },
        { id: 2, title: 'Product 2' },
      ];
      const pagination = {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      const response = new PaginatedResponseDto<Product>(products, pagination);

      expect(response.data).toEqual(products);
      expect(response.data?.[0]?.id).toBe(1);
      expect(response.data?.[0]?.title).toBe('Product 1');
    });

    it('should maintain type safety with ApiResponseDto generic', () => {
      interface ApiData {
        count: number;
        items: string[];
      }

      const apiData: ApiData = { count: 5, items: ['item1', 'item2'] };
      const response = ApiResponseDto.success<ApiData>(apiData);

      expect(response.data).toEqual(apiData);
      expect(response.data?.count).toBe(5);
      expect(response.data?.items).toEqual(['item1', 'item2']);
    });
  });
});
