import React, { useEffect, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Skeleton,
  Stack,
} from "@mui/material";
import { ChatBubbleOutline } from "@/shared/icons";
import type { PaginatedResult } from "@/shared/types/api.types";
import type { Post } from "@/features/community/types/community.dto";
import EmptyState from "@/shared/components/feedback/EmptyState";
import InlineError from "@/shared/components/feedback/InlineError";
import { PostCard } from "@/features/community/components/PostCard";

interface ProfilePostsTabProps {
  pages: PaginatedResult<Post>[] | undefined;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean | undefined;
  fetchNextPage: () => void;
  isError?: boolean;
  onRetry?: () => void;
  /** Next step shown in the empty state (own profile only). */
  emptyAction?: React.ReactNode;
}

// BACKLOG.md D2 — was hardcoded to a white-alpha overlay that assumed a
// dark background (near-invisible border/tint in light mode); the theme's
// own MuiCard override already gives a themed border/background, so this
// just needed to stop redundantly re-declaring it with the wrong values.
const PostCardSkeleton = () => (
  <Card>
    <CardContent sx={{ p: 2.5 }}>
      <Skeleton width="60%" height={20} sx={{ mb: 1 }} />
      <Skeleton width="100%" height={16} />
      <Skeleton width="80%" height={16} sx={{ mb: 2 }} />
      <Stack direction="row" spacing={1}>
        <Skeleton width={60} height={24} variant="rounded" />
        <Skeleton width={60} height={24} variant="rounded" />
      </Stack>
    </CardContent>
  </Card>
);

const ProfilePostsTab: React.FC<ProfilePostsTabProps> = ({
  pages,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  isError,
  onRetry,
  emptyAction,
}) => {
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

  const allPosts = pages?.flatMap((p) => p.data) ?? [];

  if (isLoading) {
    return (
      <Stack spacing={2}>
        {[0, 1, 2].map((i) => <PostCardSkeleton key={i} />)}
      </Stack>
    );
  }

  if (isError && !allPosts.length) {
    return <InlineError message="Couldn't load posts." onRetry={onRetry} />;
  }

  if (!allPosts.length) {
    return (
      <EmptyState
        icon={<ChatBubbleOutline sx={{ fontSize: 32 }} />}
        title="No posts yet"
        message="Posts appear here once they're shared in Community."
        action={emptyAction}
      />
    );
  }

  return (
    <Stack spacing={2}>
      {allPosts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
      {isFetchingNextPage && <PostCardSkeleton />}
      {hasNextPage && <Box ref={sentinelRef} sx={{ height: 1 }} />}
    </Stack>
  );
};

export default ProfilePostsTab;
