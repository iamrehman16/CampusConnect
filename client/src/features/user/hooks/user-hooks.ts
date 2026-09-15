// features/user/hooks/user-hooks.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { adminUserService } from "../services/admin-user.services";
import { userKeys } from "./user-keys";
import type {
  UserFilterParams,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from "../types/user.dto";

// ─── Queries ─────────────────────────────────────────────────────────────────

export const useUsers = (params: UserFilterParams) =>
  useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => adminUserService.getUsers(params),
    placeholderData: (prev) => prev, // keeps stale data visible while new page loads
    staleTime: 1000 * 60 * 2,
  });

// ─── Mutations ────────────────────────────────────────────────────────────────

const useUserMutation = <TDto>(
  mutationFn: (dto: TDto) => Promise<unknown>,
  successMessage: string,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      // invalidate all user list queries regardless of filter params
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success(successMessage);
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });
};

export const useUpdateUserRole = () =>
  useUserMutation(
    ({ id, dto }: { id: string; dto: UpdateUserRoleDto }) =>
      adminUserService.updateUserRole(id, dto),
    "User role updated.",
  );

export const useUpdateUserStatus = () =>
  useUserMutation(
    ({ id, dto }: { id: string; dto: UpdateUserStatusDto }) =>
      adminUserService.updateUserStatus(id, dto),
    "User status updated.",
  );
