import { Component, type ErrorInfo, type ReactNode } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useRouteError } from "react-router-dom";
import { ErrorOutline } from "@/shared/icons";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";

function ErrorPanel({ fullScreen }: { fullScreen?: boolean }) {
  // A page that fails to load while offline isn't broken, it just isn't
  // available without a connection (BACKLOG.md J3).
  const { isOnline } = useNetworkStatus();
  return (
    <Box
      role="alert"
      sx={{
        minHeight: fullScreen ? "100vh" : "100%",
        display: "grid",
        placeItems: "center",
        px: 3,
        py: 6,
        bgcolor: fullScreen ? "surface.canvas" : undefined,
      }}
    >
      <Stack alignItems="center" spacing={1.5} sx={{ maxWidth: 380, textAlign: "center" }}>
        <ErrorOutline sx={{ fontSize: 32, color: "text.tertiary" }} />
        <Typography variant="subtitle1" fontWeight={600}>
          {isOnline ? "This page hit a problem" : "You're offline"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isOnline
            ? "Something went wrong while showing this page. Reloading usually fixes it."
            : "This page isn't available offline yet. Reconnect and try again."}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Reload
          </Button>
          <Button variant="outlined" onClick={() => window.location.assign("/")}>
            Go home
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

interface BoundaryProps {
  children: ReactNode;
  /** Changing this (e.g. the pathname) clears a caught error. */
  resetKey: string;
}

/**
 * Catches render errors in a page so the app shell (navigation) survives,
 * instead of React Router's developer error screen replacing everything.
 * The error is still logged, not swallowed.
 */
export class PageErrorBoundary extends Component<BoundaryProps, { error: Error | null; key: string }> {
  state = { error: null as Error | null, key: this.props.resetKey };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  static getDerivedStateFromProps(props: BoundaryProps, state: { error: Error | null; key: string }) {
    return props.resetKey !== state.key ? { error: null, key: props.resetKey } : null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Page render failed", error, info.componentStack);
  }

  render() {
    return this.state.error ? <ErrorPanel /> : this.props.children;
  }
}

/** `errorElement` for top-level routes (outside the app shell). */
export function RouteErrorPage() {
  const error = useRouteError();
  console.error("Route error", error);
  return <ErrorPanel fullScreen />;
}
