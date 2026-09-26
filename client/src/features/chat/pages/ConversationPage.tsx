import {
  Box,
  ButtonBase,
  IconButton,
  Typography,
  CircularProgress,
} from "@mui/material";
import { ArrowBack } from "@/shared/icons";
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
import { useTypingIndicator } from "../hooks/useTypingIndicator";
import { PresenceStatus } from "../components/PresenceStatus";
import UserAvatar from "@/shared/components/UserAvatar";
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

  const { isPeerTyping, notifyTyping, stopTyping } = useTypingIndicator(
    activeConversationId,
    user?._id,
    isConnected,
  );

  const { data: conversations } = useConversationsQuery();
  const conversation = conversations?.find(
    (c) => c.id === activeConversationId,
  );
  const otherParticipant = conversation?.participants.find(
    (p) => p.id !== user?._id,
  );

  const hasUnread = (conversation?.unreadCount ?? 0) > 0;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMessagesQuery(activeConversationId ?? "");
  const messages = useMemo(
    () =>
      data?.pages
        .slice()
        .reverse()
        .flatMap((p) => [...p.data].reverse()) ?? [],
    [data],
  );
  const latestMessage = useMemo(
    () => messages[messages.length - 1],
    [messages],
  );

  const { setActiveConversationId } = useChatUIStore();
  useEffect(() => {
    if (!activeConversationId) return;

    setActiveConversationId(activeConversationId);

    return () => setActiveConversationId(null); // cleanup on unmount
  }, [activeConversationId, setActiveConversationId]);

  useEffect(() => {
    if (!activeConversationId || !latestMessage) return;
    // Server's unreadCount also covers older unseen messages when the latest
    // one is our own reply — don't rely on the latest message alone.
    const latestNeedsSeen =
      latestMessage.sender !== user?._id && !latestMessage.seenAt;
    if (!latestNeedsSeen && !hasUnread) return;

    markSeen(activeConversationId);
  }, [activeConversationId, latestMessage, hasUnread, markSeen, user?._id]);

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

  const profilePath = otherParticipant
    ? ROUTES.PUBLIC_PROFILE.replace(":userId", otherParticipant.id)
    : undefined;

  // height: 100% (not 100svh) — on desktop the pane sits under the shell's
  // top bar, so a viewport-height box overflowed it and pushed the composer
  // below the fold.
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        bgcolor: "surface.canvas",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: { xs: 1, md: 2.5 },
          py: 1,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
          bgcolor: "background.paper",
          minHeight: 60,
        }}
      >
        {isMobile && (
          <IconButton onClick={() => navigate(ROUTES.CHAT)} aria-label="Back to messages" sx={{ minWidth: 44, minHeight: 44 }}>
            <ArrowBack fontSize="small" />
          </IconButton>
        )}
        <ButtonBase
          onClick={() => profilePath && navigate(profilePath)}
          disabled={!profilePath}
          sx={{ display: "flex", alignItems: "center", gap: 1.5, borderRadius: 1, pr: 1, minWidth: 0, textAlign: "left" }}
        >
          <UserAvatar name={otherParticipant?.name} avatar={otherParticipant?.avatar} size={36} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={600} lineHeight={1.3} noWrap>
              {otherParticipant?.name?.trim() || "Unknown user"}
            </Typography>
            <PresenceStatus participant={otherParticipant} isTyping={isPeerTyping} />
          </Box>
        </ButtonBase>
      </Box>

      {/* Feed */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <MessageFeed
          messages={messages}
          retryMessage={retryMessage}
          fetchNextPage={fetchNextPage}
          hasNextPage={!!hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          currentUserId={user?._id}
        />
      </Box>

      {/* Input */}
      <Box sx={{ flexShrink: 0, px: { xs: 1.5, md: 3 }, pt: 1, pb: { xs: 1.5, md: 2 } }}>
        <Box sx={{ maxWidth: 760, mx: "auto" }}>
          <MessageInput
            conversationId={activeConversationId}
            sendMessage={sendMessage}
            onTyping={notifyTyping}
            onStopTyping={stopTyping}
          />
        </Box>
      </Box>
    </Box>
  );
}
