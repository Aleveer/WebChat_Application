import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  Matches,
} from 'class-validator';
import { APP_CONSTANTS } from '../../../common/constants/app.constants';

export class LoginDto {
  // @IsString()
  // @IsNotEmpty()
  // @Matches(APP_CONSTANTS.USERS.PHONE_REGEX, {
  //   message:
  //     'Phone number must be in international format (e.g., +84901234567)',
  // })
  // phone_number: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(APP_CONSTANTS.USERS.MIN_PASSWORD_LENGTH)
  password: string;
}

export class RegisterDto {
  // @IsString()
  // @IsNotEmpty()
  // @Matches(APP_CONSTANTS.USERS.PHONE_REGEX, {
  //   message:
  //     'Phone number must be in international format (e.g., +84901234567)',
  // })
  // phone_number: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(APP_CONSTANTS.USERS.MIN_PASSWORD_LENGTH)
  @Matches(APP_CONSTANTS.USERS.PASSWORD_REGEX, {
    message:
      'Password must contain only alphanumeric characters and special characters',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  full_name: string;

  @IsString()
  @IsOptional()
  @Matches(APP_CONSTANTS.USERS.USERNAME_REGEX, {
    message: 'Username must be alphanumeric and can contain underscores',
  })
  username?: string;

  @IsString()
  @IsOptional()
  @Matches(APP_CONSTANTS.USERS.EMAIL_REGEX, {
    message: 'Email must be a valid email address',
  })
  email?: string;
}

export class LogoutDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ForgotPasswordDto {
  @IsString()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(APP_CONSTANTS.USERS.MIN_PASSWORD_LENGTH)
  @Matches(APP_CONSTANTS.USERS.PASSWORD_REGEX, {
    message:
      'Password must contain only alphanumeric characters and special characters and should be at least 8 characters long',
  })
  password: string;
}
