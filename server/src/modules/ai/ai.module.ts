import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AiController } from './ai.controller';
import { ConversationController } from './conversation.controller';
import { AiChatService } from './services/ai-chat.service';
import { GroqService } from './services/groq.service';
import { EmbeddingService } from './services/embedding.service';
import { VectorStoreService } from './services/vector-store.service';
import { DocumentParserService } from './services/document-parser.service';
import { ConversationService } from './services/conversation.service';
import { IngestionService } from './services/ingestion.service';
import aiConfig from './config/ai.config';
import {
  ConversationSession,
  ConversationSessionSchema,
} from './schema/conversation-session.schema';
import {
  AiConversation,
  AiConversationSchema,
} from './schema/ai-conversation.schema';
import { AiMessage, AiMessageSchema } from './schema/ai-message.schema';
import { ChunkingService } from './services/chunking.service';
import { RetrievalService } from './services/retrieval.service';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    ConfigModule.forFeature(aiConfig),
    MongooseModule.forFeature([
      // Legacy singleton, read-only — kept only as the source for
      // ConversationService's one-time startup migration (BACKLOG.md B1).
      { name: ConversationSession.name, schema: ConversationSessionSchema },
      { name: AiConversation.name, schema: AiConversationSchema },
      { name: AiMessage.name, schema: AiMessageSchema },
    ]),
    CommonModule,
  ],
  controllers: [AiController, ConversationController],
  providers: [
    AiChatService,
    GroqService,
    ConversationService,
    IngestionService,
    DocumentParserService,
    EmbeddingService,
    VectorStoreService,
    ChunkingService,
    RetrievalService,
  ],
  exports: [AiChatService, IngestionService],
})
export class AiModule {}
