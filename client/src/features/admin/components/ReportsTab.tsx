import { useCallback, useRef, useState } from 'react';
import { ListSkeleton } from "@/shared/components/feedback/ListSkeleton";
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import InlineError from '@/shared/components/feedback/InlineError';
import { useAdminReports } from '@/features/moderation/hooks/moderation.hooks';
import { ReportReviewCard } from '@/features/moderation/components/ReportReviewCard';
import type { ReportStatus } from '@/features/moderation/types/moderation.dto';

const STATUSES: { value: ReportStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'warned', label: 'Warned' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'dismissed', label: 'Dismissed' },
];

/** Moderation queue (BACKLOG.md E16): review reports, then dismiss, warn or suspend. */
export default function ReportsTab() {
  const [status, setStatus] = useState<ReportStatus>('open');
  const { data, isLoading, isError, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useAdminReports(status);

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

  const reports = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <Stack spacing={2}>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={status}
        onChange={(_, v: ReportStatus | null) => v && setStatus(v)}
        aria-label="Report status"
      >
        {STATUSES.map((s) => (
          <ToggleButton key={s.value} value={s.value} sx={{ textTransform: 'none', px: 2 }}>
            {s.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {isLoading && <ListSkeleton count={4} />}

      {isError && <InlineError message="Failed to load reports." onRetry={refetch} />}

      {!isLoading && !isError && reports.length === 0 && (
        <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
          {status === 'open' ? 'No reports waiting for review.' : `No ${status} reports.`}
        </Typography>
      )}

      {reports.map((report) => (
        <ReportReviewCard key={report.id} report={report} />
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
