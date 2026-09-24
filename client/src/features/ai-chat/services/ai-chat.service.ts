// services/ai-chat.service.ts
import api from "@/shared/api/axios.instance";
import type { PaginatedResult } from "@/shared/types/api.types";
import type {
  AiConversationThread,
  ChatMessageDto,
  ChatResponseDto,
  Citation,
  ConversationMessage,
  MessageFeedback,
  RetrievalStatus,
} from "../types/ai-chat.dto";

// SSE event shapes emitted by the backend
export type SseTokenEvent = { type: "token"; token: string };
export type SseCitationsEvent = {
  type: "citations";
  citations: Citation[];
  retrievalStatus: RetrievalStatus;
  conversationId: string;
};
export type SseDoneEvent = { type: "done" };
// BACKLOG.md C1 — arrives after "done", once the server has persisted the
// assistant reply and knows its real AiMessage id (see ai-chat.service.ts
// on the server for why this can't be folded into "done" or "citations").
export type SseMessageSavedEvent = { type: "message-saved"; messageId: string };
export type SseErrorEvent = { type: "error"; message: string };
export type SseEvent =
  | SseTokenEvent
  | SseCitationsEvent
  | SseDoneEvent
  | SseMessageSavedEvent
  | SseErrorEvent;

// Server's AiConversation shape has more fields (summaryBuffer,
// recentMessages) the sidebar has no use for, and uses Mongoose's _id —
// normalize down to what the UI needs, same convention as chat-service.ts.
type RawThread = { _id?: string; id?: string; title: string; updatedAt: string };

function normalizeThread(thread: RawThread): AiConversationThread {
  return {
    id: thread.id ?? thread._id ?? "",
    title: thread.title,
    updatedAt: thread.updatedAt,
  };
}

// Server's AiMessage (BACKLOG.md B3) — no citations/retrievalStatus, those
// are transient SSE/response payload, never persisted per-message.
type RawMessage = {
  _id?: string;
  id?: string;
  role: "user" | "assistant";
  content: string;
  feedback?: MessageFeedback;
};

function normalizeMessage(message: RawMessage): ConversationMessage {
  return {
    id: message.id ?? message._id ?? "",
    role: message.role,
    content: message.content,
    feedback: message.feedback ?? null,
  };
}

// Full history a thread realistically has for this app's scale — a single
// page, not true infinite scroll (BACKLOG.md B8's acceptance criteria asks
// for history to reappear on open, not for scroll-back pagination; that
// would be its own PBI). Server returns newest-first (ConversationService
// convention); reversed here for chronological display.
const HISTORY_PAGE_LIMIT = 100;

export class AiChatService {
  async sendMessage(dto: ChatMessageDto): Promise<ChatResponseDto> {
    const { data } = await api.post<ChatResponseDto>("ai/chat", dto);
    return data;
  }

  async getThreads(): Promise<AiConversationThread[]> {
    const { data } = await api.get<RawThread[]>("ai/conversations");
    return data.map(normalizeThread);
  }

  async createThread(title?: string): Promise<AiConversationThread> {
    const { data } = await api.post<RawThread>(
      "ai/conversations",
      title ? { title } : {},
    );
    return normalizeThread(data);
  }

  async renameThread(
    conversationId: string,
    title: string,
  ): Promise<AiConversationThread> {
    const { data } = await api.patch<RawThread>(
      `ai/conversations/${conversationId}`,
      { title },
    );
    return normalizeThread(data);
  }

  async deleteThread(conversationId: string): Promise<void> {
    await api.delete(`ai/conversations/${conversationId}`);
  }

  async getMessages(conversationId: string): Promise<ConversationMessage[]> {
    const { data } = await api.get<PaginatedResult<RawMessage>>(
      `ai/conversations/${conversationId}/messages`,
      { params: { page: 1, limit: HISTORY_PAGE_LIMIT } },
    );
    return data.data.map(normalizeMessage).reverse();
  }

  async setMessageFeedback(
    conversationId: string,
    messageId: string,
    feedback: MessageFeedback | null,
  ): Promise<void> {
    await api.patch(
      `ai/conversations/${conversationId}/messages/${messageId}/feedback`,
      { feedback },
    );
  }

  async *streamMessage(
    dto: ChatMessageDto,
    signal: AbortSignal,
  ): AsyncGenerator<SseEvent> {
    const baseURL = (
      (import.meta.env.VITE_API_BASE_URL as string) ?? ""
    ).replace(/\/$/, "");
    const token = localStorage.getItem("accessToken") ?? "";

    const response = await fetch(`${baseURL}/api/ai/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
      signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`Stream failed: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const onAbort = () => {
      reader.cancel().catch(() => {});
    };

    if (signal.aborted) {
      onAbort();
    } else {
      signal.addEventListener("abort", onAbort);
    }

    try {
      while (true) {
        if (signal.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }
        
        // Wrap reader.read() to ensure it aggressively rejects immediately on abort.
        // Some environments/polyfills do not immediately unblock reader.read() when cancel() is called.
        const { done, value } = await new Promise<ReadableStreamReadResult<Uint8Array>>((resolve, reject) => {
          const abortHandler = () => reject(new DOMException("Aborted", "AbortError"));
          
          if (signal.aborted) {
            abortHandler();
            return;
          }
          
          signal.addEventListener("abort", abortHandler);
          
          reader.read().then(resolve, reject).finally(() => {
            signal.removeEventListener("abort", abortHandler);
          });
        });
        
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          const raw = line.slice(5).trim();
          try {
            yield JSON.parse(raw) as SseEvent;
          } catch {
            // malformed chunk — skip
          }
        }
      }
    } catch (err) {
      reader.cancel().catch(() => {});
      throw err; // re-throw so for await catch in the hook sees it
    } finally {
      signal.removeEventListener("abort", onAbort);
    }
  }
}

export const aiChatService = new AiChatService();
