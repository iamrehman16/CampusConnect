import { Box, Typography } from "@mui/material";

export default function ChatEmptyState() {
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography variant="body2" color="text.secondary">
        Select a conversation to start messaging
      </Typography>
    </Box>
  );
}
