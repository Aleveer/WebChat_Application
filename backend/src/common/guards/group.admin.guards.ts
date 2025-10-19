import { Injectable } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UnauthorizedException } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
// Group Admin Guard
@Injectable()
export class GroupAdminGuard implements CanActivate {
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

    // Here you would check if user is an admin of the group
    // This is a simplified version
    //TODO: Implement group admin check properly
    const userAdminGroups = user.adminGroups || [];
    const isAdmin = userAdminGroups.includes(groupId);

    if (!isAdmin) {
      throw new ForbiddenException('Only group admins can perform this action');
    }

    return true;
  }
}
