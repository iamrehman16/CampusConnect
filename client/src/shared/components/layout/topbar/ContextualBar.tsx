// src/layout/topbar/ContextualBar.tsx
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useNavigate } from "react-router-dom";

interface ContextualBarProps {
  /** Page title shown left-aligned next to the back arrow. */
  title: string;
  /**
   * Optional icon button rendered on the right side.
   * Each contextual page passes its own relevant action:
   *   - ConversationsPage → compose icon
   *   - ContributorsPage  → search icon
   * Keeping this as a ReactNode slot means ContextualBar stays generic
   * and never needs to know which page it's on.
   */
  action?: React.ReactNode;
}

/**
 * ContextualBar — rendered on Messages, Contributors, and any future sub-pages.
 *
 * Layout: back arrow | page title (left-aligned) | optional action (right)
 *
 * Deliberate differences from StandardBar:
 * - No avatar (you're inside a flow, not at the top level)
 * - No app name (the page title replaces it)
 * - No theme toggle (reduce cognitive load inside focused flows)
 * - Title is left-aligned, not centered — this is the native mobile pattern
 *   for sub-pages (iOS, Android both do this). Centered titles belong on
 *   top-level tabs; left-aligned belongs on pages you navigate into.
 */
export default function ContextualBar({ title, action }: ContextualBarProps) {
  const navigate = useNavigate();

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
          px: 1,
          minHeight: 56,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        {/* Back — navigate(-1) is correct here, not a hardcoded route.
            The user might arrive at /contributors from multiple places,
            and navigate(-1) always returns them to wherever they came from. */}
        <IconButton
          onClick={() => navigate(-1)}
          size="small"
          sx={{ color: "text.primary", flexShrink: 0 }}
          aria-label="Go back"
        >
          <ArrowBackIosNewIcon sx={{ fontSize: 18 }} />
        </IconButton>

        {/* Title — left-aligned, grows to fill available space */}
        <Typography
          variant="subtitle1"
          fontWeight={700}
          color="text.primary"
          sx={{
            flexGrow: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </Typography>

        {/* Right action slot — rendered only when provided */}
        {action ?? null}
      </Toolbar>
    </AppBar>
  );
}