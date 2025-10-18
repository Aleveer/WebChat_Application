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
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import {
  CreateGroupDto,
  UpdateGroupDto,
  AddMemberDto,
  RemoveMemberDto,
  SetAdminDto,
} from './dto/create-group.dto';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createGroupDto: CreateGroupDto,
    @Query('creatorId') creatorId: string,
  ) {
    if (!creatorId) {
      return {
        success: false,
        message: 'Creator ID is required',
      };
    }

    const group = await this.groupsService.create(createGroupDto, creatorId);
    return {
      success: true,
      message: 'Group created successfully',
      data: group,
    };
  }

  @Get()
  async findAll() {
    const groups = await this.groupsService.findAll();
    return {
      success: true,
      data: groups,
    };
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId') userId: string) {
    const groups = await this.groupsService.findByUserId(userId);
    return {
      success: true,
      data: groups,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const group = await this.groupsService.findOne(id);
    return {
      success: true,
      data: group,
    };
  }

  @Get(':id/members')
  async getGroupMembers(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ) {
    if (!userId) {
      return {
        success: false,
        message: 'User ID is required',
      };
    }

    const group = await this.groupsService.getGroupMembers(id, userId);
    return {
      success: true,
      data: group,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateGroupDto: UpdateGroupDto,
    @Query('userId') userId: string,
  ) {
    if (!userId) {
      return {
        success: false,
        message: 'User ID is required',
      };
    }

    const group = await this.groupsService.update(id, updateGroupDto, userId);
    return {
      success: true,
      message: 'Group updated successfully',
      data: group,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Query('userId') userId: string) {
    if (!userId) {
      return {
        success: false,
        message: 'User ID is required',
      };
    }

    await this.groupsService.remove(id, userId);
    return {
      success: true,
      message: 'Group deleted successfully',
    };
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.OK)
  async addMember(
    @Param('id') id: string,
    @Body() addMemberDto: AddMemberDto,
    @Query('userId') userId: string,
  ) {
    if (!userId) {
      return {
        success: false,
        message: 'User ID is required',
      };
    }

    const group = await this.groupsService.addMember(id, addMemberDto, userId);
    return {
      success: true,
      message: 'Member added successfully',
      data: group,
    };
  }

  @Delete(':id/members')
  @HttpCode(HttpStatus.OK)
  async removeMember(
    @Param('id') id: string,
    @Body() removeMemberDto: RemoveMemberDto,
    @Query('userId') userId: string,
  ) {
    if (!userId) {
      return {
        success: false,
        message: 'User ID is required',
      };
    }

    const group = await this.groupsService.removeMember(
      id,
      removeMemberDto,
      userId,
    );
    return {
      success: true,
      message: 'Member removed successfully',
      data: group,
    };
  }

  @Patch(':id/admin')
  @HttpCode(HttpStatus.OK)
  async setAdmin(
    @Param('id') id: string,
    @Body() setAdminDto: SetAdminDto,
    @Query('userId') userId: string,
  ) {
    if (!userId) {
      return {
        success: false,
        message: 'User ID is required',
      };
    }

    const group = await this.groupsService.setAdmin(id, setAdminDto, userId);
    return {
      success: true,
      message: 'Admin status updated successfully',
      data: group,
    };
  }
}
