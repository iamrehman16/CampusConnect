import React, { useEffect, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { ChatBubbleOutline } from "@mui/icons-material";
import type { PaginatedResult } from "@/shared/types/api.types";
import type { Post } from "@/features/community/types/community.dto";
import { PostCard } from "@/features/community/components/PostCard";

interface ProfilePostsTabProps {
  pages: PaginatedResult<Post>[] | undefined;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean | undefined;
  fetchNextPage: () => void;
}

const PostCardSkeleton = () => (
  <Card
    sx={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 2,
    }}
  >
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

  if (!allPosts.length) {
    return (
      <Box
        sx={{
          textAlign: "center",
          py: 8,
          color: "text.secondary",
        }}
      >
        <ChatBubbleOutline sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
        <Typography variant="body2">No posts yet.</Typography>
      </Box>
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
