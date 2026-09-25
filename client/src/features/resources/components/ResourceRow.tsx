import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import { Description, Download as DownloadIcon } from "@/shared/icons";
import { ROUTES } from "@/shared/constants/routes";
import type { Resource } from "../types/resource.dto";
import { RESOURCE_TYPE_LABEL } from "../utils/resource-labels";

/**
 * Compact one-line resource entry (BACKLOG.md D6/D7): title first, one
 * quiet metadata line — course · type · author — and downloads. For lists
 * where a card grid is too heavy (Home, Library list view).
 */
export function ResourceRow({ resource }: { resource: Resource }) {
  const navigate = useNavigate();
  return (
    <ButtonBase
      onClick={() => navigate(ROUTES.RESOURCE_DETAIL.replace(":id", resource._id))}
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 1.5,
        py: 1.25,
        borderRadius: 1,
        textAlign: "left",
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          bgcolor: "primary.subtle",
          color: "primary.main",
        }}
      >
        <Description fontSize="small" />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {resource.title}
        </Typography>
        <Typography variant="caption" color="text.tertiary" noWrap display="block">
          {resource.course} · {RESOURCE_TYPE_LABEL[resource.resourceType]} · {resource.uploadedBy.name}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.tertiary", flexShrink: 0 }}>
        <DownloadIcon sx={{ fontSize: 14 }} />
        <Typography variant="caption">{resource.downloads}</Typography>
      </Box>
    </ButtonBase>
  );
}
