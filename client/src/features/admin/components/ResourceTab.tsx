// features/admin/components/ResourcesTab.tsx
import { useRef, useCallback } from 'react';
import { ListSkeleton } from "@/shared/components/feedback/ListSkeleton";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InlineError from '@/shared/components/feedback/InlineError';
import CircularProgress from '@mui/material/CircularProgress';
import { CheckCircle as CheckCircleIcon } from "@/shared/icons";
import { useAdminPendingResources } from '@/features/resources/hooks/resource.hooks';
import ResourceModerationCard from './ResourceModerationCard';

export default function ResourcesTab() {
  const { data, isLoading, isError, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useAdminPendingResources({});

  // Infinite scroll sentinel
  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      if (!node) return;
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
      });
      observer.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage],
  );

  const resources = data?.pages.flatMap((p) => p.data) ?? [];

  if (isLoading) {
    return <ListSkeleton count={6} />;
  }

  if (isError) {
    return <InlineError message="Failed to load pending resources." onRetry={refetch} />;
  }

  if (resources.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
          py: 10,
          color: 'text.secondary',
        }}
      >
        <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.7 }} />
        <Typography variant="body1" fontWeight={500}>
          All caught up
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No resources pending approval.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {resources.length} resource{resources.length !== 1 ? 's' : ''} awaiting review
      </Typography>

      {/* Masonry-style responsive grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(3, minmax(0, 1fr))',
          },
          gap: 2,
          alignItems: 'start',
        }}
      >
        {resources.map((resource) => (
          <ResourceModerationCard key={resource._id} resource={resource} />
        ))}
      </Box>

      {/* Infinite scroll sentinel */}
      <Box ref={sentinelRef} sx={{ py: 1, display: 'flex', justifyContent: 'center' }}>
        {isFetchingNextPage && <CircularProgress size={24} />}
      </Box>
    </Box>
  );
}