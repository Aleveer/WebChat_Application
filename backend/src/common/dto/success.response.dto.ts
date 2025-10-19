import { BaseResponseDto } from './base.response.dto';
// Success Response DTO
export class SuccessResponseDto<T = any> extends BaseResponseDto<T> {
  constructor(data?: T, message?: string) {
    super(true, data, message);
  }
}
