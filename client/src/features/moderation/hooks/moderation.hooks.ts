import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { moderationService } from "../services/moderation.service";

export const moderationKeys = {
  all: ["moderation"] as const,
  blocked: () => [...moderationKeys.all, "blocked"] as const,
};

export const useBlockedUsers = () =>
  useQuery({
    queryKey: moderationKeys.blocked(),
    queryFn: () => moderationService.listBlocked(),
    staleTime: 60_000,
  });

const useBlockMutation = (
  mutationFn: (userId: string) => Promise<void>,
  successMessage: (name: string) => string,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId }: { userId: string; name: string }) =>
      mutationFn(userId),
    onSuccess: (_data, { name }) => {
      void queryClient.invalidateQueries({ queryKey: moderationKeys.blocked() });
      toast.success(successMessage(name));
    },
  });
};

/**
 * Block / unblock one person with a confirmation for blocking. Used from the
 * chat header and the public profile so both behave the same. Failures toast
 * through the app-wide MutationCache handler.
 */
export function useBlockToggle(userId: string | undefined, name: string) {
  const { data: blocked } = useBlockedUsers();
  const block = useBlockMutation(
    moderationService.block,
    (n) => `Blocked ${n || "user"}`,
  );
  const unblock = useBlockMutation(
    moderationService.unblock,
    (n) => `Unblocked ${n || "user"}`,
  );

  const isBlocked = Boolean(userId && blocked?.some((b) => b.id === userId));

  const toggle = useCallback(() => {
    if (!userId) return;
    if (isBlocked) {
      unblock.mutate({ userId, name });
      return;
    }
    const label = name || "this user";
    if (
      window.confirm(
        `Block ${label}? Neither of you will be able to message or send mentorship requests to the other.`,
      )
    ) {
      block.mutate({ userId, name });
    }
  }, [userId, name, isBlocked, block, unblock]);

  return { isBlocked, toggle, isPending: block.isPending || unblock.isPending };
}
