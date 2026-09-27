import { useEffect } from 'react';
import { Box, Button, Card, CircularProgress, Skeleton, Stack, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { usePosts } from '../hooks/community.hooks';
import { CreatePost } from '../components/CreatePost';
import { PostCard } from '../components/PostCard';
import { CommunityRail } from '../components/CommunityRail';
import { useIntersectionObserver } from '@/shared/hooks/useIntersectionObserver';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';

/**
 * Community (BACKLOG.md D9): feed column + a rail built from real data.
 * `?post=<id>` scrolls to that post with its replies open (links from
 * Home and the rail).
 */
export default function CommunityPage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, refetch } = usePosts();
  const [params, setParams] = useSearchParams();
  const focusId = params.get('post');

  const { isIntersecting, targetRef } = useIntersectionObserver({ threshold: 0, rootMargin: '200px' });

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const posts = data?.pages.flatMap((page) => page.data) ?? [];
  const focusLoaded = Boolean(focusId && posts.some((p) => p._id === focusId));

  useEffect(() => {
    if (focusLoaded) {
      document.getElementById(`post-${focusId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [focusLoaded, focusId]);

  return (
    <PageContainer width="default">
      <PageHeader title="Community" subtitle="Ask questions, share what worked, and find study partners." />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) 300px' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <Stack spacing={2}>
          <CreatePost />

          {status === 'pending' ? (
            [0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={160} />)
          ) : status === 'error' ? (
            <Card sx={{ py: 5, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Couldn't load posts.
              </Typography>
              <Button size="small" sx={{ mt: 1 }} onClick={() => refetch()}>
                Try again
              </Button>
            </Card>
          ) : posts.length === 0 ? (
            <Card sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="subtitle2" fontWeight={600}>
                No discussions yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Ask the first question above.
              </Typography>
            </Card>
          ) : (
            posts.map((post) => (
              // Keyed on focus so picking an already-rendered post re-opens its replies.
              <PostCard
                key={post._id === focusId ? `${post._id}:focus` : post._id}
                post={post}
                defaultShowComments={post._id === focusId}
              />
            ))
          )}

          {status === 'success' && posts.length > 0 && (
            <Box ref={targetRef} sx={{ py: 1, textAlign: 'center' }}>
              {isFetchingNextPage ? (
                <CircularProgress size={20} />
              ) : (
                !hasNextPage && (
                  <Typography variant="caption" color="text.tertiary">
                    You're all caught up.
                  </Typography>
                )
              )}
            </Box>
          )}
        </Stack>

        <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'sticky', top: 0 }}>
          <CommunityRail posts={posts} onOpenPost={(id) => setParams({ post: id }, { replace: true })} />
        </Box>
      </Box>
    </PageContainer>
  );
}
