import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Group, GroupDocument, GroupMember } from './schemas/group.schema';
import {
  CreateGroupDto,
  UpdateGroupDto,
  AddMemberDto,
  RemoveMemberDto,
  SetAdminDto,
} from './dto/create-group.dto';
import { Conversation } from '../chat/schemas/conversation.schema';

@Injectable()
export class GroupsService {
  constructor(
    @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<Conversation>,
  ) {}

  async create(
    createGroupDto: CreateGroupDto,
    creatorId: string,
  ): Promise<Group> {
    const uniqueMemberTracker = new Set<string>();
    const normalizedMembers = createGroupDto.members.map((member) => {
      if (uniqueMemberTracker.has(member.user_id)) {
        throw new BadRequestException('Duplicate members are not allowed');
      }
      uniqueMemberTracker.add(member.user_id);
      return member;
    });

    if (normalizedMembers.length < 3 || normalizedMembers.length > 100) {
      throw new BadRequestException(
        'Group must have between 3 and 100 members',
      );
    }

    const groupMembers = normalizedMembers.map((member) => ({
      user_id: new Types.ObjectId(member.user_id),
      joined_at: new Date(),
      is_admin: member.is_admin || false,
      removed_at: null,
    }));

    const creatorObjectId = new Types.ObjectId(creatorId);
    const creatorMember = groupMembers.find((member) =>
      member.user_id.equals(creatorObjectId),
    );
    if (creatorMember) {
      creatorMember.is_admin = true;
    } else {
      groupMembers.push({
        user_id: creatorObjectId,
        joined_at: new Date(),
        is_admin: true,
        removed_at: null,
      });
    }

    if (groupMembers.length < 3 || groupMembers.length > 100) {
      throw new BadRequestException(
        'Group must have between 3 and 100 members including the creator',
      );
    }

    const group = new this.groupModel({
      ...createGroupDto,
      members: groupMembers,
    });

    const savedGroup = await group.save();
    const activeParticipantIds = this.getActiveMemberIds(savedGroup.members);

    const conversation = await this.conversationModel.create({
      participants: activeParticipantIds,
      groupId: savedGroup._id,
      type: 'group',
      unreadCount: new Map(),
    });

    savedGroup.conversation_id = conversation._id as Types.ObjectId;
    await savedGroup.save();

    return this.findOne(savedGroup._id.toString());
  }

  async findAll(): Promise<Group[]> {
    return this.groupModel
      .find()
      .populate('members.user_id', 'full_name username email phone photo')
      .populate('conversation_id', 'type participants groupId')
      .exec();
  }

  async findOne(id: string): Promise<Group> {
    const group = await this.groupModel
      .findById(id)
      .populate('members.user_id', 'full_name username email phone photo')
      .populate('conversation_id', 'type participants groupId')
      .exec();

    if (!group) {
      throw new NotFoundException('Group not found');
    }
    return group;
  }

  async findByUserId(userId: string): Promise<Group[]> {
    return this.groupModel
      .find({
        'members.user_id': new Types.ObjectId(userId),
        'members.removed_at': null,
      })
      .populate('members.user_id', 'full_name username email phone photo')
      .populate('conversation_id', 'type participants groupId')
      .exec();
  }

  async update(
    id: string,
    updateGroupDto: UpdateGroupDto,
    userId: string,
  ): Promise<Group> {
    const group = await this.groupModel.findById(id).exec();
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const groupDoc = group as any as GroupDocument;
    const requesterId = new Types.ObjectId(userId);
    if (!this.isAdmin(groupDoc, requesterId)) {
      throw new ForbiddenException(
        'Only group admins can update group details',
      );
    }

    if (updateGroupDto.name !== undefined) {
      groupDoc.name = updateGroupDto.name;
    }

    await groupDoc.save();

    return this.findOne(id);
  }

  async remove(id: string, userId: string): Promise<void> {
    const group = await this.groupModel.findById(id).exec();
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const groupDoc = group as any as GroupDocument;
    const requesterId = new Types.ObjectId(userId);
    if (!this.isAdmin(groupDoc, requesterId)) {
      throw new ForbiddenException('Only group admins can delete the group');
    }

    if (groupDoc.conversation_id) {
      await this.conversationModel.findByIdAndDelete(groupDoc.conversation_id);
    }

    await this.groupModel.findByIdAndDelete(id).exec();
  }

  async addMember(
    groupId: string,
    addMemberDto: AddMemberDto,
    userId: string,
  ): Promise<Group> {
    const group = await this.groupModel.findById(groupId).exec();
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const groupDoc = group as any as GroupDocument;
    const requesterId = new Types.ObjectId(userId);
    if (!this.isAdmin(groupDoc, requesterId)) {
      throw new ForbiddenException('Only group admins can add members');
    }

    const memberUserId = new Types.ObjectId(addMemberDto.user_id);

    if (this.countActiveMembers(groupDoc) >= 100) {
      throw new BadRequestException('Group member limit reached');
    }

    if (this.isActiveMember(groupDoc, memberUserId)) {
      throw new BadRequestException('User is already a member of this group');
    }

    try {
      this.addMemberToGroup(
        groupDoc,
        memberUserId,
        addMemberDto.is_admin || false,
      );
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }

    await groupDoc.save();

    if (groupDoc.conversation_id) {
      await this.conversationModel.findByIdAndUpdate(groupDoc.conversation_id, {
        $addToSet: { participants: memberUserId },
      });
    } else {
      const conversation = await this.conversationModel.create({
        participants: this.getActiveMemberIds(groupDoc.members),
        groupId: groupDoc._id,
        type: 'group',
        unreadCount: new Map(),
      });
      groupDoc.conversation_id = conversation._id as Types.ObjectId;
      await groupDoc.save();
    }

    return this.findOne(groupId);
  }

