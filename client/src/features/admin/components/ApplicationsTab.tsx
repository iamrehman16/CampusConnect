import { useRef, useCallback, useState } from 'react';
import { ListSkeleton } from "@/shared/components/feedback/ListSkeleton";
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import InlineError from '@/shared/components/feedback/InlineError';
import { useAdminApplications } from '@/features/contributor-application/hooks/application.hooks';
import { ApplicationReviewCard } from '@/features/contributor-application/components/ApplicationReviewCard';
import type { ApplicationStatus } from '@/features/contributor-application/types/application.dto';

const STATUSES: ApplicationStatus[] = ['Pending', 'Approved', 'Rejected'];

export default function ApplicationsTab() {
  const [status, setStatus] = useState<ApplicationStatus>('Pending');
  const { data, isLoading, isError, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useAdminApplications(status);

  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      observer.current?.disconnect();
      if (!node) return;
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
      });
      observer.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage],
  );

  const applications = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <Stack spacing={2}>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={status}
        onChange={(_, v: ApplicationStatus | null) => v && setStatus(v)}
        aria-label="Application status"
      >
        {STATUSES.map((s) => (
          <ToggleButton key={s} value={s} sx={{ textTransform: 'none', px: 2 }}>
            {s}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {isLoading && <ListSkeleton count={4} />}

      {isError && <InlineError message="Failed to load applications." onRetry={refetch} />}

      {!isLoading && !isError && applications.length === 0 && (
        <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
          {status === 'Pending'
            ? 'No applications waiting for review.'
            : `No ${status.toLowerCase()} applications.`}
        </Typography>
      )}

      {applications.map((application) => (
        <ApplicationReviewCard key={application._id} application={application} />
      ))}

      <div ref={sentinelRef} />
      {isFetchingNextPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={20} />
        </Box>
      )}
    </Stack>
  );
}
