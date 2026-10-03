import { Alert, Button } from "@mui/material";

interface InlineErrorProps {
  message?: string;
  /** Usually a query's `refetch`. */
  onRetry?: () => void;
  /** Tighter padding for use inside cards and side panes. */
  compact?: boolean;
}

/**
 * A failed request, shown where the content would have been, with a retry.
 * Use this instead of a bare toast or a blank area (BACKLOG.md H2); the empty
 * state must never be shown for a request that failed.
 */
export default function InlineError({
  message = "Couldn't load this.",
  onRetry,
  compact,
}: InlineErrorProps) {
  return (
    <Alert
      severity="error"
      variant="outlined"
      sx={compact ? { mx: 1.5, my: 1, py: 0 } : undefined}
      action={
        onRetry && (
          <Button color="inherit" size="small" onClick={() => onRetry()}>
            Retry
          </Button>
        )
      }
    >
      {message}
    </Alert>
  );
}
