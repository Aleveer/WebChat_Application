import { Injectable } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { ForbiddenException } from '@nestjs/common';
// Throttle Guard (for specific endpoints)
//TODO: Implement throttle guard properly
@Injectable()
export class ThrottleGuard implements CanActivate {
  private readonly throttleMap = new Map<string, number>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const endpoint = `${request.method}:${request.route?.path}`;
    const now = Date.now();
    const lastRequest = this.throttleMap.get(endpoint) || 0;
    const throttleMs = 1000; // 1 second throttle

    if (now - lastRequest < throttleMs) {
      throw new ForbiddenException('Too many requests, please slow down');
    }

    this.throttleMap.set(endpoint, now);
    return true;
  }
}
