import { Box, Button, IconButton, Typography } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";

interface AiChatHeaderProps {
  isStreaming: boolean;
  showClear: boolean;
  onBack: () => void;
  onClear: () => void;
}

export function AiChatHeader({
  isStreaming,
  showClear,
  onBack,
  onClear,
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
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
            Campus AI
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {isStreaming ? "Responding…" : "Ask anything about your courses"}
          </Typography>
        </Box>
      </Box>

      {showClear && (
        <Button
          size="small"
          variant="outlined"
          onClick={onClear}
          sx={{
            color: "text.secondary",
            borderColor: "divider",
            fontSize: "0.75rem",
            minHeight: 32,
            flexShrink: 0,
          }}
        >
          Clear
        </Button>
      )}
    </Box>
  );
}