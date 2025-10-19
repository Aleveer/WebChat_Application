import { IsString } from 'class-validator';
// Bulk Action DTO
export class BulkActionDto {
  @IsString({ each: true })
  ids: string[];

  @IsString()
  action: string;
}

// ID Parameter DTO
export class IdParamDto {
  @IsString()
  id: string;
}
