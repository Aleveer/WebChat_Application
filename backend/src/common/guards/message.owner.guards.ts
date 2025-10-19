import { Injectable } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UnauthorizedException } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
// Message Owner Guard
@Injectable()
export class MessageOwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;
    const messageId = request.params.messageId || request.params.id;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (!messageId) {
      throw new ForbiddenException('Message ID is required');
    }

    // Here you would check if user is the owner of the message
    // This is a simplified version
    //TODO: Implement message owner check properly
    const message = (request as any).message; // Assuming message is attached to request
    if (!message) {
      throw new ForbiddenException('Message not found');
    }

    const isOwner = message.sender_id.toString() === user.id;
    if (!isOwner) {
      throw new ForbiddenException(
        'You can only perform this action on your own messages',
      );
    }

    return true;
  }
}
