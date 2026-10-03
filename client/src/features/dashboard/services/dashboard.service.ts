import api from "@/shared/api/axios.instance";
import type { MyImpact } from "../types/impact.dto";

export const dashboardService = {
  async getMyImpact(): Promise<MyImpact> {
    const { data } = await api.get<MyImpact>("dashboard/me/impact");
    return data;
  },
};
