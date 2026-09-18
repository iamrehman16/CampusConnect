import { Box, keyframes } from "@mui/material";
import { ThinkingBubble } from "./ThinkingBubble";
import { CitationsChip } from "./CitationChip";
import { MarkdownMessage } from "./MarkdownMessage";
import type { ConversationMessage } from "../types/ai-chat.dto";

const fadeSlideIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0);   }
`;

interface MessageBubbleProps {
  message: ConversationMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        animation: `${fadeSlideIn} 0.2s ease forwards`,
      }}
    >
      <Box sx={{ maxWidth: "78%" }}>
        <Box
          sx={{
            px: 1.75,
            py: 1.25,
            borderRadius: "14px",
            borderBottomRightRadius: isUser ? "4px" : "14px",
            borderBottomLeftRadius: isUser ? "14px" : "4px",
            ...(isUser
              ? {
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                }
              : {
                  border: { xs: "1px solid", md: "none" },
                  borderColor: { xs: "divider", md: "transparent" },
                  bgcolor: { xs: "background.paper", md: "transparent" },
                  px: { xs: 1.75, md: 0 },
                  py: { xs: 1.25, md: 0.5 },
                  color: "text.primary",
                }),
            fontSize: "0.875rem",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {message.isPending && !message.content ? (
            <ThinkingBubble />
          ) : (
            <MarkdownMessage content={message.content} isUser={isUser} />
          )}
        </Box>

        {!isUser &&
          !message.isPending &&
          message.citations &&
          message.citations.length > 0 && (
            <CitationsChip citations={message.citations} />
          )}

        {!isUser &&
          !message.isPending &&
          (!message.citations || message.citations.length === 0) &&
          (message.retrievalStatus === "below-threshold" ||
            message.retrievalStatus === "no-matches") && (
            <Box
              sx={{
                mt: 0.5,
                fontSize: "0.75rem",
                color: "text.secondary",
                fontStyle: "italic",
              }}
            >
              No closely matching resources were found in the knowledge base
              for this question.
            </Box>
          )}
      </Box>
    </Box>
  );
}
