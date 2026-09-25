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
  DEFAULT_CONVERSATION_TITLE,
} from '../schema/ai-conversation.schema';
import { AiMessage, AiMessageDocument } from '../schema/ai-message.schema';
import {
  ConversationSession,
  ConversationSessionDocument,
} from '../schema/conversation-session.schema';
import {
  PaginatedResult,
  PaginationService,
} from '../../../common/services/pagination.service';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { MemoryService } from './memory.service';
import {
  Citation,
  RetrievalStatus,
} from '../interfaces/retrieved-context.interface';

@Injectable()
export class ConversationService implements OnModuleInit {
  private readonly logger = new Logger(ConversationService.name);
  private readonly RECENT_LIMIT = 6;
  private readonly SUMMARIZE_BATCH = 3;

  constructor(
    @InjectModel(AiConversation.name)
    private readonly conversationModel: Model<AiConversationDocument>,
    @InjectModel(AiMessage.name)
    private readonly messageModel: Model<AiMessageDocument>,
    @InjectModel(ConversationSession.name)
    private readonly legacySessionModel: Model<ConversationSessionDocument>,
    private readonly paginationService: PaginationService,
    private readonly memoryService: MemoryService,
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
      const conversation = await this.conversationModel.create({
        userId: session.userId,
        title: 'Migrated conversation',
        summaryBuffer: session.summaryBuffer,
        recentMessages: session.recentMessages,
      });
      // Only recentMessages survive on a legacy session — anything already
      // folded into summaryBuffer by the old sliding-window splice() is
      // unrecoverable raw text (the bug B3 fixes going forward). Seed what
      // we still have so this thread's history isn't empty on day one.
      if (session.recentMessages.length > 0) {
        await this.messageModel.insertMany(
          session.recentMessages.map((m) => ({
            conversationId: conversation._id,
            role: m.role,
            content: m.content,
          })),
        );
      }
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
    /** Sources and retrieval outcome for the assistant reply. */
    assistantMeta?: {
      citations: Citation[];
      retrievalStatus: RetrievalStatus;
    },
  ): Promise<{ userMessageId: string; assistantMessageId: string }> {
    conversation.recentMessages.push(
      { role: 'user', content: userMessage, timestamp: new Date() },
      { role: 'assistant', content: assistantMessage, timestamp: new Date() },
    );

    await this.maybeCompressSummary(conversation, summarizeFn);

    // Full raw history, independent of what maybeCompressSummary just
    // spliced out of recentMessages into summaryBuffer — that splice
    // bounds Groq's context window (CLAUDE.md §4), it doesn't govern what's
    // retrievable for scroll-back (BACKLOG.md B3).
    const [userDoc, assistantDoc] = await this.messageModel.insertMany([
      { conversationId: conversation._id, role: 'user', content: userMessage },
      {
        conversationId: conversation._id,
        role: 'assistant',
        content: assistantMessage,
        ...(assistantMeta && {
          citations: assistantMeta.citations,
          retrievalStatus: assistantMeta.retrievalStatus,
        }),
      },
    ]);

    await conversation.save();

    // BACKLOG.md C1 — callers need the assistant message's real id to let
    // the client attach like/dislike feedback to it.
    return {
      userMessageId: userDoc._id.toString(),
      assistantMessageId: assistantDoc._id.toString(),
    };
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

    // BACKLOG.md B6: the exchanges just spliced out of recentMessages are,
    // by definition, "aging" out of active context — embed the raw text
    // (not the ever-growing summaryBuffer, which would re-store
    // overlapping content on every compression) into cross-session memory.
    // Fire-and-forget: MemoryService.storeMemory never throws, it logs and
    // degrades to "no memory stored this turn" on failure (CLAUDE.md §3.3),
    // so this can't block or fail the response that triggered compression.
    void this.memoryService.storeMemory(
      conversation.userId,
      conversation._id.toString(),
      rawText,
    );
  }

