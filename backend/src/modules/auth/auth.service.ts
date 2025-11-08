import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User } from '../users/schemas/user.schema';
import { verify } from '@node-rs/bcrypt';
import { APP_CONSTANTS } from '../../common/constants/app.constants';
import { EmailService } from '../../common/services/email.services';
import { PasswordUtils } from '../../common/utils/password.utils';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async signUp(data: {
    username: string;
    password: string;
    email?: string;
    phone_number?: string;
    profile_photo?: string;
  }): Promise<User> {
    const user = await this.usersService.create(data);
    return user;
  }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);
    if (user) {
      const isMatch = await verify(pass, user.password);

      if (isMatch) {
        const { password, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(user: any) {
    const payload = {
      sub: user._id,
      username: user.username,
      phone_number: user.phone_number,
      profile_photo: user.profile_photo,
    };
    console.log('payload: ', payload);
    return {
      access_token: await this.jwtService.sign(payload),
    };
  }

  async logout(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      if (!decoded) {
        throw new UnauthorizedException('Invalid token');
      }

      return {
        message: 'Logout successful',
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
      throw new UnauthorizedException('Token verification failed');
    }
  }

  async forgotPassword(email: string) {
    // Check if email is valid
    email = email.trim().toLowerCase();
    if (!email.match(APP_CONSTANTS.USERS.EMAIL_REGEX)) {
      throw new BadRequestException('Invalid email');
    }

    // When email is valid, check if user exists
    const user = await this.usersService.findByEmail(email);

    // Whether user exists or not, generate a reset token and send email
    if (user) {
      const resetToken = this.jwtService.sign({ email }, { expiresIn: '15m' });

      // Send email to user with reset link, the link should be valid for 15 minutes
      const emailSent = await this.emailService.sendPasswordResetEmail(
        email,
        resetToken,
      );

      if (emailSent) {
        //show output message to user that email has been sent
        return {
          message:
            'If an account with that email exists, a password reset link has been sent.',
        };
      }
    }
  }

  async resetPassword(token: string, password: string) {
    try {
      // Verify token is valid and not expired
      const decoded = this.jwtService.verify(token);

      if (!decoded || !decoded.email) {
        throw new UnauthorizedException('Invalid token');
      }

      // Validate password strength
      const passwordValidation =
        PasswordUtils.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        throw new BadRequestException({
          message: 'Password does not meet requirements',
          feedback: passwordValidation.feedback,
        });
      }

      // Validate password format
      if (
        password.length < APP_CONSTANTS.USERS.MIN_PASSWORD_LENGTH ||
        password.length > APP_CONSTANTS.USERS.MAX_PASSWORD_LENGTH
      ) {
        throw new BadRequestException(
          `Password must be between ${APP_CONSTANTS.USERS.MIN_PASSWORD_LENGTH} and ${APP_CONSTANTS.USERS.MAX_PASSWORD_LENGTH} characters`,
        );
      }

      if (!password.match(APP_CONSTANTS.USERS.PASSWORD_REGEX)) {
        throw new BadRequestException('Password contains invalid characters');
      }

      const user = await this.usersService.findByEmail(decoded.email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verify user has email
      if (!user.email || user.email !== decoded.email) {
        throw new UnauthorizedException('Invalid token for this user');
      }

      // Hash password before updating (findByIdAndUpdate doesn't trigger pre-save hook)
      const hashedPassword = await PasswordUtils.hashPassword(password);

      // Update user password (convert ObjectId to string)
      const userId = user._id ? String(user._id) : user._id;
      await this.usersService.update(userId, { password: hashedPassword });

      return {
        message: 'Password reset successful',
      };
    } catch (error) {
      // Handle JWT verification errors
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException(
          'Reset token has expired. Please request a new one.',
        );
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid reset token');
      }

      throw error;
    }
  }

  async refreshToken(user: { sub: string; [key: string]: unknown }) {
    const payload = {
      sub: user.sub,
      phone_number: user.phone_number,
      username: user.username,
      email: user.email,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
