import { useState, type KeyboardEvent } from "react";
import {
  Box,
  Card,
  Typography,
  InputBase,
  Stack,
  IconButton,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";

export function AiAssistantCTA() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");

  const handleSend = () => {
    const trimmed = prompt.trim();
    navigate(ROUTES.AI_CHAT, {
      state: trimmed ? { initialPrompt: trimmed } : undefined,
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
      {/* ── Header ── */}
      <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
        <AutoAwesomeIcon sx={{ fontSize: 18, color: "primary.light" }} />
        <Typography variant="subtitle2" fontWeight={700} color="primary.light">
          CampusConnect AI
        </Typography>
      </Stack>

      <Typography
        variant="body2"
        color="text.secondary"
        mb={2}
        sx={{ maxWidth: 480 }}
      >
        Ask anything about your coursework, get study help, or search across all
        campus resources — powered by AI.
      </Typography>

      {/* ── Real input bar ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: 0.75,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "action.hover",
          transition: "border-color 0.15s ease",
          "&:focus-within": {
            borderColor: "primary.main",
          },
        }}
      >
        <InputBase
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI anything about your coursework..."
          fullWidth
          sx={{
            fontSize: "0.875rem",
            color: "text.primary",
            "& input::placeholder": { color: "text.disabled" },
          }}
        />
        <IconButton
          size="small"
          onClick={handleSend}
          sx={{
            color: "primary.main",
            flexShrink: 0,
            p: 0.5,
            "&:hover": { bgcolor: "primary.dark", color: "primary.light" },
          }}
          aria-label="Send prompt to AI"
        >
          <ArrowForwardIcon fontSize="small" />
        </IconButton>
      </Box>
    </Card>
  );
}
