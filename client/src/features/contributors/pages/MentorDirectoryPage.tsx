import { useCallback, useEffect, useRef } from "react";
import { Alert, Box, Button, CircularProgress, Skeleton, Typography } from "@mui/material";
import { PageContainer } from "@/shared/components/PageContainer";
import { MentorCard } from "../components/MentorCard";
import { MentorFilterBar } from "../components/MentorFilterBar";
import { useMentors } from "../hooks/mentor.hooks";
import { useMentorFilters } from "../hooks/useMentorFilters";

const GRID_SX = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: 2,
} as const;

export default function MentorDirectoryPage() {
  const { filters, setFilters, reset, hasActiveFilters } = useMentorFilters();
  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useMentors(filters);

  const mentors = data?.pages.flatMap((p) => p.data) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  // Infinite scroll sentinel (same pattern as the admin tabs).
  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      observer.current?.disconnect();
      if (!node || isFetchingNextPage) return;
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
      });
      observer.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage],
  );
  useEffect(() => () => observer.current?.disconnect(), []);

  return (
    <PageContainer>
      <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Find a mentor
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Students and contributors who are open to helping. Filter by subject,
            department or semester.
          </Typography>
        </Box>

        <MentorFilterBar
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          onChange={setFilters}
          onReset={reset}
        />

        {isError && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => refetch()}>
                Retry
              </Button>
            }
          >
            Couldn't load mentors.
          </Alert>
        )}

        {isLoading && (
          <Box sx={GRID_SX}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={210} />
            ))}
          </Box>
        )}

        {!isLoading && !isError && mentors.length === 0 && (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {hasActiveFilters ? "No mentors match those filters" : "No mentors yet"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {hasActiveFilters
                ? "Try widening your search."
                : "Mentors appear here once they turn on mentoring in their profile settings."}
            </Typography>
            {hasActiveFilters && (
              <Button variant="outlined" size="small" onClick={reset}>
                Clear filters
              </Button>
            )}
          </Box>
        )}

        {mentors.length > 0 && (
          <>
            <Typography variant="caption" color="text.secondary" aria-live="polite">
              {total} {total === 1 ? "mentor" : "mentors"}
              {isFetching && !isFetchingNextPage ? " · updating…" : ""}
            </Typography>
            <Box sx={GRID_SX}>
              {mentors.map((mentor) => (
                <MentorCard key={mentor.id} mentor={mentor} />
              ))}
            </Box>
            <div ref={sentinelRef} />
            {isFetchingNextPage && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={22} />
              </Box>
            )}
          </>
        )}
      </Box>
    </PageContainer>
  );
}
