import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import resourceService from "../services/resource.service";
import adminResourceService from "../services/admin-resource.service";
import { resourceKeys } from "./resource.keys";
import type {
  CreateResourceDto,
  UpdateResourceDto,
  RejectResourceDto,
  ResourceFilterParams,
  AdminResourceFilterParams,
} from "../types/resource.dto";
import { PAGE_LIMIT } from "@/shared/types/api.types";
import toast from "react-hot-toast";
import { ApprovalStatus, ResourceSort } from "@/shared/types/enums";

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Public/Contributor resources list with infinite scrolling.
 */
export const useResources = (
  params: Omit<ResourceFilterParams, "page" | "limit">,
) =>
  useInfiniteQuery({
    queryKey: resourceKeys.list(params),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      resourceService.getResources({
        ...params,
        page: pageParam,
        limit: PAGE_LIMIT,
      }),
    initialPageParam: 1 as number,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPage ? lastPage.page + 1 : undefined,
  });

export const useTrendingResources = () =>
  useQuery({
    queryKey: resourceKeys.list({
      sort: ResourceSort.POPULAR,
      limit: 6,
      status: ApprovalStatus.APPROVED,
    }),
    queryFn: () =>
      resourceService.getResources({
        sort: ResourceSort.POPULAR,
        limit: 6,
        page: 1,
        status: ApprovalStatus.APPROVED,
      }),
    staleTime: 1000 * 60 * 5,
  });

/**
 * Single resource details.
 */
export const useResource = (id: string) =>
  useQuery({
    queryKey: resourceKeys.detail(id),
    queryFn: () => resourceService.getResourceById(id),
    enabled: !!id,
  });

/**
 * Contributor's own resources with infinite scrolling.
 */
export const useMyResources = (
  params: Omit<ResourceFilterParams, "page" | "limit">,
) =>
  useInfiniteQuery({
    queryKey: resourceKeys.myList(params),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      resourceService.getMyResources({
        ...params,
        page: pageParam,
        limit: PAGE_LIMIT,
      }),
    initialPageParam: 1 as number,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPage ? lastPage.page + 1 : undefined,
  });

export const useResourcesByUser = (
  userId: string,
  params: Omit<ResourceFilterParams, "page" | "limit">,
) =>
  useInfiniteQuery({
    queryKey: resourceKeys.userList(userId, params),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      resourceService.getResourcesByUser(userId, {
        ...params,
        page: pageParam,
        limit: PAGE_LIMIT,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPage ? lastPage.page + 1 : undefined,
    enabled: !!userId, // Prevent fetching if userId is undefined/empty
  });

/**
 * Admin: Pending resources moderation queue with infinite scrolling.
 */
export const useAdminPendingResources = (
  params: Omit<AdminResourceFilterParams, "page" | "limit">,
) =>
  useInfiniteQuery({
    queryKey: resourceKeys.adminPendingList(params),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      adminResourceService.getPendingResources({
        ...params,
        page: pageParam,
        limit: PAGE_LIMIT,
      }),
    initialPageParam: 1 as number,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPage ? lastPage.page + 1 : undefined,
  });

// ─── Contributor Mutations ───────────────────────────────────────────────────

export const useCreateResource = () => {
  const { invalidateAll } = useResourceInvalidation();
  return useMutation({
    mutationFn: ({ dto, file }: { dto: CreateResourceDto; file: File }) =>
      resourceService.createResource(dto, file),
    onSuccess: () => {
      invalidateAll();
      toast.success("Resource uploaded successfully. Awaiting moderation.");
    },
  });
};

export const useUpdateResource = () => {
  const { invalidateAll } = useResourceInvalidation();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateResourceDto }) =>
      resourceService.updateResource(id, dto),
    onSuccess: (data) => {
      invalidateAll(data._id);
      toast.success("Resource updated successfully.");
    },
  });
};

export const useDeleteResource = () => {
  const { invalidateAll } = useResourceInvalidation();
  return useMutation({
    mutationFn: (id: string) => resourceService.deleteResource(id),
    onSuccess: () => {
      invalidateAll();
      toast.success("Resource deleted successfully.");
    },
  });
};

// ─── Admin Mutations ─────────────────────────────────────────────────────────

export const useAdminApproveResource = () => {
  const { invalidateAll } = useResourceInvalidation();
  return useMutation({
    mutationFn: (id: string) => adminResourceService.approveResource(id),
    onSuccess: (data) => {
      invalidateAll(data._id);
      toast.success("Resource approved.");
    },
  });
};

export const useAdminRejectResource = () => {
  const { invalidateAll } = useResourceInvalidation();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: RejectResourceDto }) =>
      adminResourceService.rejectResource(id, dto),
    onSuccess: (data) => {
      invalidateAll(data._id);
      toast.success("Resource rejected.");
    },
  });
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const useResourceInvalidation = () => {
  const queryClient = useQueryClient();

  const invalidateAll = (id?: string) => {
    // Invalidate lists
    queryClient.invalidateQueries({ queryKey: resourceKeys.lists() });
    queryClient.invalidateQueries({ queryKey: resourceKeys.mine() });
    queryClient.invalidateQueries({ queryKey: resourceKeys.adminPending() });

    // Invalidate detail if id provided
    if (id) {
      queryClient.invalidateQueries({ queryKey: resourceKeys.detail(id) });
    }
  };

  return { invalidateAll };
};
