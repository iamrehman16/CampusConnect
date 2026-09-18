import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AiConversation,
  AiConversationDocument,
} from '../schema/ai-conversation.schema';
import {
  ConversationSession,
  ConversationSessionDocument,
} from '../schema/conversation-session.schema';

@Injectable()
export class ConversationService implements OnModuleInit {
  private readonly logger = new Logger(ConversationService.name);
  private readonly RECENT_LIMIT = 6;
  private readonly SUMMARIZE_BATCH = 3;

  constructor(
    @InjectModel(AiConversation.name)
    private readonly conversationModel: Model<AiConversationDocument>,
    @InjectModel(ConversationSession.name)
    private readonly legacySessionModel: Model<ConversationSessionDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.migrateLegacySessions();
  }

  /**
   * One-time (idempotent) migration: each legacy singleton
   * ConversationSession becomes one AiConversation for its user, so
   * existing history/summaries survive the move to a many-threads-per-user
   * model (BACKLOG.md B1). Re-run-safe — only sessions missing
   * `migratedAt` are processed, and each is marked immediately after its
   * AiConversation is created.
   */
  private async migrateLegacySessions(): Promise<void> {
    const pending = await this.legacySessionModel
      .find({ migratedAt: { $exists: false } })
      .lean();

    for (const session of pending) {
      await this.conversationModel.create({
        userId: session.userId,
        title: 'Migrated conversation',
        summaryBuffer: session.summaryBuffer,
        recentMessages: session.recentMessages,
      });
      await this.legacySessionModel.updateOne(
        { _id: session._id },
        { migratedAt: new Date() },
      );
    }

    if (pending.length > 0) {
      this.logger.log(
        `Migrated ${pending.length} legacy conversation session(s) to AiConversation`,
      );
    }
  }

  /**
   * Ownership-scoped lookup/creation, replacing the old userId-only
   * singleton getOrCreateSession. When conversationId is given, the thread
   * must belong to userId or this throws (a user can only read/write their
   * own threads — new requirement per B1, the old model never needed it).
   *
   * When conversationId is omitted, falls back to the user's most
   * recently updated thread (creating one if none exists) — a bridge for
   * chat/chat.stream, which don't accept a conversationId from the client
   * yet. That wiring is BACKLOG.md B2; until then this preserves today's
   * single-thread-per-user behavior on top of the new data model.
   */
  async getOrCreateConversation(
    userId: string,
    conversationId?: string,
  ): Promise<AiConversationDocument> {
    if (conversationId) {
      const conversation = await this.conversationModel.findOne({
        _id: conversationId,
        userId,
      });
      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }
      return conversation;
    }

    const mostRecent = await this.conversationModel
      .findOne({ userId })
      .sort({ updatedAt: -1 });
    if (mostRecent) return mostRecent;

    return this.conversationModel.create({ userId });
  }

  async appendMessages(
    conversation: AiConversationDocument,
    userMessage: string,
    assistantMessage: string,
    summarizeFn: (content: string) => Promise<string>,
  ): Promise<void> {
    conversation.recentMessages.push(
      { role: 'user', content: userMessage, timestamp: new Date() },
      { role: 'assistant', content: assistantMessage, timestamp: new Date() },
    );

    await this.maybeCompressSummary(conversation, summarizeFn);

    await conversation.save();
  }

  private async maybeCompressSummary(
    conversation: AiConversationDocument,
    summarizeFn: (content: string) => Promise<string>,
  ): Promise<void> {
    const exchangeCount = Math.floor(conversation.recentMessages.length / 2);

    if (exchangeCount <= this.RECENT_LIMIT) return;

    const messagesToCompress = conversation.recentMessages.splice(
      0,
      this.SUMMARIZE_BATCH * 2,
    );

    const rawText = messagesToCompress
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const prompt = conversation.summaryBuffer
      ? `You are a conversation summarizer. Return only the summary text, no preamble, no labels, no explanation.
     Existing summary: "${conversation.summaryBuffer}"
     New messages to merge in:
     ${rawText}
     Produce a single concise summary (2-3 sentences max) that captures everything.`
      : `Summarize these messages in 2-3 sentences. Return only the summary text, no preamble or explanation:
     ${rawText}`;
    conversation.summaryBuffer = await summarizeFn(prompt);
  }

  async clearConversation(
    userId: string,
    conversationId: string,
  ): Promise<void> {
    const result = await this.conversationModel.findOneAndUpdate(
      { _id: conversationId, userId },
      { summaryBuffer: '', recentMessages: [] },
    );
    if (!result) {
      throw new NotFoundException('Conversation not found');
    }
  }
}
