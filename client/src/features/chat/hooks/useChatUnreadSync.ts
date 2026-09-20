import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { chatSocketService } from "../services/chat-socket.service";
import { useChatSocketContext } from "@/shared/hooks/useChatSocketContext";
import { useAuth } from "@/shared/hooks/useAuth";
import { useChatUIStore } from "../store/chat-ui.store";
import { chatCacheUpdaters } from "../utils/chat-cache.updaters";
import { chatKeys } from "./chat-keys";

/**
 * App-wide unread sync. Mounted once under the authenticated layout so the
 * badge updates on every page — `useChatSocket` (message send/receive for an
 * open conversation) is only mounted on ConversationPage and can't do this.
 *
 * The server is the source of truth: on an incoming message we refetch the
 * conversation list (which carries `unreadCount`) instead of counting locally.
 */
export function useChatUnreadSync(): void {
  const queryClient = useQueryClient();
  const { isConnected } = useChatSocketContext();
  const { user } = useAuth();
  const currentUserId = user?._id;
  const cache = useMemo(() => chatCacheUpdaters(queryClient), [queryClient]);

  useEffect(() => {
    if (!isConnected || !currentUserId) return;

    const offNewMessage = chatSocketService.onNewMessage((message) => {
      if (message.sender === currentUserId) return;

      // The open conversation is marked seen by ConversationPage.
      const { activeConversationId } = useChatUIStore.getState();
      if (message.conversationId === activeConversationId) return;

      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    });

    const offMessagesSeen = chatSocketService.onMessagesSeen(
      ({ conversationId, seenBy }) => {
        if (seenBy !== currentUserId) return;
        cache.clearUnread(conversationId);
        // Authoritative refetch — guards against a stale in-flight list
        // response landing after the optimistic clear.
        queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
      },
    );

    return () => {
      offNewMessage();
      offMessagesSeen();
    };
  }, [isConnected, currentUserId, queryClient, cache]);
}
