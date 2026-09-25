import { Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import TopBar from "./TopBar";
import DesktopTopBar from "./DesktopTopBar";
import { AccountDrawer } from "./AccountMenu";
import { getRouteConfig } from "@/app/routeConfig";
import { useChatPresenceSync } from "@/features/chat/hooks/useChatPresenceSync";
import { useNotificationSync } from "@/features/notifications/hooks/useNotificationSync";
import { useChatUnreadSync } from "@/features/chat/hooks/useChatUnreadSync";

/**
 * Application shell (BACKLOG.md D5).
 * - Desktop (md+): sidebar (navigation) | column [ top bar (search,
 *   notifications, account) / page ].
 * - Mobile: route-aware top bar + page + 5-item bottom nav.
 */
export default function AppLayout() {
  const theme = useTheme();
  useChatUnreadSync();
  useChatPresenceSync();
  useNotificationSync();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [accountOpen, setAccountOpen] = useState(false);
  const { pathname } = useLocation();
  const { showBottomNav, topBarMode } = getRouteConfig(pathname);
  const isImmersive = topBarMode === "immersive";

  if (isDesktop) {
    return (
      <Box sx={{ display: "flex", height: "100vh", bgcolor: "surface.canvas" }}>
        <Sidebar />
        <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <DesktopTopBar />
          <Box component="main" sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <>
      <TopBar onAvatarClick={() => setAccountOpen(true)} />
      <AccountDrawer open={accountOpen} onClose={() => setAccountOpen(false)} />
      <Box
        component="main"
        sx={{
          height: "100dvh",
          pt: isImmersive ? 0 : "56px",
          pb: showBottomNav ? "calc(64px + env(safe-area-inset-bottom))" : 0,
          overflow: "hidden",
          bgcolor: "surface.canvas",
        }}
      >
        <Outlet />
      </Box>
      {showBottomNav && <BottomNav />}
    </>
  );
}
