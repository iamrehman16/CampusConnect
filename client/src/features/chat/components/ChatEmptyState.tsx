import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Forum } from "@/shared/icons";
import { ROUTES } from "@/shared/constants/routes";

/** Right pane before a conversation is picked (desktop only). */
export default function ChatEmptyState() {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        px: 4,
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: (t) => `${t.radius.md}px`,
          display: "grid",
          placeItems: "center",
          bgcolor: "primary.subtle",
          color: "primary.main",
        }}
      >
        <Forum />
      </Box>
      <Box>
        <Typography variant="subtitle1" fontWeight={600}>
          Your messages
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 340 }}>
          Pick a conversation on the left, or message one of your mentors.
        </Typography>
      </Box>
      <Button variant="outlined" size="small" onClick={() => navigate(ROUTES.MY_MENTORS)}>
        Your mentors
      </Button>
    </Box>
  );
}
