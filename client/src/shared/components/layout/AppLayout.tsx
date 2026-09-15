import { Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import Sidebar, { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from "./Sidebar";
import BottomNav from "./BottomNav";
import TopBar from "./TopBar";
import ProfileDrawer from "./ProfileDrawer";
import { useUIStore } from "@/shared/store/ui.store";
import { getRouteConfig } from "@/app/routeConfig";

/**
 * Main application layout shell.
 * - Desktop (md+): Permanent sidebar on the left + content area
 * - Mobile (<md): Full-width content with bottom navigation
 */
export default function AppLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const { sidebarCollapsed } = useUIStore();
  const sidebarWidth = sidebarCollapsed
    ? SIDEBAR_COLLAPSED_WIDTH
    : SIDEBAR_WIDTH;
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const { pathname } = useLocation();
  const { showBottomNav, topBarMode } = getRouteConfig(pathname);
  const isImmersive = topBarMode === "immersive";

  return (
    <>
      <TopBar onAvatarClick={() => setProfileDrawerOpen(true)} />
      <ProfileDrawer
        open={profileDrawerOpen}
        onClose={() => setProfileDrawerOpen(false)}
      />
      <Box sx={{ display: "flex", height: "100vh" }}>
        {isDesktop && <Sidebar />}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: isDesktop ? `calc(100% - ${sidebarWidth}px)` : "100%",
            pt: { xs: isImmersive ? 0 : "56px", md: 0 },
            pb: { xs: showBottomNav ? "64px" : 0, md: 0 },
            overflow: "hidden",
            bgcolor: "background.default",
            transition: theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          <Outlet />
        </Box>
        {!isDesktop && showBottomNav && <BottomNav />}
      </Box>
    </>
  );
}
