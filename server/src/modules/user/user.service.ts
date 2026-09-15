import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AdminUpdateUserDto } from './dto/update-admin-profile.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { Roles } from './enums/user-role.enum';
import { UserStatus } from './enums/user-status.enum';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { UserGrowthDto } from '../dashboard/dto/resource-analytics.dto';
import { format } from 'path';
import { UserQueryDto } from './dto/user-query.dto';
import {
  PaginatedResult,
  PaginationService,
} from '../../common/services/pagination.service';
import { UserQueryBuilder } from './queries/build-user-query';
import { UserSortBuilder } from './queries/build-user-sort';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';

@Injectable()
export class UserService {
  private readonly queryBuilder = new UserQueryBuilder();
  private readonly sortBuilder = new UserSortBuilder();

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly paginationService: PaginationService,
  ) {}

  async createUser(dto: RegisterUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newUser = new this.userModel({
      ...dto,
      name: dto.name || dto.email,
      password: hashedPassword,
      role: Roles.STUDENT,
      accountStatus: UserStatus.ACTIVE,
      contributionScore: 0,
    });

    try {
      return await newUser.save();
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException('User with this email already exists');
      }
      throw error;
    }
  }

  async createUserByAdmin(dto: AdminCreateUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newUser = new this.userModel({
      ...dto,
      name: dto.name || dto.email,
      password: hashedPassword,
    });

    return newUser.save();
  }

  async findAll(dto: UserQueryDto): Promise<PaginatedResult<User>> {
    return this.paginationService.paginate(
      this.userModel,
      dto,
      this.queryBuilder,
      this.sortBuilder,
    );
  }

  async findOne(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    return user.toObject();
  }

  async findOneWithHashedRefreshToken(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('+hashedRefreshToken')
      .exec();
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    return user.toObject();
  }

  async findByEmail(email: string) {
    const user = await this.userModel
      .findOne({ email })
      .select('+password')
      .exec();
    if (!user) {
      throw new NotFoundException(`User with id ${email} not found`);
    }
    return user.toObject();
  }

  async updateUserByAdmin(id: string, dto: AdminUpdateUserDto) {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return updatedUser.toObject();
  }

  async updateRole(id: string, role: Roles) {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, { role }, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return updatedUser.toObject();
  }

  async updateStatus(id: string, accountStatus: UserStatus) {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, { accountStatus }, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return updatedUser.toObject();
  }

  async updateProfile(userId: string, dto: UpdateUserProfileDto) {
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, dto, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    return updatedUser.toObject();
  }

  async remove(id: string) {
    const deletedUser = await this.userModel.findByIdAndDelete(id).exec();
    if (!deletedUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return deletedUser.toObject();
  }

  async updateRefreshToken(userId: string, hashedRefreshToken: string | null) {
    return await this.userModel.findByIdAndUpdate(
      userId,
      { hashedRefreshToken: hashedRefreshToken },
      { new: true },
    );
  }

  //stats

  async getStats() {
    const [total, contributors] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ role: Roles.CONTRIBUTOR }),
    ]);
    return { total, contributors };
  }

  async getGrowth(): Promise<UserGrowthDto> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const rows = await this.userModel.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', count: 1 } },
    ]);

    return { dailyRegistrations: rows };
  }

  async completeOnboarding(userId: string, dto: CompleteOnboardingDto) {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, { ...dto, isOnboarded: true }, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    return updatedUser.toObject();
  }

  async getTotalUsersAndMentors() {
    const [totalUsers, totalContributors] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ role: Roles.CONTRIBUTOR }),
    ]);

    return { totalUsers, totalContributors };
  }
}
