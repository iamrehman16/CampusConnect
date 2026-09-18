import { EventEmitter } from 'events';
import { Subject } from 'rxjs';
import { Response } from 'express';
import { AiController, AuthenticatedRequest } from './ai.controller';
import { AiChatService } from './services/ai-chat.service';
import { ChatMessageDto } from './dto/chat-message.dto';

type MockResponse = EventEmitter & {
  writableEnded: boolean;
  setHeader: jest.Mock;
  flushHeaders: jest.Mock;
  write: jest.Mock;
  end: jest.Mock;
};

// Test double for Express's Response — only the members the controller
// actually touches are implemented, cast to Response at the call boundary.
function createMockResponse(): MockResponse {
  const res = new EventEmitter() as MockResponse;
  res.writableEnded = false;
  res.setHeader = jest.fn();
  res.flushHeaders = jest.fn();
  res.write = jest.fn();
  res.end = jest.fn(() => {
    res.writableEnded = true;
  });
  return res;
}

type MockRequest = EventEmitter & { user: { id: string } };

function createMockRequest(): MockRequest {
  const req = new EventEmitter() as MockRequest;
  req.user = { id: 'user-1' };
  return req;
}

describe('AiController', () => {
  let controller: AiController;
  let aiChatService: Partial<AiChatService>;
  let subject: Subject<MessageEvent>;

  beforeEach(() => {
    subject = new Subject<MessageEvent>();
    aiChatService = {
      streamChatResponse: jest.fn().mockResolvedValue(subject.asObservable()),
    };
    controller = new AiController(aiChatService as AiChatService);
  });

  it('unsubscribes and stops writing once the client disconnects mid-stream', async () => {
    const req = createMockRequest();
    const res = createMockResponse();

    await controller.stream(
      req as unknown as AuthenticatedRequest,
      { message: 'hi' } as ChatMessageDto,
      res as unknown as Response,
    );

    req.emit('close');

    expect(subject.observed).toBe(false);
    expect(res.end).toHaveBeenCalledTimes(1);

    // A late emission after disconnect must not throw or write to the
    // already-ended response (ERR_HTTP_HEADERS_SENT regression guard).
    expect(() =>
      subject.next({ data: 'late-event' } as unknown as MessageEvent),
    ).not.toThrow();
    expect(res.write).not.toHaveBeenCalled();
  });

  it('does not double-end the response when close fires after complete', async () => {
    const req = createMockRequest();
    const res = createMockResponse();

    await controller.stream(
      req as unknown as AuthenticatedRequest,
      { message: 'hi' } as ChatMessageDto,
      res as unknown as Response,
    );

    subject.complete();
    expect(res.end).toHaveBeenCalledTimes(1);

    expect(() => req.emit('close')).not.toThrow();
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  it('does not write or re-end the response when an error arrives after disconnect', async () => {
    const req = createMockRequest();
    const res = createMockResponse();

    await controller.stream(
      req as unknown as AuthenticatedRequest,
      { message: 'hi' } as ChatMessageDto,
      res as unknown as Response,
    );

    req.emit('close');
    expect(res.end).toHaveBeenCalledTimes(1);

    expect(() => subject.error(new Error('late error'))).not.toThrow();
    expect(res.write).not.toHaveBeenCalled();
    expect(res.end).toHaveBeenCalledTimes(1);
  });
});
