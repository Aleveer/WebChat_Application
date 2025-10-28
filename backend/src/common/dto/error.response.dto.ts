import { BaseResponseDto } from './base.response.dto';

export class ErrorResponseDto extends BaseResponseDto<undefined> {
  constructor(message: string, code: string = 'ERROR', details?: any) {
    super(false, message, undefined, { code, details });
  }
}
