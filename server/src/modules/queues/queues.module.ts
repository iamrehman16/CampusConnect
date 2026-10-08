import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiModule } from '../ai/ai.module';
import { Resource, ResourceSchema } from '../resource/schemas/resource.schema';
import { IngestionQueueService } from './ingestion-queue.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Resource.name, schema: ResourceSchema },
    ]),
    AiModule,
  ],
  providers: [IngestionQueueService],
  exports: [IngestionQueueService],
})
export class QueuesModule {}
