import { ResourceService } from './resource.service';
import { CloudinaryService } from '../storage/cloudinary.service';
import { PaginationService } from '../../common/services/pagination.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model } from 'mongoose';
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
