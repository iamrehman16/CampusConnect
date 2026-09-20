import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useForm, useWatch } from "react-hook-form";
import { useApplyToContribute } from "../hooks/application.hooks";
import {
  APPLICATION_REASON_MAX,
  APPLICATION_REASON_MIN,
} from "../types/application.dto";

interface FormValues {
  reason: string;
  sampleUrl: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ApplyDialog({ open, onClose }: Props) {
  const { mutate, isPending } = useApplyToContribute();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { reason: "", sampleUrl: "" } });

  const reasonLength = (useWatch({ control, name: "reason" }) ?? "").trim().length;

  const submit = handleSubmit(({ reason, sampleUrl }) => {
    mutate(
      { reason: reason.trim(), sampleUrl: sampleUrl.trim() || undefined },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      },
    );
  });

  return (
    <Dialog open={open} onClose={isPending ? undefined : onClose} fullWidth maxWidth="sm">
      <form onSubmit={submit} noValidate>
        <DialogTitle>Apply to become a contributor</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              An admin reviews every application. Tell us what you'd share and
              why you're a good fit.
            </Typography>
            <TextField
              label="Why do you want to contribute?"
              multiline
              minRows={4}
              fullWidth
              autoFocus
              {...register("reason", {
                required: "Please tell us why",
                validate: (v) =>
                  v.trim().length >= APPLICATION_REASON_MIN ||
                  `Write at least ${APPLICATION_REASON_MIN} characters`,
                maxLength: {
                  value: APPLICATION_REASON_MAX,
                  message: `At most ${APPLICATION_REASON_MAX} characters`,
                },
              })}
              error={!!errors.reason}
              helperText={
                errors.reason?.message ??
                `${reasonLength}/${APPLICATION_REASON_MIN} minimum`
              }
            />
            <TextField
              label="Link to prior work (optional)"
              placeholder="https://…"
              fullWidth
              {...register("sampleUrl", {
                validate: (v) => {
                  if (!v.trim()) return true;
                  try {
                    const { protocol } = new URL(v.trim());
                    return (
                      protocol === "http:" ||
                      protocol === "https:" ||
                      "Use an http(s) link"
                    );
                  } catch {
                    return "Enter a valid URL, including https://";
                  }
                },
              })}
              error={!!errors.sampleUrl}
              helperText={errors.sampleUrl?.message}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={isPending}>
            Submit application
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
