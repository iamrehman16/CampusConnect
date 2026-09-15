import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Typography,
  Tooltip,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import ImageIcon from '@mui/icons-material/Image';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';
import { KebabMenu } from '@/shared/components/KebabMenu';
import { FileType, ApprovalStatus } from '@/shared/types/enums';
import type { Resource } from '../types/resource.dto';
import { ROUTES } from '@/shared/constants/routes';
import { UserRole } from '@/shared/types/enums';

// ─── File type config ────────────────────────────────────────────────────────

const FILE_TYPE_CONFIG: Record<
  FileType,
  { icon: React.ReactNode; color: string; bg: string }
> = {
  [FileType.PDF]: {
    icon: <PictureAsPdfIcon fontSize="small" />,
    color: '#ef5350',
    bg: 'rgba(239,83,80,0.12)',
  },
  [FileType.DOC]: {
    icon: <DescriptionIcon fontSize="small" />,
    color: '#42a5f5',
    bg: 'rgba(66,165,245,0.12)',
  },
  [FileType.PPT]: {
    icon: <SlideshowIcon fontSize="small" />,
    color: '#ff7043',
    bg: 'rgba(255,112,67,0.12)',
  },
  [FileType.IMAGE]: {
    icon: <ImageIcon fontSize="small" />,
    color: '#66bb6a',
    bg: 'rgba(102,187,106,0.12)',
  },
  [FileType.ZIP]: {
    icon: <FolderZipIcon fontSize="small" />,
    color: '#ffa726',
    bg: 'rgba(255,167,38,0.12)',
  },
  [FileType.OTHER]: {
    icon: <InsertDriveFileIcon fontSize="small" />,
    color: '#bdbdbd',
    bg: 'rgba(189,189,189,0.12)',
  },
};

const RESOURCE_TYPE_COLORS: Record<string, string> = {
  Notes: '#7c4dff',
  Slides: '#00bcd4',
  Assignment: '#ff9800',
  Lab: '#4caf50',
  PastPaper: '#e91e63',
  Book: '#795548',
  ResearchPaper: '#607d8b',
  Other: '#9e9e9e',
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface ResourceCardProps {
  resource: Resource;
  onEdit?: (resource: Resource) => void;
  onDelete?: (resource: Resource) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ResourceCard({ resource, onEdit, onDelete }: ResourceCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const fileConfig = FILE_TYPE_CONFIG[resource.fileType] ?? FILE_TYPE_CONFIG[FileType.OTHER];
  const resourceTypeColor = RESOURCE_TYPE_COLORS[resource.resourceType] ?? '#9e9e9e';

  const canManage =
    user?.role === UserRole.ADMIN ||
    (user?.role === UserRole.CONTRIBUTOR && user._id === resource.uploadedBy._id);

  const fileSizeLabel = resource.fileSize < 1024 * 1024
    ? `${Math.round(resource.fileSize / 1024)} KB`
    : `${(resource.fileSize / (1024 * 1024)).toFixed(1)} MB`;

  const kebabItems = [
    ...(onEdit
      ? [{ label: 'Edit', icon: <EditIcon fontSize="small" />, onClick: () => onEdit(resource) }]
      : []),
    ...(onDelete
      ? [{
          label: 'Delete',
          icon: <DeleteIcon fontSize="small" />,
          onClick: () => onDelete(resource),
          color: 'error' as const,
        }]
      : []),
  ];

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        elevation: 0,
        transition: 'border-color 0.2s',
        '&:hover': {
          borderColor: 'primary.light',
        },
      }}
    >
      <CardActionArea
        onClick={() => navigate(ROUTES.RESOURCE_DETAIL.replace(':id', resource._id))}
        sx={{ flexGrow: 1, alignItems: 'flex-start', display: 'flex', flexDirection: 'column' }}
      >
        <CardContent sx={{ width: '100%', pb: 1 }}>
          {/* Header row: file type icon + resource type chip + kebab */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
            <Stack direction="row" alignItems="center" gap={1}>
              {/* File type icon badge */}
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: fileConfig.bg,
                  color: fileConfig.color,
                  flexShrink: 0,
                }}
              >
                {fileConfig.icon}
              </Box>

              {/* Resource type chip */}
              <Chip
                label={resource.resourceType}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  bgcolor: `${resourceTypeColor}22`,
                  color: resourceTypeColor,
                  border: `1px solid ${resourceTypeColor}44`,
                }}
              />
            </Stack>

            {/* Kebab — stop propagation handled inside KebabMenu */}
            {canManage && kebabItems.length > 0 && (
              <KebabMenu items={kebabItems} />
            )}
          </Stack>

          {/* Title */}
          <Typography
            variant="subtitle2"
            fontWeight={600}
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.4,
              mb: 0.75,
            }}
          >
            {resource.title}
          </Typography>

          {/* Subject · Course */}
          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            {resource.subject} · {resource.course}
          </Typography>

          {/* Semester chip */}
          <Chip
            label={`Semester ${resource.semester}`}
            size="small"
            variant="outlined"
            sx={{ height: 18, fontSize: '0.65rem', mb: 1.5 }}
          />

          {/* Footer: uploader + downloads + size */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Tooltip title={resource.uploadedBy.name}>
              <Typography variant="caption" color="text.secondary" noWrap maxWidth={100}>
                {resource.uploadedBy.name}
              </Typography>
            </Tooltip>

            <Stack direction="row" alignItems="center" gap={1.5}>
              <Stack direction="row" alignItems="center" gap={0.4}>
                <DownloadIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.disabled">
                  {resource.downloads}
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.disabled">
                {fileSizeLabel}
              </Typography>
            </Stack>
          </Stack>

          {/* Pending badge for contributor's own pending resource */}
          {resource.approvalStatus === ApprovalStatus.PENDING && (
            <Chip
              label="Pending Review"
              size="small"
              sx={{
                mt: 1,
                height: 18,
                fontSize: '0.65rem',
                bgcolor: 'warning.dark',
                color: 'warning.contrastText',
              }}
            />
          )}
          {resource.approvalStatus === ApprovalStatus.REJECTED && (
            <Chip
              label="Rejected"
              size="small"
              sx={{
                mt: 1,
                height: 18,
                fontSize: '0.65rem',
                bgcolor: 'error.dark',
                color: 'error.contrastText',
              }}
            />
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}