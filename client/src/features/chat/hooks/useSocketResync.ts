import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChatSocketContext } from "@/shared/hooks/useChatSocketContext";
import { notificationKeys } from "@/features/notifications/hooks/notification.keys";
import { chatKeys } from "./chat-keys";

/**
 * App-wide. Socket events are not replayed, so anything that arrived while
 * the connection was down (messages, unread counts, notifications) was missed.
 * When the socket comes back after a drop, refetch from the server, which is
 * the source of truth (BACKLOG.md J4). The first connection of a session is
 * not a reconnect, and the queries are fresh then.
 */
export function useSocketResync(): void {
  const queryClient = useQueryClient();
  const { isConnected } = useChatSocketContext();
  const hasBeenConnected = useRef(false);
  const wasConnected = useRef(false);

  useEffect(() => {
    if (isConnected && hasBeenConnected.current && !wasConnected.current) {
      void queryClient.invalidateQueries({ queryKey: chatKeys.all });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    }
    if (isConnected) hasBeenConnected.current = true;
    wasConnected.current = isConnected;
  }, [isConnected, queryClient]);
}
