import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import { chatSocketService } from "../services/chat-socket.service";
import { useChatSocketContext } from "@/shared/hooks/useChatSocketContext";
import { chatCacheUpdaters } from "../utils/chat-cache.updaters";
import type { CreateMessageDto, Message, DeleteMessageDto } from "../types/chat-dto";
import { useAuth } from "@/shared/hooks/useAuth";
import { chatEventHandlers } from "../utils/chatEventHandler";
import { useChatUIStore } from "../store/chat-ui.store";

const SEND_TIMEOUT_MS = 6000;

export function useChatSocket() {
  const queryClient = useQueryClient();
  const { isConnected } = useChatSocketContext();
  const { user } = useAuth();
  const currentUserId = user?._id!;
  const cache = useMemo(() => chatCacheUpdaters(queryClient), [queryClient]);

  const pendingTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // ─── Timeout helpers ───────────────────────────────────────────────────────

  const clearSendTimeout = useCallback((clientId: string) => {
    const timeout = pendingTimeouts.current.get(clientId);
    if (timeout) {
      clearTimeout(timeout);
      pendingTimeouts.current.delete(clientId);
    }
  }, []);

  const startSendTimeout = useCallback(
    (clientId: string, conversationId: string) => {
      clearSendTimeout(clientId); // Clean up existing if retrying
      const timeout = setTimeout(() => {
        pendingTimeouts.current.delete(clientId);
        cache.markFailed(conversationId, clientId);
      }, SEND_TIMEOUT_MS);

      pendingTimeouts.current.set(clientId, timeout);
    },
    [cache, clearSendTimeout],
  );

  // ─── Shared Emission Logic ────────────────────────────────────────────────

  const performSend = useCallback(
    (clientId: string, dto: Omit<CreateMessageDto, "clientId">) => {
      try {
        chatSocketService.sendMessage({ ...dto, clientId }, (serverMessage: Message) => {
          clearSendTimeout(clientId);
          cache.promoteMessage(dto.conversationId, serverMessage);
        });
        startSendTimeout(clientId, dto.conversationId);
      } catch (error) {
        cache.markFailed(dto.conversationId, clientId);
      }
    },
    [cache, startSendTimeout, clearSendTimeout],
  );

  // ─── Socket listeners ──────────────────────────────────────────────────────

  const handlers = useMemo(() => chatEventHandlers(cache), [cache]);

  useEffect(() => {
    if (!isConnected) return;

    const offNewMessage = chatSocketService.onNewMessage((message) => {
      handlers.handleIncomingMessage(message, clearSendTimeout);

      const { activeConversationId } = useChatUIStore.getState();
      if (
        message.sender !== currentUserId &&
        message.conversationId === activeConversationId
      ) {
        chatSocketService.markSeen(message.conversationId);
      }
    });

    const offMessagesSeen = chatSocketService.onMessagesSeen(({ conversationId, seenBy }) => {
      cache.markSeen(conversationId, seenBy);
    });

    const offMessageDeleted = chatSocketService.onMessageDeleted(({ conversationId, messageId }) => {
      cache.deleteMessage(conversationId, messageId);
    });

    return () => {
      offNewMessage();
      offMessagesSeen();
      offMessageDeleted();
    };
  }, [isConnected, handlers, cache, clearSendTimeout, currentUserId]);

  // ─── Emitters ──────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    (dto: Omit<CreateMessageDto, "clientId">): string => {
      const clientId = uuidv4();

      cache.appendOptimistic({
        clientId,
        id: "",
        conversationId: dto.conversationId,
        sender: currentUserId,
        content: dto.content,
        seenAt: null,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        _status: "PENDING",
      });

      performSend(clientId, dto);
      return clientId;
    },
    [cache, currentUserId, performSend],
  );

  const retryMessage = useCallback(
    (clientId: string, dto: Omit<CreateMessageDto, "clientId">): void => {
      cache.markPending(dto.conversationId, clientId);
      performSend(clientId, dto);
    },
    [cache, performSend],
  );

  const joinConversation = useCallback(
    (id: string) => chatSocketService.joinConversation(id),
    [],
  );

  const markSeen = useCallback(
    (id: string) => chatSocketService.markSeen(id),
    [],
  );

  const deleteMessage = useCallback(
    (dto: DeleteMessageDto) => chatSocketService.deleteMessage(dto),
    [],
  );

  return {
    joinConversation,
    sendMessage,
    retryMessage,
    markSeen,
    deleteMessage,
  };
}
