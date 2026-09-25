import { useLocation, useNavigate } from "react-router-dom";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { ArrowBackIosNew, ChevronRight } from "@/shared/icons";
import { BrandLockup, BrandMark } from "@/shared/components/BrandMark";
import { useAuth } from "@/shared/hooks/useAuth";
import { useUIStore } from "@/shared/store/ui.store";
import { UserRole } from "@/shared/types/enums";
import {
  ADMIN_NAV,
  PRIMARY_NAV,
  isNavActive,
  useNavBadges,
  type NavItem,
} from "./navigation";

export const SIDEBAR_WIDTH = 240;
export const SIDEBAR_COLLAPSED_WIDTH = 68;

/**
 * Desktop sidebar (md+) — navigation only. Account, theme, notifications and
 * log out live in the top bar (BACKLOG.md D5): the old sidebar mixed 11
 * destinations and actions in one column.
 */
export default function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sidebarCollapsed: collapsed, toggleSidebar } = useUIStore();
  const badges = useNavBadges();

  const renderItem = (item: NavItem) => {
    const active = isNavActive(pathname, item.path);
    const count = item.badge ? badges[item.badge] : 0;
    return (
      <Tooltip key={item.key} title={collapsed ? item.label : ""} placement="right">
        <ListItemButton
          selected={active}
          onClick={() => navigate(item.path)}
          aria-current={active ? "page" : undefined}
          sx={{
            minHeight: 40,
            mb: 0.25,
            px: 1.25,
            justifyContent: collapsed ? "center" : "flex-start",
            color: (t) =>
              active
                ? t.palette.mode === "dark"
                  ? t.palette.primary.main
                  : t.palette.primary.dark
                : t.palette.text.secondary,
            "&:hover": { color: active ? undefined : "text.primary" },
            ".MuiListItemIcon-root": { color: "inherit" },
          }}
        >
          <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36 }}>
            <Badge
              badgeContent={count}
              color="error"
              max={99}
              variant={collapsed ? "dot" : "standard"}
              invisible={!count || !collapsed}
            >
              {item.icon}
            </Badge>
          </ListItemIcon>
          {!collapsed && (
            <>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: active ? 600 : 500 }}
              />
              {count > 0 && (
                <Box
                  component="span"
                  sx={{
                    minWidth: 20,
                    height: 20,
                    px: 0.75,
                    borderRadius: 10,
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {count > 99 ? "99+" : count}
                </Box>
              )}
            </>
          )}
        </ListItemButton>
      </Tooltip>
    );
  };

  return (
    <Box
      component="nav"
      aria-label="Main"
      sx={{
        width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        flexShrink: 0,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "surface.card",
        borderRight: "1px solid",
        borderColor: "border.default",
        transition: (t) => t.transitions.create("width", { duration: t.transitions.duration.shorter }),
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          height: 56,
          px: collapsed ? 0 : 2,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          flexShrink: 0,
          cursor: "pointer",
        }}
        onClick={() => navigate("/")}
      >
        {collapsed ? <BrandMark size={28} /> : <BrandLockup size={28} />}
      </Box>

      <List sx={{ flex: 1, px: 1.25, py: 1, overflowY: "auto" }}>
        {PRIMARY_NAV.map(renderItem)}
        {user?.role === UserRole.ADMIN && (
          <>
            {!collapsed && (
              <Typography
                variant="caption"
                color="text.tertiary"
                sx={{ display: "block", px: 1.25, pt: 2, pb: 0.5, fontWeight: 600, letterSpacing: "0.04em" }}
              >
                MANAGE
              </Typography>
            )}
            {renderItem(ADMIN_NAV)}
          </>
        )}
      </List>

      <Box sx={{ p: 1.25, display: "flex", justifyContent: collapsed ? "center" : "flex-end" }}>
        <Tooltip title={collapsed ? "Expand sidebar" : "Collapse sidebar"} placement="right">
          <IconButton size="small" onClick={toggleSidebar} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? <ChevronRight fontSize="small" /> : <ArrowBackIosNew fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
