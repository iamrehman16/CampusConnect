import { Button, type ButtonProps } from "@mui/material";
import toast from "react-hot-toast";
import { ChatBubbleOutline } from "@/shared/icons";
import { useAuth } from "@/shared/hooks/useAuth";
import { useChatTrigger } from "../hooks/chat-hooks";
import type { ChatAttachment } from "../types/chat-dto";

interface Props {
  authorId: string;
  /** The resource/post being asked about; pre-attached to the chat. */
  attachment: ChatAttachment;
  label?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  sx?: ButtonProps["sx"];
}

/**
 * Opens (or reuses) a DM with the author of a resource/post with that item
 * staged as a card on the first message (BACKLOG.md E13). Renders nothing on
 * your own content.
 */
export function AskAuthorButton({
  authorId,
  attachment,
  label = "Ask the author",
  variant = "outlined",
  size = "small",
  sx,
}: Props) {
  const { user } = useAuth();
  const { trigger, isPending } = useChatTrigger();

  if (!user || user._id === authorId) return null;

  const handleClick = () => {
    trigger(authorId, attachment).catch(() =>
      toast.error("Couldn't open the chat. Please try again."),
    );
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isPending}
      startIcon={<ChatBubbleOutline sx={{ fontSize: 16 }} />}
      sx={{ textTransform: "none", fontWeight: 600, ...sx }}
    >
      {label}
    </Button>
  );
}
