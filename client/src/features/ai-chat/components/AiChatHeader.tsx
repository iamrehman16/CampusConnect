import { Box, IconButton, Typography } from "@mui/material";
import { ArrowBackIosNew as ArrowBackIosNewIcon, Menu as MenuIcon, SmartToyOutlined as SmartToyOutlinedIcon } from "@/shared/icons";

interface AiChatHeaderProps {
  isStreaming: boolean;
  title?: string;
  /** Mobile only — the desktop shell has navigation, so no back button. */
  onBack?: () => void;
  // Mobile only — opens the thread-history drawer (BACKLOG.md B7). The
  // desktop layout has a permanent sidebar instead (AiChatLayout).
  onOpenThreads?: () => void;
}

export function AiChatHeader({
  isStreaming,
  title,
  onBack,
  onOpenThreads,
}: AiChatHeaderProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: { xs: 1, sm: 2.5 },
        py: 1,
        bgcolor: "surface.card",
        borderBottom: "1px solid",
        borderColor: "border.default",
        flexShrink: 0,
        minHeight: 56,
        gap: 1,
      }}
    >
      {onBack && (
        <IconButton
          size="small"
          onClick={onBack}
          sx={{ color: "text.primary", flexShrink: 0 }}
          aria-label="Go back"
        >
          <ArrowBackIosNewIcon sx={{ fontSize: 18 }} />
        </IconButton>
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexGrow: 1 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1,
            bgcolor: "primary.subtle",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <SmartToyOutlinedIcon sx={{ color: "primary.main", fontSize: 18 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            noWrap
            sx={{ fontWeight: 600, lineHeight: 1.2 }}
          >
            {title || "Study assistant"}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {isStreaming ? "Responding…" : "Answers from CampusConnect resources"}
          </Typography>
        </Box>
      </Box>

      {onOpenThreads && (
        <IconButton
          size="small"
          onClick={onOpenThreads}
          sx={{ color: "text.primary", flexShrink: 0 }}
          aria-label="Chat history"
        >
          <MenuIcon sx={{ fontSize: 20 }} />
        </IconButton>
      )}
    </Box>
  );
}