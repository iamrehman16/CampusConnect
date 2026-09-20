import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import applicationService from "../services/application.service";
import { applicationKeys } from "./application.keys";
import { userKeys } from "@/features/user/hooks/user-keys";
import { PAGE_LIMIT } from "@/shared/types/api.types";
import type { ApplicationStatus } from "../types/application.dto";

export const useMyApplication = (enabled = true) =>
  useQuery({
    queryKey: applicationKeys.mine(),
    queryFn: () => applicationService.getMine(),
    enabled,
    staleTime: 1000 * 60,
  });

export const useApplyToContribute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: applicationService.apply,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.mine() });
      toast.success("Application submitted");
    },
  });
};

export const useAdminApplications = (status: ApplicationStatus) =>
  useInfiniteQuery({
    queryKey: applicationKeys.admin(status),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      applicationService.listForAdmin({
        page: pageParam,
        limit: PAGE_LIMIT,
        status,
      }),
    initialPageParam: 1 as number,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPage ? lastPage.page + 1 : undefined,
  });

const useReviewMutation = <TVars>(
  mutationFn: (vars: TVars) => Promise<void>,
  successMessage: string,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.adminAll() });
      // Approval changes a user's role — refresh the admin users table too.
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success(successMessage);
    },
  });
};

export const useApproveApplication = () =>
  useReviewMutation(
    (id: string) => applicationService.approve(id),
    "Applicant is now a contributor",
  );

export const useRejectApplication = () =>
  useReviewMutation(
    ({ id, reason }: { id: string; reason: string }) =>
      applicationService.reject(id, reason),
    "Application rejected",
  );
