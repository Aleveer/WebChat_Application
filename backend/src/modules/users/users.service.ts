import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto, UpdateUserDto, LoginDto } from './dto/create-users.dto';
import { AnalyticsService } from '../analytics/analytics.service';
import { EventType } from '../analytics/schemas/analytics-event.schema';
import {
  createSafeRegex,
  sanitizePhoneNumber,
  sanitizeObjectId,
} from '../../common/utils/sanitization.utils';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private analyticsService: AnalyticsService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const user = new this.userModel(createUserDto);
      const savedUser = await user.save();

      // Track user registration
      await this.analyticsService.trackEvent({
        event_type: 'user_register' as EventType,
        user_id: savedUser._id.toString(),
        metadata: { registration_method: 'phone' },
      });

      return savedUser;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Phone number already exists');
      }
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-password').exec();
  }

  async findOne(id: string): Promise<User> {
    // Validate and sanitize ObjectId
    const sanitizedId = sanitizeObjectId(id);
    if (!sanitizedId) {
      throw new BadRequestException('Invalid user ID format');
    }

    const user = await this.userModel
      .findById(sanitizedId)
      .select('-password')
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    // Sanitize phone number to prevent injection
    const sanitizedPhone = sanitizePhoneNumber(phoneNumber);
    if (!sanitizedPhone) {
      return null; // Return null for invalid format (consistent with findByUsername)
    }

    const user = await this.userModel
      .findOne({ phone_number: sanitizedPhone })
      .exec();

    return user;
  }

  /**
   * Find user by phone number (throws exception if not found)
   * Use this for operations that require user to exist
   */
  async findByPhoneNumberOrFail(phoneNumber: string): Promise<User> {
    const user = await this.findByPhoneNumber(phoneNumber);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Validate and sanitize ObjectId
    const sanitizedId = sanitizeObjectId(id);
    if (!sanitizedId) {
      throw new BadRequestException('Invalid user ID format');
    }

    const user = await this.userModel
      .findByIdAndUpdate(sanitizedId, updateUserDto, {
        new: true,
        runValidators: true,
      })
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Track profile update
    await this.analyticsService.trackEvent({
      event_type: 'profile_updated' as EventType,
      user_id: sanitizedId,
      metadata: { updated_fields: Object.keys(updateUserDto) },
    });

    return user;
  }

  async remove(id: string): Promise<void> {
    // Validate and sanitize ObjectId
    const sanitizedId = sanitizeObjectId(id);
    if (!sanitizedId) {
      throw new BadRequestException('Invalid user ID format');
    }

    const result = await this.userModel.findByIdAndDelete(sanitizedId).exec();
    if (!result) {
      throw new NotFoundException('User not found');
    }
  }

  async login(loginDto: LoginDto): Promise<{ user: User; message: string }> {
    // Sanitize phone number to prevent injection
    const sanitizedPhone = sanitizePhoneNumber(loginDto.phone_number);
    if (!sanitizedPhone) {
      throw new BadRequestException('Invalid phone number format');
    }

    const user = await this.userModel
      .findOne({
        phone_number: sanitizedPhone,
      })
      .exec();

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await user.comparePassword(loginDto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Return user without password
    const userWithoutPassword = await this.userModel
      .findById(user._id)
      .select('-password')
      .exec();

    if (!userWithoutPassword) {
      throw new UnauthorizedException('User not found');
    }

    return {
      user: userWithoutPassword,
      message: 'Login successful',
    };
  }

  async searchUsers(query: string): Promise<User[]> {
    // Use safe regex to prevent ReDoS and injection
    const safeRegex = createSafeRegex(query);

    return this.userModel
      .find({
        $or: [
          { full_name: safeRegex },
          { username: safeRegex },
          { phone_number: safeRegex },
          { email: safeRegex },
        ],
      })
      .select('-password')
      .limit(20)
      .exec();
  }

  async getUserContacts(userId: string): Promise<User[]> {
    // Validate and sanitize ObjectId
    const sanitizedId = sanitizeObjectId(userId);
    if (!sanitizedId) {
      throw new BadRequestException('Invalid user ID format');
    }

    // This would typically involve getting users from groups or direct messages
    // For now, return all users except the current user
    return this.userModel
      .find({ _id: { $ne: sanitizedId } })
      .select('-password')
      .exec();
  }
}
