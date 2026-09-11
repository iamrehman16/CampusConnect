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

    this.socket.on("chat_error", (err: { message: string }) => {
      toast.error(err.message);
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
}

// Module-level singleton — same pattern as chatService
export const chatSocketService = new ChatSocketService();
