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
import {
  CreateUserDto,
  UpdateUserDto,
  LoginDto,
  ChangePasswordDto,
} from './dto/create-users.dto';
import { AnalyticsService } from '../analytics/analytics.service';
import { EventType } from '../analytics/schemas/analytics-event.schema';
import {
  createSafeRegex,
  sanitizePhoneNumber,
  sanitizeObjectId,
} from '../../common/utils/sanitization.utils';
import { PasswordUtils } from '../../common/utils/password.utils';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private analyticsService: AnalyticsService,
  ) {}

  async create(data: {
    username: string;
    email?: string;
    password: string;
    phone?: string;
    photo?: string;
    full_name?: string;
  }): Promise<User> {
    const { username, email, password, phone, photo, full_name } = data;
    console.log('username from service: ', username);

    // Validate that at least one identifier is provided
    if (!username && !email && !phone) {
      throw new BadRequestException(
        'At least one of username, email, or phone is required',
      );
    }

    // Check if username already exists
    if (username) {
      const existingUser = await this.userModel.findOne({ username });
      if (existingUser) {
        throw new ConflictException('Username already exists');
      }
    }

    // Check if email already exists
    if (email) {
      const existingEmail = await this.userModel.findOne({ email });
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    // Check if phone number already exists
    if (phone) {
      const existingPhone = await this.userModel.findOne({ phone });
      if (existingPhone) {
        throw new ConflictException('Phone number already exists');
      }
    }

    // Create new user
    const newUser = new this.userModel({
      username: username,
      password,
      email,
      phone,
      photo,
      full_name,
    });

    const savedUser = await newUser.save();

    return savedUser.toObject();
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
      .findOne({ phone: sanitizedPhone })
      .lean()
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
    const user = await this.userModel.findOne({ username }).lean().exec();
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userModel.findOne({ email }).lean().exec();
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Validate and sanitize ObjectId
    const sanitizedId = sanitizeObjectId(id);
    if (!sanitizedId) {
      throw new BadRequestException('Invalid user ID format');
    }

    // Check if updating username and it already exists
    if (updateUserDto.username) {
      const existingUser = await this.userModel.findOne({
        username: updateUserDto.username,
        _id: { $ne: sanitizedId },
      });
      if (existingUser) {
        throw new ConflictException('Username already exists');
      }
    }

    // Check if updating email and it already exists
    if (updateUserDto.email) {
      const existingEmail = await this.userModel.findOne({
        email: updateUserDto.email,
        _id: { $ne: sanitizedId },
      });
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    // Check if updating phone and it already exists
    if (updateUserDto.phone) {
      const existingPhone = await this.userModel.findOne({
        phone: updateUserDto.phone,
        _id: { $ne: sanitizedId },
      });
      if (existingPhone) {
        throw new ConflictException('Phone number already exists');
      }
    }

    // Get current user to validate email/phone requirement
    const currentUser = await this.userModel.findById(sanitizedId);
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    // Validate that at least one of email or phone will remain after update
    const updatedEmail =
      updateUserDto.email !== undefined
        ? updateUserDto.email
        : currentUser.email;
    const updatedPhone =
      updateUserDto.phone !== undefined
        ? updateUserDto.phone
        : currentUser.phone;

    if (!updatedEmail && !updatedPhone) {
      throw new BadRequestException(
        'At least one of email or phone number is required',
      );
    }

    // Prepare update operations
    const setFields: any = {};
    const unsetFields: any = {};

    // Separate fields to set vs unset
    Object.keys(updateUserDto).forEach((key) => {
      const value = updateUserDto[key];
      if (value === undefined || value === null) {
        unsetFields[key] = ''; // MongoDB $unset syntax
      } else {
        setFields[key] = value;
      }
    });

    // Build update object
    const updateOperation: any = {};
    if (Object.keys(setFields).length > 0) {
      updateOperation.$set = setFields;
    }
    if (Object.keys(unsetFields).length > 0) {
      updateOperation.$unset = unsetFields;
    }

    const user = await this.userModel
      .findByIdAndUpdate(sanitizedId, updateOperation, {
        new: true,
        runValidators: false, // Skip validators for null values
      })
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Track profile update
    await this.analyticsService.trackEvent({
      event_type: EventType.PROFILE_UPDATED,
      user_id: sanitizedId,
      metadata: { updated_fields: Object.keys(updateUserDto) },
    });

    return user;
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    // Validate and sanitize ObjectId
    const sanitizedId = sanitizeObjectId(userId);
    if (!sanitizedId) {
      throw new BadRequestException('Invalid user ID format');
    }

    const { currentPassword, newPassword } = changePasswordDto;

    // Validate current password:
    const user = await this.userModel
      .findById(sanitizedId)
      .select('+password')
      .lean()
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const isPasswordValid = await PasswordUtils.comparePassword(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Validate new password:
    const passwordValidation =
      PasswordUtils.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new BadRequestException({
        message: 'Password does not meet security requirements',
        feedback: passwordValidation.feedback,
      });
    }

    // Hash new password
    const hashedPassword = await PasswordUtils.hashPassword(newPassword);

    // Update password
    await this.userModel.findByIdAndUpdate(sanitizedId, {
      password: hashedPassword,
    });

    // Track password change
    await this.analyticsService.trackEvent({
      event_type: EventType.PASSWORD_CHANGED,
      user_id: sanitizedId,
      metadata: { timestamp: new Date() },
    });

    return { message: 'Password changed successfully' };
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

  async searchUsers(query: string): Promise<User[]> {
    // Use safe regex to prevent ReDoS and injection
    const safeRegex = createSafeRegex(query);

    return this.userModel
      .find({
        $or: [
          { full_name: safeRegex },
          { username: safeRegex },
          { phone: safeRegex },
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
