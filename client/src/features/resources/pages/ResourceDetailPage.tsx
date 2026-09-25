import { useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  Link,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ArrowBack,
  AutoAwesome,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  OpenInNew,
} from "@/shared/icons";
import { useDeleteResource, useResource, useResources } from "../hooks/resource.hooks";
import { EditResourceModal } from "../components/EditResourceModal";
import { ResourceRow } from "../components/ResourceRow";
import { ApprovalStatus, UserRole } from "@/shared/types/enums";
import { useAuth } from "@/shared/hooks/useAuth";
import { ROUTES } from "@/shared/constants/routes";
import resourceService from "../services/resource.service";
import { formatRelativeTime } from "@/shared/utils/format";
import { PageContainer } from "@/shared/components/PageContainer";
import UserAvatar from "@/shared/components/UserAvatar";
import { TierChip } from "@/features/reputation/components/TierChip";
import type { Resource } from "../types/resource.dto";
import {
  FILE_TYPE_LABEL,
  RESOURCE_TYPE_LABEL,
  formatFileSize,
  resourcePreviewUrl,
} from "../utils/resource-labels";

function DetailSkeleton() {
  return (
    <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "minmax(0, 2fr) minmax(0, 1fr)" } }}>
      <Stack spacing={2}>
        <Skeleton width={120} />
        <Skeleton variant="text" height={44} width="80%" />
        <Skeleton width="50%" />
        <Skeleton variant="rounded" height={420} />
      </Stack>
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={140} />
        <Skeleton variant="rounded" height={180} />
      </Stack>
    </Box>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack direction="row" justifyContent="space-between" gap={2} sx={{ py: 1 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500} textAlign="right">
        {value}
      </Typography>
    </Stack>
  );
}

/** Other approved resources for the same course. */
function RelatedResources({ resource }: { resource: Resource }) {
  const { data, isLoading } = useResources({ course: resource.course, status: ApprovalStatus.APPROVED });
  const related = (data?.pages[0]?.data ?? []).filter((r) => r._id !== resource._id).slice(0, 4);
  if (!isLoading && related.length === 0) return null;
  return (
    <Card>
      <Typography variant="subtitle2" fontWeight={600} sx={{ px: 2, pt: 1.75, pb: 0.5 }}>
        More for {resource.course}
      </Typography>
      <Box sx={{ px: 0.5, pb: 1 }}>
        {isLoading ? (
          <Stack spacing={1} sx={{ p: 1.5 }}>
            <Skeleton variant="rounded" height={36} />
            <Skeleton variant="rounded" height={36} />
          </Stack>
        ) : (
          related.map((r) => <ResourceRow key={r._id} resource={r} />)
        )}
      </Box>
    </Card>
  );
}

/**
 * Resource detail (BACKLOG.md D7): first-page preview, primary actions
 * (download, ask the AI about it), author card and related resources.
 */
