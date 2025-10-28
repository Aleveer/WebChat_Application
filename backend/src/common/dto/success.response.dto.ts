import { BaseResponseDto } from './base.response.dto';

export class SuccessResponseDto<T = any> extends BaseResponseDto<T> {
  constructor(data?: T, message: string = 'Operation successful') {
    super(true, message, data);
  }
}
