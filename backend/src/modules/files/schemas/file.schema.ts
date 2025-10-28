import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class File {
  @Prop({ required: true, trim: true })
  original_name: string;

  @Prop({ required: true, trim: true })
  file_name: string;

  @Prop({ required: true, trim: true })
  file_path: string;

  @Prop({ required: true, trim: true })
  file_url: string;

  @Prop({ required: true })
  file_size: number;

  @Prop({ required: true, trim: true })
  mime_type: string;

  @Prop({ required: true, enum: FileType })
  file_type: FileType;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploaded_by: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, unknown>;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export type FileDocument = File & Document;
export const FileSchema = SchemaFactory.createForClass(File);
