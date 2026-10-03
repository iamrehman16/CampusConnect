import { useQuery } from "@tanstack/react-query";
import reputationService from "../services/reputation.service";
import type { LeaderboardPeriod } from "../types/reputation.types";

export const reputationKeys = {
  all: ["reputation"] as const,
  leaderboard: (period: LeaderboardPeriod, limit: number) =>
    [...reputationKeys.all, "leaderboard", period, limit] as const,
  badges: (userId: string) => [...reputationKeys.all, "badges", userId] as const,
};

export const useUserBadges = (userId: string | undefined) =>
  useQuery({
    queryKey: reputationKeys.badges(userId ?? ""),
    queryFn: () => reputationService.getBadges(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

export const useLeaderboard = (period: LeaderboardPeriod, limit = 20) =>
  useQuery({
    queryKey: reputationKeys.leaderboard(period, limit),
    queryFn: () => reputationService.getLeaderboard(period, limit),
    staleTime: 1000 * 60,
  });
