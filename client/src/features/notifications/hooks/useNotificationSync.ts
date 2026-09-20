import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { chatSocketService } from "@/features/chat/services/chat-socket.service";
import { useChatSocketContext } from "@/shared/hooks/useChatSocketContext";
import { notificationKeys } from "./notification.keys";

/**
 * App-wide realtime notification sync. Notifications ride the chat socket
 * (same `/chat` namespace, per-user room) — see NotificationGateway.
 * Mounted once under the authenticated layout.
 */
export function useNotificationSync(): void {
  const queryClient = useQueryClient();
  const { isConnected } = useChatSocketContext();

  useEffect(() => {
    if (!isConnected) return;

    const offNotification = chatSocketService.onNotification((notification) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      // New-message notifications are already surfaced by the messenger
      // unread badge; toasting each one would just be noise.
      if (notification.type !== "new_message") {
        toast(`${notification.title}: ${notification.body}`, { icon: "🔔" });
      }
    });

    const offUnreadCount = chatSocketService.onNotificationUnreadCount(
      ({ count }) => {
        queryClient.setQueryData(notificationKeys.unreadCount(), count);
        queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
      },
    );

    return () => {
      offNotification();
      offUnreadCount();
    };
  }, [isConnected, queryClient]);
}
