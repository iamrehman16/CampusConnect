import { Box, useMediaQuery, useTheme } from "@mui/material";
import { Outlet, useParams } from "react-router-dom";
import { ConversationList } from "../components/ConversationList";

export default function ConversationsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { conversationId } = useParams();

  // Mobile: show list OR chat, never both
  if (isMobile) {
    return conversationId ? <Outlet /> : <ConversationList />;
  }

  // Desktop: right panel (conversation list) + center (chat or empty state)
  return (
    <Box sx={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Center — chat or empty state */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          bgcolor: "background.default",
        }}
      >
        <Outlet />
      </Box>

      {/* Right panel — conversation list */}
      <Box
        sx={{
          width: 320,
          borderLeft: "1px solid",
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          flexShrink: 0,
          bgcolor: "background.paper",
        }}
      >
        <ConversationList />
      </Box>
    </Box>
  );
}
