import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum EventType {
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_REGISTER = 'user_register',
  MESSAGE_SENT = 'message_sent',
  MESSAGE_RECEIVED = 'message_received',
  GROUP_CREATED = 'group_created',
  GROUP_JOINED = 'group_joined',
  GROUP_LEFT = 'group_left',
  FILE_UPLOADED = 'file_uploaded',
  FILE_DOWNLOADED = 'file_downloaded',
  NOTIFICATION_SENT = 'notification_sent',
  NOTIFICATION_READ = 'notification_read',
  PROFILE_UPDATED = 'profile_updated',
  SETTINGS_CHANGED = 'settings_changed',
}

@Schema({ timestamps: true })
export class AnalyticsEvent {
  @Prop({ required: true, enum: EventType })
  event_type: EventType;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, unknown>;

  @Prop({ trim: true })
  session_id?: string;

  @Prop({ trim: true })
  ip_address?: string;

  @Prop({ trim: true })
  user_agent?: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export type AnalyticsEventDocument = AnalyticsEvent & Document;
export const AnalyticsEventSchema =
  SchemaFactory.createForClass(AnalyticsEvent);
