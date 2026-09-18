import { EventEmitter } from 'events';
import { Subject } from 'rxjs';
import { AiController } from './ai.controller';
import { AiChatService } from './services/ai-chat.service';

function createMockResponse() {
  const res: any = new EventEmitter();
  res.writableEnded = false;
  res.setHeader = jest.fn();
  res.flushHeaders = jest.fn();
  res.write = jest.fn();
  res.end = jest.fn(() => {
    res.writableEnded = true;
  });
  return res;
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
    const req: any = new EventEmitter();
    req.user = { id: 'user-1' };
    const res = createMockResponse();

    await controller.stream(req, { message: 'hi' } as any, res);

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
    const req: any = new EventEmitter();
    req.user = { id: 'user-1' };
    const res = createMockResponse();

    await controller.stream(req, { message: 'hi' } as any, res);

    subject.complete();
    expect(res.end).toHaveBeenCalledTimes(1);

    expect(() => req.emit('close')).not.toThrow();
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  it('does not write or re-end the response when an error arrives after disconnect', async () => {
    const req: any = new EventEmitter();
    req.user = { id: 'user-1' };
    const res = createMockResponse();

    await controller.stream(req, { message: 'hi' } as any, res);

    req.emit('close');
    expect(res.end).toHaveBeenCalledTimes(1);

    expect(() => subject.error(new Error('late error'))).not.toThrow();
    expect(res.write).not.toHaveBeenCalled();
    expect(res.end).toHaveBeenCalledTimes(1);
  });
});
