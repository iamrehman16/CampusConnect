import { Box, useMediaQuery, useTheme } from "@mui/material";
import { Outlet } from "react-router-dom";
import { ThreadSidebar } from "../components/ThreadSidebar";

// Desktop: permanent sidebar + chat pane, mirroring the real-time
// messenger's ConversationsPage layout (BACKLOG.md B7). Mobile keeps the
// chat pane full-screen — a new chat is the primary action here, unlike
// the messenger where picking a person comes first — and reaches the
// thread list through a drawer opened from AiChatHeader (see AiChatPage).
export default function AiChatLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  if (!isDesktop) {
    return <Outlet />;
  }

  return (
    <Box sx={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <Box
        sx={{
          width: 280,
          flexShrink: 0,
          borderRight: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <ThreadSidebar />
      </Box>
      <Box
        sx={{
          flex: 1,
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
