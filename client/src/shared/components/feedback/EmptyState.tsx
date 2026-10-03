import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Inbox as InboxIcon } from "@/shared/icons";

interface EmptyStateProps {
  /** Short heading; `message` is the explanation under it. */
  title?: string;
  message?: string;
  icon?: ReactNode;
  /** The next step (a button or link) — an empty state should say what to do. */
  action?: ReactNode;
}

/**
 * Empty-state placeholder for lists/grids with no data (BACKLOG.md H2).
 */
export default function EmptyState({
  title,
  message = 'No items found.',
  icon,
  action,
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: 8,
        px: 3,
        gap: 1,
      }}
    >
      <Box sx={{ color: 'text.tertiary', display: 'flex', mb: 0.5 }}>
        {icon || <InboxIcon sx={{ fontSize: 32 }} />}
      </Box>
      {title && (
        <Typography variant="subtitle1" fontWeight={600}>
          {title}
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
        {message}
      </Typography>
      {action && <Box sx={{ mt: 1 }}>{action}</Box>}
    </Box>
  );
}
