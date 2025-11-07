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
import * as bcrypt from 'bcrypt';


@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  async signUp(data: {
    user_name: string;
    password: string;
    phone_number?: string;
    profile_photo?: string;
  }): Promise<User> {
    return this.usersService.create(data);
  }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user) {
      const isMatch = await bcrypt.compare(pass, user.password);

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
      user_name: user.user_name,
      phone_number: user.phone_number,
      profile_photo: user.profile_photo
    };
    console.log("payload: ", payload)
    return {
      access_token: await this.jwtService.sign(payload),
    };
  }


  async refreshToken(user: { sub: string;[key: string]: unknown }) {
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
