import toast from "react-hot-toast";
import { io, Socket } from "socket.io-client";
import type { Notification } from "@/features/notifications/types/notification.dto";
import api from "@/shared/api/axios.instance";
import { config } from "@/shared/constants/config";
import { tokenStorage } from "@/shared/utils/storage";
import type {
  CreateMessageDto,
  DeleteMessageDto,
  MarkSeenDto,
  Message,
  PresenceEvent,
  TypingEvent,
} from "../types/chat-dto";

type Listener<T> = (payload: T) => void;

// `clientId`/`conversationId` are only present for send_message failures —
// other chat_error sources (join/markSeen/delete) carry just a message.
interface ChatErrorPayload {
  message: string;
  clientId?: string;
  conversationId?: string;
}

// Backoff for re-authenticating after the server drops us (BACKLOG.md J4).
const REAUTH_DELAY_MS = 1000;
const MAX_REAUTH_ATTEMPTS = 3;

class ChatSocketService {
  private socket: Socket | null = null;
  private reauthAttempts = 0;
  private reauthenticating = false;

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  connect(token: string): Socket {
    if (this.socket) {
      if (!this.socket.connected) {
        this.socket.connect();
      }

      return this.socket;
    }

    this.socket = io(`${config.socketUrl}/chat`, {
      // A function, evaluated on every (re)connection attempt: after a token
      // refresh the stored access token is newer than the one this socket was
      // created with, and a fixed object would keep presenting the expired one.
      auth: (cb) => cb({ token: tokenStorage.getAccessToken() ?? token }),
      transports: ["polling", "websocket"],
      reconnection: true,
    });

    this.socket.on("connect", () => {
      this.reauthAttempts = 0;
    });

    this.socket.on("connect_error", (err) => {
      console.error("[ChatSocket] connection error:", err.message);
      void this.recoverFromAuthFailure();
    });

    // The server disconnects sockets whose token it rejects; socket.io does
    // not auto-reconnect after a server-initiated disconnect.
    this.socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        void this.recoverFromAuthFailure();
      }
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

  /**
   * An expired access token makes the handshake fail. Any authenticated API
   * call refreshes it through the axios interceptor, after which the socket
   * can reconnect with the new token. Bounded, so a genuinely invalid
   * session doesn't loop.
   */
  private async recoverFromAuthFailure(): Promise<void> {
    const socket = this.socket;
    if (!socket || this.reauthenticating) return;
    if (this.reauthAttempts >= MAX_REAUTH_ATTEMPTS) return;
    if (!tokenStorage.getAccessToken()) return;

    this.reauthenticating = true;
    this.reauthAttempts += 1;
    try {
      await new Promise((resolve) => setTimeout(resolve, REAUTH_DELAY_MS));
      await api.get("/users/profile");
      if (this.socket === socket && !socket.connected) socket.connect();
    } catch (err) {
      console.error("[ChatSocket] re-authentication failed:", err);
    } finally {
      this.reauthenticating = false;
    }
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

  /** Ids of conversation partners currently online (server ack). */
  getOnlinePartners(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket not connected"));
        return;
      }
      this.socket
        .timeout(5000)
        .emit("get_presence", (err: Error | null, ids: string[]) =>
          err ? reject(err) : resolve(ids),
        );
    });
  }

  emitTyping(conversationId: string, isTyping: boolean): void {
    if (!this.socket) {
      throw new Error("Socket not connected");
    }
    this.socket.emit("typing", { conversationId, isTyping });
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

  onPresence(cb: Listener<PresenceEvent>): () => void {
    if (!this.socket) {
      throw new Error("Socket not connected");
    }
    this.socket.on("presence", cb);
    return () => this.socket?.off("presence", cb);
  }

  onTyping(cb: Listener<TypingEvent>): () => void {
    if (!this.socket) {
      throw new Error("Socket not connected");
    }
    this.socket.on("typing", cb);
    return () => this.socket?.off("typing", cb);
  }

  // Notifications share this socket (server: NotificationGateway, same
  // `/chat` namespace) — typed here so the singleton stays the only place
  // that touches the raw socket.
  onNotification(cb: Listener<Notification>): () => void {
    if (!this.socket) {
      throw new Error("Socket not connected");
    }
    this.socket.on("notification", cb);
    return () => this.socket?.off("notification", cb);
  }

  onNotificationUnreadCount(cb: Listener<{ count: number }>): () => void {
    if (!this.socket) {
      throw new Error("Socket not connected");
    }
    this.socket.on("notification_unread_count", cb);
    return () => this.socket?.off("notification_unread_count", cb);
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
