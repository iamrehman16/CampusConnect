import { Box, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import { Description, ForumOutlined } from "@/shared/icons";
import type { MessageContext, MessageKind } from "../types/chat-dto";

interface Props {
  kind: Exclude<MessageKind, "text">;
  contextId: string;
  context: MessageContext;
  /** Sits inside an own (accent) bubble — flips text colours. */
  onAccent?: boolean;
}

const KIND_LABEL = { resource: "Resource", post: "Community post" } as const;

/** Click-through path for the item a message is about. */
function contextPath(
  kind: Exclude<MessageKind, "text">,
  id: string,
): string {
  return kind === "resource"
    ? ROUTES.RESOURCE_DETAIL.replace(":id", id)
    : `${ROUTES.COMMUNITY}?post=${id}`;
}

/** Card for a resource/post a chat message refers to (BACKLOG.md E13). */
export function MessageContextCard({ kind, contextId, context, onAccent }: Props) {
  const Icon = kind === "resource" ? Description : ForumOutlined;
  return (
    <Box
      component={RouterLink}
      to={contextPath(kind, contextId)}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        mb: 0.75,
        p: 1,
        borderRadius: (t) => `${t.radius.md}px`,
        border: "1px solid",
        borderColor: "border.default",
        bgcolor: "background.paper",
        color: "text.primary",
        textDecoration: "none",
        minWidth: 0,
        "&:hover": { borderColor: onAccent ? "primary.contrastText" : "primary.main" },
      }}
    >
      <Icon sx={{ fontSize: 20, color: "text.secondary", flexShrink: 0 }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.tertiary" display="block" lineHeight={1.2}>
          {KIND_LABEL[kind]}
          {context.subtitle ? ` · ${context.subtitle}` : ""}
        </Typography>
        <Typography variant="body2" fontWeight={600} noWrap>
          {context.title}
        </Typography>
      </Box>
    </Box>
  );
}
