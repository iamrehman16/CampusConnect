import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';

import { usePosts } from '../hooks/community.hooks';
import { CreatePost } from '../components/CreatePost';
import { PostCard } from '../components/PostCard';
import { useIntersectionObserver } from '@/shared/hooks/useIntersectionObserver';
import { useEffect } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';

export default function CommunityPage() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status
  } = usePosts();

  const { isIntersecting, targetRef } = useIntersectionObserver({
    threshold: 0,
    rootMargin: '0px',
  });

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);
  const posts = data?.pages.flatMap((page) => page.data) || [];

  return (
    <PageContainer>
      <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* 2-column layout */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3, maxWidth: 1152, mx: 'auto' }}>

        {/* Main Feed */}
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Community Forum
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Share your thoughts, ask questions, and connect with peers.
            </Typography>
          </Box>

          <CreatePost />

          <Stack spacing={0}>
            {status === 'pending' ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : status === 'error' ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'error.main' }}>
                Failed to load posts. Please try again later.
              </Box>
            ) : posts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography color="text.secondary">
                  No posts yet. Be the first to start a conversation!
                </Typography>
              </Box>
            ) : (
              posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))
            )}

            {/* Pagination Sentinel */}
            {status === 'success' && posts.length > 0 && (
              <Box ref={targetRef} sx={{ height: 20, py: 1, textAlign: 'center' }}>
                {isFetchingNextPage && <CircularProgress size={24} />}
                {!hasNextPage && (
                  <Typography variant="caption" color="text.secondary">
                    You've reached the end.
                  </Typography>
                )}
              </Box>
            )}
          </Stack>
        </Box>

        {/* Right Widget Area - Disappears on mobile */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Box sx={{ position: 'sticky', top: 24, zIndex: 1 }}>
            <Card sx={{ bgcolor: 'background.paper', borderRadius: 2, elevation: 0, border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Community Rules
                </Typography>
                <Typography variant="body2" paragraph color="text.secondary">
                  1. Be respectful and supportive.
                </Typography>
                <Typography variant="body2" paragraph color="text.secondary">
                  2. Share constructive feedback.
                </Typography>
                <Typography variant="body2" paragraph color="text.secondary">
                  3. Avoid spam and self-promotion.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  4. Keep discussions relevant to learning.
                </Typography>
              </CardContent>
              <Divider />
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Stats
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  A place to showcase popular topics or top contributors in the future.
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    </Container>
    </PageContainer>
  );
}
