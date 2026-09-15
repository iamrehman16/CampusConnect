import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { CloudinaryService } from '../storage/cloudinary.service';
import { InjectModel } from '@nestjs/mongoose';
import { Resource, ResourceDocument } from './schemas/resource.schema';
import { Model, Types } from 'mongoose';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceByContributorDto } from './dto/update-resource.dto';
import { ApprovalStatus } from './enums/approval-status.enum';
import { ResourceQueryDto } from './dto/resource-query.dto';
import { ResourceQueryBuilder } from './dto/queries/build-resource-query';
import { ResourceSortBuilder } from './dto/queries/build-resource-sort';
import {
  PaginationService,
  PaginatedResult,
} from '../../common/services/pagination.service';
import { inferCloudinaryResourceType, inferFileType } from './utils/file.utils';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AdminResourceQueryDto } from './dto/admin-resource-query.dto';
import { UploadSignatureResponseDto } from './dto/upload-signature-response.dto';
import { AllowedMimetype } from './dto/request-upload-signature.dto';
import resourceConfig from '../storage/config/cloudinary.config';
import { ConfigType } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { JOBS, QUEUES } from '../queues/queue.constants';
import { Queue } from 'bullmq';
import { IngestResourceJobPayload } from '../queues/interfaces/ingest-resource-job.interface';
import {
  ApprovalFunnelDto,
  ResourceAnalyticsDto,
} from '../dashboard/dto/resource-analytics.dto';

const UPLOADED_BY_POPULATE = { path: 'uploadedBy', select: 'name email' };

