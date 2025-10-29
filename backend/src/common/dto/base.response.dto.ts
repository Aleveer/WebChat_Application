import { format } from 'date-fns';
export class BaseResponseDto<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: unknown;
  };
  timestamp: string;
  requestId?: string;

  constructor(
    success: boolean,
    message: string,
    data?: T,
    error?: { code: string; details?: unknown },
    requestId?: string,
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.error = error;
    this.timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    this.requestId = requestId;
  }

  static success<T>(
    data: T,
    message: string = 'Operation successful',
    requestId?: string,
  ): BaseResponseDto<T> {
    return new BaseResponseDto(true, message, data, undefined, requestId);
  }

  static error(
    message: string,
    code: string = 'ERROR',
    details?: unknown,
    requestId?: string,
  ): BaseResponseDto<undefined> {
    return new BaseResponseDto(
      false,
      message,
      undefined,
      { code, details },
      requestId,
    );
  }
}
