import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    phoneNumber: string,
    password: string,
  ): Promise<{
    _id?: Types.ObjectId;
    id?: string;
    [key: string]: unknown;
  } | null> {
    const user = await this.usersService.findByPhoneNumber(phoneNumber);
    if (user && (await user.comparePassword(password))) {
      const { password: _, ...result } = user;
      return result as {
        _id?: Types.ObjectId;
        id?: string;
        [key: string]: unknown;
      };
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(
      loginDto.phone_number,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userDoc = user as unknown as {
      _id?: Types.ObjectId;
      id?: string;
      [key: string]: unknown;
    };
    const userId = userDoc.id || userDoc._id?.toString();

    const payload = {
      sub: userId,
      phone_number: user.phone_number as string,
      username: user.username as string | undefined,
      email: user.email as string | undefined,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: userId,
        phone_number: user.phone_number as string,
        full_name: user.full_name as string,
        username: user.username as string | undefined,
        email: user.email as string | undefined,
        profile_photo: user.profile_photo as string | undefined,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.usersService.findByPhoneNumber(
      registerDto.phone_number,
    );
    if (existingUser) {
      throw new BadRequestException(
        'User with this phone number already exists',
      );
    }

    // Check username if provided
    if (registerDto.username) {
      const existingUsername = await this.usersService.findByUsername(
        registerDto.username,
      );
      if (existingUsername) {
        throw new BadRequestException('Username already taken');
      }
    }

    // Check email if provided
    if (registerDto.email) {
      const existingEmail = await this.usersService.findByEmail(
        registerDto.email,
      );
      if (existingEmail) {
        throw new BadRequestException('Email already registered');
      }
    }

    // Create user (password will be hashed automatically by User schema pre-save hook)
    const user = await this.usersService.create(registerDto);

    const userDoc = user as unknown as {
      _id?: Types.ObjectId;
      id?: string;
      [key: string]: unknown;
    };
    const userId = userDoc.id || userDoc._id?.toString();

    // Validate userId exists before proceeding
    if (!userId) {
      throw new BadRequestException(
        'User ID could not be determined from user document',
      );
    }

    const payload = {
      sub: userId,
      phone_number: user.phone_number as string,
      username: user.username as string | undefined,
      email: user.email as string | undefined,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: userId,
        phone_number: user.phone_number as string,
        full_name: user.full_name as string,
        username: user.username as string | undefined,
        email: user.email as string | undefined,
        profile_photo: user.profile_photo as string | undefined,
      },
    };
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
