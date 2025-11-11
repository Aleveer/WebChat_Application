import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsUrl,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { APP_CONSTANTS } from '../../../common/constants/app.constants';

export class CreateUserDto {
  @IsPhoneNumber(undefined, {
    message: 'Phone number must be in international format',
  })
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(APP_CONSTANTS.USERS.MAX_NAME_LENGTH)
  @Matches(APP_CONSTANTS.USERS.FULL_NAME_REGEX, {
    message:
      'Full name must contain only letters and spaces (Unicode supported)',
  })
  full_name: string;

  @IsOptional()
  @IsString()
  @MaxLength(APP_CONSTANTS.USERS.MAX_USERNAME_LENGTH)
  @Matches(APP_CONSTANTS.USERS.USERNAME_REGEX, {
    message:
      'Username must contain only alphanumeric characters and underscores',
  })
  username?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @Matches(APP_CONSTANTS.USERS.EMAIL_REGEX, {
    message: 'Email must be a valid email address',
  })
  email?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Profile photo must be a valid URL' })
  @Matches(APP_CONSTANTS.USERS.PHOTO_REGEX, {
    message: 'Profile photo must be an image file',
  })
  photo?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(APP_CONSTANTS.USERS.MIN_PASSWORD_LENGTH, {
    message: 'Password must be at least 8 characters long',
  })
  @Matches(APP_CONSTANTS.USERS.PASSWORD_REGEX, {
    message:
      'Password must contain only alphanumeric characters and special characters',
  })
  password: string;
}

export class UpdateUserDto {
  @IsOptional()
  @Transform(({ value }) =>
    value === null || value === '' ? undefined : value,
  )
  @IsString()
  @MaxLength(APP_CONSTANTS.USERS.MAX_NAME_LENGTH)
  @Matches(APP_CONSTANTS.USERS.FULL_NAME_REGEX, {
    message:
      'Full name must contain only letters and spaces (Unicode supported)',
  })
  full_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(APP_CONSTANTS.USERS.MAX_USERNAME_LENGTH)
  @Matches(APP_CONSTANTS.USERS.USERNAME_REGEX, {
    message:
      'Username must contain only alphanumeric characters and underscores',
  })
  username?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === null || value === '' ? undefined : value,
  )
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @Matches(APP_CONSTANTS.USERS.EMAIL_REGEX, {
    message: 'Email must be a valid email address',
  })
  email?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === null || value === '' ? undefined : value,
  )
  @IsPhoneNumber(undefined, {
    message: 'Phone number must be in international format',
  })
  phone?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === null || value === '' ? undefined : value,
  )
  @IsUrl({}, { message: 'Profile photo must be a valid URL' })
  @Matches(APP_CONSTANTS.USERS.PHOTO_REGEX, {
    message: 'Profile photo must be an image file',
  })
  photo?: string;

  @IsOptional()
  @IsString()
  @MinLength(APP_CONSTANTS.USERS.MIN_PASSWORD_LENGTH, {
    message: 'Password must be at least 6 characters long',
  })
  @Matches(APP_CONSTANTS.USERS.PASSWORD_REGEX, {
    message:
      'Password must contain only alphanumeric characters and special characters',
  })
  password?: string;
}

export class LoginDto {
  @IsPhoneNumber(undefined, {
    message: 'Phone number must be in international format',
  })
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(APP_CONSTANTS.USERS.MIN_PASSWORD_LENGTH, {
    message: 'New password must be at least 8 characters long',
  })
  @Matches(APP_CONSTANTS.USERS.PASSWORD_REGEX, {
    message:
      'Password must contain only alphanumeric characters and special characters',
  })
  newPassword: string;
}
