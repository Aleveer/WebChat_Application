import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Group, GroupDocument } from './schemas/group.schema';
import {
  CreateGroupDto,
  UpdateGroupDto,
  AddMemberDto,
  RemoveMemberDto,
  SetAdminDto,
} from './dto/create-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
  ) {}

  async create(
    createGroupDto: CreateGroupDto,
    creatorId: string,
  ): Promise<Group> {
    const groupData = {
      ...createGroupDto,
      members: createGroupDto.members.map((member) => ({
        user_id: new Types.ObjectId(member.user_id),
        joined_at: new Date(),
        is_admin: member.is_admin || false,
        removed_at: null,
      })),
    };

    // Ensure creator is admin
    const creatorMember = groupData.members.find(
      (member) => member.user_id.toString() === creatorId,
    );
    if (creatorMember) {
      creatorMember.is_admin = true;
    } else {
      // Add creator as admin if not in members list
      groupData.members.push({
        user_id: new Types.ObjectId(creatorId),
        joined_at: new Date(),
        is_admin: true,
        removed_at: null,
      });
    }

    const group = new this.groupModel(groupData);
    return await group.save();
  }

  async findAll(): Promise<Group[]> {
    return this.groupModel
      .find()
      .populate('members.user_id', 'full_name username email phone photo')
      .exec();
  }

  async findOne(id: string): Promise<Group> {
    const group = await this.groupModel
      .findById(id)
      .populate('members.user_id', 'full_name username email phone photo')
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

    if (!group.isAdmin(new Types.ObjectId(userId))) {
      throw new ForbiddenException(
        'Only group admins can update group details',
      );
    }

    const updatedGroup = await this.groupModel
      .findByIdAndUpdate(id, updateGroupDto, { new: true, runValidators: true })
      .populate('members.user_id', 'full_name username email phone photo')
      .exec();

    return updatedGroup;
  }

  async remove(id: string, userId: string): Promise<void> {
    const group = await this.groupModel.findById(id).exec();
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (!group.isAdmin(new Types.ObjectId(userId))) {
      throw new ForbiddenException('Only group admins can delete the group');
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

    if (!group.isAdmin(new Types.ObjectId(userId))) {
      throw new ForbiddenException('Only group admins can add members');
    }

    const memberUserId = new Types.ObjectId(addMemberDto.user_id);

    // Check if user is already a member
    if (group.isMember(memberUserId)) {
      throw new BadRequestException('User is already a member of this group');
    }

    group.addMember(memberUserId, addMemberDto.is_admin || false);
    await group.save();

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

    const requesterId = new Types.ObjectId(userId);
    const memberUserId = new Types.ObjectId(removeMemberDto.user_id);

    // Users can remove themselves, or admins can remove anyone
    if (!requesterId.equals(memberUserId) && !group.isAdmin(requesterId)) {
      throw new ForbiddenException(
        'You can only remove yourself or be an admin to remove others',
      );
    }

    // Admins cannot remove other admins (except themselves)
    if (!requesterId.equals(memberUserId) && group.isAdmin(memberUserId)) {
      throw new ForbiddenException('Cannot remove other admins');
    }

    const success = group.removeMember(memberUserId);
    if (!success) {
      throw new BadRequestException(
        'User is not an active member of this group',
      );
    }

    await group.save();
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

    if (!group.isAdmin(new Types.ObjectId(userId))) {
      throw new ForbiddenException('Only group admins can change admin status');
    }

    const memberUserId = new Types.ObjectId(setAdminDto.user_id);
    const success = group.setAdmin(memberUserId, setAdminDto.is_admin);

    if (!success) {
      throw new BadRequestException(
        'User is not an active member of this group',
      );
    }

    await group.save();
    return this.findOne(groupId);
  }

  async getGroupMembers(groupId: string, userId: string): Promise<Group> {
    const group = await this.groupModel.findById(groupId).exec();
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (!group.isMember(new Types.ObjectId(userId))) {
      throw new ForbiddenException('You are not a member of this group');
    }

    return this.findOne(groupId);
  }
}
