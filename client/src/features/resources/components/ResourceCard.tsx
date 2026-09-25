import { Box, Card, CardActionArea, Chip, Stack, Typography } from "@mui/material";
import {
  Description,
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@/shared/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/hooks/useAuth";
import { KebabMenu } from "@/shared/components/KebabMenu";
import UserAvatar from "@/shared/components/UserAvatar";
import { ApprovalStatus, UserRole } from "@/shared/types/enums";
import type { Resource } from "../types/resource.dto";
import { ROUTES } from "@/shared/constants/routes";
import { TierChip } from "@/features/reputation/components/TierChip";
import { RESOURCE_TYPE_LABEL } from "../utils/resource-labels";

interface ResourceCardProps {
  resource: Resource;
  onEdit?: (resource: Resource) => void;
  onDelete?: (resource: Resource) => void;
}

/**
 * Library grid card (BACKLOG.md D7). Hierarchy: type → title → course →
 * author. The old card had a rainbow per-type colour map, a file-type
 * colour, a semester chip, a tier chip, downloads and file size all
 * competing with the title; now type is a quiet label, semester lives in
 * the filter, and size moves to the detail page.
 */
export function ResourceCard({ resource, onEdit, onDelete }: ResourceCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const canManage =
    user?.role === UserRole.ADMIN ||
    (user?.role === UserRole.CONTRIBUTOR && user._id === resource.uploadedBy._id);

  const kebabItems = [
    ...(onEdit
      ? [{ label: "Edit", icon: <EditIcon fontSize="small" />, onClick: () => onEdit(resource) }]
      : []),
    ...(onDelete
      ? [{
          label: "Delete",
          icon: <DeleteIcon fontSize="small" />,
          onClick: () => onDelete(resource),
          color: "error" as const,
        }]
      : []),
  ];

  const status =
    resource.approvalStatus === ApprovalStatus.PENDING
      ? { label: "In review", color: "warning" as const }
      : resource.approvalStatus === ApprovalStatus.REJECTED
        ? { label: "Rejected", color: "error" as const }
        : null;

  return (
    <Card
      sx={{
        height: "100%",
        position: "relative",
        transition: (t) => t.transitions.create("border-color"),
        "&:hover": { borderColor: "border.strong" },
      }}
    >
      <CardActionArea
        onClick={() => navigate(ROUTES.RESOURCE_DETAIL.replace(":id", resource._id))}
        sx={{ height: "100%", p: 2, display: "flex", flexDirection: "column", alignItems: "stretch", gap: 1.5 }}
      >
        <Stack direction="row" alignItems="center" gap={1} sx={{ pr: canManage && kebabItems.length ? 4 : 0 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1,
              display: "grid",
              placeItems: "center",
              bgcolor: "primary.subtle",
              color: "primary.main",
              flexShrink: 0,
            }}
          >
            <Description fontSize="small" />
          </Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap>
            {RESOURCE_TYPE_LABEL[resource.resourceType]}
          </Typography>
          {status && <Chip size="small" color={status.color} label={status.label} sx={{ ml: "auto" }} />}
        </Stack>

        <Box sx={{ flex: 1 }}>
          <Typography
            variant="subtitle2"
            fontWeight={600}
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.4,
            }}
          >
            {resource.title}
          </Typography>
          <Typography variant="caption" color="text.tertiary" display="block" sx={{ mt: 0.5 }} noWrap>
            {resource.course} · {resource.subject}
          </Typography>
        </Box>

        <Stack direction="row" alignItems="center" gap={1}>
          <UserAvatar name={resource.uploadedBy.name} avatar={resource.uploadedBy.avatar} size={22} />
          <Typography variant="caption" color="text.secondary" noWrap sx={{ minWidth: 0 }}>
            {resource.uploadedBy.name}
          </Typography>
          <TierChip tier={resource.uploadedBy.tier} hideNewcomer sx={{ height: 18, fontSize: "0.625rem" }} />
          <Stack direction="row" alignItems="center" gap={0.5} sx={{ ml: "auto", color: "text.tertiary", flexShrink: 0 }}>
            <DownloadIcon sx={{ fontSize: 14 }} />
            <Typography variant="caption">{resource.downloads}</Typography>
          </Stack>
        </Stack>
      </CardActionArea>

      {canManage && kebabItems.length > 0 && (
        <Box sx={{ position: "absolute", top: 10, right: 8 }}>
          <KebabMenu items={kebabItems} />
        </Box>
      )}
    </Card>
  );
}
