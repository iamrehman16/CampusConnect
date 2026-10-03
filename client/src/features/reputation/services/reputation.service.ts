import api from "@/shared/api/axios.instance";
import type { Badge, LeaderboardEntry, LeaderboardPeriod } from "../types/reputation.types";

const reputationService = {
  async getBadges(userId: string): Promise<Badge[]> {
    const { data } = await api.get<Badge[]>(`reputation/users/${userId}/badges`);
    return data;
  },

  async getLeaderboard(period: LeaderboardPeriod, limit: number): Promise<LeaderboardEntry[]> {
    const { data } = await api.get<LeaderboardEntry[]>("reputation/leaderboard", {
      params: { period, limit },
    });
    return data;
  },
};

export default reputationService;
