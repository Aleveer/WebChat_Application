import { PaginationUtils } from './pagination.utils';
export class ResponseUtils {
  static success<T>(data?: T, message?: string) {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  static error(message: string, error?: string) {
    return {
      success: false,
      message,
      error,
      timestamp: new Date().toISOString(),
    };
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string,
  ) {
    const pagination = PaginationUtils.calculatePagination(page, limit, total);

    return {
      success: true,
      data,
      pagination,
      message,
      timestamp: new Date().toISOString(),
    };
  }
}
