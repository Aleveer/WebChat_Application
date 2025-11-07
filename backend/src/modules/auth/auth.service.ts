import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { User } from '../users/schemas/user.schema';
import { verify } from '@node-rs/bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signUp(data: {
    username: string;
    password: string;
    phone_number?: string;
    profile_photo?: string;
  }): Promise<User> {
    return this.usersService.create(data);
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
