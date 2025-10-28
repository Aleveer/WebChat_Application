import { ResponseUtils } from './response.utils';
import { PaginationUtils } from './pagination.utils';

// Mock PaginationUtils
jest.mock('./pagination.utils');

describe('ResponseUtils', () => {
  // Mock Date để có timestamp cố định
  let dateNowSpy: jest.SpyInstance;
  const mockDate = new Date('2025-10-27T10:00:00.000Z');

  beforeEach(() => {
    dateNowSpy = jest
      .spyOn(Date.prototype, 'toISOString')
      .mockReturnValue(mockDate.toISOString());
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('success', () => {
    // Test case 1: Success với data và message (all params provided)
    it('should return success response with data and message', () => {
      const data = { id: 1, name: 'Test User' };
      const message = 'User created successfully';

      const result = ResponseUtils.success(data, message);

      expect(result).toEqual({
        success: true,
        data: { id: 1, name: 'Test User' },
        message: 'User created successfully',
        timestamp: '2025-10-27T10:00:00.000Z',
      });
    });

    // Test case 2: Success với chỉ data (message = undefined)
    it('should return success response with only data', () => {
      const data = { id: 1, name: 'Test User' };

      const result = ResponseUtils.success(data);

      expect(result).toEqual({
        success: true,
        data: { id: 1, name: 'Test User' },
        message: undefined,
        timestamp: '2025-10-27T10:00:00.000Z',
      });
    });

    // Test case 3: Success với chỉ message (data = undefined)
    it('should return success response with only message', () => {
      const message = 'Operation completed';

      const result = ResponseUtils.success(undefined, message);

      expect(result).toEqual({
        success: true,
        data: undefined,
        message: 'Operation completed',
        timestamp: '2025-10-27T10:00:00.000Z',
      });
    });

    // Test case 4: Success không có params (data = undefined, message = undefined)
    it('should return success response with no parameters', () => {
      const result = ResponseUtils.success();

      expect(result).toEqual({
        success: true,
        data: undefined,
        message: undefined,
        timestamp: '2025-10-27T10:00:00.000Z',
      });
    });

    // Test case 5: Success với data = null
    it('should return success response with null data', () => {
      const result = ResponseUtils.success(null, 'Success');

      expect(result).toEqual({
        success: true,
        data: null,
        message: 'Success',
        timestamp: '2025-10-27T10:00:00.000Z',
      });
    });

    // Test case 6: Success với empty object
    it('should return success response with empty object', () => {
      const result = ResponseUtils.success({}, 'Success');

      expect(result).toEqual({
        success: true,
        data: {},
        message: 'Success',
        timestamp: '2025-10-27T10:00:00.000Z',
      });
    });

    // Test case 7: Success với empty array
    it('should return success response with empty array', () => {
      const result = ResponseUtils.success([], 'Success');

      expect(result).toEqual({
        success: true,
        data: [],
        message: 'Success',
        timestamp: '2025-10-27T10:00:00.000Z',
      });
    });

    // Test case 8: Success với array data
    it('should return success response with array data', () => {
      const data = [1, 2, 3, 4, 5];
      const result = ResponseUtils.success(data, 'Numbers retrieved');

      expect(result).toEqual({
        success: true,
        data: [1, 2, 3, 4, 5],
        message: 'Numbers retrieved',
        timestamp: '2025-10-27T10:00:00.000Z',
      });
    });

    // Test case 9: Success với nested object
    it('should return success response with nested object', () => {
      const data = {
        user: {
          id: 1,
          profile: {
            name: 'John',
            age: 30,
          },
        },
      };

      const result = ResponseUtils.success(data);

      expect(result.data).toEqual(data);
      expect(result.success).toBe(true);
    });

    // Test case 10: Success với string data
    it('should return success response with string data', () => {
      const result = ResponseUtils.success('Hello World', 'Message sent');

      expect(result).toEqual({
        success: true,
        data: 'Hello World',
        message: 'Message sent',
        timestamp: '2025-10-27T10:00:00.000Z',
      });
    });

    // Test case 11: Success với number data
    it('should return success response with number data', () => {
      const result = ResponseUtils.success(42, 'Answer found');

      expect(result).toEqual({
        success: true,
        data: 42,
        message: 'Answer found',
        timestamp: '2025-10-27T10:00:00.000Z',
      });
    });

    // Test case 12: Success với boolean data
    it('should return success response with boolean data', () => {
      const result = ResponseUtils.success(true, 'Status checked');

      expect(result).toEqual({
        success: true,
        data: true,
        message: 'Status checked',
        timestamp: '2025-10-27T10:00:00.000Z',
      });
    });

    // Test case 13: Success với empty string message
    it('should return success response with empty string message', () => {
      const result = ResponseUtils.success({ id: 1 }, '');

      expect(result.message).toBe('');
    });

    // Test case 14: Success luôn có success = true
    it('should always have success property set to true', () => {
      const result1 = ResponseUtils.success();
      const result2 = ResponseUtils.success(null);
      const result3 = ResponseUtils.success({}, 'test');

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);
    });

    // Test case 15: Success với very long message
    it('should handle very long message', () => {
      const longMessage = 'A'.repeat(1000);
      const result = ResponseUtils.success({ id: 1 }, longMessage);

      expect(result.message).toBe(longMessage);
      expect(result.message?.length).toBe(1000);
    });

    // Test case 16: Verify timestamp is ISO string
    it('should have timestamp in ISO format', () => {
      const result = ResponseUtils.success();

      expect(result.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/,
      );
    });

    // Test case 17: Verify toISOString được gọi
    it('should call toISOString for timestamp', () => {
      ResponseUtils.success();

      expect(dateNowSpy).toHaveBeenCalled();
    });
  });

  describe('error', () => {
    // Test case 1: Error với message và error (all params provided)
    it('should return error response with message and error details', () => {
      const message = 'Operation failed';
      const error = 'Invalid input data';

      const result = ResponseUtils.error(message, error);

      expect(result).toEqual({
        success: false,
        message: 'Operation failed',
        error: 'Invalid input data',
        timestamp: '2025-10-27T10:00:00.000Z',
      });
    });

    // Test case 2: Error với chỉ message (error = undefined)
    it('should return error response with only message', () => {
      const message = 'Something went wrong';

      const result = ResponseUtils.error(message);

      expect(result).toEqual({
        success: false,
        message: 'Something went wrong',
        error: undefined,
        timestamp: '2025-10-27T10:00:00.000Z',
      });
    });

    // Test case 3: Error với empty string message
    it('should return error response with empty string message', () => {
      const result = ResponseUtils.error('', 'Error details');

      expect(result.message).toBe('');
      expect(result.error).toBe('Error details');
    });

    // Test case 4: Error với empty string error
    it('should return error response with empty string error', () => {
      const result = ResponseUtils.error('Failed', '');

      expect(result.message).toBe('Failed');
      expect(result.error).toBe('');
    });

    // Test case 5: Error luôn có success = false
    it('should always have success property set to false', () => {
      const result1 = ResponseUtils.error('Error 1');
      const result2 = ResponseUtils.error('Error 2', 'Details');
      const result3 = ResponseUtils.error('Error 3', '');

      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
      expect(result3.success).toBe(false);
    });

    // Test case 6: Error với very long message
    it('should handle very long error message', () => {
      const longMessage = 'Error: '.repeat(200);
      const result = ResponseUtils.error(longMessage);

      expect(result.message).toBe(longMessage);
    });

    // Test case 7: Error với very long error details
    it('should handle very long error details', () => {
      const longError = 'Stack trace: '.repeat(200);
      const result = ResponseUtils.error('Failed', longError);

      expect(result.error).toBe(longError);
    });

    // Test case 8: Error với special characters
    it('should handle special characters in message and error', () => {
      const message = 'Error: <script>alert("xss")</script>';
      const error = 'Stack: \n\t\r\\';

      const result = ResponseUtils.error(message, error);

      expect(result.message).toBe(message);
      expect(result.error).toBe(error);
    });

    // Test case 9: Error với unicode characters
    it('should handle unicode characters', () => {
      const message = 'エラーが発生しました';
      const error = 'Lỗi xảy ra';

      const result = ResponseUtils.error(message, error);

      expect(result.message).toBe(message);
      expect(result.error).toBe(error);
    });

    // Test case 10: Verify timestamp is ISO string
    it('should have timestamp in ISO format', () => {
      const result = ResponseUtils.error('Failed');

      expect(result.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/,
      );
    });

    // Test case 11: Error không có data field
    it('should not have data field in error response', () => {
      const result = ResponseUtils.error('Failed', 'Error');

      expect('data' in result).toBe(false);
    });

    // Test case 12: Verify toISOString được gọi
    it('should call toISOString for timestamp', () => {
      ResponseUtils.error('Failed');

      expect(dateNowSpy).toHaveBeenCalled();
    });
  });

  describe('paginated', () => {
    // Test case 1: Paginated với full params (including message)
    it('should return paginated response with all parameters', () => {
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const page = 1;
      const limit = 10;
      const total = 30;
      const message = 'Users retrieved';

      const mockPagination = {
        page: 1,
        limit: 10,
        total: 30,
        totalPages: 3,
        hasNext: true,
        hasPrev: false,
        offset: 0,
      };

      (PaginationUtils.calculatePagination as jest.Mock).mockReturnValue(
        mockPagination,
      );

      const result = ResponseUtils.paginated(data, page, limit, total, message);

      expect(result).toEqual({
        success: true,
        data: [{ id: 1 }, { id: 2 }, { id: 3 }],
        pagination: mockPagination,
        message: 'Users retrieved',
        timestamp: '2025-10-27T10:00:00.000Z',
      });

      expect(PaginationUtils.calculatePagination).toHaveBeenCalledWith(
        page,
        limit,
        total,
      );
    });

    // Test case 2: Paginated without message (message = undefined)
    it('should return paginated response without message', () => {
      const data = [{ id: 1 }];
      const mockPagination = {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
        offset: 0,
      };

      (PaginationUtils.calculatePagination as jest.Mock).mockReturnValue(
        mockPagination,
      );

      const result = ResponseUtils.paginated(data, 1, 20, 1);

      expect(result).toEqual({
        success: true,
        data: [{ id: 1 }],
        pagination: mockPagination,
        message: undefined,
        timestamp: '2025-10-27T10:00:00.000Z',
      });
    });

    // Test case 3: Paginated với empty array
    it('should return paginated response with empty array', () => {
      const data: any[] = [];
      const mockPagination = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
        offset: 0,
      };

      (PaginationUtils.calculatePagination as jest.Mock).mockReturnValue(
        mockPagination,
      );

      const result = ResponseUtils.paginated(data, 1, 10, 0);

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    // Test case 4: Paginated với page = 1 (first page)
    it('should return paginated response for first page', () => {
      const data = [1, 2, 3];
      const mockPagination = {
        page: 1,
        limit: 3,
        total: 10,
        totalPages: 4,
        hasNext: true,
        hasPrev: false,
        offset: 0,
      };

      (PaginationUtils.calculatePagination as jest.Mock).mockReturnValue(
        mockPagination,
      );

      const result = ResponseUtils.paginated(data, 1, 3, 10);

      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(false);
    });

    // Test case 5: Paginated với middle page
    it('should return paginated response for middle page', () => {
      const data = [4, 5, 6];
      const mockPagination = {
        page: 2,
        limit: 3,
        total: 10,
        totalPages: 4,
        hasNext: true,
        hasPrev: true,
        offset: 3,
      };

      (PaginationUtils.calculatePagination as jest.Mock).mockReturnValue(
        mockPagination,
      );

      const result = ResponseUtils.paginated(data, 2, 3, 10);

      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(true);
    });

    // Test case 6: Paginated với last page
    it('should return paginated response for last page', () => {
      const data = [10];
      const mockPagination = {
        page: 4,
        limit: 3,
        total: 10,
        totalPages: 4,
        hasNext: false,
        hasPrev: true,
        offset: 9,
      };

      (PaginationUtils.calculatePagination as jest.Mock).mockReturnValue(
        mockPagination,
      );

      const result = ResponseUtils.paginated(data, 4, 3, 10);

      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(true);
    });

    // Test case 7: Paginated với large dataset
    it('should return paginated response for large dataset', () => {
      const data = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));
      const mockPagination = {
        page: 1,
        limit: 100,
        total: 10000,
        totalPages: 100,
        hasNext: true,
        hasPrev: false,
        offset: 0,
      };

      (PaginationUtils.calculatePagination as jest.Mock).mockReturnValue(
        mockPagination,
      );

      const result = ResponseUtils.paginated(data, 1, 100, 10000);

      expect(result.data.length).toBe(100);
      expect(result.pagination.totalPages).toBe(100);
    });

    // Test case 8: Paginated luôn có success = true
    it('should always have success property set to true', () => {
      const mockPagination = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
        offset: 0,
      };

      (PaginationUtils.calculatePagination as jest.Mock).mockReturnValue(
        mockPagination,
      );

      const result = ResponseUtils.paginated([], 1, 10, 0);

      expect(result.success).toBe(true);
    });

    // Test case 9: Verify PaginationUtils.calculatePagination được gọi với đúng params
    it('should call PaginationUtils.calculatePagination with correct parameters', () => {
      const mockPagination = {
        page: 5,
        limit: 20,
        total: 100,
        totalPages: 5,
        hasNext: false,
        hasPrev: true,
        offset: 80,
      };

      (PaginationUtils.calculatePagination as jest.Mock).mockReturnValue(
        mockPagination,
      );

      ResponseUtils.paginated([1, 2], 5, 20, 100, 'Test');

      expect(PaginationUtils.calculatePagination).toHaveBeenCalledWith(
        5,
        20,
        100,
      );
      expect(PaginationUtils.calculatePagination).toHaveBeenCalledTimes(1);
    });

    // Test case 10: Paginated với different data types
    it('should handle different data types in array', () => {
      const data = [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' },
        'string item',
        123,
        null,
        undefined,
      ];

      const mockPagination = {
        page: 1,
        limit: 10,
        total: 6,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
        offset: 0,
      };

      (PaginationUtils.calculatePagination as jest.Mock).mockReturnValue(
        mockPagination,
      );

      const result = ResponseUtils.paginated(data, 1, 10, 6);

      expect(result.data).toEqual(data);
    });

    // Test case 11: Verify timestamp is ISO string
    it('should have timestamp in ISO format', () => {
      const mockPagination = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
        offset: 0,
      };

      (PaginationUtils.calculatePagination as jest.Mock).mockReturnValue(
        mockPagination,
      );

      const result = ResponseUtils.paginated([], 1, 10, 0);

      expect(result.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/,
      );
    });

    // Test case 12: Paginated với page = 0 (edge case)
    it('should handle page 0', () => {
      const mockPagination = {
        page: 0,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
        offset: -10,
      };

      (PaginationUtils.calculatePagination as jest.Mock).mockReturnValue(
        mockPagination,
      );

      const result = ResponseUtils.paginated([1, 2], 0, 10, 100);

      expect(result.pagination.page).toBe(0);
    });

    // Test case 13: Paginated với limit = 0 (edge case)
    it('should handle limit 0', () => {
      const mockPagination = {
        page: 1,
        limit: 0,
        total: 100,
        totalPages: Infinity,
        hasNext: true,
        hasPrev: false,
        offset: 0,
      };

      (PaginationUtils.calculatePagination as jest.Mock).mockReturnValue(
        mockPagination,
      );

      const result = ResponseUtils.paginated([], 1, 0, 100);

      expect(result.pagination.limit).toBe(0);
    });

    // Test case 14: Verify toISOString được gọi
    it('should call toISOString for timestamp', () => {
      const mockPagination = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
        offset: 0,
      };

      (PaginationUtils.calculatePagination as jest.Mock).mockReturnValue(
        mockPagination,
      );

      ResponseUtils.paginated([], 1, 10, 0);

      expect(dateNowSpy).toHaveBeenCalled();
    });

    // Test case 15: Paginated với empty string message
    it('should handle empty string message', () => {
      const mockPagination = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
        offset: 0,
      };

      (PaginationUtils.calculatePagination as jest.Mock).mockReturnValue(
        mockPagination,
      );

      const result = ResponseUtils.paginated([], 1, 10, 0, '');

      expect(result.message).toBe('');
    });
  });

  // Integration tests
  describe('Integration Tests', () => {
    it('should have consistent structure across all response types', () => {
      const mockPagination = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
        offset: 0,
      };

      (PaginationUtils.calculatePagination as jest.Mock).mockReturnValue(
        mockPagination,
      );

      const successResponse = ResponseUtils.success({ id: 1 }, 'Success');
      const errorResponse = ResponseUtils.error('Failed', 'Error details');
      const paginatedResponse = ResponseUtils.paginated([], 1, 10, 0, 'Empty');

      // All should have timestamp
      expect(successResponse.timestamp).toBeDefined();
      expect(errorResponse.timestamp).toBeDefined();
      expect(paginatedResponse.timestamp).toBeDefined();

      // All should have success field
      expect(successResponse.success).toBeDefined();
      expect(errorResponse.success).toBeDefined();
      expect(paginatedResponse.success).toBeDefined();

      // Success responses should be true
      expect(successResponse.success).toBe(true);
      expect(paginatedResponse.success).toBe(true);

      // Error responses should be false
      expect(errorResponse.success).toBe(false);
    });

    it('should handle workflow: success -> error -> paginated', () => {
      // Step 1: Success
      const step1 = ResponseUtils.success({ userId: 1 }, 'User created');
      expect(step1.success).toBe(true);

      // Step 2: Error
      const step2 = ResponseUtils.error(
        'Validation failed',
        'Email already exists',
      );
      expect(step2.success).toBe(false);

      // Step 3: Paginated
      const mockPagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
        offset: 0,
      };

      (PaginationUtils.calculatePagination as jest.Mock).mockReturnValue(
        mockPagination,
      );

      const step3 = ResponseUtils.paginated([{ id: 1 }], 1, 10, 100);
      expect(step3.success).toBe(true);
      expect(step3.pagination).toBeDefined();
    });

    it('should work with PaginationUtils integration', () => {
      // Mock PaginationUtils để verify integration
      const mockPagination = {
        page: 2,
        limit: 5,
        total: 15,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
        offset: 5,
      };

      (PaginationUtils.calculatePagination as jest.Mock).mockReturnValue(
        mockPagination,
      );

      const data = [1, 2, 3, 4, 5];
      const result = ResponseUtils.paginated(data, 2, 5, 15, 'Page 2');

      // Verify PaginationUtils được gọi đúng
      expect(PaginationUtils.calculatePagination).toHaveBeenCalledWith(
        2,
        5,
        15,
      );

      // Verify response structure
      expect(result.data).toEqual(data);
      expect(result.pagination).toEqual(mockPagination);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Page 2');
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    it('should handle null values in success', () => {
      const result = ResponseUtils.success(null, null as any);

      expect(result.data).toBe(null);
      expect(result.message).toBe(null);
    });

    it('should handle undefined values explicitly', () => {
      const result = ResponseUtils.success(undefined, undefined);

      expect(result.data).toBeUndefined();
      expect(result.message).toBeUndefined();
    });

    it('should handle circular reference in data (JSON serialization issue)', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;

      // ResponseUtils không serialize, chỉ assign
      const result = ResponseUtils.success(circular);

      expect(result.data).toBe(circular);
      expect(result.data.self).toBe(circular);
    });

    it('should handle very large arrays in paginated', () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => i);
      const mockPagination = {
        page: 1,
        limit: 10000,
        total: 10000,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
        offset: 0,
      };

      (PaginationUtils.calculatePagination as jest.Mock).mockReturnValue(
        mockPagination,
      );

      const result = ResponseUtils.paginated(largeData, 1, 10000, 10000);

      expect(result.data.length).toBe(10000);
    });

    it('should handle negative page and limit in paginated', () => {
      const mockPagination = {
        page: -1,
        limit: -10,
        total: 100,
        totalPages: -10,
        hasNext: false,
        hasPrev: false,
        offset: 20,
      };

      (PaginationUtils.calculatePagination as jest.Mock).mockReturnValue(
        mockPagination,
      );

      const result = ResponseUtils.paginated([], -1, -10, 100);

      expect(result.pagination.page).toBe(-1);
      expect(result.pagination.limit).toBe(-10);
    });

    it('should preserve object references in data', () => {
      const original = { id: 1, nested: { value: 'test' } };
      const result = ResponseUtils.success(original);

      expect(result.data).toBe(original);
      expect(result.data.nested).toBe(original.nested);
    });

    it('should handle Symbol in data', () => {
      const sym = Symbol('test');
      const data = { [sym]: 'value', regular: 'prop' };

      const result = ResponseUtils.success(data);

      expect(result.data).toBe(data);
      expect(result.data[sym]).toBe('value');
    });
  });
});
