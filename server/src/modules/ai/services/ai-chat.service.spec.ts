import { Types } from 'mongoose';
import { AiChatService } from './ai-chat.service';
import { GroqService } from './groq.service';
import { ConversationService } from './conversation.service';
import { RetrievalService } from './retrieval.service';
import {
  Citation,
  RetrievedContext,
} from '../interfaces/retrieved-context.interface';

type CitationsSseData = { type: 'citations'; citations: Citation[] };

function chunk(
  resourceId: string,
  pageNumber: number,
  score: number,
): RetrievedContext {
  return {
    text: `chunk text page ${pageNumber}`,
    pageNumber,
    title: `Resource ${resourceId}`,
    resourceId,
    semester: 3,
    course: 'CS101',
    score,
  };
}

function buildService(context: RetrievedContext[]) {
  const groqService: Partial<GroqService> = {
    buildMessages: jest.fn().mockReturnValue([]),
    generateResponse: jest.fn().mockResolvedValue('the answer'),
    summarize: jest.fn().mockResolvedValue('summary'),
    generateTitle: jest.fn().mockResolvedValue('a title'),
    generateStream: jest.fn().mockResolvedValue(
      (async function* () {
        // no token chunks needed for this test
      })(),
    ),
  };
  const conversationService: Partial<ConversationService> = {
    getOrCreateConversation: jest.fn().mockResolvedValue({
      _id: new Types.ObjectId(),
      summaryBuffer: '',
      recentMessages: [],
    }),
    appendMessages: jest.fn().mockResolvedValue(undefined),
    maybeGenerateTitle: jest.fn().mockResolvedValue(undefined),
  };
  const retrievalService: Partial<RetrievalService> = {
    retrieve: jest.fn().mockResolvedValue({ context, status: 'ok' }),
  };

  return new AiChatService(
    groqService as GroqService,
    conversationService as ConversationService,
    retrievalService as RetrievalService,
  );
}

describe('AiChatService — citation deduplication', () => {
  it('getChatResponse dedupes multiple chunks from the same resource, keeping the highest-scoring page', async () => {
    const service = buildService([
      chunk('resource-1', 3, 0.92),
      chunk('resource-1', 7, 0.81),
      chunk('resource-2', 1, 0.75),
    ]);

    const { citations } = await service.getChatResponse('user-1', 'query');

    expect(citations).toHaveLength(2);
    expect(citations.map((c) => c.resourceId)).toEqual([
      'resource-1',
      'resource-2',
    ]);
    expect(citations[0].pageNumber).toBe(3); // highest-scoring chunk's page
  });

  it('streamChatResponse emits deduped citations on the SSE citations event', async () => {
    const service = buildService([
      chunk('resource-1', 3, 0.92),
      chunk('resource-1', 7, 0.81),
    ]);

    const observable = await service.streamChatResponse('user-1', 'query');

    const citationsEvent = await new Promise<CitationsSseData>(
      (resolve, reject) => {
        observable.subscribe({
          next: (event: MessageEvent) => {
            const data = event.data as { type: string };
            if (data.type === 'citations') {
              resolve(data as CitationsSseData);
            }
          },
          error: reject,
        });
      },
    );

    expect(citationsEvent.citations).toHaveLength(1);
    expect(citationsEvent.citations[0].resourceId).toBe('resource-1');
    expect(citationsEvent.citations[0].pageNumber).toBe(3);
  });
});

function buildServiceWithConversation(recentMessages: unknown[]) {
  const conversation = {
    _id: new Types.ObjectId(),
    summaryBuffer: '',
    recentMessages,
  };
  const conversationService: Partial<ConversationService> = {
    getOrCreateConversation: jest.fn().mockResolvedValue(conversation),
    appendMessages: jest.fn().mockResolvedValue(undefined),
    maybeGenerateTitle: jest.fn().mockResolvedValue(undefined),
  };
  const groqService: Partial<GroqService> = {
    buildMessages: jest.fn().mockReturnValue([]),
    generateResponse: jest.fn().mockResolvedValue('the answer'),
    summarize: jest.fn().mockResolvedValue('summary'),
    generateTitle: jest.fn().mockResolvedValue('a title'),
  };
  const retrievalService: Partial<RetrievalService> = {
    retrieve: jest.fn().mockResolvedValue({ context: [], status: 'ok' }),
  };

  return {
    service: new AiChatService(
      groqService as GroqService,
      conversationService as ConversationService,
      retrievalService as RetrievalService,
    ),
    conversation,
    conversationService,
  };
}

describe('AiChatService — auto-title on first exchange (B4)', () => {
  it('getChatResponse triggers title generation for a brand-new thread', async () => {
    const { service, conversation, conversationService } =
      buildServiceWithConversation([]);

    await service.getChatResponse('user-1', 'query');

    expect(conversationService.maybeGenerateTitle).toHaveBeenCalledWith(
      conversation,
      'query',
      expect.any(Function),
    );
  });

  it('getChatResponse does not trigger title generation for a thread that already has history', async () => {
    const { service, conversationService } = buildServiceWithConversation([
      { role: 'user', content: 'earlier', timestamp: new Date() },
    ]);

    await service.getChatResponse('user-1', 'query');

    expect(conversationService.maybeGenerateTitle).not.toHaveBeenCalled();
  });
});
