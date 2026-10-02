import { ButtonBase, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import type { MessageContext, MessageKind } from "../types/chat-dto";

interface Props {
  kind: Exclude<MessageKind, "text">;
  context: MessageContext;
  isOwn: boolean;
}

const KIND_LABEL: Record<Props["kind"], string> = {
  resource: "Resource",
  post: "Community post",
};

/** Click-through target for the item a message is about. */
function contextPath(kind: Props["kind"], refId: string): string {
  return kind === "resource"
    ? ROUTES.RESOURCE_DETAIL.replace(":id", refId)
    : `${ROUTES.COMMUNITY}?post=${refId}`;
}

/** Card shown above a message's text when it was sent about a resource/post. */
export function MessageContextCard({ kind, context, isOwn }: Props) {
  return (
    <ButtonBase
      component={RouterLink}
      to={contextPath(kind, context.refId)}
      sx={(t) => ({
        display: "block",
        width: "100%",
        textAlign: "left",
        mb: 0.75,
        px: 1.25,
        py: 0.75,
        borderRadius: `${t.radius.md}px`,
        border: "1px solid",
        borderColor: isOwn ? "rgba(255,255,255,0.35)" : "border.default",
        bgcolor: isOwn ? "rgba(255,255,255,0.12)" : "surface.subtle",
        color: "inherit",
      })}
    >
      <Typography variant="caption" sx={{ display: "block", opacity: 0.8, fontWeight: 600 }}>
        {KIND_LABEL[kind]}
      </Typography>
      <Typography variant="body2" fontWeight={600} sx={{ overflowWrap: "anywhere" }}>
        {context.title}
      </Typography>
      {context.subtitle && (
        <Typography variant="caption" sx={{ display: "block", opacity: 0.8 }}>
          {context.subtitle}
        </Typography>
      )}
    </ButtonBase>
  );
}
