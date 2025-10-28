import {
  IsString,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsIn,
} from 'class-validator';

// Bulk Action DTO
export class BulkActionDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100) // Giới hạn số lượng items
  ids: string[];

  @IsString()
  @IsIn(['delete', 'update', 'activate', 'deactivate']) // Chỉ cho phép các action hợp lệ
  action: string;
}

// ID Parameter DTO
export class IdParamDto {
  @IsString()
  id: string;
}
