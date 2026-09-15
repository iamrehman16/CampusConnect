import api from "@/shared/api/axios.instance";
import type { MyStatsDto, PublicStatsDto } from "../types/dashboard.types";

export class DashboardService {
  async getMyStats(): Promise<MyStatsDto> {
    const { data } = await api.get<MyStatsDto>("dashboard/me/stats");
    return data;
  }

  async getPublicStats(): Promise<PublicStatsDto> {
    const { data } = await api.get<PublicStatsDto>("dashboard/stats");
    return data;
  }
}

export const dashboardService = new DashboardService();
