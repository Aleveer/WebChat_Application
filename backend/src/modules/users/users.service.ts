import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto, UpdateUserDto, LoginDto } from './dto/create-users.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const user = new this.userModel(createUserDto);
      return await user.save();
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
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User> {
    const user = await this.userModel
      .findOne({ phone_number: phoneNumber })
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true, runValidators: true })
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('User not found');
    }
  }

  async login(loginDto: LoginDto): Promise<{ user: User; message: string }> {
    const user = await this.userModel
      .findOne({
        phone_number: loginDto.phone_number,
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
    const searchRegex = new RegExp(query, 'i');
    return this.userModel
      .find({
        $or: [
          { fullname: searchRegex },
          { username: searchRegex },
          { phone_number: searchRegex },
          { email: searchRegex },
        ],
      })
      .select('-password')
      .limit(20)
      .exec();
  }

  async getUserContacts(userId: string): Promise<User[]> {
    // This would typically involve getting users from groups or direct messages
    // For now, return all users except the current user
    return this.userModel
      .find({ _id: { $ne: userId } })
      .select('-password')
      .exec();
  }
}
