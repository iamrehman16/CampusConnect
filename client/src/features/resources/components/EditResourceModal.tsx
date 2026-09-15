import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Typography,
  LinearProgress,
  IconButton,
  Chip,
  Autocomplete,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useState, useEffect } from 'react';
import { useUpdateResource } from '../hooks/resource.hooks';
import { ResourceType } from '@/shared/types/enums';
import type { Resource, UpdateResourceDto } from '../types/resource.dto';

const RESOURCE_TYPE_OPTIONS = Object.values(ResourceType);
const SEMESTER_OPTIONS = Array.from({ length: 8 }, (_, i) => i + 1);

interface EditResourceModalProps {
  open: boolean;
  resource: Resource | null;
  onClose: () => void;
}

export function EditResourceModal({ open, resource, onClose }: EditResourceModalProps) {
  const { mutate: updateResource, isPending } = useUpdateResource();

  const [dto, setDto] = useState<UpdateResourceDto>({});

  // Sync form when resource changes
  useEffect(() => {
    if (resource) {
      setDto({
        title: resource.title,
        description: resource.description ?? '',
        subject: resource.subject,
        course: resource.course,
        semester: resource.semester,
        resourceType: resource.resourceType,
        tags: resource.tags ?? [],
      });
    }
  }, [resource]);

  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  const handleField = (field: keyof UpdateResourceDto) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDto((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = () => {
    if (!resource) return;
    updateResource(
      { id: resource._id, dto },
      { onSuccess: handleClose }
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          '@media (max-width: 600px)': {
            borderRadius: 0,
            m: 0,
            maxHeight: '100dvh',
            height: '100dvh',
          },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={700}>Edit Resource</Typography>
          <IconButton size="small" onClick={handleClose} disabled={isPending}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
        {isPending && <LinearProgress sx={{ mt: 1.5, borderRadius: 1 }} />}
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        <Stack spacing={2.5}>
          <TextField
            label="Title"
            value={dto.title ?? ''}
            onChange={handleField('title')}
            fullWidth
            required
            disabled={isPending}
            inputProps={{ maxLength: 200 }}
            size="small"
          />

          <TextField
            label="Description"
            value={dto.description ?? ''}
            onChange={handleField('description')}
            fullWidth
            multiline
            rows={2}
            disabled={isPending}
            inputProps={{ maxLength: 2000 }}
            size="small"
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Subject"
              value={dto.subject ?? ''}
              onChange={handleField('subject')}
              fullWidth
              required
              disabled={isPending}
              size="small"
            />
            <TextField
              label="Course"
              value={dto.course ?? ''}
              onChange={handleField('course')}
              fullWidth
              required
              disabled={isPending}
              size="small"
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Semester"
              select
              value={dto.semester ?? 1}
              onChange={(e) => setDto((prev) => ({ ...prev, semester: Number(e.target.value) }))}
              fullWidth
              disabled={isPending}
              size="small"
            >
              {SEMESTER_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>Semester {s}</MenuItem>
              ))}
            </TextField>

            <TextField
              label="Resource Type"
              select
              value={dto.resourceType ?? ResourceType.NOTES}
              onChange={(e) =>
                setDto((prev) => ({ ...prev, resourceType: e.target.value as ResourceType }))
              }
              fullWidth
              disabled={isPending}
              size="small"
            >
              {RESOURCE_TYPE_OPTIONS.map((o) => (
                <MenuItem key={o} value={o}>{o}</MenuItem>
              ))}
            </TextField>
          </Stack>

          <Autocomplete
            multiple
            freeSolo
            options={[]}
            value={dto.tags ?? []}
            onChange={(_, val) => setDto((prev) => ({ ...prev, tags: val as string[] }))}
            disabled={isPending}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip label={option} size="small" {...getTagProps({ index })} key={option} />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tags"
                size="small"
                placeholder="Type and press Enter"
              />
            )}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={isPending} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}