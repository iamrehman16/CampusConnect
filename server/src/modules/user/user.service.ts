import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AdminUpdateUserDto } from './dto/update-admin-profile.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { Roles } from './enums/user-role.enum';
import {
  ReputationTier,
  tierForScore,
  tierMongoExpression,
} from '../reputation/tiers';
import { UserStatus } from './enums/user-status.enum';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import {
  DailyCountDto,
  UserGrowthDto,
} from '../dashboard/dto/resource-analytics.dto';
import { UserQueryDto } from './dto/user-query.dto';
import {
  PaginatedResult,
  PaginationService,
} from '../../common/services/pagination.service';
import { UserQueryBuilder } from './queries/build-user-query';
import { UserSortBuilder } from './queries/build-user-sort';
import { MentorQueryDto } from './dto/mentor-query.dto';
import { DEFAULT_MAX_ACTIVE_MENTEES } from './user.constants';
import { MentorSummaryDto } from './dto/mentor-summary.dto';
import { MentorQueryBuilder } from './queries/build-mentor-query';
import { MentorSortBuilder } from './queries/build-mentor-sort';

// Fields loaded for the public mentor directory (mirrors MentorSummaryDto).
const MENTOR_PUBLIC_FIELDS =
  'name avatar department semester role tier contributionScore expertise mentorBio mentorTopics maxActiveMentees activeMenteeCount';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';

@Injectable()
export class UserService {
  private readonly queryBuilder = new UserQueryBuilder();
  private readonly mentorSortBuilder = new MentorSortBuilder();
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
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('User with this email already exists');
      }
      throw error;
    }
  }

  private isDuplicateKeyError(err: unknown): boolean {
    return (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: unknown }).code === 11000
    );
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

  /** Public mentor directory — safe fields only (see MentorSummaryDto). */
  async findMentors(
    dto: MentorQueryDto,
    requesterId: string,
  ): Promise<PaginatedResult<MentorSummaryDto>> {
    const result = await this.paginationService.paginate(
      this.userModel,
      dto,
      new MentorQueryBuilder(requesterId),
      this.mentorSortBuilder,
      MENTOR_PUBLIC_FIELDS,
    );

    return {
      ...result,
      data: result.data.map((u) => {
        const maxActiveMentees =
          u.maxActiveMentees ?? DEFAULT_MAX_ACTIVE_MENTEES;
        return {
          id: (u as User & { _id: Types.ObjectId })._id.toString(),
          name: u.name ?? '',
          avatar: u.avatar,
          department: u.department,
          semester: u.semester,
          role: u.role,
          tier: u.tier,
          contributionScore: u.contributionScore,
          expertise: u.expertise ?? [],
          mentorBio: u.mentorBio,
          mentorTopics: u.mentorTopics ?? [],
          maxActiveMentees,
          slotsLeft: Math.max(0, maxActiveMentees - (u.activeMenteeCount ?? 0)),
        };
      }),
    };
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

  /**
   * `contributionScore` is derived from the reputation ledger — only the
   * reputation module should call these (see ReputationService).
   */
  async adjustContributionScore(id: string, delta: number): Promise<void> {
    // Pipeline update: score and tier are computed in ONE atomic write, the
    // tier from the same threshold table as tierForScore().
    await this.userModel
      .updateOne(
        { _id: id },
        [
          {
            $set: {
              contributionScore: {
                $max: [
                  0,
                  { $add: [{ $ifNull: ['$contributionScore', 0] }, delta] },
                ],
              },
            },
          },
          { $set: { tier: tierMongoExpression('$contributionScore') } },
        ],
        { updatePipeline: true },
      )
      .exec();
  }

  async setContributionScore(id: string, score: number): Promise<void> {
    await this.userModel
      .updateOne(
        { _id: id },
        { contributionScore: score, tier: tierForScore(score) },
      )
      .exec();
  }

  async zeroContributionScoresExcept(ids: string[]): Promise<void> {
    await this.userModel
      .updateMany(
        {
          _id: { $nin: ids },
          $or: [
            { contributionScore: { $ne: 0 } },
            { tier: { $ne: ReputationTier.NEWCOMER } },
          ],
        },
        { contributionScore: 0, tier: ReputationTier.NEWCOMER },
      )
      .exec();
  }

  /**
   * Atomically claim one mentee slot: succeeds only while activeMenteeCount is
   * still below the mentor's maxActiveMentees, evaluated inside the write so
   * two concurrent accepts can never both take the last slot.
   * @returns false when the mentor is full.
   */
  async reserveMenteeSlot(mentorId: string): Promise<boolean> {
    const res = await this.userModel
      .updateOne(
        {
          _id: mentorId,
          $expr: {
            $lt: [
              { $ifNull: ['$activeMenteeCount', 0] },
              { $ifNull: ['$maxActiveMentees', DEFAULT_MAX_ACTIVE_MENTEES] },
            ],
          },
        },
        { $inc: { activeMenteeCount: 1 } },
      )
      .exec();
    return res.modifiedCount === 1;
  }

  /** Give a reserved slot back (mentorship completed, or accept rolled back). */
  async releaseMenteeSlot(mentorId: string): Promise<void> {
    await this.userModel
      .updateOne(
        { _id: mentorId, activeMenteeCount: { $gt: 0 } },
        { $inc: { activeMenteeCount: -1 } },
      )
      .exec();
  }

  async touchLastSeen(id: string, at: Date): Promise<void> {
    await this.userModel.updateOne({ _id: id }, { lastSeenAt: at }).exec();
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

    const rows = await this.userModel.aggregate<DailyCountDto>([
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
