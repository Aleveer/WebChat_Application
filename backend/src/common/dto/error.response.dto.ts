import { BaseResponseDto } from './base.response.dto';
// Error Response DTO
export class ErrorResponseDto extends BaseResponseDto {
  constructor(error: string, message?: string) {
    super(false, undefined, message, error);
  }
}
