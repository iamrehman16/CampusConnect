import api from "@/shared/api/axios.instance";
import type { PaginatedResult, PaginationParams } from "@/shared/types/api.types";
import type { Notification } from "../types/notification.dto";

const notificationService = {
  async list(params: PaginationParams): Promise<PaginatedResult<Notification>> {
    const { data } = await api.get<PaginatedResult<Notification>>(
      "notifications",
      { params },
    );
    return data;
  },

  async unreadCount(): Promise<number> {
    const { data } = await api.get<{ count: number }>(
      "notifications/unread-count",
    );
    return data.count;
  },

  async markRead(id: string): Promise<Notification> {
    const { data } = await api.patch<Notification>(`notifications/${id}/read`);
    return data;
  },

  async markAllRead(): Promise<void> {
    await api.patch("notifications/read-all");
  },
};

export default notificationService;
