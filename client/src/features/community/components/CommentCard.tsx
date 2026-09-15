import { useState } from 'react';
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Button,
  Stack,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import type { Comment } from '../types/community.dto';
import { useAuth } from '@/shared/hooks/useAuth';
import { formatRelativeTime } from '@/shared/utils/format';
import { canEditComment } from '../utils/permissions';
import { useUpdateComment, useDeleteComment } from '../hooks/community.hooks';

interface CommentCardProps {
  comment: Comment;
  postId: string;
}

export function CommentCard({ comment, postId }: CommentCardProps) {
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const { mutate: updateComment, isPending: isUpdating } = useUpdateComment(postId);
  const { mutate: deleteComment } = useDeleteComment(postId);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditSubmit = () => {
    updateComment(
      { commentId: comment._id, dto: { content: editContent } },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  const handleDelete = () => {
    deleteComment(comment._id);
    handleMenuClose();
  };

  const hasEditPermission = canEditComment(user, comment.author);

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 1.5 }}>
      <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.light', fontSize: '0.875rem' }}>
        {comment.author.name?.[0]?.toUpperCase() || 'U'}
      </Avatar>

      <Box sx={{ flexGrow: 1, bgcolor: 'action.hover', p: 1.5, borderRadius: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {comment.author.name || 'Unknown'}
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1, fontWeight: 400 }}>
              {formatRelativeTime(comment.createdAt)}
            </Typography>
          </Typography>

          {hasEditPermission && !isEditing && (
            <>
              <IconButton size="small" onClick={handleMenuClick} sx={{ p: 0 }}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem
                  onClick={() => {
                    setIsEditing(true);
                    handleMenuClose();
                  }}
                  sx={{ fontSize: '0.875rem' }}
                >
                  Edit
                </MenuItem>
                <MenuItem onClick={handleDelete} sx={{ color: 'error.main', fontSize: '0.875rem' }}>
                  Delete
                </MenuItem>
              </Menu>
            </>
          )}
        </Stack>

        {isEditing ? (
          <Stack spacing={1}>
            <TextField
              fullWidth
              multiline
              size="small"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              disabled={isUpdating}
              sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                size="small"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
              >
                Cancel
              </Button>
              <Button size="small" variant="contained" onClick={handleEditSubmit} disabled={isUpdating}>
                Save
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Typography variant="body2">{comment.content}</Typography>
        )}
      </Box>
    </Box>
  );
}
