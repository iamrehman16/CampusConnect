import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model, Types } from 'mongoose';
import {
  ContributorApplication,
  ContributorApplicationDocument,
} from './schema/contributor-application.schema';
import { ApplicationStatus } from './enums/application-status.enum';
import { CONTRIBUTOR_ELIGIBILITY_SCORE } from './contributor-application.constants';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ApplicationQueryDto } from './dto/application-query.dto';
import { MyApplicationDto } from './dto/my-application.dto';
import { UserService } from '../user/user.service';
import { Roles } from '../user/enums/user-role.enum';
import {
  ContributorApplicationReviewedEvent,
  DomainEvents,
} from '../../common/events/domain-events';
import {
  PaginatedResult,
  PaginationService,
} from '../../common/services/pagination.service';

const APPLICANT_POPULATE = {
  path: 'applicant',
  select: 'name email avatar contributionScore semester department',
};

function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: unknown }).code === 11000
  );
}

@Injectable()
export class ContributorApplicationService {
  private readonly logger = new Logger(ContributorApplicationService.name);

  constructor(
    @InjectModel(ContributorApplication.name)
    private readonly applicationModel: Model<ContributorApplicationDocument>,
    private readonly userService: UserService,
    private readonly paginationService: PaginationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async apply(userId: string, dto: CreateApplicationDto) {
    const user = await this.userService.findOne(userId);
    if (user.role !== Roles.STUDENT) {
      throw new BadRequestException(
        'Only students can apply to become a contributor',
      );
    }

    try {
      const created = await this.applicationModel.create({
        applicant: new Types.ObjectId(userId),
        reason: dto.reason.trim(),
        sampleUrl: dto.sampleUrl,
        scoreAtApplication: user.contributionScore,
      });
      return created.toObject();
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        // Unique partial index on (applicant) where Pending.
        throw new ConflictException(
          'You already have an application under review',
        );
      }
      throw err;
    }
  }

  async getMine(userId: string): Promise<MyApplicationDto> {
    const [user, latest] = await Promise.all([
      this.userService.findOne(userId),
      this.applicationModel
        .findOne({ applicant: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
    ]);

    return {
      application: latest ? { ...latest, _id: latest._id.toString() } : null,
      score: user.contributionScore,
      threshold: CONTRIBUTOR_ELIGIBILITY_SCORE,
      eligible: user.contributionScore >= CONTRIBUTOR_ELIGIBILITY_SCORE,
      canApply: user.role === Roles.STUDENT,
    };
  }

  async listForAdmin(
    dto: ApplicationQueryDto,
  ): Promise<PaginatedResult<ContributorApplication & { eligible: boolean }>> {
    const status = dto.status ?? ApplicationStatus.PENDING;
    const result = await this.paginationService.paginateWithPopulate(
      this.applicationModel,
      dto,
      { build: () => ({ status }) },
      // Review queue is oldest-first; history is newest-first.
      {
        build: () => ({
          createdAt: status === ApplicationStatus.PENDING ? 1 : -1,
        }),
      },
      APPLICANT_POPULATE,
    );

    return {
      ...result,
      data: result.data.map((application) => ({
        ...application,
        // `applicant` is populated (APPLICANT_POPULATE) with contributionScore.
        eligible:
          (application.applicant as unknown as { contributionScore?: number })
            .contributionScore !== undefined &&
          (application.applicant as unknown as { contributionScore: number })
            .contributionScore >= CONTRIBUTOR_ELIGIBILITY_SCORE,
      })),
    };
  }

  async approve(applicationId: string, adminId: string) {
    const application = await this.claim(applicationId, adminId, {
      status: ApplicationStatus.APPROVED,
    });
    const applicantId = application.applicant.toString();

    try {
      // Existing role-change path; JWT auth reads role from the DB per
      // request, so the new role applies immediately.
      await this.userService.updateRole(applicantId, Roles.CONTRIBUTOR);
    } catch (err) {
      // Compensate: put the application back in the queue rather than leave
      // it "Approved" for a user who never got the role.
      this.logger.error(
        `Role update failed approving application ${applicationId}; reverting to Pending`,
        err instanceof Error ? err.stack : String(err),
      );
      await this.applicationModel
        .updateOne(
          { _id: application._id, status: ApplicationStatus.APPROVED },
          {
            status: ApplicationStatus.PENDING,
            reviewedBy: null,
            reviewedAt: null,
          },
        )
        .exec();
      throw err;
    }

    this.eventEmitter.emit(DomainEvents.CONTRIBUTOR_APPLICATION_APPROVED, {
      applicantId,
      applicationId,
    } satisfies ContributorApplicationReviewedEvent);
    return application;
  }

  async reject(applicationId: string, adminId: string, reason: string) {
    const application = await this.claim(applicationId, adminId, {
      status: ApplicationStatus.REJECTED,
      rejectionReason: reason,
    });

    this.eventEmitter.emit(DomainEvents.CONTRIBUTOR_APPLICATION_REJECTED, {
      applicantId: application.applicant.toString(),
      applicationId,
      reason,
    } satisfies ContributorApplicationReviewedEvent);
    return application;
  }

  /**
   * Atomic Pending -> reviewed transition; the `status: Pending` filter is
   * what stops two admins (or a double click) from processing the same
   * application twice.
   */
  private async claim(
    applicationId: string,
    adminId: string,
    outcome: Partial<ContributorApplication>,
  ) {
    const application = await this.applicationModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(applicationId),
          status: ApplicationStatus.PENDING,
        },
        {
          ...outcome,
          reviewedBy: new Types.ObjectId(adminId),
          reviewedAt: new Date(),
        },
        { new: true },
      )
      .lean()
      .exec();

    if (!application) {
      throw new NotFoundException('Application not found or already reviewed');
    }
    return application;
  }
}
