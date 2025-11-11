import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { APP_CONSTANTS } from '../../../common/constants/app.constants';
import { hash } from '@node-rs/bcrypt';
export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  _id?: string;

  @Prop({
    required: false,
    trim: true,
    maxlength: APP_CONSTANTS.USERS.MAX_NAME_LENGTH,
    match: APP_CONSTANTS.USERS.FULL_NAME_REGEX,
    message:
      'Full name must contain only letters and spaces (Unicode supported)',
  })
  full_name?: string;

  @Prop({
    required: false,
    unique: true,
    sparse: true,
    match: APP_CONSTANTS.USERS.PHONE_REGEX,
    message:
      'Phone number must be in international format (e.g., +84901234567)',
  })
  phone?: string;

  @Prop({
    required: false,
    unique: true,
    sparse: true,
    trim: true,
    maxlength: 50,
    match: APP_CONSTANTS.USERS.USERNAME_REGEX,
    message: 'Username must be alphanumeric and can contain underscores',
  })
  username?: string;

  @Prop({
    required: false,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
    match: APP_CONSTANTS.USERS.EMAIL_REGEX,
    message: 'Email must be a valid email address',
  })
  email?: string;

  @Prop({
    default: null,
    match: APP_CONSTANTS.USERS.PHOTO_REGEX,
    message: 'Profile photo must be a valid image URL',
  })
  photo?: string;

  @Prop({
    required: true,
    minlength: APP_CONSTANTS.USERS.MIN_PASSWORD_LENGTH,
    match: APP_CONSTANTS.USERS.PASSWORD_REGEX,
    message:
      'Password must contain only alphanumeric characters and special characters',
  })
  password: string;

  // Method to compare password
  // async comparePassword(candidatePassword: string): Promise<boolean> {
  //   return PasswordUtils.comparePassword(candidatePassword, this.password);
  // }
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add virtual id field
// UserSchema.virtual('id').get(function () {
//   return this._id.toHexString();
// });

// Ensure virtual fields are serialized
UserSchema.set('toJSON', {
  virtuals: true,
});

//Pre-save middleware to hash password
UserSchema.pre('save', async function (next) {
  // Hash password
  const saltRounds = 10;
  this.password = await hash(this.password, saltRounds);
  next();
});

// Indexes for faster queries
UserSchema.index({ phone: 1 });
UserSchema.index({ username: 1 }, { sparse: true });
UserSchema.index({ email: 1 }, { sparse: true });
