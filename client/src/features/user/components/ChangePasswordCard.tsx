import { useState, type FormEvent } from "react";
import { Box, Button, Card, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuth } from "@/shared/hooks/useAuth";
import { userService } from "../services/user.services";

const MIN_LENGTH = 6; // matches the server's ChangePasswordDto / RegisterUserDto

/**
 * Change password (BACKLOG.md G5). The server clears the refresh token on
 * success, so this session is signed out too — done explicitly here with a
 * clear message rather than failing at the next token refresh.
 */
export function ChangePasswordCard() {
  const { logout } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: () => userService.changePassword(current, next),
    onSuccess: () => {
      toast.success("Password changed. Sign in with your new password.");
      void logout();
    },
  });

  const tooShort = next.length > 0 && next.length < MIN_LENGTH;
  const mismatch = confirm.length > 0 && confirm !== next;
  const canSubmit = current && next.length >= MIN_LENGTH && confirm === next && !isPending;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (canSubmit) mutate();
  };

  return (
    <Card sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Password
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You'll be signed out everywhere after changing it.
        </Typography>
      </Box>
      <Stack component="form" spacing={2.5} onSubmit={submit}>
        <TextField
          type="password"
          label="Current password"
          size="small"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
        <TextField
          type="password"
          label="New password"
          size="small"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          error={tooShort}
          helperText={tooShort ? `At least ${MIN_LENGTH} characters` : " "}
        />
        <TextField
          type="password"
          label="Confirm new password"
          size="small"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={mismatch}
          helperText={mismatch ? "Passwords don't match" : " "}
        />
        <Stack direction="row" justifyContent="flex-end">
          <Button
            type="submit"
            variant="outlined"
            disabled={!canSubmit}
            startIcon={isPending ? <CircularProgress size={16} sx={{ color: "inherit" }} /> : undefined}
          >
            {isPending ? "Changing…" : "Change password"}
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}
