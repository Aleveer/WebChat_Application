import { Types } from 'mongoose';

// Common database field types
export interface BaseDocument {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ID helpers
export type MongoId = Types.ObjectId | string;

// User ID types
export type UserId = string;
export type GroupId = string;
export type MessageId = string;
export type FileId = string;

// JWT Payload types
export interface JwtPayload {
  sub: string;
  phone_number: string;
  username?: string;
  email?: string;
  role?: string;
  permissions?: string[];
  iat?: number;
  exp?: number;
}

// User info type
export interface UserInfo {
  id?: string;
  _id?: Types.ObjectId;
  sub?: string;
  role?: string;
  permissions?: string[];
  groups?: string[];
  adminGroups?: string[];
  phone_number?: string;
  username?: string;
  email?: string;
  full_name?: string;
}

// Receiver types
export type ReceiverType = 'user' | 'group';
