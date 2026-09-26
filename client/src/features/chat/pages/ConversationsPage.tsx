import { Box, useMediaQuery, useTheme } from "@mui/material";
import { Outlet, useParams } from "react-router-dom";
import { ConversationList } from "../components/ConversationList";

/**
 * Messages (BACKLOG.md D8) — same two-pane pattern as Ask AI: list on the
 * left, conversation on the right. Mobile shows one pane at a time.
 */
export default function ConversationsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { conversationId } = useParams();

  if (isMobile) {
    return conversationId ? <Outlet /> : <ConversationList />;
  }

  return (
    <Box sx={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <Box
        sx={{
          width: 320,
          flexShrink: 0,
          borderRight: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <ConversationList />
      </Box>
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
