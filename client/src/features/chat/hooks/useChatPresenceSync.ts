import { useEffect } from "react";
import { chatSocketService } from "../services/chat-socket.service";
import { useChatSocketContext } from "@/shared/hooks/useChatSocketContext";
import { useChatPresenceStore } from "../store/chat-presence.store";

/** App-wide presence listeners; mounted once under the authenticated layout. */
export function useChatPresenceSync(): void {
  const { isConnected } = useChatSocketContext();

  useEffect(() => {
    if (!isConnected) return;

    const { setSnapshot, setPresence, reset } = useChatPresenceStore.getState();

    // Register the live listener first, then pull the snapshot, so no
    // presence change can fall between the two.
    let cancelled = false;
    const offPresence = chatSocketService.onPresence(
      ({ userId, online, lastSeenAt }) => setPresence(userId, online, lastSeenAt),
    );

    chatSocketService
      .getOnlinePartners()
      .then((ids) => {
        if (!cancelled) setSnapshot(ids);
      })
      .catch((err: unknown) => {
        console.error("[ChatPresence] snapshot failed:", err);
      });

    return () => {
      cancelled = true;
      offPresence();
      // Our own socket dropped — presence we hold is no longer trustworthy.
      reset();
    };
  }, [isConnected]);
}
