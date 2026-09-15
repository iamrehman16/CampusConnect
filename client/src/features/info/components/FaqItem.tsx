import { useState } from "react";
import { Box, Stack, Typography, IconButton, Collapse, Divider } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

interface FaqItemProps {
  q: string;
  a: string;
}

export function FaqItem({ q, a }: FaqItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        gap={2}
        sx={{
          py: 1.75,
          cursor: "pointer",
          "&:hover .faq-question": { color: "primary.light" },
        }}
        onClick={() => setOpen((p) => !p)}
      >
        <Typography
          className="faq-question"
          variant="body1"
          fontWeight={600}
          sx={{ transition: "color 0.15s ease", lineHeight: 1.5 }}
        >
          {q}
        </Typography>
        <IconButton
          size="small"
          disableRipple
          sx={{
            flexShrink: 0,
            color: open ? "primary.light" : "text.disabled",
            mt: 0.25,
            p: 0,
            transition: "color 0.15s ease",
          }}
        >
          {open ? <RemoveIcon fontSize="small" /> : <AddIcon fontSize="small" />}
        </IconButton>
      </Stack>

      <Collapse in={open} timeout={200}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ pb: 2, lineHeight: 1.8, maxWidth: 680 }}
        >
          {a}
        </Typography>
      </Collapse>

      <Divider sx={{ opacity: 0.5 }} />
    </Box>
  );
}