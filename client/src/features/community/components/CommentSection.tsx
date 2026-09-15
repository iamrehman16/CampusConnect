import { useState } from 'react';
import { Box, TextField, Button, Avatar, Stack } from '@mui/material';
import { useCreateComment, useComments } from '../hooks/community.hooks';
import { useAuth } from '@/shared/hooks/useAuth';
import { CommentCard } from './CommentCard';

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const { mutate: createComment, isPending } = useCreateComment(postId);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status
  } = useComments(postId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    createComment(
      { content },
      {
        onSuccess: () => setContent(''),
      }
    );
  };

  const comments = data?.pages.flatMap((page) => page.data) || [];

  return (
    <Box sx={{ pt: 1, px: 2, pb: 2, bgcolor: 'background.default' }}>
      {user && (
        <form onSubmit={handleSubmit}>
          <Stack direction="row" spacing={2} sx={{ mb: 2, mt: 2 }} alignItems="flex-start">
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              {user.name?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <TextField
                fullWidth
                placeholder="Add a comment..."
                variant="outlined"
                size="small"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isPending}
              />
              {content.trim() && (
                <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
                  <Button type="submit" variant="contained" size="small" disabled={isPending}>
                    {isPending ? 'Posting...' : 'Post Comment'}
                  </Button>
                </Stack>
              )}
            </Box>
          </Stack>
        </form>
      )}

      {status === 'pending' ? (
        <Box sx={{ textAlign: 'center', py: 2 }}>Loading comments...</Box>
      ) : status === 'error' ? (
        <Box sx={{ textAlign: 'center', py: 2, color: 'error.main' }}>Error loading comments</Box>
      ) : (
        <Stack spacing={1}>
          {comments.map((comment) => (
            <CommentCard key={comment._id} comment={comment} postId={postId} />
          ))}
          {hasNextPage && (
            <Button
              variant="text"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              sx={{ alignSelf: 'center', mt: 1 }}
            >
              {isFetchingNextPage ? 'Loading more...' : 'Read More'}
            </Button>
          )}
        </Stack>
      )}
    </Box>
  );
}
