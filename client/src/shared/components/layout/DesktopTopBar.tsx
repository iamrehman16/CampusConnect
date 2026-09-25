import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import InputBase from "@mui/material/InputBase";
import Stack from "@mui/material/Stack";
import { Search } from "@/shared/icons";
import UserAvatar from "@/shared/components/UserAvatar";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { useAuth } from "@/shared/hooks/useAuth";
import { ROUTES } from "@/shared/constants/routes";
import { AccountMenu } from "./AccountMenu";

export const DESKTOP_TOPBAR_HEIGHT = 56;

/**
 * Desktop top bar (md+, BACKLOG.md D5): global search into the Library,
 * notifications, and the account menu. Sits above the page in the content
 * column, so every page gets the same header chrome.
 */
export default function DesktopTopBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [accountAnchor, setAccountAnchor] = useState<HTMLElement | null>(null);
  const [query, setQuery] = useState(
    pathname === ROUTES.RESOURCES ? (params.get("q") ?? "") : "",
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `${ROUTES.RESOURCES}?q=${encodeURIComponent(q)}` : ROUTES.RESOURCES);
  };

  return (
    <Box
      component="header"
      sx={{
        height: DESKTOP_TOPBAR_HEIGHT,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: 3,
        bgcolor: "surface.card",
        borderBottom: "1px solid",
        borderColor: "border.default",
      }}
    >
      <Box
        component="form"
        role="search"
        onSubmit={submit}
        sx={{
          flex: 1,
          maxWidth: 480,
          display: "flex",
          alignItems: "center",
          gap: 1,
          height: 36,
          px: 1.5,
          borderRadius: 1,
          bgcolor: "surface.subtle",
          border: "1px solid transparent",
          color: "text.tertiary",
          transition: (t) => t.transitions.create(["border-color", "background-color"]),
          "&:focus-within": {
            bgcolor: "surface.card",
            borderColor: "primary.main",
          },
        }}
      >
        <Search fontSize="small" />
        <InputBase
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes, slides, past papers…"
          inputProps={{ "aria-label": "Search the library" }}
          sx={{ flex: 1, fontSize: "0.875rem", color: "text.primary" }}
        />
      </Box>

      <Stack direction="row" alignItems="center" spacing={1} sx={{ ml: "auto" }}>
        <NotificationBell />
        <ButtonBase
          onClick={(e) => setAccountAnchor(e.currentTarget)}
          aria-label="Account menu"
          aria-haspopup="menu"
          sx={{ borderRadius: "50%" }}
        >
          <UserAvatar name={user?.name} avatar={user?.avatar} size={32} />
        </ButtonBase>
      </Stack>

      <AccountMenu anchorEl={accountAnchor} onClose={() => setAccountAnchor(null)} />
    </Box>
  );
}
