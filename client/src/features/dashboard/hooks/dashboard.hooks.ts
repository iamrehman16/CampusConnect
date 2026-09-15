import { useQuery } from "@tanstack/react-query";
import { dashboardKeys } from "./dashboard.keys";
import { dashboardService } from "../services/dashboard.service";

export const useMyStats = () =>
  useQuery({
    queryKey: dashboardKeys.myStats(),
    queryFn: () => dashboardService.getMyStats(),
    staleTime: 1000 * 60 * 5,
  });

export const usePublicStats = () =>
  useQuery({
    queryKey: dashboardKeys.publicStats(),
    queryFn: () => dashboardService.getPublicStats(),
    staleTime: 1000 * 60 * 5,
  });
