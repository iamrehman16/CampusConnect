import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Roles } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';
import { HydratedDocument } from 'mongoose';

@Schema({
  timestamps: true,
  toJSON: {
    transform(doc, ret: any) {
      delete ret.password;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ default: '' })
  name?: string;

  @Prop({ default: null, select: false })
  hashedRefreshToken?: string;

  @Prop({ default: Roles.STUDENT, type: String, enum: Roles })
  role: Roles;

  @Prop({ required: false }) //bio
  academicInfo?: string;

  @Prop({ default: 0 })
  contributionScore: number;

  @Prop({ default: UserStatus.ACTIVE, enum: UserStatus, type: String })
  accountStatus: UserStatus;

  @Prop({ required: false, min: 1, max: 8 })
  semester?: number;

  @Prop({ required: false })
  department?: string;

  @Prop({ required: false, default: false })
  isOpenToMentor?: boolean;

  @Prop({ required: false })
  avatar?: string;

  @Prop({ type: [String], default: [] })
  interests?: string[];

  @Prop({ type: [String], default: [] })
  expertise?: string[];

  @Prop({ required: false, default: false })
  isOnboarded?: boolean;
}

export type UserDocument = HydratedDocument<User>;

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ name: 'text', email: 'text' });
