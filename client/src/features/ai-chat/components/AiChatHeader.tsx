import { Box, IconButton, Typography } from "@mui/material";
import { ArrowBackIosNew as ArrowBackIosNewIcon, Menu as MenuIcon, SmartToyOutlined as SmartToyOutlinedIcon } from "@/shared/icons";

interface AiChatHeaderProps {
  isStreaming: boolean;
  title?: string;
  onBack: () => void;
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
        px: 1,
        py: 1.5,
        bgcolor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "divider",
        flexShrink: 0,
        minHeight: 56,
        gap: 1,
      }}
    >
      <IconButton
        size="small"
        onClick={onBack}
        sx={{ color: "text.primary", flexShrink: 0 }}
        aria-label="Go back"
      >
        <ArrowBackIosNewIcon sx={{ fontSize: 18 }} />
      </IconButton>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexGrow: 1 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "10px",
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <SmartToyOutlinedIcon sx={{ color: "#fff", fontSize: 20 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            noWrap
            sx={{ fontWeight: 600, lineHeight: 1.2 }}
          >
            {title || "Campus AI"}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {isStreaming ? "Responding…" : "Ask anything about your courses"}
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