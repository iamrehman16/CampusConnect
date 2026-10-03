import type { ReactNode } from "react";
import {
  Box,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Search as SearchIcon } from "@/shared/icons";

/** Width of the list pane beside a conversation (BACKLOG.md D11). */
export const LIST_PANE_WIDTH = 300;

/**
 * The permanent left pane of a two-pane screen (Ask AI threads, Messages
 * conversations), so both read as one system.
 */
export function ListPane({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        width: LIST_PANE_WIDTH,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRight: "1px solid",
        borderColor: "border.default",
        bgcolor: "surface.card",
      }}
    >
      {children}
    </Box>
  );
}

interface HeaderProps {
  title: string;
  /** Label and handler for the "new" icon action. */
  actionLabel: string;
  actionIcon: ReactNode;
  onAction: () => void;
  /** Omit to hide the search box (e.g. nothing to search yet). */
  search?: { value: string; onChange: (v: string) => void; placeholder: string };
  /** Mobile shows the title in the top bar, so the row collapses to just the action. */
  hideTitleOnMobile?: boolean;
}

export function ListPaneHeader({
  title,
  actionLabel,
  actionIcon,
  onAction,
  search,
  hideTitleOnMobile,
}: HeaderProps) {
  const action = (
    <Tooltip title={actionLabel}>
      <IconButton aria-label={actionLabel} onClick={onAction}>
        {actionIcon}
      </IconButton>
    </Tooltip>
  );

  return (
    <Box sx={{ p: 1.5, pb: 1, flexShrink: 0 }}>
      <Stack
        direction="row"
        alignItems="center"
        sx={{
          mb: search ? 1.25 : 0,
          minHeight: 36,
          display: hideTitleOnMobile ? { xs: "none", md: "flex" } : "flex",
        }}
      >
        <Typography variant="subtitle1" component="h1" fontWeight={700} sx={{ flex: 1, px: 0.5 }}>
          {title}
        </Typography>
        {action}
      </Stack>
      {search && (
        <Stack direction="row" alignItems="center" gap={0.5}>
          <TextField
            fullWidth
            size="small"
            placeholder={search.placeholder}
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 16, color: "text.tertiary" }} />
                  </InputAdornment>
                ),
              },
              htmlInput: { "aria-label": search.placeholder },
            }}
          />
          {/* The title row is hidden on mobile, so the action moves beside the search. */}
          {hideTitleOnMobile && (
            <Box sx={{ display: { xs: "block", md: "none" } }}>{action}</Box>
          )}
        </Stack>
      )}
    </Box>
  );
}
