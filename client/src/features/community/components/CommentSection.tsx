import { useState } from 'react';
import { Box, TextField, Button, Skeleton, Stack, Typography } from '@mui/material';
import InlineError from '@/shared/components/feedback/InlineError';
import { useCreateComment, useComments } from '../hooks/community.hooks';
import { useAuth } from '@/shared/hooks/useAuth';
import UserAvatar from "@/shared/components/UserAvatar";
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
    status,
    refetch,
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
            <UserAvatar name={user.name} avatar={user.avatar} size={32} />
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
        <Stack spacing={1}>
          {[0, 1].map((i) => (
            <Skeleton key={i} variant="rounded" height={48} />
          ))}
        </Stack>
      ) : status === 'error' ? (
        <InlineError compact message="Couldn't load comments." onRetry={refetch} />
      ) : (
        <Stack spacing={1}>
          {comments.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
              No replies yet. Be the first to answer.
            </Typography>
          )}
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
