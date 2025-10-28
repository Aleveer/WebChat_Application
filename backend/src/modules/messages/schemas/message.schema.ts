import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

export enum ReceiverType {
  USER = 'user',
  GROUP = 'group',
}

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender_id: Types.ObjectId;

  @Prop({
    type: String,
    enum: ReceiverType,
    required: true,
  })
  receiver_type: ReceiverType;

  @Prop({ type: Types.ObjectId, required: true })
  receiver_id: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    maxlength: 1000,
    minlength: 1,
  })
  text: string;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;

  // Virtual field for sender info (populated)
  sender?: {
    _id: Types.ObjectId;
    full_name: string;
    phone_number: string;
    username?: string;
    email?: string;
    profile_photo?: string;
  };

  // Virtual field for receiver info (populated)
  receiver?: {
    _id: Types.ObjectId;
    name?: string; // for groups
    full_name?: string; // for users
    phone_number?: string; // for users
    username?: string; // for users
  };
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Ensure virtual fields are serialized
MessageSchema.set('toJSON', {
  virtuals: true,
});

// PERFORMANCE: Comprehensive indexing strategy for common queries
// 1. Compound index for message retrieval by receiver with time ordering
MessageSchema.index({ receiver_type: 1, receiver_id: 1, timestamp: -1 });

// 2. Index for sender's sent messages
MessageSchema.index({ sender_id: 1, timestamp: -1 });

// 3. Index for direct message conversations (bidirectional)
MessageSchema.index({
  sender_id: 1,
  receiver_id: 1,
  receiver_type: 1,
  timestamp: -1,
});

// 4. Standalone timestamp index for cleanup/archival operations
MessageSchema.index({ timestamp: -1 });
