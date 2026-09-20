import { Typography } from "@mui/material";
import { formatDistanceToNow } from "date-fns";
import type { ConversationParticipant } from "../types/chat-dto";
import { useChatPresenceStore } from "../store/chat-presence.store";

interface Props {
  participant?: ConversationParticipant;
  isTyping: boolean;
}

/** "typing…" > "Online" > "Last seen X ago" (renders nothing if unknown). */
export function PresenceStatus({ participant, isTyping }: Props) {
  const id = participant?.id;
  const online = useChatPresenceStore((s) => (id ? s.online[id] : false));
  const liveLastSeen = useChatPresenceStore((s) =>
    id ? s.lastSeen[id] : undefined,
  );

  const lastSeen = liveLastSeen ?? participant?.lastSeenAt ?? undefined;

  let label: string | null = null;
  if (isTyping) label = "typing…";
  else if (online) label = "Online";
  else if (lastSeen) {
    label = `Last seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}`;
  }

  if (!label) return null;

  return (
    <Typography
      variant="caption"
      color={isTyping || online ? "success.main" : "text.secondary"}
      display="block"
      lineHeight={1.2}
    >
      {label}
    </Typography>
  );
}
