// features/admin/api/adminService.ts
import api from "@/shared/api/axios.instance";
import type {
  OverviewStats,
  ResourceAnalytics,
  UserGrowth,
} from "../types/admin.dto";

export const adminService = {
  getOverviewStats: (): Promise<OverviewStats> =>
    api.get("/admin/dashboard/stats").then((r) => r.data),

  getResourceAnalytics: (): Promise<ResourceAnalytics> =>
    api.get("/admin/dashboard/resources/analytics").then((r) => r.data),

  getUserGrowth: (): Promise<UserGrowth> =>
    api.get("/admin/dashboard/users/growth").then((r) => r.data),
};
