import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from '../../common/common.module';
import { UserModule } from '../user/user.module';
import {
  ReputationEvent,
  ReputationEventSchema,
} from './schema/reputation-event.schema';
import { Resource, ResourceSchema } from '../resource/schemas/resource.schema';
import { Post, PostSchema } from '../post/schemas/post.schema';
import { ReputationService } from './reputation.service';
import { ReputationListener } from './reputation.listener';
import { ReputationController } from './reputation.controller';
import { ReputationAdminController } from './reputation-admin.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReputationEvent.name, schema: ReputationEventSchema },
      { name: Resource.name, schema: ResourceSchema },
      { name: Post.name, schema: PostSchema },
    ]),
    CommonModule,
    UserModule,
  ],
  controllers: [ReputationController, ReputationAdminController],
  providers: [ReputationService, ReputationListener],
  exports: [ReputationService],
})
export class ReputationModule {}
