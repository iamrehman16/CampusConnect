import { useState } from "react";
import { Box, IconButton, Tooltip, keyframes } from "@mui/material";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ThumbUpRoundedIcon from "@mui/icons-material/ThumbUpRounded";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbDownRoundedIcon from "@mui/icons-material/ThumbDownRounded";
import ThumbDownOutlinedIcon from "@mui/icons-material/ThumbDownOutlined";
import { ThinkingBubble } from "./ThinkingBubble";
import { CitationsChip } from "./CitationChip";
import { MarkdownMessage } from "./MarkdownMessage";
import { useSetMessageFeedback } from "../hooks/ai-chat.hooks";
import type { ConversationMessage } from "../types/ai-chat.dto";

const fadeSlideIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0);   }
`;

interface MessageBubbleProps {
  message: ConversationMessage;
  // Needed to address the feedback endpoint (BACKLOG.md C1). Omitted for
  // the streaming bubble in AiChatMessageList's usage isn't necessary
  // since the toolbar is hidden until isPending is false anyway.
  conversationId: string;
}

function MessageActionToolbar({
  message,
  conversationId,
}: {
  message: ConversationMessage;
  conversationId: string;
}) {
  const [copied, setCopied] = useState(false);
  const { mutate: setFeedback } = useSetMessageFeedback();

  const handleCopy = () => {
    void navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const toggleFeedback = (value: "up" | "down") => {
    setFeedback({
      conversationId,
      messageId: message.id,
      feedback: message.feedback === value ? null : value,
    });
  };

  return (
    <Box
      className="message-action-toolbar"
      sx={{
        display: "flex",
        gap: 0.25,
        mt: 0.25,
        opacity: { xs: 1, md: 0 },
        transition: "opacity 0.15s ease",
      }}
    >
      <Tooltip title={copied ? "Copied" : "Copy"}>
        <IconButton size="small" onClick={handleCopy}>
          {copied ? (
            <CheckRoundedIcon sx={{ fontSize: 16 }} />
          ) : (
            <ContentCopyRoundedIcon sx={{ fontSize: 16 }} />
          )}
        </IconButton>
      </Tooltip>
      <Tooltip title="Good response">
        <IconButton size="small" onClick={() => toggleFeedback("up")}>
          {message.feedback === "up" ? (
            <ThumbUpRoundedIcon sx={{ fontSize: 16 }} color="primary" />
          ) : (
            <ThumbUpOutlinedIcon sx={{ fontSize: 16 }} />
          )}
        </IconButton>
      </Tooltip>
      <Tooltip title="Bad response">
        <IconButton size="small" onClick={() => toggleFeedback("down")}>
          {message.feedback === "down" ? (
            <ThumbDownRoundedIcon sx={{ fontSize: 16 }} color="primary" />
          ) : (
            <ThumbDownOutlinedIcon sx={{ fontSize: 16 }} />
          )}
        </IconButton>
      </Tooltip>
    </Box>
  );
}

export function MessageBubble({ message, conversationId }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        animation: `${fadeSlideIn} 0.2s ease forwards`,
      }}
    >
      <Box
        sx={{
          maxWidth: "78%",
          "&:hover .message-action-toolbar": { opacity: 1 },
        }}
      >
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

        {!isUser && !message.isPending && (
          <MessageActionToolbar
            message={message}
            conversationId={conversationId}
          />
        )}
      </Box>
    </Box>
  );
}
