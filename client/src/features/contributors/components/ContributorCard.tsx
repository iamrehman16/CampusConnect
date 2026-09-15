import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Typography,
} from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { useChatTrigger } from "@/features/chat/hooks/chat-hooks";
import type { User } from "@/shared/types/auth.types";

interface Props {
  user: User;
}

export function ContributorCard({ user }: Props) {
  const { trigger, isPending } = useChatTrigger();

  return (
    <Card variant="outlined">
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{ width: 44, height: 44 }}>
            {user?.email?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {user.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
        </Box>

        {user.role && (
          <Chip
            label={user.role}
            size="small"
            variant="outlined"
            sx={{ alignSelf: "flex-start" }}
          />
        )}

        <Button
          size="small"
          variant="outlined"
          startIcon={<ChatBubbleOutlineIcon fontSize="small" />}
          loading={isPending}
          onClick={() => trigger(user._id)}
          sx={{ alignSelf: "flex-start", mt: 0.5 }}
        >
          Message
        </Button>
      </CardContent>
    </Card>
  );
}
