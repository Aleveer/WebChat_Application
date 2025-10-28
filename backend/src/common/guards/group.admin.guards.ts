import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { Types } from 'mongoose';

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

    // Validate ObjectId
    if (!Types.ObjectId.isValid(groupId)) {
      throw new ForbiddenException('Invalid Group ID');
    }

    // TODO: Implement actual group admin check with database
    // For now, check if user has adminGroups array
    const userWithAdminGroups = user as unknown as { adminGroups?: string[] };
    const userAdminGroups = userWithAdminGroups.adminGroups || [];
    const isAdmin = userAdminGroups.includes(groupId);

    if (!isAdmin) {
      throw new ForbiddenException('Only group admins can perform this action');
    }

    return true;
  }
}