  async removeMember(
    groupId: string,
    removeMemberDto: RemoveMemberDto,
    userId: string,
  ): Promise<Group> {
    const group = await this.groupModel.findById(groupId).exec();
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const groupDoc = group as any as GroupDocument;
    const requesterId = new Types.ObjectId(userId);
    const memberUserId = new Types.ObjectId(removeMemberDto.user_id);

    if (
      !requesterId.equals(memberUserId) &&
      !this.isAdmin(groupDoc, requesterId)
    ) {
      throw new ForbiddenException(
        'You can only remove yourself or be an admin to remove others',
      );
    }

    if (
      !requesterId.equals(memberUserId) &&
      this.isAdmin(groupDoc, memberUserId)
    ) {
      throw new ForbiddenException('Cannot remove other admins');
    }

    if (
      this.isAdmin(groupDoc, memberUserId) &&
      this.countActiveAdmins(groupDoc) <= 1
    ) {
      throw new ForbiddenException('Cannot remove the last remaining admin');
    }

    const success = this.removeMemberFromGroup(groupDoc, memberUserId);
    if (!success) {
      throw new BadRequestException(
        'User is not an active member of this group',
      );
    }

    await groupDoc.save();

    if (groupDoc.conversation_id) {
      await this.conversationModel.findByIdAndUpdate(groupDoc.conversation_id, {
        $pull: { participants: memberUserId },
      });
    }

    return this.findOne(groupId);
  }

  async setAdmin(
    groupId: string,
    setAdminDto: SetAdminDto,
    userId: string,
  ): Promise<Group> {
    const group = await this.groupModel.findById(groupId).exec();
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const groupDoc = group as any as GroupDocument;
    const requesterId = new Types.ObjectId(userId);
    if (!this.isAdmin(groupDoc, requesterId)) {
      throw new ForbiddenException('Only group admins can change admin status');
    }

    const memberUserId = new Types.ObjectId(setAdminDto.user_id);

    if (
      this.isAdmin(groupDoc, memberUserId) &&
      this.countActiveAdmins(groupDoc) <= 1 &&
      !setAdminDto.is_admin
    ) {
      throw new ForbiddenException('Cannot remove the last remaining admin');
    }

    if (
      !memberUserId.equals(requesterId) &&
      this.isAdmin(groupDoc, memberUserId) &&
      !setAdminDto.is_admin
    ) {
      throw new ForbiddenException('Cannot demote another admin');
    }

    const success = this.setAdminStatus(
      groupDoc,
      memberUserId,
      setAdminDto.is_admin,
    );

    if (!success) {
      throw new BadRequestException(
        'User is not an active member of this group',
      );
    }

    await groupDoc.save();

    if (setAdminDto.is_admin && groupDoc.conversation_id) {
      await this.conversationModel.findByIdAndUpdate(groupDoc.conversation_id, {
        $addToSet: { participants: memberUserId },
      });
    }

    return this.findOne(groupId);
  }

  async getGroupMembers(groupId: string, userId: string): Promise<Group> {
    const group = await this.groupModel.findById(groupId).exec();
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const groupDoc = group as any as GroupDocument;
    if (!this.isActiveMember(groupDoc, new Types.ObjectId(userId))) {
      throw new ForbiddenException('You are not a member of this group');
    }

    return this.findOne(groupId);
  }

  private getActiveMemberIds(members: GroupMember[]): Types.ObjectId[] {
    return members
      .filter((member) => member.removed_at === null)
      .map((member) => member.user_id as Types.ObjectId);
  }

  private findMember(group: GroupDocument, userId: Types.ObjectId) {
    return group.members.find((member) => member.user_id.equals(userId));
  }

  private isMemberActive(member: GroupMember) {
    return member.removed_at === null;
  }

  private isActiveMember(
    group: GroupDocument,
    userId: Types.ObjectId,
  ): boolean {
    const member = this.findMember(group, userId);
    return !!member && this.isMemberActive(member);
  }

  private isAdmin(group: GroupDocument, userId: Types.ObjectId): boolean {
    const member = this.findMember(group, userId);
    return !!member && this.isMemberActive(member) && member.is_admin === true;
  }

  private countActiveMembers(group: GroupDocument): number {
    return group.members.filter((member) => this.isMemberActive(member)).length;
  }

  private countActiveAdmins(group: GroupDocument): number {
    return group.members.filter(
      (member) => this.isMemberActive(member) && member.is_admin,
    ).length;
  }

  private addMemberToGroup(
    group: GroupDocument,
    userId: Types.ObjectId,
    isAdmin: boolean,
  ) {
    const existingMember = this.findMember(group, userId);

    if (existingMember) {
      if (!this.isMemberActive(existingMember)) {
        existingMember.removed_at = null;
        existingMember.joined_at = new Date();
        existingMember.is_admin = isAdmin;
        group.markModified('members');
      }

      return;
    }

    group.members.push({
      user_id: userId,
      joined_at: new Date(),
      is_admin: isAdmin,
      removed_at: null,
    });
    group.markModified('members');
  }

  private removeMemberFromGroup(
    group: GroupDocument,
    userId: Types.ObjectId,
  ): boolean {
    const member = this.findMember(group, userId);
    if (member && this.isMemberActive(member)) {
      member.removed_at = new Date();
      group.markModified('members');
      return true;
    }
    return false;
  }

  private setAdminStatus(
    group: GroupDocument,
    userId: Types.ObjectId,
    isAdmin: boolean,
  ): boolean {
    const member = this.findMember(group, userId);
    if (member && this.isMemberActive(member)) {
      member.is_admin = isAdmin;
      group.markModified('members');
      return true;
    }
    return false;
  }
}
