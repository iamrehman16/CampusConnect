import { useState } from 'react';
import { Box, Button, Card, Collapse, Link, Stack, TextField, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  ChatBubbleOutline,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ThumbUp,
  ThumbUpOutlined,
} from '@/shared/icons';
import type { Post } from '../types/community.dto';
import { useAuth } from '@/shared/hooks/useAuth';
import { formatRelativeTime } from '@/shared/utils/format';
import { ROUTES } from '@/shared/constants/routes';
import { KebabMenu } from '@/shared/components/KebabMenu';
import UserAvatar from '@/shared/components/UserAvatar';
import { canEditPost } from '../utils/permissions';
import { useUpdatePost, useDeletePost, useToggleUpvote } from '../hooks/community.hooks';
import { CommentSection } from './CommentSection';
import { useChatTrigger } from '@/features/chat/hooks/chat-hooks';

/** Posts longer than this are clamped with a "Show more". */
const LONG_POST_CHARS = 420;

interface PostCardProps {
  post: Post;
  /** Open the replies on mount (deep link from Home / the rail). */
  defaultShowComments?: boolean;
}

/** Community post (BACKLOG.md D9): flat card, author → title → body → actions. */
export function PostCard({ post, defaultShowComments = false }: PostCardProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editContent, setEditContent] = useState(post.content);
  const [showComments, setShowComments] = useState(defaultShowComments);
  const [expanded, setExpanded] = useState(false);

  const { mutate: updatePost, isPending: isUpdating } = useUpdatePost();
  const { mutate: deletePost } = useDeletePost();
  const { mutate: toggleUpvote } = useToggleUpvote();
  const { trigger: startChat, isPending: startingChat } = useChatTrigger();

  const canEdit = canEditPost(user, post.author);
  const canMessageAuthor = Boolean(user) && user?._id !== post.author._id;
  const isUpvoted = Boolean(user && post.upvotes.includes(user._id));
  const isLong = post.content.length > LONG_POST_CHARS;
  const profilePath = ROUTES.PUBLIC_PROFILE.replace(':userId', post.author._id);

  const handleEditSubmit = () => {
    updatePost(
      { postId: post._id, dto: { title: editTitle, content: editContent } },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  const actionSx = {
    color: 'text.secondary',
    fontWeight: 500,
    px: 1.25,
    minHeight: 36,
    '& .MuiButton-startIcon': { mr: 0.75 },
  } as const;

  return (
    <Card id={`post-${post._id}`} sx={{ scrollMarginTop: 16 }}>
      <Box sx={{ p: { xs: 2, sm: 2.5 }, pb: 1 }}>
        <Stack direction="row" alignItems="center" gap={1.25}>
          <UserAvatar name={post.author.name} avatar={post.author.avatar} size={36} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Link
              component={RouterLink}
              to={profilePath}
              underline="hover"
              color="text.primary"
              variant="body2"
              fontWeight={600}
              noWrap
              sx={{ display: 'block' }}
            >
              {post.author.name || 'Unknown'}
            </Link>
            <Typography variant="caption" color="text.tertiary">
              {formatRelativeTime(post.createdAt)}
            </Typography>
          </Box>
          {canEdit && !isEditing && (
            <KebabMenu
              items={[
                { label: 'Edit', icon: <EditIcon fontSize="small" />, onClick: () => setIsEditing(true) },
                {
                  label: 'Delete',
                  icon: <DeleteIcon fontSize="small" />,
                  color: 'error',
                  onClick: () => {
                    if (window.confirm('Delete this post?')) deletePost(post._id);
                  },
                },
              ]}
            />
          )}
        </Stack>

        <Box sx={{ mt: 1.5 }}>
          {isEditing ? (
            <Stack spacing={2}>
              <TextField
                fullWidth
                size="small"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                disabled={isUpdating}
                label="Title"
              />
              <TextField
                fullWidth
                multiline
                minRows={3}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                disabled={isUpdating}
                label="Post"
              />
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setEditTitle(post.title);
                    setEditContent(post.content);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleEditSubmit}
                  disabled={isUpdating || !editTitle.trim() || !editContent.trim()}
                >
                  Save
                </Button>
              </Stack>
            </Stack>
          ) : (
            <>
              <Typography variant="subtitle1" component="h2" fontWeight={600} sx={{ lineHeight: 1.35 }}>
                {post.title}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.5,
                  lineHeight: 1.65,
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere',
                  ...(isLong && !expanded
                    ? { display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
                    : {}),
                }}
              >
                {post.content}
              </Typography>
              {isLong && (
                <Link component="button" variant="body2" fontWeight={600} underline="hover" onClick={() => setExpanded((v) => !v)} sx={{ mt: 0.5 }}>
                  {expanded ? 'Show less' : 'Show more'}
                </Link>
              )}
            </>
          )}
        </Box>
      </Box>

      <Stack direction="row" gap={0.5} sx={{ px: { xs: 1, sm: 1.5 }, pb: 1 }}>
        <Button
          size="small"
          onClick={() => toggleUpvote(post._id)}
          aria-pressed={isUpvoted}
          aria-label={isUpvoted ? 'Remove upvote' : 'Upvote'}
          startIcon={isUpvoted ? <ThumbUp sx={{ fontSize: 16 }} /> : <ThumbUpOutlined sx={{ fontSize: 16 }} />}
          sx={{
            ...actionSx,
            ...(isUpvoted && { color: 'primary.main', bgcolor: 'primary.subtle', '&:hover': { bgcolor: 'primary.subtle' } }),
          }}
        >
          {post.upvotes.length}
        </Button>
        <Button
          size="small"
          onClick={() => setShowComments((v) => !v)}
          aria-expanded={showComments}
          startIcon={<ChatBubbleOutline sx={{ fontSize: 16 }} />}
          sx={actionSx}
        >
          {post.commentCount} {post.commentCount === 1 ? 'reply' : 'replies'}
        </Button>
        {canMessageAuthor && (
          <Button
            size="small"
            disabled={startingChat}
            onClick={() => void startChat(post.author._id, { kind: 'post', contextId: post._id, title: post.title })}
            sx={actionSx}
          >
            Ask the author
          </Button>
        )}
      </Stack>

      <Collapse in={showComments} timeout="auto" unmountOnExit>
        <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
          <CommentSection postId={post._id} />
        </Box>
      </Collapse>
    </Card>
  );
}
