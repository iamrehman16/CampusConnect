import { Injectable } from '@nestjs/common';
import { GroqService } from './groq.service';
import { ConversationService } from './conversation.service';
import { RetrievalService } from './retrieval.service';
import {
  Citation,
  ChatResponse,
} from '../interfaces/retrieved-context.interface';
import { Observable } from 'rxjs';

@Injectable()
export class AiChatService {
  constructor(
    private readonly groqService: GroqService,
    private readonly conversationService: ConversationService,
    private readonly retrievalService: RetrievalService,
  ) {}

  async getChatResponse(
    userId: string,
    message: string,
  ): Promise<ChatResponse> {
    const [session, context] = await Promise.all([
      this.conversationService.getOrCreateSession(userId),
      this.retrievalService.retrieve(message),
    ]);

    const messages = this.groqService.buildMessages(
      session.summaryBuffer,
      session.recentMessages,
      message,
      context,
    );

    const answer = await this.groqService.generateResponse(messages);

    await this.conversationService.appendMessages(
      userId,
      message,
      answer,
      this.groqService.summarize.bind(this.groqService),
    );

    const citations: Citation[] = context.map((c) => ({
      title: c.title,
      pageNumber: c.pageNumber,
      semester: c.semester,
      course: c.course,
      resourceId: c.resourceId,
    }));

    return { answer, citations };
  }

  async streamChatResponse(
    userId: string,
    message: string,
  ): Promise<Observable<MessageEvent>> {
    const [session, context] = await Promise.all([
      this.conversationService.getOrCreateSession(userId),
      this.retrievalService.retrieve(message),
    ]);

    const messages = this.groqService.buildMessages(
      session.summaryBuffer,
      session.recentMessages,
      message,
      context,
    );

    const stream = await this.groqService.generateStream(messages);

    const citations: Citation[] = context.map((c) => ({
      title: c.title,
      pageNumber: c.pageNumber,
      semester: c.semester,
      course: c.course,
      resourceId: c.resourceId,
    }));

    return new Observable<MessageEvent>((observer) => {
      (async () => {
        let fullAnswer = '';
        try {
          for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content ?? '';
            if (token) {
              fullAnswer += token;
              observer.next({ data: { type: 'token', token } } as MessageEvent);
            }
          }
          // Stream complete — emit citations then done
          observer.next({
            data: { type: 'citations', citations },
          } as MessageEvent);
          observer.next({ data: { type: 'done' } } as MessageEvent);

          // Persist to conversation history after full answer is assembled
          await this.conversationService.appendMessages(
            userId,
            message,
            fullAnswer,
            this.groqService.summarize.bind(this.groqService),
          );

          observer.complete();
        } catch (err) {
          observer.error(err);
        }
      })();
    });
  }

  async clearSession(userId: string): Promise<void> {
    await this.conversationService.clearSession(userId);
  }
}
