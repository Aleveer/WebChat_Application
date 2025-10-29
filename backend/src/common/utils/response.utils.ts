import { PaginationUtils } from './pagination.utils';
import { format } from 'date-fns';
export class ResponseUtils {
  static success<T>(data?: T, message?: string) {
    return {
      success: true,
      data,
      message,
      timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    };
  }

  static error(message: string, error?: string) {
    return {
      success: false,
      message,
      error,
      timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
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
      timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    };
  }
}
