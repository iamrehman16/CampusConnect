import AppBar from "@mui/material/AppBar";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";
import { InstallMobileRounded, Search } from "@/shared/icons";
import { BrandMark } from "@/shared/components/BrandMark";
import UserAvatar from "@/shared/components/UserAvatar";
import { useAuth } from "@/shared/hooks/useAuth";
import { ROUTES } from "@/shared/constants/routes";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { usePwaInstall } from "@/shared/hooks/usePwaInstall";

interface StandardBarProps {
  /** Page title; on Home the brand is shown instead. */
  title: string;
  /** Opens the account drawer — handler lives in AppLayout, passed through TopBar. */
  onAvatarClick: () => void;
}

/**
 * Mobile top bar for top-level pages (BACKLOG.md D5).
 *
 * Layout: avatar (account drawer) | title | [install] search, notifications.
 * Messages moved to the bottom nav and the theme toggle into the account
 * drawer, so this bar holds only what doesn't have a home elsewhere.
 */
export default function StandardBar({ title, onAvatarClick }: StandardBarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isInstallable, triggerInstall } = usePwaInstall();
  const isHome = title === "CampusConnect";

  return (
    <AppBar position="fixed" sx={{ display: { xs: "flex", md: "none" }, zIndex: (t) => t.zIndex.appBar }}>
      <Toolbar sx={{ px: 1.5, minHeight: 56, gap: 1 }}>
        <ButtonBase onClick={onAvatarClick} aria-label="Account menu" sx={{ borderRadius: "50%" }}>
          <UserAvatar name={user?.name} avatar={user?.avatar} size={32} />
        </ButtonBase>

        {/* Flex item (not absolutely centred) so it ellipsizes instead of
            sliding under the actions. */}
        <Stack direction="row" alignItems="center" gap={1} sx={{ flex: 1, minWidth: 0, ml: 0.5 }}>
          {isHome && <BrandMark size={22} />}
          <Typography variant="subtitle1" fontWeight={700} noWrap>
            {title}
          </Typography>
        </Stack>

        {isInstallable && (
          <Tooltip title="Install app">
            <IconButton onClick={triggerInstall} aria-label="Install app">
              <InstallMobileRounded fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <IconButton onClick={() => navigate(ROUTES.RESOURCES)} aria-label="Search the library">
          <Search fontSize="small" />
        </IconButton>
        <NotificationBell />
      </Toolbar>
    </AppBar>
  );
}
