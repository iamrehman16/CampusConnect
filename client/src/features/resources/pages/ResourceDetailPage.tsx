import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Stack,
  Typography,
  Button,
  Chip,
  Avatar,
  Divider,
  Skeleton,
  IconButton,
  Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import ImageIcon from '@mui/icons-material/Image';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SchoolIcon from '@mui/icons-material/School';
import { useResource, useDeleteResource } from '../hooks/resource.hooks';
import { EditResourceModal } from '../components/EditResourceModal';
import { FileType, ApprovalStatus } from '@/shared/types/enums';
import { useAuth } from '@/shared/hooks/useAuth';
import { UserRole } from '@/shared/types/enums';
import { ROUTES } from '@/shared/constants/routes';
import resourceService from '../services/resource.service';
import { formatRelativeTime } from '@/shared/utils/format';
import { PageContainer } from '@/shared/components/PageContainer';

// ─── File type config (mirrors ResourceCard) ──────────────────────────────────

const FILE_TYPE_CONFIG: Record<FileType, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  [FileType.PDF]: { icon: <PictureAsPdfIcon />, color: '#ef5350', bg: 'rgba(239,83,80,0.12)', label: 'PDF Document' },
  [FileType.DOC]: { icon: <DescriptionIcon />, color: '#42a5f5', bg: 'rgba(66,165,245,0.12)', label: 'Word Document' },
  [FileType.PPT]: { icon: <SlideshowIcon />, color: '#ff7043', bg: 'rgba(255,112,67,0.12)', label: 'Presentation' },
  [FileType.IMAGE]: { icon: <ImageIcon />, color: '#66bb6a', bg: 'rgba(102,187,106,0.12)', label: 'Image' },
  [FileType.ZIP]: { icon: <FolderZipIcon />, color: '#ffa726', bg: 'rgba(255,167,38,0.12)', label: 'Archive' },
  [FileType.OTHER]: { icon: <InsertDriveFileIcon />, color: '#bdbdbd', bg: 'rgba(189,189,189,0.12)', label: 'File' },
};

