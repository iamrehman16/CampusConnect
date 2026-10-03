import api from "@/shared/api/axios.instance";
import type { BlockedUser } from "../types/moderation.dto";

export const moderationService = {
  async listBlocked(): Promise<BlockedUser[]> {
    const { data } = await api.get<BlockedUser[]>("blocks");
    return data;
  },

  async block(userId: string): Promise<void> {
    await api.post("blocks", { userId });
  },

  async unblock(userId: string): Promise<void> {
    await api.delete(`blocks/${userId}`);
  },
};