  /**
   * Auto-names a thread from its first exchange (BACKLOG.md B4). Only
   * fires while the thread still has the schema default title, so it
   * never clobbers a title the user set via rename — the `title:
   * DEFAULT_CONVERSATION_TITLE` filter on the update makes that race-safe
   * even if this somehow ran twice concurrently.
   *
   * Never throws: title generation is a nice-to-have side effect, not on
   * the chat-response critical path. A failed titleFn call is logged, not
   * swallowed, and falls back to the first few words of the user's
   * message rather than leaving the thread untitled.
   */
  async maybeGenerateTitle(
    conversation: AiConversationDocument,
    userMessage: string,
    titleFn: (message: string) => Promise<string>,
  ): Promise<void> {
    if (conversation.title !== DEFAULT_CONVERSATION_TITLE) return;

    let title: string;
    try {
      title = (await titleFn(userMessage)).trim();
    } catch (err) {
      this.logger.error(
        `Title generation failed for conversation ${conversation._id.toString()}`,
        err instanceof Error ? err.stack : undefined,
      );
      title = '';
    }

    await this.conversationModel.updateOne(
      { _id: conversation._id, title: DEFAULT_CONVERSATION_TITLE },
      { title: title || this.fallbackTitle(userMessage) },
    );
  }

  private fallbackTitle(userMessage: string): string {
    const words = userMessage.trim().split(/\s+/).slice(0, 6).join(' ');
    return words || DEFAULT_CONVERSATION_TITLE;
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

  async listConversations(userId: string): Promise<AiConversationDocument[]> {
    return this.conversationModel.find({ userId }).sort({ updatedAt: -1 });
  }

  async createConversation(
    userId: string,
    title?: string,
  ): Promise<AiConversationDocument> {
    return this.conversationModel.create({
      userId,
      ...(title ? { title } : {}),
    });
  }

  async renameConversation(
    userId: string,
    conversationId: string,
    title: string,
  ): Promise<AiConversationDocument> {
    const conversation = await this.conversationModel.findOneAndUpdate(
      { _id: conversationId, userId },
      { title },
      { new: true },
    );
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }

  /**
   * Ownership-checked. Paginated so a long thread's history is never
   * shipped as one giant payload (BACKLOG.md B3) — newest page first,
   * matching the chat module's GetMessagesDto/getMessages convention.
   */
  async getMessages(
    userId: string,
    conversationId: string,
    dto: BaseQueryDto,
  ): Promise<PaginatedResult<AiMessageDocument>> {
    const conversation = await this.conversationModel.findOne({
      _id: conversationId,
      userId,
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return this.paginationService.paginate(
      this.messageModel,
      dto,
      { build: () => ({ conversationId: conversation._id }) },
      { build: () => ({ createdAt: -1 }) },
    );
  }

  /**
   * Ownership-checked via the parent conversation, since AiMessage has no
   * userId of its own (BACKLOG.md C1). `feedback: null` clears any existing
   * rating rather than storing a third 'none' state.
   */
  async setMessageFeedback(
    userId: string,
    conversationId: string,
    messageId: string,
    feedback: 'up' | 'down' | null,
  ): Promise<void> {
    const conversation = await this.conversationModel.findOne({
      _id: conversationId,
      userId,
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const result = await this.messageModel.updateOne(
      { _id: messageId, conversationId: conversation._id },
      feedback ? { feedback } : { $unset: { feedback: '' } },
    );
    if (result.matchedCount === 0) {
      throw new NotFoundException('Message not found');
    }
  }

  /**
   * Ownership-checked delete. Removes the thread's AiMessage docs too —
   * every message from here on is persisted via appendMessages
   * (BACKLOG.md B3), so this is a real cascade, not a preemptive no-op.
   */
  async deleteConversation(
    userId: string,
    conversationId: string,
  ): Promise<void> {
    const conversation = await this.conversationModel.findOneAndDelete({
      _id: conversationId,
      userId,
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    await this.messageModel.deleteMany({ conversationId: conversation._id });
  }
}
