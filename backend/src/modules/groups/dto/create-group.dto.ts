import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
  IsBoolean,
  IsMongoId,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GroupMemberDto {
  @IsMongoId()
  @IsNotEmpty()
  user_id: string;

  @IsOptional()
  @IsBoolean()
  is_admin?: boolean;
}

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupMemberDto)
  @ArrayMinSize(3, { message: 'Group must have at least three members' })
  @ArrayMaxSize(100, { message: 'Group can have at most one hundred members' })
  members: GroupMemberDto[];
}

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}

export class AddMemberDto {
  @IsMongoId()
  @IsNotEmpty()
  user_id: string;

  @IsOptional()
  @IsBoolean()
  is_admin?: boolean;
}

export class RemoveMemberDto {
  @IsMongoId()
  @IsNotEmpty()
  user_id: string;
}

export class SetAdminDto {
  @IsMongoId()
  @IsNotEmpty()
  user_id: string;

  @IsBoolean()
  is_admin: boolean;
}
