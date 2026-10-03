import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import mentorService from "../services/mentor.service";
import type { MentorFilters } from "../types/mentor.dto";

const MENTORS_PAGE_SIZE = 12;

export const mentorKeys = {
  all: ["mentors"] as const,
  list: (filters: MentorFilters) => [...mentorKeys.all, "list", filters] as const,
  recommended: (limit: number) => [...mentorKeys.all, "recommended", limit] as const,
};

export const useMentors = (filters: MentorFilters, enabled = true) =>
  useInfiniteQuery({
    enabled,
    queryKey: mentorKeys.list(filters),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      mentorService.getMentors(filters, pageParam, MENTORS_PAGE_SIZE),
    initialPageParam: 1 as number,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPage ? lastPage.page + 1 : undefined,
    placeholderData: (prev) => prev, // keep the grid visible while filters change
    staleTime: 1000 * 60,
  });

/** "Recommended for you" (BACKLOG.md E12). Short staleTime: capacity and requests change. */
export const useRecommendedMentors = (limit: number, enabled = true) =>
  useQuery({
    queryKey: mentorKeys.recommended(limit),
    queryFn: () => mentorService.getRecommended(limit),
    enabled,
    staleTime: 1000 * 60,
  });
