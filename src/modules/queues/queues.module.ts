import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { QUEUES } from './queue.constants';
import { AiModule } from '../ai/ai.module';
import { RagIngestionProcessor } from './processors/rag-ingestion.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUES.RAG_INGESTION,
    }),
    AiModule,
  ],

  providers: [RagIngestionProcessor],
  exports: [BullModule],
})
export class QueuesModule {}
