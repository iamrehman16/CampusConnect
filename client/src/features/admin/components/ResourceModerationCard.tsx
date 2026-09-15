// features/admin/components/ResourceModerationCard.tsx
import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import { useAdminApproveResource } from '@/features/resources/hooks/resource.hooks';
import { useAdminRejectResource } from '@/features/resources/hooks/resource.hooks';
import type { Resource } from '@/features/resources/types/resource.dto';

interface Props {
  resource: Resource;
}

export default function ResourceModerationCard({ resource }: Props) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');

  const approve = useAdminApproveResource();
  const reject = useAdminRejectResource();

  const isPending =
    approve.isPending || reject.isPending;

  const handleApprove = () => {
    approve.mutate(resource._id);
  };

  const handleReject = () => {
    if (!reason.trim()) return;
    reject.mutate(
      { id: resource._id, dto: { reason: reason.trim() } },
      { onSuccess: () => { setRejectOpen(false); setReason(''); } },
    );
  };

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}
    >
      {/* Header row */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <InsertDriveFileOutlinedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            fontWeight={600}
            noWrap
            title={resource.title}
          >
            {resource.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {resource.subject} · Sem {resource.semester} · {resource.fileType.toUpperCase()}
          </Typography>
        </Box>

        <Tooltip title="Open resource">
          <IconButton
            size="small"
            href={resource.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Meta chips */}
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
        <Chip label={resource.resourceType} size="small" variant="outlined" />
        <Chip label={resource.course} size="small" variant="outlined" />
        {resource.tags.slice(0, 2).map((tag) => (
          <Chip key={tag} label={tag} size="small" variant="outlined" />
        ))}
      </Box>

      {/* Uploaded by */}
      <Typography variant="caption" color="text.secondary">
        Uploaded by{' '}
        <Typography component="span" variant="caption" color="text.primary">
          {typeof resource.uploadedBy === 'object'
            ? (resource.uploadedBy as any).name
            : resource.uploadedBy}
        </Typography>{' '}
        · {new Date(resource.createdAt).toLocaleDateString()}
      </Typography>

      {/* Reject reason input */}
      <Collapse in={rejectOpen}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <TextField
            size="small"
            fullWidth
            multiline
            minRows={2}
            placeholder="Reason for rejection..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              size="small"
              variant="text"
              onClick={() => { setRejectOpen(false); setReason(''); }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              color="error"
              onClick={handleReject}
              disabled={!reason.trim() || isPending}
              loading={reject.isPending}
            >
              Confirm reject
            </Button>
          </Box>
        </Box>
      </Collapse>

      {/* Action row */}
      {!rejectOpen && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<CheckCircleOutlineIcon />}
            onClick={handleApprove}
            disabled={isPending}
            loading={approve.isPending}
            sx={{ flex: 1 }}
          >
            Approve
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<CancelOutlinedIcon />}
            onClick={() => setRejectOpen(true)}
            disabled={isPending}
            sx={{ flex: 1 }}
          >
            Reject
          </Button>
        </Box>
      )}
    </Paper>
  );
}