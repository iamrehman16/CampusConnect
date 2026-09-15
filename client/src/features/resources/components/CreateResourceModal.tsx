import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Box,
  Typography,
  LinearProgress,
  IconButton,
  Chip,
  Autocomplete,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useCreateResource } from '../hooks/resource.hooks';
import { ResourceType } from '@/shared/types/enums';
import type { CreateResourceDto } from '../types/resource.dto';

// ─── Constants ───────────────────────────────────────────────────────────────

const ALLOWED_EXTENSIONS = '.pdf,.doc,.docx,.ppt,.pptx,.zip,.txt,.png,.jpg,.jpeg,.gif,.webp';

const RESOURCE_TYPE_OPTIONS = Object.values(ResourceType).map((v) => ({
  value: v,
  label: v,
}));

const SEMESTER_OPTIONS = Array.from({ length: 8 }, (_, i) => i + 1);

// ─── Props ───────────────────────────────────────────────────────────────────

interface CreateResourceModalProps {
  open: boolean;
  onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CreateResourceModal({ open, onClose }: CreateResourceModalProps) {
  const { mutate: createResource, isPending } = useCreateResource();

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dto, setDto] = useState<CreateResourceDto>({
    title: '',
    description: '',
    subject: '',
    course: '',
    semester: 1,
    resourceType: ResourceType.NOTES,
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');

  const resetForm = () => {
    setFile(null);
    setDto({
      title: '',
      description: '',
      subject: '',
      course: '',
      semester: 1,
      resourceType: ResourceType.NOTES,
      tags: [],
    });
    setTagInput('');
  };

  const handleClose = () => {
    if (isPending) return;
    resetForm();
    onClose();
  };

  const handleField = (field: keyof CreateResourceDto) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDto((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // ── File drop/select ──────────────────────────────────────────────────────

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type) {
      return; // browser couldn't determine type — reject silently, backend will catch
    }
    setFile(selectedFile);
    // Auto-fill title from filename if empty
    if (!dto.title) {
      const name = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setDto((prev) => ({ ...prev, title: name }));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, [dto.title]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const isValid = file && dto.title.trim() && dto.subject.trim() && dto.course.trim();

  const handleSubmit = () => {
    if (!isValid) return;
    createResource(
      { dto, file },
      {
        onSuccess: () => {
          handleClose();
        },
      }
    );
  };

  const fileSizeLabel = file
    ? file.size < 1024 * 1024
      ? `${Math.round(file.size / 1024)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`
    : '';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={false}
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          // Full screen on mobile
          '@media (max-width: 600px)': {
            borderRadius: 0,
            m: 0,
            maxHeight: '100dvh',
            height: '100dvh',
          },
        },
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={700}>
            Upload Resource
          </Typography>
          <IconButton size="small" onClick={handleClose} disabled={isPending}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
        {isPending && <LinearProgress sx={{ mt: 1.5, borderRadius: 1 }} />}
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        <Stack spacing={2.5}>
          {/* Drop zone */}
          <Box
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('resource-file-input')?.click()}
            sx={{
              border: '2px dashed',
              borderColor: dragOver ? 'primary.main' : file ? 'success.main' : 'divider',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: dragOver ? 'action.hover' : 'transparent',
              transition: 'all 0.2s',
              '&:hover': { borderColor: 'primary.light', bgcolor: 'action.hover' },
            }}
          >
            <input
              id="resource-file-input"
              type="file"
              accept={ALLOWED_EXTENSIONS}
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />
            {file ? (
              <Stack alignItems="center" gap={1}>
                <InsertDriveFileIcon sx={{ fontSize: 32, color: 'success.main' }} />
                <Typography variant="body2" fontWeight={600} color="success.main">
                  {file.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {fileSizeLabel} · Click to change
                </Typography>
              </Stack>
            ) : (
              <Stack alignItems="center" gap={1}>
                <CloudUploadIcon sx={{ fontSize: 32, color: 'text.disabled' }} />
                <Typography variant="body2" color="text.secondary">
                  Drag & drop or <strong>browse</strong>
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  PDF, DOC, PPT, ZIP, Images · Max 10MB
                </Typography>
              </Stack>
            )}
          </Box>

          {/* Title */}
          <TextField
            label="Title"
            value={dto.title}
            onChange={handleField('title')}
            fullWidth
            required
            disabled={isPending}
            inputProps={{ maxLength: 200 }}
            size="small"
          />

          {/* Description */}
          <TextField
            label="Description"
            value={dto.description}
            onChange={handleField('description')}
            fullWidth
            multiline
            rows={2}
            disabled={isPending}
            inputProps={{ maxLength: 2000 }}
            size="small"
          />

          {/* Subject + Course */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Subject"
              value={dto.subject}
              onChange={handleField('subject')}
              fullWidth
              required
              disabled={isPending}
              size="small"
            />
            <TextField
              label="Course"
              value={dto.course}
              onChange={handleField('course')}
              fullWidth
              required
              disabled={isPending}
              size="small"
            />
          </Stack>

          {/* Semester + Resource Type */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Semester"
              select
              value={dto.semester}
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
              value={dto.resourceType}
              onChange={(e) => setDto((prev) => ({ ...prev, resourceType: e.target.value as ResourceType }))}
              fullWidth
              disabled={isPending}
              size="small"
            >
              {RESOURCE_TYPE_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </TextField>
          </Stack>

          {/* Tags */}
          <Autocomplete
            multiple
            freeSolo
            options={[]}
            value={dto.tags ?? []}
            inputValue={tagInput}
            onInputChange={(_, val) => setTagInput(val)}
            onChange={(_, val) => setDto((prev) => ({ ...prev, tags: val as string[] }))}
            disabled={isPending}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option}
                  size="small"
                  {...getTagProps({ index })}
                  key={option}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tags"
                size="small"
                placeholder="Type and press Enter"
                helperText="Optional — helps with search"
              />
            )}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={isPending} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!isValid || isPending}
          startIcon={<CloudUploadIcon />}
        >
          {isPending ? 'Uploading...' : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}