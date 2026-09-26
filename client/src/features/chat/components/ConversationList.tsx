// src/features/chat/components/ConversationList.tsx
import { useMemo, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  List,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  EditOutlined as EditOutlinedIcon,
  PeopleOutline as PeopleOutlineIcon,
  Search as SearchIcon,
} from "@/shared/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/shared/hooks/useAuth";
import { useConversationsQuery } from "../hooks/chat-hooks";
import { ConversationListItem } from "./ConversationListItem";
import { ROUTES } from "@/shared/constants/routes";

/**
 * Conversation pane (BACKLOG.md D8). Header carries the title (desktop —
 * the mobile top bar already shows it), a name filter and the "new
 * message" action, which replaces the old floating FAB that covered the
 * last row. New conversations start from a mentor, so the action routes
 * to the people you mentor with.
 */
export function ConversationList() {
  const { conversationId: activeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: conversations, isLoading } = useConversationsQuery();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations ?? [];
    return (conversations ?? []).filter((c) =>
      c.participants.some(
        (p) => p.id !== user?._id && p.name?.toLowerCase().includes(q),
      ),
    );
  }, [conversations, query, user?._id]);

  const hasAny = (conversations?.length ?? 0) > 0;

  const newMessageButton = (
    <Tooltip title="New message">
      <IconButton aria-label="New message" onClick={() => navigate(ROUTES.MY_MENTORS)}>
        <EditOutlinedIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <Box sx={{ p: 1.5, pb: 1, flexShrink: 0 }}>
        <Stack
          direction="row"
          alignItems="center"
          sx={{ mb: 1.25, minHeight: 36, display: { xs: "none", md: "flex" } }}
        >
          <Typography variant="subtitle1" component="h1" fontWeight={700} sx={{ flex: 1, px: 0.5 }}>
            Messages
          </Typography>
          {newMessageButton}
        </Stack>
        {hasAny && (
          <Stack direction="row" alignItems="center" gap={0.5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search people"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 16, color: "text.tertiary" }} />
                    </InputAdornment>
                  ),
                },
                htmlInput: { "aria-label": "Search conversations" },
              }}
            />
            {/* Mobile has no title row (the top bar shows it). */}
            <Box sx={{ display: { xs: "block", md: "none" } }}>{newMessageButton}</Box>
          </Stack>
        )}
      </Box>

      {isLoading ? (
        <Stack spacing={1} sx={{ px: 1.5, pt: 1 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={56} />
          ))}
        </Stack>
      ) : !hasAny ? (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            px: 4,
            gap: 1.5,
            textAlign: "center",
          }}
        >
          <PeopleOutlineIcon sx={{ fontSize: 28, color: "text.tertiary" }} />
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              No conversations yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              When a mentor accepts your request, you can message them here.
            </Typography>
          </Box>
          <Button size="small" variant="outlined" onClick={() => navigate(ROUTES.MENTORS)}>
            Find a mentor
          </Button>
        </Box>
      ) : filtered.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ px: 2.5, py: 3, textAlign: "center" }}>
          No one matches “{query.trim()}”.
        </Typography>
      ) : (
        <List disablePadding sx={{ flex: 1, overflowY: "auto", px: 1, pb: 1 }}>
          {filtered.map((conversation) => (
            <ConversationListItem
              key={conversation.id}
              conversation={conversation}
              isActive={conversation.id === activeId}
              onClick={() => navigate(`${ROUTES.CHAT}/${conversation.id}`)}
            />
          ))}
        </List>
      )}
    </Box>
  );
}
