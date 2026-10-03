import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import mentorshipService from "../services/mentorship.service";
import { PAGE_LIMIT } from "@/shared/types/api.types";
import type {
  Mentorship,
  MentorshipStatus,
  MentorshipView,
} from "../types/mentorship.dto";
import { OPEN_STATUSES } from "../types/mentorship.dto";
import { mentorKeys } from "@/features/contributors/hooks/mentor.hooks";
import { chatKeys } from "@/features/chat/hooks/chat-keys";
import { profileKeys } from "@/features/user/hooks/profile-keys";

export const mentorshipKeys = {
  all: ["mentorships"] as const,
  list: (view: MentorshipView, statuses: readonly MentorshipStatus[]) =>
    [...mentorshipKeys.all, "list", view, statuses] as const,
  open: () => [...mentorshipKeys.all, "open"] as const,
  pendingCount: () => [...mentorshipKeys.all, "pending-count"] as const,
  endorsements: (mentorId: string) =>
    [...mentorshipKeys.all, "endorsements", mentorId] as const,
};

export const useMentorships = (
  view: MentorshipView,
  statuses: readonly MentorshipStatus[],
) =>
  useInfiniteQuery({
    queryKey: mentorshipKeys.list(view, statuses),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      mentorshipService.list({
        as: view,
        status: statuses,
        page: pageParam,
        limit: PAGE_LIMIT,
      }),
    initialPageParam: 1 as number,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPage ? lastPage.page + 1 : undefined,
  });

// Tolerates the `{}` that browsers persisted before this fix, until the
// next fetch replaces it.
const byMentorId = (list: Mentorship[] | unknown) =>
  new Map<string, Mentorship>(
    (Array.isArray(list) ? (list as Mentorship[]) : []).map((m) => [m.mentor.id, m]),
  );

/**
 * The current user's open (pending/active) requests as a mentee, keyed by
 * mentor id — lets mentor cards show "Request sent" instead of a dead button.
 *
 * The cache holds the plain array and `select` builds the Map on read: the
 * query cache is persisted to IndexedDB as JSON, where a cached Map came
 * back as `{}` after a reload and `.get` crashed every mentor card.
 */
export const useMyOpenMentorships = () =>
  useQuery({
    queryKey: mentorshipKeys.open(),
    queryFn: async () => {
      const page = await mentorshipService.list({
        as: "mentee",
        status: OPEN_STATUSES,
        page: 1,
        limit: 100,
      });
      return page.data;
    },
    select: byMentorId,
    staleTime: 1000 * 60,
  });

export const usePendingRequestCount = () =>
  useQuery({
    queryKey: mentorshipKeys.pendingCount(),
    queryFn: () => mentorshipService.pendingCount(),
    staleTime: 1000 * 60,
  });

/**
 * Every mentorship change can affect: both users' lists, the mentor's badge,
 * the directory (slots left), profiles (slots left), and — on accept — the
 * chat list. Failures toast through the app-wide MutationCache handler.
 */
const useMentorshipMutation = <TVars, TData>(
  mutationFn: (vars: TVars) => Promise<TData>,
  successMessage: string,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mentorshipKeys.all });
      queryClient.invalidateQueries({ queryKey: mentorKeys.all });
      queryClient.invalidateQueries({ queryKey: profileKeys.all() });
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
      toast.success(successMessage);
    },
  });
};

export const useRequestMentorship = () =>
  useMentorshipMutation(mentorshipService.request, "Request sent");

export const useAcceptMentorship = () =>
  useMentorshipMutation(
    (id: string) => mentorshipService.accept(id),
    "Accepted — a chat has been opened",
  );

export const useDeclineMentorship = () =>
  useMentorshipMutation(
    ({ id, reason }: { id: string; reason?: string }) =>
      mentorshipService.decline(id, reason),
    "Request declined",
  );

export const useCancelMentorship = () =>
  useMentorshipMutation(
    (id: string) => mentorshipService.cancel(id),
    "Request cancelled",
  );

export const useCompleteMentorship = () =>
  useMentorshipMutation(
    (id: string) => mentorshipService.complete(id),
    "Mentorship marked complete",
  );

/** Rate a completed mentorship (BACKLOG.md E11); refreshes lists, the directory and profiles. */
export const useRateMentorship = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; rating: number; review?: string }) =>
      mentorshipService.rate(v.id, v.rating, v.review),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mentorshipKeys.all });
      void queryClient.invalidateQueries({ queryKey: mentorKeys.all });
      void queryClient.invalidateQueries({ queryKey: profileKeys.all() });
      toast.success("Thanks — your rating was saved");
    },
  });
};

/** A mentor's skills with endorsement counts (BACKLOG.md E11). */
export const useEndorsements = (mentorId: string) =>
  useQuery({
    queryKey: mentorshipKeys.endorsements(mentorId),
    queryFn: () => mentorshipService.getEndorsements(mentorId),
    enabled: !!mentorId,
    staleTime: 1000 * 60,
  });

/** Endorse or take back an endorsement; the server owns the rules, errors toast globally. */
export const useToggleEndorsement = (mentorId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tag, endorsed }: { tag: string; endorsed: boolean }) =>
      endorsed
        ? mentorshipService.retractEndorsement(mentorId, tag)
        : mentorshipService.endorse(mentorId, tag),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: mentorshipKeys.endorsements(mentorId),
      }),
  });
};
