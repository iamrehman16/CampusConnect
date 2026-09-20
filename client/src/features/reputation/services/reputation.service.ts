import api from "@/shared/api/axios.instance";
import type { Badge } from "../types/reputation.types";

const reputationService = {
  async getBadges(userId: string): Promise<Badge[]> {
    const { data } = await api.get<Badge[]>(`reputation/users/${userId}/badges`);
    return data;
  },
};

export default reputationService;
