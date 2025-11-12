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

  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: false })
  conversation_id?: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  created_at: Date;

  get active_members_count(): number {
    return this.members.filter((member) => member.removed_at === null).length;
  }

  isMember(userId: Types.ObjectId): boolean {
    return this.members.some(
      (member) => member.user_id.equals(userId) && member.removed_at === null,
    );
  }

  isAdmin(userId: Types.ObjectId): boolean {
    return this.members.some(
      (member) =>
        member.user_id.equals(userId) &&
        member.is_admin === true &&
        member.removed_at === null,
    );
  }

  addMember(userId: Types.ObjectId, isAdmin: boolean = false): void {
    const existingMember = this.members.find((member) =>
      member.user_id.equals(userId),
    );

    if (existingMember) {
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

  removeMember(userId: Types.ObjectId): boolean {
    const member = this.members.find((member) => member.user_id.equals(userId));
    if (member && member.removed_at === null) {
      member.removed_at = new Date();
      return true;
    }
    return false;
  }

  activeAdminCount(): number {
    return this.members.filter(
      (member) => member.removed_at === null && member.is_admin,
    ).length;
  }

  getActiveMembers(): Types.ObjectId[] {
    return this.members
      .filter((member) => member.removed_at === null)
      .map((member) => member.user_id);
  }

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

GroupSchema.virtual('active_members_count').get(function () {
  return this.members.filter((member) => member.removed_at === null).length;
});

GroupSchema.set('toJSON', {
  virtuals: true,
});

GroupSchema.index({ 'members.user_id': 1, 'members.removed_at': 1 });
GroupSchema.index({ created_at: -1 });
GroupSchema.index({
  'members.user_id': 1,
  'members.is_admin': 1,
  'members.removed_at': 1,
});
GroupSchema.index({ name: 'text' });
