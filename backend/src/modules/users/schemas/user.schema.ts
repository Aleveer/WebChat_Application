import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { APP_CONSTANTS } from '../../../common/constants/app.constants';
import { PasswordUtils } from '../../../common/utils/password.utils';
import * as bcrypt from 'bcrypt';
export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  _id?: string;
  @Prop({
    required: true,
    unique: true,
    match: APP_CONSTANTS.USERS.PHONE_REGEX,
    message:
      'Phone number must be in international format (e.g., +84901234567)',
  })
  phone_number: string;

  @Prop({
    required: false,
    unique: true,
    sparse: true,
    trim: true,
    maxlength: 50,
    match: APP_CONSTANTS.USERS.USERNAME_REGEX,
    message: 'Username must be alphanumeric and can contain underscores',
  })
  user_name?: string;

  // @Prop({
  //   required: false,
  //   unique: true,
  //   sparse: true,
  //   trim: true,
  //   lowercase: true,
  //   match: APP_CONSTANTS.USERS.EMAIL_REGEX,
  //   message: 'Email must be a valid email address',
  // })
  // email?: string;

  @Prop({
    default: null,
    match: APP_CONSTANTS.USERS.PROFILE_PHOTO_REGEX,
    message: 'Profile photo must be a valid image URL',
  })
  profile_photo?: string;

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
  const hashedPassword = await bcrypt.hash(this.password, saltRounds);
  next()
});

// Indexes for faster queries
UserSchema.index({ phone_number: 1 });
UserSchema.index({ username: 1 }, { sparse: true });
//UserSchema.index({ email: 1 }, { sparse: true });
