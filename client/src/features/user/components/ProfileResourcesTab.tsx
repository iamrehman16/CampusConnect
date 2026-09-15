import React, { useEffect, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import {
  CheckCircle,
  HourglassEmpty,
  Cancel,
  InsertDriveFile,
} from "@mui/icons-material";
import { ApprovalStatus } from "@/shared/types/enums";
import type { PaginatedResult } from "@/shared/types/api.types";
import type { Resource } from "@/features/resources/types/resource.dto";
import { ResourceCard } from "@/features/resources/components/ResourceCard";

interface ProfileResourcesTabProps {
  pages: PaginatedResult<Resource>[] | undefined;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean | undefined;
  fetchNextPage: () => void;
  publicView?: boolean;
  statusFilter?: ApprovalStatus | "all";
  onStatusFilterChange?: (val: ApprovalStatus | "all") => void;
  onEditResource?: (resource: Resource) => void;
  onDeleteResource?: (resource: Resource) => void;
}

const statusMeta: Record<
  ApprovalStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  [ApprovalStatus.APPROVED]: {
    label: "Approved",
    color: "#00D9A6",
    bg: "rgba(0,217,166,0.12)",
    icon: <CheckCircle sx={{ fontSize: 13 }} />,
  },
  [ApprovalStatus.PENDING]: {
    label: "Pending",
    color: "#FFB547",
    bg: "rgba(255,181,71,0.12)",
    icon: <HourglassEmpty sx={{ fontSize: 13 }} />,
  },
  [ApprovalStatus.REJECTED]: {
    label: "Rejected",
    color: "#FF5C5C",
    bg: "rgba(255,92,92,0.12)",
    icon: <Cancel sx={{ fontSize: 13 }} />,
  },
};

const ResourceCardSkeleton = () => (
  <Card
    sx={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 2,
    }}
  >
    <CardContent sx={{ p: 2.5 }}>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Skeleton variant="rounded" width={40} height={40} />
        <Box flex={1}>
          <Skeleton width="55%" height={20} sx={{ mb: 0.5 }} />
          <Skeleton width="80%" height={15} />
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

const filterOptions: { value: ApprovalStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: ApprovalStatus.APPROVED, label: "Approved" },
  { value: ApprovalStatus.PENDING, label: "Pending" },
  { value: ApprovalStatus.REJECTED, label: "Rejected" },
];

const ProfileResourcesTab: React.FC<ProfileResourcesTabProps> = (props) => {
  const {
    pages,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    publicView = false,
  } = props;
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allResources = pages?.flatMap((p) => p.data) ?? [];

  return (
    <Box>
      {/* Filter chips — hidden on public view */}
      {!publicView && (
        <Stack
          direction="row"
          spacing={1}
          sx={{ mb: 2.5 }}
          flexWrap="wrap"
          useFlexGap
        >
          {filterOptions.map(({ value, label }) => {
            const isActive = props.statusFilter === value;
            const meta = value !== "all" ? statusMeta[value] : null;
            return (
              <Chip
                key={value}
                label={label}
                onClick={() => props.onStatusFilterChange?.(value)}
                size="small"
                sx={{
                  height: 28,
                  fontSize: "0.75rem",
                  fontWeight: isActive ? 700 : 400,
                  cursor: "pointer",
                  background: isActive
                    ? meta
                      ? meta.bg
                      : "rgba(108,99,255,0.15)"
                    : "rgba(255,255,255,0.05)",
                  color: isActive
                    ? meta
                      ? meta.color
                      : "#6C63FF"
                    : "text.secondary",
                  border: isActive
                    ? `1px solid ${meta ? meta.color + "55" : "rgba(108,99,255,0.4)"}`
                    : "1px solid rgba(255,255,255,0.08)",
                  transition: "all 0.15s",
                  "&:hover": {
                    background: isActive
                      ? meta
                        ? meta.bg
                        : "rgba(108,99,255,0.2)"
                      : "rgba(255,255,255,0.08)",
                  },
                }}
              />
            );
          })}
        </Stack>
      )}

      {isLoading ? (
        <Stack spacing={2}>
          {[0, 1, 2].map((i) => <ResourceCardSkeleton key={i} />)}
        </Stack>
      ) : allResources.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
          <InsertDriveFile sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
          <Typography variant="body2">No resources found.</Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          {allResources.map((r) => (
            <ResourceCard
              key={r._id}
              resource={r}
              onEdit={publicView ? undefined : props.onEditResource}
              onDelete={publicView ? undefined : props.onDeleteResource}
            />
          ))}
          {isFetchingNextPage && <ResourceCardSkeleton />}
          {hasNextPage && <Box ref={sentinelRef} sx={{ height: 1 }} />}
        </Stack>
      )}
    </Box>
  );
};

export default ProfileResourcesTab;
