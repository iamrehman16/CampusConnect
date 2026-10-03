import api from "@/shared/api/axios.instance";
import type { PaginatedResult } from "@/shared/types/api.types";
import type {
  AdminReport,
  BlockedUser,
  CreateReportDto,
  ReportResolution,
  ReportStatus,
} from "../types/moderation.dto";

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

  async createReport(dto: CreateReportDto): Promise<void> {
    await api.post("reports", dto);
  },

  async listReports(params: {
    page: number;
    limit: number;
    status: ReportStatus;
  }): Promise<PaginatedResult<AdminReport>> {
    const { data } = await api.get<PaginatedResult<AdminReport>>("admin/reports", { params });
    return data;
  },

  async resolveReport(
    id: string,
    action: ReportResolution,
    note?: string,
  ): Promise<AdminReport> {
    const { data } = await api.patch<AdminReport>(`admin/reports/${id}/resolve`, { action, note });
    return data;
  },
};
