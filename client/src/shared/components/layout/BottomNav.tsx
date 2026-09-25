import { useLocation, useNavigate } from "react-router-dom";
import Badge from "@mui/material/Badge";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";
import { PRIMARY_NAV, isNavActive, useNavBadges } from "./navigation";

const ITEMS = PRIMARY_NAV.filter((i) => !i.desktopOnly);

/** Mobile bottom navigation (below md) — the 5 primary destinations. */
export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const badges = useNavBadges();
  const active = ITEMS.findIndex((i) => isNavActive(pathname, i.path));

  return (
    <Paper
      component="nav"
      aria-label="Main"
      elevation={0}
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (t) => t.zIndex.appBar,
        pb: "env(safe-area-inset-bottom)",
        bgcolor: "surface.card",
      }}
    >
      <BottomNavigation
        value={active === -1 ? false : active}
        onChange={(_, i: number) => navigate(ITEMS[i].path)}
        showLabels
        sx={{ height: 64 }}
      >
        {ITEMS.map((item) => {
          const count = item.badge ? badges[item.badge] : 0;
          return (
            <BottomNavigationAction
              key={item.key}
              label={item.label}
              icon={
                <Badge badgeContent={count} color="error" max={99}>
                  {item.icon}
                </Badge>
              }
            />
          );
        })}
      </BottomNavigation>
    </Paper>
  );
}
