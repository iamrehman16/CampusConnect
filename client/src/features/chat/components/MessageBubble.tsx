import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { useAuth } from "@/shared/hooks/useAuth";
import type { Message, SendMessageDto } from "../types/chat-dto";
import { MessageStatusIcon } from "./MessageStatusIcon";
import { MessageContextCard } from "./MessageContextCard";
import { KebabMenu } from "@/shared/components/KebabMenu";
import { Flag as FlagIcon } from "@/shared/icons";
import { ReportDialog } from "@/features/moderation/components/ReportDialog";
import { format } from "date-fns";

interface Props {
  message: Message;
  retryMessage: (clientId: string, dto: SendMessageDto) => void;
  showSeenAt?: boolean;
}

export function MessageBubble({
  message,
  retryMessage,
  showSeenAt = false,
}: Props) {
  const { user } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);
  const isOwn = message.sender === user?._id;
  const timestampColor = isOwn ? "rgba(255,255,255,0.8)" : "text.tertiary";
  // Only received, persisted (real id), undeleted messages can be reported.
  const canReport = !isOwn && !message.isDeleted && Boolean(message.id);
  const seenAt = message.seenAt ? format(new Date(message.seenAt), "HH:mm") : null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: isOwn ? "flex-end" : "flex-start",
        maxWidth: { xs: "85%", sm: "75%" },
        alignSelf: isOwn ? "flex-end" : "flex-start",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 0.25,
          maxWidth: "100%",
          "&:hover .report-menu, &:focus-within .report-menu": { opacity: 1 },
        }}
      >
      <Box
        sx={{
          px: 1.5,
          py: 1,
          borderRadius: (t) => {
            const r = t.radius.lg;
            return isOwn ? `${r}px ${r}px 4px ${r}px` : `${r}px ${r}px ${r}px 4px`;
          },
          bgcolor: isOwn ? "primary.main" : "surface.card",
          color: isOwn ? "primary.contrastText" : "text.primary",
          border: "1px solid",
          borderColor: isOwn ? "primary.main" : "border.default",
          opacity: message._status === "PENDING" ? 0.7 : 1,
        }}
      >
        {message.isDeleted ? (
          <Typography
            variant="body2"
            fontStyle="italic"
            color={isOwn ? "primary.contrastText" : "text.disabled"}
          >
            This message was deleted
          </Typography>
        ) : (
          <>
            {message.context && message.kind && message.kind !== "text" && (
              <MessageContextCard kind={message.kind} context={message.context} isOwn={isOwn} />
            )}
            <Typography
              variant="body2"
              sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.5 }}
            >
              {message.content}
            </Typography>
          </>
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 0.5,
            mt: 0.5,
            minHeight: 14,
          }}
        >
          {message.createdAt && (
            <Typography variant="caption" sx={{ color: timestampColor, lineHeight: 1 }}>
              {format(new Date(message.createdAt), "HH:mm")}
            </Typography>
          )}
          {isOwn && (
            <MessageStatusIcon
              status={message._status}
              clientId={message.clientId}
              conversationId={message.conversationId}
              content={message.content}
              kind={message.kind}
              contextId={message.context?.refId}
              retryMessage={retryMessage}
            />
          )}
        </Box>
      </Box>
        {canReport && (
          <Box className="report-menu" sx={{ opacity: { xs: 1, md: 0 }, transition: "opacity 0.15s" }}>
            <KebabMenu
              items={[
                {
                  label: "Report message",
                  icon: <FlagIcon fontSize="small" />,
                  color: "error",
                  onClick: () => setReportOpen(true),
                },
              ]}
            />
          </Box>
        )}
      </Box>
      {reportOpen && (
        <ReportDialog
          open
          onClose={() => setReportOpen(false)}
          targetType="message"
          targetId={message.id}
          subject="this message"
        />
      )}

      {isOwn && message._status === "FAILED" && (
        <Typography variant="caption" color="error.main" sx={{ mt: 0.25, px: 0.5 }}>
          Not sent — tap the icon to retry
        </Typography>
      )}

      {isOwn && showSeenAt && seenAt && (
        <Typography variant="caption" color="text.tertiary" sx={{ mt: 0.25, px: 0.5 }}>
          Seen at {seenAt}
        </Typography>
      )}
    </Box>
  );
}
