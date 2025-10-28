import { Injectable } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UnauthorizedException } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
// Group Member Guard
@Injectable()
export class GroupMemberGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;
    const groupId = request.params.groupId || request.params.id;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (!groupId) {
      throw new ForbiddenException('Group ID is required');
    }

    // Here you would check if user is a member of the group
    // This is a simplified version
    //TODO: Implement group member check properly
    const userWithGroups = user as unknown as { groups?: string[] };
    const userGroups = userWithGroups.groups || [];
    const isMember = userGroups.includes(groupId);

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    return true;
  }
}
