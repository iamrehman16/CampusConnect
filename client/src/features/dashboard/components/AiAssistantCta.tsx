import { useState, type FormEvent } from "react";
import { Box, Card, Chip, IconButton, InputBase, Stack, Typography } from "@mui/material";
import { AutoAwesome, ArrowForward } from "@/shared/icons";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import { useStarterPrompts } from "@/features/ai-chat/hooks/useStarterPrompts";

/** Home's primary action: ask the AI assistant, or pick a suggestion. */
export function AiAssistantCTA() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const suggestions = useStarterPrompts(3);

  const ask = (text: string) => {
    const trimmed = text.trim();
    navigate(ROUTES.AI_CHAT, { state: trimmed ? { initialPrompt: trimmed } : undefined });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(prompt);
  };

  return (
    <Card sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
        <AutoAwesome sx={{ fontSize: 18, color: "primary.main" }} />
        <Typography variant="subtitle1" fontWeight={600}>
          Ask the study assistant
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Answers come from notes and past papers shared on CampusConnect, with
        links to the source.
      </Typography>

      <Box
        component="form"
        onSubmit={submit}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          pl: 1.75,
          pr: 0.75,
          height: 48,
          borderRadius: 1,
          border: "1px solid",
          borderColor: "border.default",
          bgcolor: "surface.card",
          transition: (t) => t.transitions.create(["border-color", "box-shadow"]),
          "&:focus-within": {
            borderColor: "primary.main",
            boxShadow: (t) => `0 0 0 3px ${t.palette.primary.subtle}`,
          },
        }}
      >
        <InputBase
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask about any course topic…"
          fullWidth
          inputProps={{ "aria-label": "Ask the study assistant" }}
          sx={{ fontSize: "0.9375rem" }}
        />
        <IconButton
          type="submit"
          aria-label="Ask"
          sx={{
            bgcolor: "primary.main",
            color: "primary.contrastText",
            "&:hover": { bgcolor: "primary.dark", color: "primary.contrastText" },
          }}
        >
          <ArrowForward fontSize="small" />
        </IconButton>
      </Box>

      <Stack direction="row" gap={1} flexWrap="wrap" mt={1.5}>
        {suggestions.map((s) => (
          <Chip
            key={s.label}
            label={s.label}
            variant="outlined"
            onClick={() => ask(s.prompt)}
            sx={{ maxWidth: "100%" }}
          />
        ))}
      </Stack>
    </Card>
  );
}
