import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import {
  CreateGroupDto,
  UpdateGroupDto,
  AddMemberDto,
  RemoveMemberDto,
  SetAdminDto,
} from './dto/create-group.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.auth.guard';
import { RateLimitGuard } from '../../common/guards/ratelimit.guards';
import { ResponseUtils } from '../../common/utils/response.utils';

@Controller('groups')
@UseGuards(JwtAuthGuard, RateLimitGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createGroupDto: CreateGroupDto, @Request() req) {
    const creatorId = req.user?.sub || req.user?._id;

    const group = await this.groupsService.create(createGroupDto, creatorId);
    return ResponseUtils.success(group, 'Group created successfully');
  }

  @Get()
  async findAll() {
    const groups = await this.groupsService.findAll();
    return ResponseUtils.success(groups);
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId') userId: string) {
    const groups = await this.groupsService.findByUserId(userId);
    return ResponseUtils.success(groups);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const group = await this.groupsService.findOne(id);
    return ResponseUtils.success(group);
  }

  @Get(':id/members')
  async getGroupMembers(@Param('id') id: string, @Request() req) {
    const userId = req.user?.sub || req.user?._id;

    const group = await this.groupsService.getGroupMembers(id, userId);
    return ResponseUtils.success(group);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateGroupDto: UpdateGroupDto,
    @Request() req,
  ) {
    const userId = req.user?.sub || req.user?._id;

    const group = await this.groupsService.update(id, updateGroupDto, userId);
    return ResponseUtils.success(group, 'Group updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Request() req) {
    const userId = req.user?.sub || req.user?._id;

    await this.groupsService.remove(id, userId);
    return ResponseUtils.success(null, 'Group deleted successfully');
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.OK)
  async addMember(
    @Param('id') id: string,
    @Body() addMemberDto: AddMemberDto,
    @Request() req,
  ) {
    const userId = req.user?.sub || req.user?._id;

    const group = await this.groupsService.addMember(id, addMemberDto, userId);
    return ResponseUtils.success(group, 'Member added successfully');
  }

  @Delete(':id/members')
  @HttpCode(HttpStatus.OK)
  async removeMember(
    @Param('id') id: string,
    @Body() removeMemberDto: RemoveMemberDto,
    @Request() req,
  ) {
    const userId = req.user?.sub || req.user?._id;

    const group = await this.groupsService.removeMember(
      id,
      removeMemberDto,
      userId,
    );
    return ResponseUtils.success(group, 'Member removed successfully');
  }

  @Patch(':id/admin')
  @HttpCode(HttpStatus.OK)
  async setAdmin(
    @Param('id') id: string,
    @Body() setAdminDto: SetAdminDto,
    @Request() req,
  ) {
    const userId = req.user?.sub || req.user?._id;

    const group = await this.groupsService.setAdmin(id, setAdminDto, userId);
    return ResponseUtils.success(group, 'Admin status updated successfully');
  }
}
