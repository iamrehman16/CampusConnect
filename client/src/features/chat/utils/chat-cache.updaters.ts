import type { InfiniteData } from "@tanstack/react-query";
import type { PaginatedResult } from "@/shared/types/api.types";
import type { Message } from "../types/chat-dto";
import { chatKeys } from "../hooks/chat-keys";

export const chatCacheUpdaters = (queryClient: any) => ({
  // Optimistic append — called immediately on send, before server reply
  appendOptimistic(message: Message) {
    queryClient.setQueryData(
      chatKeys.messages(message.conversationId),
      (old: InfiniteData<PaginatedResult<Message>> | undefined) => {
        if (!old) return old;
        const [firstPage, ...rest] = old.pages;
        const updatedFirstPage: PaginatedResult<Message> = {
          ...firstPage,
          data: [message, ...firstPage.data],
          total: firstPage.total + 1,
        };
        return { ...old, pages: [updatedFirstPage, ...rest] };
      },
    );
    queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
  },

  // Server replica came back — find by clientId, patch with real server fields
  promoteMessage(conversationId: string, serverMessage: Message) {
    queryClient.setQueryData(
      chatKeys.messages(conversationId),
      (old: InfiniteData<PaginatedResult<Message>> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((msg) =>
              msg.clientId === serverMessage.clientId
                ? { ...serverMessage, _status: "SENT" as const }
                : msg,
            ),
          })),
        };
      },
    );
  },

  // Emit failed — flip status, keep message in place for retry
  markFailed(conversationId: string, clientId: string) {
    queryClient.setQueryData(
      chatKeys.messages(conversationId),
      (old: InfiniteData<PaginatedResult<Message>> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((msg) =>
              msg.clientId === clientId
                ? { ...msg, _status: "FAILED" as const }
                : msg,
            ),
          })),
        };
      },
    );
  },

  // Incoming message from another participant — normal prepend
  prependMessage(message: Message) {
    queryClient.setQueryData(
      chatKeys.messages(message.conversationId),
      (old: InfiniteData<PaginatedResult<Message>> | undefined) => {
        if (!old) return old;
        const [firstPage, ...rest] = old.pages;
        const updatedFirstPage: PaginatedResult<Message> = {
          ...firstPage,
          data: [message, ...firstPage.data],
          total: firstPage.total + 1,
        };
        return { ...old, pages: [updatedFirstPage, ...rest] };
      },
    );
    queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
  },

  markSeen(conversationId: string, seenBy: string) {
    queryClient.setQueryData(
      chatKeys.messages(conversationId),
      (old: InfiniteData<PaginatedResult<Message>> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((msg) =>
              msg.sender !== seenBy && !msg.seenAt
                ? { ...msg, seen: true, seenAt: new Date() }
                : msg,
            ),
          })),
        };
      },
    );
  },

  deleteMessage(conversationId: string, messageId: string) {
    queryClient.setQueryData(
      chatKeys.messages(conversationId),
      (old: InfiniteData<PaginatedResult<Message>> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((msg) =>
              msg.id === messageId ? { ...msg, isDeleted: true } : msg,
            ),
          })),
        };
      },
    );
  },

  isOwnReplica(conversationId: string, clientId?: string) {
    if (!clientId) return false;

    const cacheData = queryClient.getQueryData(
      chatKeys.messages(conversationId),
    ) as InfiniteData<PaginatedResult<Message>> | undefined;

    return (
      cacheData?.pages?.some((page) =>
        page.data.some((msg) => msg.clientId === clientId),
      ) ?? false
    );
  },

  markPending(conversationId: string, clientId: string) {
    queryClient.setQueryData(
      chatKeys.messages(conversationId),
      (old: InfiniteData<PaginatedResult<Message>> | undefined) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((msg) =>
              msg.clientId === clientId
                ? { ...msg, _status: "PENDING" as const }
                : msg,
            ),
          })),
        };
      },
    );
  },
});
