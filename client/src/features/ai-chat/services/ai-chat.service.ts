// services/ai-chat.service.ts
import api from "@/shared/api/axios.instance";
import type {
  ChatMessageDto,
  ChatResponseDto,
  Citation,
} from "../types/ai-chat.dto";

// SSE event shapes emitted by the backend
export type SseTokenEvent = { type: "token"; token: string };
export type SseCitationsEvent = { type: "citations"; citations: Citation[] };
export type SseDoneEvent = { type: "done" };
export type SseErrorEvent = { type: "error"; message: string };
export type SseEvent =
  | SseTokenEvent
  | SseCitationsEvent
  | SseDoneEvent
  | SseErrorEvent;

export class AiChatService {
  async sendMessage(dto: ChatMessageDto): Promise<ChatResponseDto> {
    const { data } = await api.post<ChatResponseDto>("ai/chat", dto);
    return data;
  }

  async clearSession(): Promise<void> {
    await api.delete("ai/chat/session");
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
            console.log("[GENERATOR RESUMED]", signal.aborted);
          } catch {
            // malformed chunk — skip
          }
        }
      }
    } catch (err) {
      console.log(
        "[SERVICE CATCH]",
        err,
        err instanceof DOMException,
        (err as any)?.name,
      );
      reader.cancel().catch(() => {});
      throw err; // re-throw so for await catch in the hook sees it
    } finally {
      signal.removeEventListener("abort", onAbort);
    }
  }
}

export const aiChatService = new AiChatService();
