import { useQuery } from "@tanstack/react-query";
import { adminKeys } from "./admin-keys";
import { adminService } from "../services/admin-service";

export const useOverviewStats = () =>
  useQuery({
    queryKey: adminKeys.stats(),
    queryFn: adminService.getOverviewStats,
    staleTime: 1000 * 60 * 2, // 2 min — overview cards don't need to be live
  });

export const useResourceAnalytics = () =>
  useQuery({
    queryKey: adminKeys.resourceAnalytics(),
    queryFn: adminService.getResourceAnalytics,
    staleTime: 1000 * 60 * 5, // 5 min — aggregation is expensive, no need to hammer it
  });

export const useUserGrowth = () =>
  useQuery({
    queryKey: adminKeys.userGrowth(),
    queryFn: adminService.getUserGrowth,
    staleTime: 1000 * 60 * 5,
  });
