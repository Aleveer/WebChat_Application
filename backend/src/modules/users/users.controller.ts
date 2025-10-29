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
import { ThrottleGuard } from '../../common/guards/throttle.guards';
import { Public } from '../../common/decorators/custom.decorators';
import { ResponseUtils } from '../../common/utils/response.utils';

@Controller('users')
@UseGuards(JwtAuthGuard, ThrottleGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return ResponseUtils.success(user, 'User created successfully');
  }

  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return ResponseUtils.success(users);
  }

  @Get('search')
  async searchUsers(@Query('q') query: string) {
    if (!query) {
      return ResponseUtils.success([]);
    }

    const users = await this.usersService.searchUsers(query);
    return ResponseUtils.success(users);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return ResponseUtils.success(user);
  }

  @Get('phone/:phoneNumber')
  async findByPhoneNumber(@Param('phoneNumber') phoneNumber: string) {
    const user = await this.usersService.findByPhoneNumber(phoneNumber);
    return ResponseUtils.success(user);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);
    return ResponseUtils.success(user, 'User updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return ResponseUtils.success(null, 'User deleted successfully');
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const result = await this.usersService.login(loginDto);
    return ResponseUtils.success(result.user, result.message);
  }

  @Get(':id/contacts')
  async getUserContacts(@Param('id') id: string) {
    const contacts = await this.usersService.getUserContacts(id);
    return ResponseUtils.success(contacts);
  }
}
