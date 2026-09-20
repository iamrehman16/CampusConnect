import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { chatSocketService } from "@/features/chat/services/chat-socket.service";
import { useChatSocketContext } from "@/shared/hooks/useChatSocketContext";
import { useAuth } from "@/shared/hooks/useAuth";
import { applicationKeys } from "@/features/contributor-application/hooks/application.keys";
import { mentorshipKeys } from "@/features/mentorship/hooks/mentorship.hooks";
import { mentorKeys } from "@/features/contributors/hooks/mentor.hooks";
import { chatKeys } from "@/features/chat/hooks/chat-keys";
import { profileKeys } from "@/features/user/hooks/profile-keys";
import { notificationKeys } from "./notification.keys";

/**
 * App-wide realtime notification sync. Notifications ride the chat socket
 * (same `/chat` namespace, per-user room) — see NotificationGateway.
 * Mounted once under the authenticated layout.
 */
export function useNotificationSync(): void {
  const queryClient = useQueryClient();
  const { isConnected } = useChatSocketContext();
  const { refreshUser } = useAuth();

  useEffect(() => {
    if (!isConnected) return;

    const offNotification = chatSocketService.onNotification((notification) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      // New-message notifications are already surfaced by the messenger
      // unread badge; toasting each one would just be noise.
      if (notification.type.startsWith("contributor_application_")) {
        // Role may have changed server-side: refresh the session user so
        // contributor-only UI (uploads) appears without a re-login.
        void refreshUser();
        queryClient.invalidateQueries({ queryKey: applicationKeys.mine() });
      }
      if (notification.type.startsWith("mentorship_")) {
        // The other party changed a mentorship: refresh lists, badges, the
        // directory's slot counts and — on accept — the new chat thread.
        queryClient.invalidateQueries({ queryKey: mentorshipKeys.all });
        queryClient.invalidateQueries({ queryKey: mentorKeys.all });
        queryClient.invalidateQueries({ queryKey: profileKeys.all() });
        if (notification.type === "mentorship_accepted") {
          queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
        }
      }
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
  }, [isConnected, queryClient, refreshUser]);
}
