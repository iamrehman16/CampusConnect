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
import { useRequestMentorship } from "../hooks/mentorship.hooks";
import { MENTORSHIP_LIMITS } from "../types/mentorship.dto";

interface FormValues {
  topic: string;
  introMessage: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  mentorId: string;
  mentorName: string;
  /** Pre-fill the topic (e.g. from one of the mentor's advertised topics). */
  defaultTopic?: string;
}

export function RequestMentorshipDialog({
  open,
  onClose,
  mentorId,
  mentorName,
  defaultTopic = "",
}: Props) {
  const { mutate, isPending } = useRequestMentorship();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { topic: defaultTopic, introMessage: "" },
  });

  const introLength = (useWatch({ control, name: "introMessage" }) ?? "").trim()
    .length;

  const submit = handleSubmit(({ topic, introMessage }) => {
    mutate(
      { mentorId, topic: topic.trim(), introMessage: introMessage.trim() },
      {
        onSuccess: () => {
          reset({ topic: defaultTopic, introMessage: "" });
          onClose();
        },
      },
    );
  });

  const { topicMin, topicMax, introMin, introMax } = MENTORSHIP_LIMITS;

  return (
    <Dialog
      open={open}
      onClose={isPending ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <form onSubmit={submit} noValidate>
        <DialogTitle>Request mentorship from {mentorName}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {mentorName} will see this and can accept or decline. If they
              accept, a chat opens with your message as the first one.
            </Typography>

            <TextField
              label="What do you want help with?"
              placeholder="e.g. Dynamic programming"
              autoFocus
              fullWidth
              {...register("topic", {
                validate: (v) => {
                  const n = v.trim().length;
                  if (n < topicMin) return `At least ${topicMin} characters`;
                  if (n > topicMax) return `At most ${topicMax} characters`;
                  return true;
                },
              })}
              error={!!errors.topic}
              helperText={errors.topic?.message}
            />

            <TextField
              label="Introduce yourself"
              placeholder="Where you are now, what you're stuck on, and what you'd like to achieve."
              multiline
              minRows={4}
              fullWidth
              {...register("introMessage", {
                validate: (v) => {
                  const n = v.trim().length;
                  if (n < introMin) return `Write at least ${introMin} characters`;
                  if (n > introMax) return `At most ${introMax} characters`;
                  return true;
                },
              })}
              error={!!errors.introMessage}
              helperText={
                errors.introMessage?.message ??
                `${introLength}/${introMin} minimum`
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={isPending}>
            Send request
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
