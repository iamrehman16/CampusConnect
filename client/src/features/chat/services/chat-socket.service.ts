import toast from "react-hot-toast";
import { io, Socket } from "socket.io-client";
import { config } from "@/shared/constants/config";
import type {
  CreateMessageDto,
  DeleteMessageDto,
  MarkSeenDto,
  Message,
} from "../types/chat-dto";

type Listener<T> = (payload: T) => void;

// `clientId`/`conversationId` are only present for send_message failures —
// other chat_error sources (join/markSeen/delete) carry just a message.
interface ChatErrorPayload {
  message: string;
  clientId?: string;
  conversationId?: string;
}

class ChatSocketService {
  private socket: Socket | null = null;

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  connect(token: string): Socket {
    if (this.socket) {
      this.socket.auth = { token };

      if (!this.socket.connected) {
        this.socket.connect();
      }

      return this.socket;
    }

    this.socket = io(`${config.socketUrl}/chat`, {
      auth: { token },
      transports: ["polling", "websocket"],
      reconnection: true,
    });

    this.socket.on("connect_error", (err) => {
      console.error("[ChatSocket] connection error:", err.message);
    });

    this.socket.on("chat_error", (err: ChatErrorPayload) => {
      // Send-message failures carry a clientId and are reconciled onto the
      // specific optimistic message by useChatSocket's onChatError
      // subscription instead — a generic toast here would be redundant
      // with (and disconnected from) that per-message failed state.
      if (!err.clientId) {
        toast.error(err.message);
      }
    });

    return this.socket;
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  // ─── Emitters ─────────────────────────────────────────────────────────────

  joinConversation(conversationId: string): void {
    if (!this.socket) {
      throw new Error("Socket not connected");
    }
    this.socket.emit("join_conversation", conversationId);
  }

  sendMessage(dto: CreateMessageDto, onAck: (message: Message) => void): void {
    if (!this.socket) {
      throw new Error("Socket not connected");
    }
    this.socket.emit("send_message", dto, onAck);
  }

  markSeen(conversationId: string): void {
    if (!this.socket) {
      throw new Error("Socket not connected");
    }
    this.socket.emit("mark_seen", conversationId);
  }

  deleteMessage(dto: DeleteMessageDto): void {
    if (!this.socket) {
      throw new Error("Socket not connected");
    }
    this.socket.emit("delete_message", dto);
  }

  // ─── Typed listeners (return cleanup fn) ──────────────────────────────────

  onNewMessage(cb: Listener<Message>): () => void {
    if (!this.socket) {
      throw new Error("Socket not connected");
    }
    this.socket.on("new_message", cb);
    return () => this.socket?.off("new_message", cb);
  }

  onMessagesSeen(cb: Listener<MarkSeenDto>): () => void {
    if (!this.socket) {
      throw new Error("Socket not connected");
    }
    this.socket.on("messages_seen", cb);
    return () => this.socket?.off("messages_seen", cb);
  }

  onMessageDeleted(cb: Listener<DeleteMessageDto>): () => void {
    if (!this.socket) {
      throw new Error("Socket not connected");
    }
    this.socket.on("message_deleted", cb);
    return () => this.socket?.off("message_deleted", cb);
  }

  // Only fires for send_message failures (payload carries clientId) — see
  // the `chat_error` handler in connect() for why other chat_error sources
  // aren't routed through here.
  onSendMessageError(
    cb: Listener<Required<Pick<ChatErrorPayload, "clientId" | "conversationId">>>,
  ): () => void {
    if (!this.socket) {
      throw new Error("Socket not connected");
    }
    const handler = (err: ChatErrorPayload) => {
      if (err.clientId && err.conversationId) {
        cb({ clientId: err.clientId, conversationId: err.conversationId });
      }
    };
    this.socket.on("chat_error", handler);
    return () => this.socket?.off("chat_error", handler);
  }
}

// Module-level singleton — same pattern as chatService
export const chatSocketService = new ChatSocketService();
