import { useMemo, useState } from "react";
import { ListSkeleton } from "@/shared/components/feedback/ListSkeleton";
import { Box, List, Typography } from "@mui/material";
import {
  ChatBubbleOutline as ChatBubbleOutlineIcon,
  EditOutlined as EditOutlinedIcon,
} from "@/shared/icons";
import InlineError from "@/shared/components/feedback/InlineError";
import { ListPaneHeader } from "@/shared/components/layout/ListPane";
import { useNavigate, useParams } from "react-router-dom";
import {
  useDeleteThread,
  useRenameThread,
  useThreadsQuery,
} from "../hooks/ai-chat.hooks";
import { ThreadListItem } from "./ThreadListItem";
import { ROUTES } from "@/shared/constants/routes";

interface ThreadSidebarProps {
  // Called after navigating away from a click inside the sidebar — the
  // mobile drawer instance uses this to close itself.
  onNavigate?: () => void;
}

export function ThreadSidebar({ onNavigate }: ThreadSidebarProps) {
  const navigate = useNavigate();
  const { conversationId: activeId } = useParams();
  const { data: threads, isLoading, isError, refetch } = useThreadsQuery();
  const { mutate: renameThread } = useRenameThread();
  const { mutate: deleteThread } = useDeleteThread();

  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? (threads ?? []).filter((t) => t.title.toLowerCase().includes(q)) : (threads ?? []);
  }, [threads, query]);

  const goTo = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <ListPaneHeader
        title="Ask AI"
        actionLabel="New chat"
        actionIcon={<EditOutlinedIcon fontSize="small" />}
        onAction={() => goTo(ROUTES.AI_CHAT)}
        search={
          threads?.length
            ? { value: query, onChange: setQuery, placeholder: "Search chats" }
            : undefined
        }
      />

      {isLoading ? (
        <Box sx={{ px: 2 }}>
          <ListSkeleton count={6} avatar={false} compact />
        </Box>
      ) : isError && !threads ? (
        <Box sx={{ pt: 2 }}>
          <InlineError compact message="Couldn't load your chats." onRetry={refetch} />
        </Box>
      ) : !threads?.length ? (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            px: 3,
            textAlign: "center",
          }}
        >
          <ChatBubbleOutlineIcon sx={{ fontSize: 28, color: "text.secondary" }} />
          <Typography variant="body2" color="text.secondary">
            No chats yet — start a new one.
          </Typography>
        </Box>
      ) : filtered.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ px: 2.5, py: 3, textAlign: "center" }}>
          No chats match “{query.trim()}”.
        </Typography>
      ) : (
        <List disablePadding sx={{ flex: 1, overflowY: "auto", px: 1, pb: 1 }}>
          {filtered.map((thread) => (
            <ThreadListItem
              key={thread.id}
              thread={thread}
              isActive={thread.id === activeId}
              onClick={() => goTo(`${ROUTES.AI_CHAT}/${thread.id}`)}
              onRename={(title) => renameThread({ conversationId: thread.id, title })}
              onDelete={() => {
                deleteThread(thread.id);
                if (thread.id === activeId) goTo(ROUTES.AI_CHAT);
              }}
            />
          ))}
        </List>
      )}
    </Box>
  );
}
