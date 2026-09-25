import { Box, CircularProgress, Fab, List, Typography } from "@mui/material";
import { Add as AddIcon, ChatBubbleOutline as ChatBubbleOutlineIcon } from "@/shared/icons";
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
  const { data: threads, isLoading } = useThreadsQuery();
  const { mutate: renameThread } = useRenameThread();
  const { mutate: deleteThread } = useDeleteThread();

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
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <Typography variant="subtitle2" fontWeight={600}>
          Chats
        </Typography>
        <Fab
          size="small"
          color="primary"
          aria-label="New chat"
          onClick={() => goTo(ROUTES.AI_CHAT)}
          sx={{ boxShadow: "none", width: 32, height: 32, minHeight: 32 }}
        >
          <AddIcon fontSize="small" />
        </Fab>
      </Box>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", pt: 4 }}>
          <CircularProgress size={24} />
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
      ) : (
        <List disablePadding sx={{ flex: 1, overflowY: "auto" }}>
          {threads.map((thread) => (
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
