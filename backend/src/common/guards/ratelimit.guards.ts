import { Injectable } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ForbiddenException } from '@nestjs/common';
// Rate Limiting Guard
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly requests = new Map<
    string,
    { count: number; resetTime: number }
  >();

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rateLimitConfig = this.reflector.getAllAndOverride<{
      limit: number;
      windowMs: number;
    }>('rateLimit', [context.getHandler(), context.getClass()]);

    if (!rateLimitConfig) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const clientId = request.ip || 'unknown';
    const now = Date.now();
    const windowMs = rateLimitConfig.windowMs;
    const limit = rateLimitConfig.limit;

    const clientRequests = this.requests.get(clientId);

    if (!clientRequests || now > clientRequests.resetTime) {
      this.requests.set(clientId, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (clientRequests.count >= limit) {
      throw new ForbiddenException('Rate limit exceeded');
    }

    clientRequests.count++;
    return true;
  }
}
