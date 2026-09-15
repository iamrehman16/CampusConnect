import { Module } from '@nestjs/common';
import { ResourceService } from './resource.service';
import { ResourceController } from './resource.controller';
import { ResourceAdminController } from './resource-admin.controller';
import { StorageModule } from '../storage/storage.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Resource, ResourceSchema } from './schemas/resource.schema';
import { CommonModule } from '../../common/common.module';
import { ConfigModule } from '@nestjs/config';
import resourceConfig from '../storage/config/cloudinary.config';
import { QueuesModule } from '../queues/queues.module';

@Module({
  imports: [
    ConfigModule.forFeature(resourceConfig),
    StorageModule,
    CommonModule,
    MongooseModule.forFeature([
      { name: Resource.name, schema: ResourceSchema },
    ]),
    QueuesModule,
  ],
  controllers: [ResourceController, ResourceAdminController],
  providers: [ResourceService],
  exports: [ResourceService, MongooseModule],
})
export class ResourceModule {}
