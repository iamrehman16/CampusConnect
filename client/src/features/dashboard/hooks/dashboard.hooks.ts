import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboard.service";

export const useMyImpact = (enabled = true) =>
  useQuery({
    queryKey: ["dashboard", "my-impact"] as const,
    queryFn: () => dashboardService.getMyImpact(),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
