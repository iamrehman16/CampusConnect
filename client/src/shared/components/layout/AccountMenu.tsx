import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import {
  Person,
  ManageAccounts,
  Forum,
  AdminPanelSettings,
  DarkMode,
  LightMode,
  Logout,
} from "@/shared/icons";
import UserAvatar from "@/shared/components/UserAvatar";
import { useAuth } from "@/shared/hooks/useAuth";
import { useThemeModeContext } from "@/shared/hooks/useThemeModeContext";
import { ROUTES } from "@/shared/constants/routes";
import { UserRole } from "@/shared/types/enums";

interface AccountAction {
  key: string;
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  danger?: boolean;
  /** Start a new group (divider above). */
  divider?: boolean;
}

/** The account actions, shared by the desktop menu and the mobile drawer. */
function useAccountActions(close: () => void, opts: { includeCommunity: boolean }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { mode, toggle } = useThemeModeContext();
  const go = (path: string) => () => {
    close();
    navigate(path);
  };

  const actions: AccountAction[] = [
    { key: "profile", label: "Your profile", icon: <Person />, onSelect: go(ROUTES.PROFILE) },
    { key: "settings", label: "Settings", icon: <ManageAccounts />, onSelect: go(ROUTES.SETTINGS) },
  ];
  if (opts.includeCommunity) {
    actions.push({ key: "community", label: "Community", icon: <Forum />, onSelect: go(ROUTES.COMMUNITY) });
  }
  if (user?.role === UserRole.ADMIN) {
    actions.push({ key: "admin", label: "Admin", icon: <AdminPanelSettings />, onSelect: go(ROUTES.ADMIN) });
  }
  actions.push(
    {
      key: "theme",
      label: mode === "dark" ? "Light mode" : "Dark mode",
      icon: mode === "dark" ? <LightMode /> : <DarkMode />,
      onSelect: toggle,
      divider: true,
    },
    {
      key: "logout",
      label: "Log out",
      icon: <Logout />,
      onSelect: () => {
        close();
        void logout();
      },
      danger: true,
    },
  );
  return { user, actions };
}

function AccountHeader() {
  const { user } = useAuth();
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.5 }}>
      <UserAvatar name={user?.name} avatar={user?.avatar} size={36} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" fontWeight={600} noWrap>
          {user?.name}
        </Typography>
        <Typography variant="caption" color="text.tertiary" noWrap display="block">
          {user?.email}
        </Typography>
      </Box>
    </Box>
  );
}

/** Desktop: dropdown anchored to the avatar in the top bar. */
export function AccountMenu({
  anchorEl,
  onClose,
}: {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}) {
  const { actions } = useAccountActions(onClose, { includeCommunity: false });
  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{ paper: { sx: { width: 260, mt: 0.5 } } }}
    >
      <AccountHeader />
      <Divider sx={{ my: 0.5 }} />
      {actions.flatMap((a) => [
        ...(a.divider ? [<Divider key={`${a.key}-div`} sx={{ my: 0.5 }} />] : []),
        <MenuItem
          key={a.key}
          onClick={a.onSelect}
          sx={a.danger ? { color: "error.main" } : undefined}
        >
          <ListItemIcon sx={{ color: a.danger ? "error.main" : "text.secondary" }}>
            {a.icon}
          </ListItemIcon>
          {a.label}
        </MenuItem>,
      ])}
    </Menu>
  );
}

/** Mobile: side drawer opened from the avatar in the top bar. */
export function AccountDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { actions } = useAccountActions(onClose, { includeCommunity: true });
  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: 288, pt: "env(safe-area-inset-top)" } } }}
    >
      <Box sx={{ py: 1 }}>
        <AccountHeader />
      </Box>
      <Divider />
      <List sx={{ px: 1, py: 1 }}>
        {actions.flatMap((a) => [
          ...(a.divider ? [<Divider key={`${a.key}-div`} sx={{ my: 1 }} />] : []),
          <ListItemButton key={a.key} onClick={a.onSelect} sx={{ minHeight: 44 }}>
            <ListItemIcon sx={{ minWidth: 40, color: a.danger ? "error.main" : "text.secondary" }}>
              {a.icon}
            </ListItemIcon>
            <ListItemText
              primary={a.label}
              primaryTypographyProps={{
                fontWeight: 500,
                fontSize: "0.9375rem",
                color: a.danger ? "error.main" : "text.primary",
              }}
            />
          </ListItemButton>,
        ])}
      </List>
    </Drawer>
  );
}
