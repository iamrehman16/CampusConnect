// src/layout/topbar/StandardBar.tsx
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import { useNavigate } from "react-router-dom";
import { InstallMobileRounded } from "@mui/icons-material";
import SmsIcon from "@mui/icons-material/Sms";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useAuth } from "@/shared/hooks/useAuth";
import { ROUTES } from "@/shared/constants/routes";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { useTotalUnread } from "@/features/chat/hooks/chat-hooks";
import { useThemeModeContext } from "@/shared/hooks/useThemeModeContext";
import { usePwaInstall } from "@/shared/hooks/usePwaInstall";

interface StandardBarProps {
  /** Page title shown in the center. "CampusConnect" on Home, page name elsewhere. */
  title: string;
  /** Opens the ProfileDrawer — handler lives in AppLayout, passed through TopBar. */
  onAvatarClick: () => void;
}

/**
 * StandardBar — rendered on Home, Resources, Community, Profile.
 *
 * Layout: avatar | title (flex, ellipsized) | [install] theme toggle, bell, messenger
 *
 * Nothing in here knows about routing modes or routeConfig.
 * It receives exactly what it needs via props and renders it.
 * All the mode-switching logic stays in TopBar.tsx.
 */
export default function StandardBar({ title, onAvatarClick }: StandardBarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mode, toggle } = useThemeModeContext();
  const { isInstallable, triggerInstall } = usePwaInstall();

  const totalUnread = useTotalUnread();

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        display: { xs: "flex", md: "none" },
        bgcolor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "divider",
        color: "text.primary",
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      <Toolbar
        sx={{
          px: 2,
          minHeight: 56,
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Left — avatar opens profile drawer */}
        <IconButton onClick={onAvatarClick} size="small" sx={{ p: 0 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              fontSize: "0.875rem",
              fontWeight: 700,
              bgcolor: "primary.main",
              color: "primary.contrastText",
            }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>
        </IconButton>

        {/* Center — dynamic title. A flex item (not absolutely positioned)
            so it shrinks and ellipsizes instead of sliding under the
            right-side actions when they're wider than expected. */}
        <Typography
          variant="subtitle1"
          fontWeight={700}
          color="primary.main"
          sx={{
            flex: 1,
            minWidth: 0,
            mx: 1.5,
            textAlign: "center",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </Typography>

        {/* Right — install prompt (only when installable), theme toggle, messenger */}
        <Stack direction="row" alignItems="center" spacing={0.5}>
          {isInstallable && (
            <Tooltip title="Install app">
              <IconButton
                onClick={triggerInstall}
                size="small"
                aria-label="Install app"
                sx={{ color: "secondary.main" }}
              >
                <InstallMobileRounded fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <IconButton
            onClick={toggle}
            size="small"
            sx={{ color: "text.secondary" }}
          >
            {mode === "dark" ? (
              <LightModeIcon fontSize="small" />
            ) : (
              <DarkModeIcon fontSize="small" />
            )}
          </IconButton>

          <NotificationBell />

          <IconButton
            onClick={() => navigate(ROUTES.CHAT)}
            size="small"
            sx={{ color: "text.secondary" }}
          >
            <Badge
              badgeContent={totalUnread}
              color="error"
              max={99}
              sx={{ "& .MuiBadge-badge": { fontSize: "0.6rem" } }}
            >
              <SmsIcon fontSize="small" />
            </Badge>
          </IconButton>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}