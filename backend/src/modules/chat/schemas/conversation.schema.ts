import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Conversation extends Document {
  @Prop({ type: [Types.ObjectId], ref: 'User', required: true })
  participants: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Group' })
  groupId?: Types.ObjectId;

  @Prop({ type: String, enum: ['direct', 'group'], default: 'direct' })
  type: string;

  // Last message info (denormalized for performance)
  @Prop({ type: Object })
  lastMessage: {
    content: string;
    senderId: Types.ObjectId;
    senderName?: string;
    type: string;
    createdAt?: Date;
  };

  @Prop({ type: Date })
  lastMessageAt: Date;

  // Unread count per user
  @Prop({ type: Map, of: Number, default: {} })
  unreadCount: Map<string, number>;

  // For soft delete
  @Prop({ default: false })
  isDeleted: boolean;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Indexes for performance
ConversationSchema.index({ participants: 1, lastMessageAt: -1 });
ConversationSchema.index({ type: 1, lastMessageAt: -1 });
ConversationSchema.index({ groupId: 1 });