export default function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);

  const { data: resource, isLoading, isError } = useResource(id!);
  const { mutate: deleteResource } = useDeleteResource();

  if (isLoading) {
    return (
      <PageContainer width="wide">
        <DetailSkeleton />
      </PageContainer>
    );
  }

  if (isError || !resource) {
    return (
      <PageContainer width="narrow">
        <Card sx={{ py: 8, textAlign: "center" }}>
          <Typography variant="subtitle1" fontWeight={600}>
            This resource isn't available
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
            It may have been removed, or the link is wrong.
          </Typography>
          <Button variant="outlined" onClick={() => navigate(ROUTES.RESOURCES)}>
            Back to the library
          </Button>
        </Card>
      </PageContainer>
    );
  }

  const canManage =
    user?.role === UserRole.ADMIN ||
    (user?.role === UserRole.CONTRIBUTOR && user._id === resource.uploadedBy._id);
  const isApproved = resource.approvalStatus === ApprovalStatus.APPROVED;
  const preview = previewFailed ? undefined : resourcePreviewUrl(resource.fileUrl, resource.fileType);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await resourceService.downloadResource(resource._id);
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${resource.title}"?`)) {
      deleteResource(resource._id, { onSuccess: () => navigate(ROUTES.RESOURCES) });
    }
  };

  const askAi = () =>
    navigate(ROUTES.AI_CHAT, {
      state: {
        initialPrompt: `Summarise the key ideas in "${resource.title}" (${resource.course}) and what I should focus on for the exam.`,
      },
    });

  return (
    <PageContainer width="wide">
      <Link
        component="button"
        onClick={() => navigate(-1)}
        underline="hover"
        color="text.secondary"
        variant="body2"
        sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, mb: 2 }}
      >
        <ArrowBack sx={{ fontSize: 16 }} /> Back
      </Link>

      <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 2fr) minmax(0, 1fr)" }, alignItems: "start" }}>
        {/* ── Main column ── */}
        <Stack spacing={2.5} sx={{ minWidth: 0 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {RESOURCE_TYPE_LABEL[resource.resourceType]} · {resource.course}
            </Typography>
            <Stack direction="row" alignItems="flex-start" gap={1}>
              <Typography variant="h5" component="h1" fontWeight={700} sx={{ lineHeight: 1.3, flex: 1, letterSpacing: "-0.01em" }}>
                {resource.title}
              </Typography>
              {canManage && (
                <Stack direction="row">
                  <Tooltip title="Edit">
                    <IconButton onClick={() => setEditOpen(true)} aria-label="Edit resource">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={handleDelete} aria-label="Delete resource" sx={{ color: "error.main" }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              )}
            </Stack>
            <Typography variant="body2" color="text.tertiary" sx={{ mt: 0.5 }}>
              {resource.subject} · Semester {resource.semester} · Shared {formatRelativeTime(resource.createdAt)}
            </Typography>
          </Box>

          {resource.approvalStatus === ApprovalStatus.PENDING && (
            <Alert severity="warning">In review — only you and admins can see this until it's approved.</Alert>
          )}
          {resource.approvalStatus === ApprovalStatus.REJECTED && (
            <Alert severity="error">
              Not approved{resource.rejectionReason ? `: ${resource.rejectionReason}` : "."}
            </Alert>
          )}

          {isApproved && (
            <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
              <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleDownload} disabled={downloading}>
                {downloading ? "Preparing…" : "Download"}
              </Button>
              <Button variant="outlined" startIcon={<AutoAwesome />} onClick={askAi}>
                Ask AI about this
              </Button>
            </Stack>
          )}

          {preview ? (
            <Card sx={{ p: 0, overflow: "hidden", bgcolor: "surface.subtle" }}>
              <Box
                component="img"
                src={preview}
                alt={`First page of ${resource.title}`}
                loading="lazy"
                onError={() => setPreviewFailed(true)}
                sx={{ display: "block", width: "100%", height: "auto", maxHeight: 720, objectFit: "cover", objectPosition: "top", bgcolor: "#fff" }}
              />
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 1.25, bgcolor: "surface.card", borderTop: "1px solid", borderColor: "border.default" }}>
                <Typography variant="caption" color="text.tertiary">
                  Preview · page 1
                </Typography>
                {isApproved && (
                  <Button size="small" variant="text" endIcon={<OpenInNew sx={{ fontSize: 14 }} />} onClick={handleDownload}>
                    Full document
                  </Button>
                )}
              </Stack>
            </Card>
          ) : null}

          {resource.description && (
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
                About this resource
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {resource.description}
              </Typography>
            </Box>
          )}

          {resource.tags?.length > 0 && (
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {resource.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onClick={() => navigate(`${ROUTES.RESOURCES}?q=${encodeURIComponent(tag)}`)}
                />
              ))}
            </Stack>
          )}
        </Stack>

        {/* ── Aside ── */}
        <Stack spacing={2.5} sx={{ minWidth: 0 }}>
          <Card sx={{ p: 2 }}>
            <Typography variant="caption" color="text.tertiary" fontWeight={600}>
              Shared by
            </Typography>
            <Stack direction="row" alignItems="center" gap={1.5} sx={{ mt: 1 }}>
              <UserAvatar name={resource.uploadedBy.name} avatar={resource.uploadedBy.avatar} size={44} />
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" alignItems="center" gap={0.75}>
                  <Typography variant="subtitle2" fontWeight={600} noWrap>
                    {resource.uploadedBy.name}
                  </Typography>
                  <TierChip tier={resource.uploadedBy.tier} hideNewcomer />
                </Stack>
                <Link
                  component={RouterLink}
                  to={ROUTES.PUBLIC_PROFILE.replace(":userId", resource.uploadedBy._id)}
                  variant="caption"
                  underline="hover"
                  fontWeight={600}
                >
                  View profile
                </Link>
              </Box>
            </Stack>
          </Card>

          <Card sx={{ px: 2, py: 1 }}>
            <DetailRow label="Format" value={FILE_TYPE_LABEL[resource.fileType]} />
            <Divider />
            <DetailRow label="Size" value={formatFileSize(resource.fileSize)} />
            <Divider />
            <DetailRow label="Downloads" value={resource.downloads} />
            <Divider />
            <DetailRow label="Semester" value={resource.semester} />
          </Card>

          <RelatedResources resource={resource} />
        </Stack>
      </Box>

      <EditResourceModal open={editOpen} resource={resource} onClose={() => setEditOpen(false)} />
    </PageContainer>
  );
}
