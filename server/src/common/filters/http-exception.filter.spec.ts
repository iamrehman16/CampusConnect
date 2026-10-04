import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { GlobalHttpExceptionFilter } from './http-exception.filter';

interface MockResponse {
  headersSent: boolean;
  writableEnded: boolean;
  status: jest.Mock;
  json: jest.Mock;
  end: jest.Mock;
}

function createHost(res: MockResponse): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => res,
      getRequest: () => ({ method: 'POST', url: '/api/ai/chat/stream' }),
    }),
  } as unknown as ArgumentsHost;
}

function createResponse(headersSent: boolean): MockResponse {
  const res: MockResponse = {
    headersSent,
    writableEnded: false,
    status: jest.fn(),
    json: jest.fn(),
    end: jest.fn(() => {
      res.writableEnded = true;
    }),
  };
  res.status.mockReturnValue(res);
  return res;
}

describe('GlobalHttpExceptionFilter', () => {
  const filter = new GlobalHttpExceptionFilter();
  const exception = new HttpException(
    'AI assistant is temporarily unavailable',
    HttpStatus.SERVICE_UNAVAILABLE,
  );

  it('sends a JSON error when headers are not yet sent', () => {
    const res = createResponse(false);

    filter.catch(exception, createHost(res));

    expect(res.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    expect(res.json).toHaveBeenCalledTimes(1);
  });

  it('ends the response instead of writing JSON when headers are already sent', () => {
    const res = createResponse(true);

    expect(() => filter.catch(exception, createHost(res))).not.toThrow();

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(res.end).toHaveBeenCalledTimes(1);
  });
});
