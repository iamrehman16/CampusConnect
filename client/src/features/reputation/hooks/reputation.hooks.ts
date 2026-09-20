import { useQuery } from "@tanstack/react-query";
import reputationService from "../services/reputation.service";

export const reputationKeys = {
  all: ["reputation"] as const,
  badges: (userId: string) => [...reputationKeys.all, "badges", userId] as const,
};

export const useUserBadges = (userId: string | undefined) =>
  useQuery({
    queryKey: reputationKeys.badges(userId ?? ""),
    queryFn: () => reputationService.getBadges(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
