import {
  Box,
  IconButton,
  Typography,
  Avatar,
  Divider,
  CircularProgress,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { Navigate } from "react-router-dom";
import { useNavigate, useParams } from "react-router-dom";
import { useMediaQuery, useTheme } from "@mui/material";
import { useChatSocket } from "../hooks/chat-socket-hooks";
import { useConversationsQuery, useMessagesQuery } from "../hooks/chat-hooks";
import { MessageFeed } from "../components/MessageFeed";
import { MessageInput } from "../components/MessageInput";
import { useAuth } from "@/shared/hooks/useAuth";
import { useEffect, useMemo } from "react";
import { useChatUIStore } from "../store/chat-ui.store";
import { ROUTES } from "@/shared/constants/routes";
import { useChatSocketContext } from "@/shared/hooks/useChatSocketContext";

export default function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const activeConversationId =
    conversationId && conversationId !== "undefined"
      ? conversationId
      : undefined;
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { user } = useAuth();
  const { isConnected } = useChatSocketContext();
  const { sendMessage, retryMessage, markSeen, joinConversation } =
    useChatSocket();

  useEffect(() => {
    if (!activeConversationId || !isConnected) return;
    joinConversation(activeConversationId);
  }, [activeConversationId, isConnected, joinConversation]);

  const { data: conversations } = useConversationsQuery();
  const conversation = conversations?.find(
    (c) => c.id === activeConversationId,
  );
  const otherParticipant = conversation?.participants.find(
    (p) => p.id !== user?._id,
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMessagesQuery(activeConversationId ?? "");
  const messages =
    data?.pages
      .slice()
      .reverse()
      .flatMap((p) => [...p.data].reverse()) ?? [];
  const latestMessage = useMemo(
    () => messages[messages.length - 1],
    [messages],
  );

  const { setActiveConversationId, clearUnread } = useChatUIStore();

  useEffect(() => {
    if (!activeConversationId) return;

    setActiveConversationId(activeConversationId);
    clearUnread(activeConversationId);

    return () => setActiveConversationId(null); // cleanup on unmount
  }, [activeConversationId, setActiveConversationId, clearUnread]);

  useEffect(() => {
    if (!activeConversationId || !latestMessage) return;
    if (latestMessage.sender === user?._id || latestMessage.seenAt) return;

    markSeen(activeConversationId);
  }, [activeConversationId, latestMessage, markSeen, user?._id]);

  if (!activeConversationId) {
    return <Navigate to={ROUTES.CHAT} replace />;
  }

  // Cold cache — user navigated directly via URL before conversation list loaded
  if (!conversation) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100svh",
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
          bgcolor: "background.paper",
          minHeight: 56,
        }}
      >
        {isMobile && (
          <IconButton size="small" onClick={() => navigate(-1)} sx={{ minWidth: 44, minHeight: 44 }}>
            <ArrowBack fontSize="small" />
          </IconButton>
        )}
        <Avatar sx={{ width: 40, height: 40, bgcolor: "primary.main" }} />
        <Typography variant="subtitle1" fontWeight={600}>
          {otherParticipant?.name ?? "Unknown"}
        </Typography>
      </Box>

      {/* Feed */}
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <MessageFeed
          messages={messages}
          retryMessage={retryMessage}
          fetchNextPage={fetchNextPage}
          hasNextPage={!!hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          currentUserId={user?._id}
        />
      </Box>

      <Divider />

      {/* Input */}
      <Box sx={{ flexShrink: 0 }}>
        <MessageInput
          conversationId={activeConversationId}
          sendMessage={sendMessage}
        />
      </Box>
    </Box>
  );
}