const RESOURCE_TYPE_COLORS: Record<string, string> = {
  Notes: '#7c4dff', Slides: '#00bcd4', Assignment: '#ff9800', Lab: '#4caf50',
  PastPaper: '#e91e63', Book: '#795548', ResearchPaper: '#607d8b', Other: '#9e9e9e',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 3, maxWidth: 800, mx: 'auto' }}>
      <Skeleton variant="text" width={80} height={32} sx={{ mb: 3 }} />
      <Skeleton variant="rounded" height={160} sx={{ mb: 3, borderRadius: 3 }} />
      <Skeleton variant="text" width="70%" height={32} />
      <Skeleton variant="text" width="40%" height={20} sx={{ mb: 2 }} />
      <Skeleton variant="text" width="100%" height={16} />
      <Skeleton variant="text" width="90%" height={16} />
      <Skeleton variant="text" width="60%" height={16} />
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [editOpen, setEditOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { data: resource, isLoading, isError } = useResource(id!);
  const { mutate: deleteResource } = useDeleteResource();

  if (isLoading)
    return (
      <PageContainer>
        <DetailSkeleton />
      </PageContainer>
    );

  if (isError || !resource) {
    return (
      <PageContainer>
        <Box textAlign="center" py={10}>
          <Typography variant="h6" color="text.secondary">Resource not found.</Typography>
          <Button onClick={() => navigate(ROUTES.RESOURCES)} sx={{ mt: 2 }}>
            Back to Resources
          </Button>
        </Box>
      </PageContainer>
    );
  }

  const fileConfig = FILE_TYPE_CONFIG[resource.fileType] ?? FILE_TYPE_CONFIG[FileType.OTHER];
  const resourceTypeColor = RESOURCE_TYPE_COLORS[resource.resourceType] ?? '#9e9e9e';

  const canManage =
    user?.role === UserRole.ADMIN ||
    (user?.role === UserRole.CONTRIBUTOR && user._id === resource.uploadedBy._id);

  const fileSizeLabel = resource.fileSize < 1024 * 1024
    ? `${Math.round(resource.fileSize / 1024)} KB`
    : `${(resource.fileSize / (1024 * 1024)).toFixed(1)} MB`;

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
      deleteResource(resource._id, {
        onSuccess: () => navigate(ROUTES.RESOURCES),
      });
    }
  };

  return (
    <PageContainer>
      <Box sx={{ px: { xs: 2, sm: 3 }, py: 3, maxWidth: 800, mx: 'auto' }}>
      {/* Back button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3, color: 'text.secondary', pl: 0 }}
      >
        Back
      </Button>

      {/* Hero section — file type icon + title block */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={3} alignItems={{ sm: 'flex-start' }}>
          {/* Large file type badge */}
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: fileConfig.bg,
              color: fileConfig.color,
              flexShrink: 0,
              '& svg': { fontSize: 36 },
            }}
          >
            {fileConfig.icon}
          </Box>

          {/* Title + meta */}
          <Box flexGrow={1} minWidth={0}>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
              <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1.3, mb: 1 }}>
                {resource.title}
              </Typography>

              {/* Action buttons */}
              {canManage && (
                <Stack direction="row" gap={0.5} flexShrink={0}>
                  <IconButton
                    size="small"
                    onClick={() => setEditOpen(true)}
                    sx={{ color: 'text.secondary' }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={handleDelete}
                    sx={{ color: 'error.main' }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              )}
            </Stack>

            {/* Chips row */}
            <Stack direction="row" flexWrap="wrap" gap={1} mb={1.5}>
              <Chip
                label={resource.resourceType}
                size="small"
                sx={{
                  bgcolor: `${resourceTypeColor}22`,
                  color: resourceTypeColor,
                  border: `1px solid ${resourceTypeColor}44`,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              />
              <Chip
                label={fileConfig.label}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
              <Chip
                label={`Semester ${resource.semester}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
              {resource.approvalStatus === ApprovalStatus.PENDING && (
                <Chip label="Pending Review" size="small" color="warning" variant="outlined" sx={{ fontSize: '0.75rem' }} />
              )}
              {resource.approvalStatus === ApprovalStatus.REJECTED && (
                <Chip label="Rejected" size="small" color="error" variant="outlined" sx={{ fontSize: '0.75rem' }} />
              )}
            </Stack>

            {/* Subject · Course */}
            <Stack direction="row" alignItems="center" gap={1}>
              <SchoolIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
              <Typography variant="body2" color="text.secondary">
                {resource.subject} · {resource.course}
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {/* Description */}
      {resource.description && (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="overline" color="text.secondary" fontWeight={700} mb={1}>
            DESCRIPTION
          </Typography>
          <Typography variant="body2" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {resource.description}
          </Typography>
        </Paper>
      )}

      {/* File info + uploader */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="overline" color="text.secondary" fontWeight={700} mb={2}>
          DETAILS
        </Typography>

        <Stack spacing={1.5}>
          {/* Uploader */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">Uploaded by</Typography>
            <Stack direction="row" alignItems="center" gap={1}>
              <Avatar sx={{ width: 22, height: 22, fontSize: '0.65rem', bgcolor: 'secondary.light' }}>
                {resource.uploadedBy.name?.[0]?.toUpperCase() ?? 'U'}
              </Avatar>
              <Typography variant="body2" fontWeight={500}>
                {resource.uploadedBy.name}
              </Typography>
            </Stack>
          </Stack>

          <Divider />

          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">File size</Typography>
            <Typography variant="body2" fontWeight={500}>{fileSizeLabel}</Typography>
          </Stack>

          <Divider />

          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">Format</Typography>
            <Typography variant="body2" fontWeight={500} sx={{ textTransform: 'uppercase' }}>
              {resource.fileFormat}
            </Typography>
          </Stack>

          <Divider />

          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">Downloads</Typography>
            <Typography variant="body2" fontWeight={500}>{resource.downloads}</Typography>
          </Stack>

          <Divider />

          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">Uploaded</Typography>
            <Stack direction="row" alignItems="center" gap={0.5}>
              <CalendarTodayIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
              <Typography variant="body2" fontWeight={500}>
                {formatRelativeTime(resource.createdAt)}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Paper>

      {/* Tags */}
      {resource.tags?.length > 0 && (
        <Stack direction="row" flexWrap="wrap" gap={1} mb={3}>
          {resource.tags.map((tag) => (
            <Chip
              key={tag}
              label={`#${tag}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.75rem', color: 'text.secondary' }}
            />
          ))}
        </Stack>
      )}

      {/* Rejection reason */}
      {resource.approvalStatus === ApprovalStatus.REJECTED && resource.rejectionReason && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'error.dark',
            bgcolor: 'rgba(211,47,47,0.08)',
          }}
        >
          <Typography variant="overline" color="error.light" fontWeight={700} display="block" mb={0.5}>
            REJECTION REASON
          </Typography>
          <Typography variant="body2" color="error.light">
            {resource.rejectionReason}
          </Typography>
        </Paper>
      )}

      {/* Download CTA — only for approved resources */}
      {resource.approvalStatus === ApprovalStatus.APPROVED && (
        <Button
          variant="contained"
          fullWidth
          size="large"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          disabled={downloading}
          sx={{ borderRadius: 2, minHeight: 48 }}
        >
          {downloading ? 'Preparing download...' : 'Download Resource'}
        </Button>
      )}

      {/* Edit modal */}
      <EditResourceModal
        open={editOpen}
        resource={resource}
        onClose={() => setEditOpen(false)}
      />
    </Box>
    </PageContainer>
  );
}