@Injectable()
export class ResourceService {
  private readonly queryBuilder = new ResourceQueryBuilder();
  private readonly sortBuilder = new ResourceSortBuilder();

  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly paginationService: PaginationService,
    private readonly eventEmitter: EventEmitter2,
    @InjectModel(Resource.name) private resourceModel: Model<ResourceDocument>,
    @Inject(resourceConfig.KEY)
    private resourceCfg: ConfigType<typeof resourceConfig>,
    @InjectQueue(QUEUES.RAG_INGESTION) private readonly ingestionQueue: Queue,
  ) {}

  generateUploadSignature(
    mimetype: AllowedMimetype,
    userId: string,
  ): UploadSignatureResponseDto {
    // Derive cloudinary resource type from mimetype
    const cloudinaryResourceType = inferCloudinaryResourceType(mimetype);
    const timestamp = Math.round(Date.now() / 1000);
    const folder = `campusconnect/resources/${userId}`;

    const paramsToSign = {
      timestamp,
      folder,
      // Cloudinary-side tags for orphan cleanup job — NOT related to Resource.tags
      tags: `user_${userId},pending_approval`,
    };

    const signature = this.cloudinaryService.generateSignature(paramsToSign);

    return {
      signature,
      timestamp,
      folder,
      cloudinaryResourceType,
      apiKey: this.resourceCfg.apiKey,
      cloudName: this.resourceCfg.cloudName,
    };
  }

  async create(dto: CreateResourceDto, userId: string) {
    // Step 1: Verify Cloudinary's return signature
    // Proves the upload actually happened and result wasn't spoofed by client
    const expectedSignature = this.cloudinaryService.generateSignature({
      public_id: dto.publicId,
      version: dto.version,
    });

    if (expectedSignature !== dto.cloudinarySignature) {
      throw new BadRequestException('Upload verification failed');
    }

    // Step 2: Verify file lives in this user's folder
    // Prevents a user from claiming another user's uploaded file
    const expectedFolder = `campusconnect/resources/${userId}`;
    if (!dto.publicId.startsWith(expectedFolder)) {
      throw new ForbiddenException('Upload folder mismatch');
    }

    // Step 3: Derive file metadata — same logic as before, now from dto fields
    const fileFormat =
      dto.format ||
      dto.originalName.split('.').pop()?.toLowerCase() ||
      'unknown';
    const fileType = inferFileType(fileFormat, dto.originalName);

    try {
      const resource = await this.resourceModel.create({
        title: dto.title,
        description: dto.description,
        subject: dto.subject,
        course: dto.course,
        semester: dto.semester,
        resourceType: dto.resourceType, // ResourceType enum: Notes, Book, etc.
        tags: dto.tags ?? [],
        fileUrl: dto.secureUrl,
        cloudinaryPublicId: dto.publicId,
        fileFormat,
        fileType, // FileType enum: PDF, DOC, etc.
        fileSize: dto.bytes,
        cloudinaryResourceType: dto.cloudinaryResourceType, // 'image' | 'raw'
        uploadedBy: userId,
        // approvalStatus defaults to PENDING via schema
      });

      return this.resourceModel
        .findById(resource._id)
        .populate(UPLOADED_BY_POPULATE)
        .lean()
        .exec();
    } catch (err) {
      console.error('DB save failed after verified upload:', err);
      await this.cloudinaryService
        .deleteFile(dto.publicId, dto.cloudinaryResourceType)
        .catch(() => null);
      throw new InternalServerErrorException(
        'Database save failed. File rolled back.',
      );
    }
  }

  async findAll(dto: ResourceQueryDto): Promise<PaginatedResult<Resource>> {
    return this.paginationService.paginateWithPopulate(
      this.resourceModel,
      dto,
      this.queryBuilder,
      this.sortBuilder,
      UPLOADED_BY_POPULATE,
    );
  }

  async findOne(id: string) {
    const resource = await this.resourceModel
      .findOne({ _id: id, isDeleted: false })
      .populate(UPLOADED_BY_POPULATE)
      .lean()
      .exec();

    if (!resource) throw new NotFoundException('Resource not found');
    return resource;
  }

  async update(
    id: string,
    dto: UpdateResourceByContributorDto,
    userId: string,
    isAdmin: boolean,
  ) {
    const ownershipFilter = isAdmin
      ? {}
      : { uploadedBy: new Types.ObjectId(userId) };

    const resource = await this.resourceModel
      .findOneAndUpdate(
        { _id: id, ...ownershipFilter, isDeleted: false },
        { $set: dto },
        { new: true, runValidators: true },
      )
      .populate(UPLOADED_BY_POPULATE)
      .lean()
      .exec();

    if (!resource)
      throw new NotFoundException('Resource not found or ownership mismatch');
    return resource;
  }

  async remove(id: string, userId: string, isAdmin: boolean) {
    const ownershipFilter = isAdmin
      ? {}
      : { uploadedBy: new Types.ObjectId(userId) };

    const resource = await this.resourceModel
      .findOneAndUpdate(
        { _id: id, ...ownershipFilter, isDeleted: false },
        { $set: { isDeleted: true } },
        { new: false },
      )
      .populate(UPLOADED_BY_POPULATE)
      .lean()
      .exec();

    if (!resource)
      throw new NotFoundException('Resource not found or ownership mismatch');

    if (resource.cloudinaryPublicId) {
      this.cloudinaryService
        .deleteFile(
          resource.cloudinaryPublicId,
          resource.cloudinaryResourceType as 'image' | 'raw',
        )
        .catch((err) =>
          console.error(
            `Cleanup failed for ${resource.cloudinaryPublicId}:`,
            err,
          ),
        );
    }

    return resource;
  }

  async getDownloadUrl(id: string) {
    const resource = await this.resourceModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $inc: { downloads: 1 } },
        { new: true },
      )
      .lean()
      .exec();

    if (!resource) throw new NotFoundException('Resource not found');
    return this.cloudinaryService.generateDownloadUrl(resource.fileUrl);
  }

  async findAllPending(
    dto: AdminResourceQueryDto,
  ): Promise<PaginatedResult<Resource>> {
    return this.paginationService.paginateWithPopulate(
      this.resourceModel,
      { ...dto },
      this.queryBuilder,
      this.sortBuilder,
      UPLOADED_BY_POPULATE,
    );
  }

  async approve(id: string) {
    const resource = await this.resourceModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false, approvalStatus: ApprovalStatus.PENDING },
        { approvalStatus: ApprovalStatus.APPROVED },
        { new: true },
      )
      .populate(UPLOADED_BY_POPULATE)
      .lean()
      .exec();

    if (!resource)
      throw new NotFoundException('Resource not found or not pending');

    const payload: IngestResourceJobPayload = {
      resourceId: resource._id.toString(),
      fileUrl: resource.fileUrl,
      fileType: resource.fileType,
      cloudinaryResourceType: resource.cloudinaryResourceType,
      title: resource.title,
      resourceType: resource.resourceType,
      semester: resource.semester,
      course: resource.course,
      subject: resource.subject,
    };

    await this.ingestionQueue.add(JOBS.INGEST_RESOURCE, payload, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: 100,
      removeOnFail: 200,
    });

    return resource;
  }

  async reject(id: string, reason: string) {
    const resource = await this.resourceModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false, approvalStatus: ApprovalStatus.PENDING },
        { approvalStatus: ApprovalStatus.REJECTED, rejectionReason: reason },
        { new: true },
      )
      .populate(UPLOADED_BY_POPULATE)
      .lean()
      .exec();

    if (!resource)
      throw new NotFoundException('Resource not found or not pending');
    return resource;
  }

  async getStats() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    try {
      const [stats] = await this.resourceModel.aggregate([
        { $match: { isDeleted: false } },
        {
          $facet: {
            total: [{ $count: 'count' }],
            pending: [
              { $match: { approvalStatus: ApprovalStatus.PENDING } },
              { $count: 'count' },
            ],
            uploadedPastWeek: [
              { $match: { createdAt: { $gte: oneWeekAgo } } },
              { $count: 'count' },
            ],
          },
        },
        {
          $project: {
            total: { $arrayElemAt: ['$total.count', 0] },
            pending: { $arrayElemAt: ['$pending.count', 0] },
            uploadedPastWeek: { $arrayElemAt: ['$uploadedPastWeek.count', 0] },
          },
        },
      ]);

      return stats ?? { total: 0, pending: 0, uploadedPastWeek: 0 };
    } catch {
      throw new InternalServerErrorException('Failed to fetch resource stats');
    }
  }

  // resource/resource.service.ts  (add this method)
  async getAnalytics(): Promise<ResourceAnalyticsDto> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [result] = await this.resourceModel.aggregate([
      { $match: { isDeleted: false } },
      {
        $facet: {
          // --- Daily uploads (last 30 days) ---
          dailyUploads: [
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, date: '$_id', count: 1 } },
          ],

          // --- Approval funnel ---
          approvalFunnel: [
            {
              $group: {
                _id: '$approvalStatus',
                count: { $sum: 1 },
              },
            },
          ],

          // --- By file type ---
          byFileType: [
            { $group: { _id: '$fileType', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $project: { _id: 0, label: '$_id', count: 1 } },
          ],

          // --- By subject (top 8) ---
          bySubject: [
            { $group: { _id: '$subject', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 8 },
            { $project: { _id: 0, label: '$_id', count: 1 } },
          ],

          // --- By semester ---
          bySemester: [
            { $group: { _id: '$semester', count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, label: { $toString: '$_id' }, count: 1 } },
          ],

          // --- Avg approval time (approved resources only) ---
          approvalTiming: [
            { $match: { approvalStatus: ApprovalStatus.APPROVED } },
            {
              $project: {
                diffMs: {
                  $subtract: ['$updatedAt', '$createdAt'],
                },
              },
            },
            {
              $group: {
                _id: null,
                avgMs: { $avg: '$diffMs' },
              },
            },
          ],

          // --- Top contributors (top 5) ---
          topContributors: [
            {
              $group: {
                _id: '$uploadedBy',
                uploads: { $sum: 1 },
              },
            },
            { $sort: { uploads: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'user',
              },
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },
            {
              $project: {
                _id: 0,
                userId: { $toString: '$_id' },
                name: '$user.name', // adjust to your User.name field
                uploads: 1,
              },
            },
          ],
        },
      },
    ]);

    // --- Shape the approval funnel from array → object ---
    const funnel: ApprovalFunnelDto = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };
    for (const { _id, count } of result.approvalFunnel) {
      if (_id === ApprovalStatus.PENDING) funnel.pending = count;
      else if (_id === ApprovalStatus.APPROVED) funnel.approved = count;
      else if (_id === ApprovalStatus.REJECTED) funnel.rejected = count;
    }

    const avgMs = result.approvalTiming[0]?.avgMs ?? 0;
    const avgApprovalHours = Math.round((avgMs / (1000 * 60 * 60)) * 10) / 10;

    return {
      dailyUploads: result.dailyUploads,
      approvalFunnel: funnel,
      byFileType: result.byFileType,
      bySubject: result.bySubject,
      bySemester: result.bySemester,
      avgApprovalHours,
      topContributors: result.topContributors,
    };
  }

  async getTotalResourceCount() {
    return await this.resourceModel.countDocuments();
  }
}
