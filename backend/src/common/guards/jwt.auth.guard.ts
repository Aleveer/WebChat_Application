import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

// JWT Auth Guard
//TODO: Implement JWT validation properly
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('JWT token not found');
    }

    try {
      const secret =
        this.configService.get<string>('jwt.secret') || process.env.JWT_SECRET;

      if (!secret) {
        throw new UnauthorizedException('JWT secret is not configured');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret,
      });
      request['user'] = payload;
    } catch (err: any) {
      const message =
        err?.name === 'TokenExpiredError'
          ? 'JWT token expired'
          : err?.name === 'JsonWebTokenError'
            ? 'Invalid JWT token'
            : 'Invalid JWT token';
      throw new UnauthorizedException(message);
    }

    return true;
  }

  private extractToken(request: Request): string | undefined {
    // Prefer Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader) {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer' && token) return token;
    }

    // Fallback to cookie (common in web apps)
    const cookieToken = (request as any).cookies?.access_token;
    if (cookieToken) return cookieToken;

    return undefined;
  }
}
