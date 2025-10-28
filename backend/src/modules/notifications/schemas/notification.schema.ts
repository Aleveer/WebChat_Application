import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum NotificationType {
  MESSAGE = 'message',
  GROUP_INVITE = 'group_invite',
  GROUP_UPDATE = 'group_update',
  SYSTEM = 'system',
  FRIEND_REQUEST = 'friend_request',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true, enum: NotificationType })
  type: NotificationType;

  @Prop({ required: true, trim: true, maxlength: 200 })
  title: string;

  @Prop({ required: true, trim: true, maxlength: 1000 })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recipient: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Group', required: false })
  group?: Types.ObjectId;

  @Prop({ default: false })
  is_read: boolean;

  @Prop({ type: Object, default: {} })
  related_data: Record<string, unknown>;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export type NotificationDocument = Notification & Document;
export const NotificationSchema = SchemaFactory.createForClass(Notification);
