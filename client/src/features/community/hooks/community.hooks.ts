import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import communityService from "../services/community.service";
import { communityKeys } from "./community.keys";
import type {
  CreateCommentDto,
  CreatePostDto,
  UpdateCommentDto,
  UpdatePostDto,
} from "../types/community.dto";
import { PAGE_LIMIT, type PaginatedResult } from "@/shared/types/api.types";
import toast from "react-hot-toast";

// ─── Queries ──────────────────────────────────────────────────────────────────

export const usePosts = () =>
  useInfiniteQuery({
    queryKey: communityKeys.lists(),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      communityService.getPosts({ page: pageParam, limit: PAGE_LIMIT }),
    initialPageParam: 1 as number,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPage ? lastPage.page + 1 : undefined,
  });

export const useComments = (postId: string) =>
  useInfiniteQuery({
    queryKey: communityKeys.comments(postId),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      communityService.getCommentsByPostId(postId, {
        page: pageParam,
        limit: PAGE_LIMIT,
      }),
    initialPageParam: 1 as number,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPage ? lastPage.page + 1 : undefined,
    enabled: !!postId,
  });

export const useStats = () => {
  return useQuery({
    queryKey: communityKeys.stats(),
    queryFn: () => communityService.getPostStats(),
  });
};

// ─── User Specific Post Queries ──────────────────────────────────────────────

/**
 * Fetches the authenticated user's own posts
 */
export const useOwnPosts = () =>
  useInfiniteQuery({
    queryKey: communityKeys.mine(),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      communityService.getOwnPosts({ page: pageParam, limit: PAGE_LIMIT }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPage ? lastPage.page + 1 : undefined,
  });

/**
 * Fetches posts for a specific user ID
 */
export const usePostsByUser = (userId: string) =>
  useInfiniteQuery({
    queryKey: communityKeys.byUser(userId),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      communityService.getPostsByUser(
        { page: pageParam, limit: PAGE_LIMIT },
        userId,
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPage ? lastPage.page + 1 : undefined,
    enabled: !!userId, // Only fetch if userId is provided
  });

// ─── Post mutations ───────────────────────────────────────────────────────────

export const useCreatePost = () => {
  const { invalidatePosts } = useCommunityInvalidation();
  return useMutation({
    mutationFn: (dto: CreatePostDto) => communityService.createPost(dto),
    onSuccess: () => {
      invalidatePosts();
      toast.success("Post created.");
    },
  });
};

export const useUpdatePost = () => {
  const { invalidatePosts } = useCommunityInvalidation();
  return useMutation({
    mutationFn: ({ postId, dto }: { postId: string; dto: UpdatePostDto }) =>
      communityService.updateOwnPost(postId, dto),
    onSuccess: () => {
      invalidatePosts();
      toast.success("Post created.");
    },
  });
};

export const useDeletePost = () => {
  const { invalidatePosts } = useCommunityInvalidation();
  return useMutation({
    mutationFn: (postId: string) => communityService.deleteOwnPost(postId),
    onSuccess: () => {
      invalidatePosts();
      toast.success("Post deleted.");
    },
  });
};

export const useToggleUpvote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => communityService.toggleUpvote(postId),

    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: communityKeys.lists() });
      const previousData = queryClient.getQueryData(communityKeys.lists());

      queryClient.setQueriesData({ queryKey: communityKeys.lists() }, (old) =>
        updatePostInCache(old, postId, (post) => ({
          ...post,
          isUpvoted: !post.isUpvoted,
          upvoteCount: post.isUpvoted
            ? post.upvoteCount - 1
            : post.upvoteCount + 1,
        })),
      );
      return { previousData };
    },

    onSuccess: (updatedPost) => {
      const idToSync = updatedPost._id;

      queryClient.setQueriesData({ queryKey: communityKeys.lists() }, (old) =>
        updatePostInCache(old, idToSync, () => updatedPost),
      );
    },

    onError: (_err, _postId, context) => {
      if (context?.previousData) {
        queryClient.setQueriesData(
          { queryKey: communityKeys.lists() },
          context.previousData,
        );
      }
    },
  });
};

// ─── Comment mutations ────────────────────────────────────────────────────────

export const useCreateComment = (postId: string) => {
  const { invalidatePosts, invalidateComments } = useCommunityInvalidation();
  return useMutation({
    mutationFn: (dto: CreateCommentDto) =>
      communityService.createComment(postId, dto),
    onSuccess: () => {
      invalidateComments(postId);
      invalidatePosts();
    },
  });
};

export const useUpdateComment = (postId: string) => {
  const { invalidateComments } = useCommunityInvalidation();
  return useMutation({
    mutationFn: ({
      commentId,
      dto,
    }: {
      commentId: string;
      dto: UpdateCommentDto;
    }) => communityService.updateOwnComment(commentId, dto),
    onSuccess: () => invalidateComments(postId),
  });
};

export const useDeleteComment = (postId: string) => {
  const { invalidatePosts, invalidateComments } = useCommunityInvalidation();
  return useMutation({
    mutationFn: (commentId: string) =>
      communityService.deleteOwnComment(commentId),
    onSuccess: () => {
      invalidateComments(postId);
      invalidatePosts();
    },
  });
};

// Helper Hooks
const useCommunityInvalidation = () => {
  const queryClient = useQueryClient();
  return {
    invalidatePosts: () => {
      // This will invalidate ANY query that starts with ["posts", "list"]
      // including usePosts, useOwnPosts, and usePostsByUser
      queryClient.invalidateQueries({ queryKey: communityKeys.lists() });
    },
    invalidateComments: (postId: string) =>
      queryClient.invalidateQueries({
        queryKey: communityKeys.comments(postId),
      }),
  };
};

/**
 * Helper to update a specific post within the TanStack InfiniteQuery cache structure
 */
const updatePostInCache = (
  oldData: any,
  postId: string,
  updateFn: (post: any) => any,
) => {
  if (!oldData?.pages) return oldData;

  return {
    ...oldData,
    pages: oldData.pages.map((page: PaginatedResult<any>) => ({
      ...page,
      // Safely access 'data' and default to empty array if missing
      data: (page.data || []).map((post: any) => {
        // Check both id and _id to be safe across different environments
        const isMatch = post._id === postId || post.id === postId;
        return isMatch ? updateFn(post) : post;
      }),
    })),
  };
};
