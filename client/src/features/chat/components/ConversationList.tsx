// src/features/chat/components/ConversationList.tsx
import {
  Box,
  CircularProgress,
  Divider,
  Fab,
  List,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import { useNavigate, useParams } from "react-router-dom";
import { useConversationsQuery } from "../hooks/chat-hooks";
import { ConversationListItem } from "./ConversationListItem";
import { ROUTES } from "@/shared/constants/routes";

export function ConversationList() {
  const { conversationId: activeId } = useParams();
  const navigate = useNavigate();
  const { data: conversations, isLoading } = useConversationsQuery();

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", pt: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!conversations?.length) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          px: 4,
          gap: 2,
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            bgcolor: "action.hover",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PeopleOutlineIcon sx={{ fontSize: 28, color: "text.secondary" }} />
        </Box>

        <Box>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            No conversations yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Find a contributor and start a conversation.
          </Typography>
        </Box>

        <Typography
          variant="body2"
          fontWeight={600}
          color="primary"
          onClick={() => navigate(ROUTES.CONTRIBUTORS)}
          sx={{
            cursor: "pointer",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          Browse contributors →
        </Typography>
      </Box>
    );
  }

  // ── Populated list ─────────────────────────────────────────────────────────
  //
  // The title "Messages" is gone from here — ContextualBar in the top bar
  // already owns it. Showing it twice was redundant and visually noisy.
  //
  // The FAB replaces the old pencil-in-a-row pattern. Why FAB over an
  // icon button in the header?
  // - A header row with only one icon and no label looks unbalanced.
  // - FAB is the established mobile convention for "primary action on a list"
  //   (WhatsApp, Telegram, Gmail all do this).
  // - It stays visible as the user scrolls — always accessible.
  //
  // The tradeoff: FAB overlaps the last list item slightly. We compensate
  // with pb on the List so the last item is never hidden behind it.
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        position: "relative", // FAB is positioned relative to this container
      }}
    >
      <List
        disablePadding
        sx={{
          flex: 1,
          overflowY: "auto",
          // Extra bottom padding so the last conversation item is never
          // obscured by the FAB (FAB height 40px + margin 16px + buffer 8px)
          pb: "72px",
        }}
      >
        {conversations.map((conversation) => (
          <ConversationListItem
            key={conversation.id}
            conversation={conversation}
            isActive={conversation.id === activeId}
            onClick={() => navigate(`/chat/${conversation.id}`)}
          />
        ))}
      </List>

      {/* FAB — positioned inside the list container, not the whole screen.
          bottom/right values align it to the corner of the list panel,
          which on desktop is the right sidebar and on mobile is full width. */}
      <Fab
        size="small"
        color="primary"
        aria-label="Start new conversation"
        onClick={() => navigate(ROUTES.CONTRIBUTORS)}
        sx={{
          position: "absolute",
          bottom: 16,
          right: 16,
        }}
      >
        <EditOutlinedIcon fontSize="small" />
      </Fab>

      <Divider />
    </Box>
  );
}