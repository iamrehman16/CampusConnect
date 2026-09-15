// features/user/hooks/profile.hooks.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { userService } from "../services/user.services";
import { profileKeys } from "./profile-keys";
import type { UpdateUserDto } from "../types/user.dto";

// ─── Queries ──────────────────────────────────────────────────────────────────

export const useMyProfile = () =>
  useQuery({
    queryKey: profileKeys.me(),
    queryFn: () => userService.getMyProfile(),
    staleTime: 1000 * 60 * 5, // profile data doesn't change often
  });

export const useUserProfile = (id: string) =>
  useQuery({
    queryKey: profileKeys.user(id),
    queryFn: () => userService.getUserProfile(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

// ─── Mutations ────────────────────────────────────────────────────────────────

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateUserDto) => userService.updateUser(dto),
    onSuccess: (updatedUser) => {
      // Write response directly into cache — avoids a redundant refetch
      queryClient.setQueryData(profileKeys.me(), updatedUser);
      toast.success("Profile updated.");
    },
    onError: () => {
      toast.error("Failed to update profile. Please try again.");
    },
  });
};
