import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ConversationSession,
  ConversationSessionDocument,
} from '../schema/conversation-session.schema';

@Injectable()
export class ConversationService {
  private readonly RECENT_LIMIT = 6;
  private readonly SUMMARIZE_BATCH = 3;

  constructor(
    @InjectModel(ConversationSession.name)
    private readonly sessionModel: Model<ConversationSessionDocument>,
  ) {}

  async getOrCreateSession(
    userId: string,
  ): Promise<ConversationSessionDocument> {
    const session = await this.sessionModel.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId, summaryBuffer: '', recentMessages: [] } },
      { upsert: true, new: true },
    );
    return session;
  }

  async appendMessages(
    userId: string,
    userMessage: string,
    assistantMessage: string,
    summarizeFn: (content: string) => Promise<string>,
  ): Promise<void> {
    const session = await this.getOrCreateSession(userId);

    session.recentMessages.push(
      { role: 'user', content: userMessage, timestamp: new Date() },
      { role: 'assistant', content: assistantMessage, timestamp: new Date() },
    );

    await this.maybeCompressSummary(session, summarizeFn);

    await session.save();
  }

  private async maybeCompressSummary(
    session: ConversationSessionDocument,
    summarizeFn: (content: string) => Promise<string>,
  ): Promise<void> {
    const exchangeCount = Math.floor(session.recentMessages.length / 2);

    if (exchangeCount <= this.RECENT_LIMIT) return;

    const messagesToCompress = session.recentMessages.splice(
      0,
      this.SUMMARIZE_BATCH * 2,
    );

    const rawText = messagesToCompress
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const prompt = session.summaryBuffer
      ? `You are a conversation summarizer. Return only the summary text, no preamble, no labels, no explanation.
     Existing summary: "${session.summaryBuffer}"
     New messages to merge in:
     ${rawText}
     Produce a single concise summary (2-3 sentences max) that captures everything.`
      : `Summarize these messages in 2-3 sentences. Return only the summary text, no preamble or explanation:
     ${rawText}`;
    session.summaryBuffer = await summarizeFn(prompt);
  }

  async clearSession(userId: string): Promise<void> {
    await this.sessionModel.findOneAndUpdate(
      { userId },
      { summaryBuffer: '', recentMessages: [] },
    );
  }
}
