import api from "@/shared/api/axios.instance";
import type {
  PaginatedResult,
  PaginationParams,
} from "@/shared/types/api.types";
import type {
  AdminApplication,
  ApplicationStatus,
  ContributorApplication,
  CreateApplicationDto,
  MyApplication,
} from "../types/application.dto";

const applicationService = {
  async getMine(): Promise<MyApplication> {
    const { data } = await api.get<MyApplication>("contributor-applications/me");
    return data;
  },

  async apply(dto: CreateApplicationDto): Promise<ContributorApplication> {
    const { data } = await api.post<ContributorApplication>(
      "contributor-applications",
      dto,
    );
    return data;
  },

  async listForAdmin(
    params: PaginationParams & { status?: ApplicationStatus },
  ): Promise<PaginatedResult<AdminApplication>> {
    const { data } = await api.get<PaginatedResult<AdminApplication>>(
      "admin/contributor-applications",
      { params },
    );
    return data;
  },

  async approve(id: string): Promise<void> {
    await api.patch(`admin/contributor-applications/${id}/approve`);
  },

  async reject(id: string, reason: string): Promise<void> {
    await api.patch(`admin/contributor-applications/${id}/reject`, { reason });
  },
};

export default applicationService;
