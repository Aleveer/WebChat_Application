import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GroupDocument = Group & Document;

@Schema({ _id: false })
export class GroupMember {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  joined_at: Date;

  @Prop({ type: Boolean, default: false })
  is_admin: boolean;

  @Prop({ type: Date, default: null })
  removed_at: Date | null;
}

@Schema({ timestamps: true })
export class Group {
  @Prop({ required: true, trim: true, maxlength: 100 })
  name: string;

  @Prop({ type: [GroupMember], required: true, minlength: 1 })
  members: GroupMember[];

  @Prop({ type: Date, default: Date.now })
  created_at: Date;

  // Virtual field for active members count
  get active_members_count(): number {
    return this.members.filter((member) => member.removed_at === null).length;
  }

  // Method to check if user is member
  isMember(userId: Types.ObjectId): boolean {
    return this.members.some(
      (member) => member.user_id.equals(userId) && member.removed_at === null,
    );
  }

  // Method to check if user is admin
  isAdmin(userId: Types.ObjectId): boolean {
    return this.members.some(
      (member) =>
        member.user_id.equals(userId) &&
        member.is_admin === true &&
        member.removed_at === null,
    );
  }

  // Method to add member
  addMember(userId: Types.ObjectId, isAdmin: boolean = false): void {
    const existingMember = this.members.find((member) =>
      member.user_id.equals(userId),
    );

    if (existingMember) {
      // If user was removed before, reactivate them
      if (existingMember.removed_at) {
        existingMember.removed_at = null;
        existingMember.joined_at = new Date();
        existingMember.is_admin = isAdmin;
      }
    } else {
      this.members.push({
        user_id: userId,
        joined_at: new Date(),
        is_admin: isAdmin,
        removed_at: null,
      });
    }
  }

  // Method to remove member
  removeMember(userId: Types.ObjectId): boolean {
    const member = this.members.find((member) => member.user_id.equals(userId));
    if (member && member.removed_at === null) {
      member.removed_at = new Date();
      return true;
    }
    return false;
  }

  // Method to promote/demote admin
  setAdmin(userId: Types.ObjectId, isAdmin: boolean): boolean {
    const member = this.members.find(
      (member) => member.user_id.equals(userId) && member.removed_at === null,
    );
    if (member) {
      member.is_admin = isAdmin;
      return true;
    }
    return false;
  }
}

export const GroupSchema = SchemaFactory.createForClass(Group);

// Add virtual field to schema
GroupSchema.virtual('active_members_count').get(function () {
  return this.members.filter((member) => member.removed_at === null).length;
});

// Ensure virtual fields are serialized
GroupSchema.set('toJSON', {
  virtuals: true,
});

// Index for faster queries
GroupSchema.index({ 'members.user_id': 1 });
GroupSchema.index({ created_at: -1 });
