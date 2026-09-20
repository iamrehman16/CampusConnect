import { ResourceService } from './resource.service';
import { CloudinaryService } from '../storage/cloudinary.service';
import { PaginationService } from '../../common/services/pagination.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model, Types } from 'mongoose';
import { ResourceDocument } from './schemas/resource.schema';
import { Queue } from 'bullmq';

describe('ResourceService', () => {
  it('should be defined', () => {
    const cloudinaryService: Partial<CloudinaryService> = {};
    const paginationService: Partial<PaginationService> = {};
    const eventEmitter: Partial<EventEmitter2> = {};
    const resourceModel: Partial<Model<ResourceDocument>> = {};
    const ingestionQueue: Partial<Queue> = {};

    const service = new ResourceService(
      cloudinaryService as CloudinaryService,
      paginationService as PaginationService,
      eventEmitter as EventEmitter2,
      resourceModel as Model<ResourceDocument>,
      {
        cloudName: 'test-cloud',
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      },
      ingestionQueue as Queue,
    );

    expect(service).toBeDefined();
  });
});

describe('ResourceService moderation events', () => {
  const uploaderId = new Types.ObjectId();
  const resourceId = new Types.ObjectId();

  function build(model: Record<string, unknown>) {
    const eventEmitter = { emit: jest.fn() };
    const ingestionQueue = { add: jest.fn().mockResolvedValue(undefined) };
    const service = new ResourceService(
      {} as CloudinaryService,
      {} as PaginationService,
      eventEmitter as unknown as EventEmitter2,
      model as unknown as Model<ResourceDocument>,
      { cloudName: 'c', apiKey: 'k', apiSecret: 's' },
      ingestionQueue as unknown as Queue,
    );
    return { service, eventEmitter };
  }

  function updateChain(result: unknown) {
    const chain = {
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(result),
    };
    return { findOneAndUpdate: jest.fn().mockReturnValue(chain) };
  }

  const populatedResource = {
    _id: resourceId,
    title: 'Data Structures Notes',
    fileUrl: 'u',
    fileType: 'pdf',
    cloudinaryResourceType: 'raw',
    resourceType: 'notes',
    semester: 3,
    course: 'CS',
    subject: 'DS',
    uploadedBy: { _id: uploaderId, name: 'A', email: 'a@x.com' },
  };

  it('approve emits resource.approved with the populated uploader id', async () => {
    const { service, eventEmitter } = build(updateChain(populatedResource));

    await service.approve(resourceId.toString());

    expect(eventEmitter.emit).toHaveBeenCalledWith('resource.approved', {
      resourceId: resourceId.toString(),
      title: 'Data Structures Notes',
      uploaderId: uploaderId.toString(),
    });
  });

  it('reject emits resource.rejected including the reason', async () => {
    const { service, eventEmitter } = build(updateChain(populatedResource));

    await service.reject(resourceId.toString(), 'Blurry scan');

    expect(eventEmitter.emit).toHaveBeenCalledWith('resource.rejected', {
      resourceId: resourceId.toString(),
      title: 'Data Structures Notes',
      uploaderId: uploaderId.toString(),
      reason: 'Blurry scan',
    });
  });

  it('does not emit when the resource is not pending', async () => {
    const { service, eventEmitter } = build(updateChain(null));

    await expect(service.reject(resourceId.toString(), 'x')).rejects.toThrow();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });
});
