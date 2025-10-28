import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, LoginDto } from './dto/create-users.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.auth.guard';
import { RateLimitGuard } from '../../common/guards/ratelimit.guards';
import { Public } from '../../common/decorators/custom.decorators';

@Controller('users')
@UseGuards(JwtAuthGuard, RateLimitGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return {
      success: true,
      message: 'User created successfully',
      data: user,
    };
  }

  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return {
      success: true,
      data: users,
    };
  }

  @Get('search')
  async searchUsers(@Query('q') query: string) {
    if (!query) {
      return {
        success: true,
        data: [],
      };
    }

    const users = await this.usersService.searchUsers(query);
    return {
      success: true,
      data: users,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return {
      success: true,
      data: user,
    };
  }

  @Get('phone/:phoneNumber')
  async findByPhoneNumber(@Param('phoneNumber') phoneNumber: string) {
    const user = await this.usersService.findByPhoneNumber(phoneNumber);
    return {
      success: true,
      data: user,
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);
    return {
      success: true,
      message: 'User updated successfully',
      data: user,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return {
      success: true,
      message: 'User deleted successfully',
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const result = await this.usersService.login(loginDto);
    return {
      success: true,
      message: result.message,
      data: result.user,
    };
  }

  @Get(':id/contacts')
  async getUserContacts(@Param('id') id: string) {
    const contacts = await this.usersService.getUserContacts(id);
    return {
      success: true,
      data: contacts,
    };
  }
}
