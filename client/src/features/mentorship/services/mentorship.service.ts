import api from "@/shared/api/axios.instance";
import type {
  PaginatedResult,
  PaginationParams,
} from "@/shared/types/api.types";
import type {
  CreateMentorshipDto,
  Mentorship,
  MentorshipStatus,
  MentorshipView,
} from "../types/mentorship.dto";

interface ListParams extends PaginationParams {
  as: MentorshipView;
  status?: readonly MentorshipStatus[];
}

const mentorshipService = {
  async request(dto: CreateMentorshipDto): Promise<{ id: string }> {
    const { data } = await api.post<{ id: string }>("mentorships", dto);
    return data;
  },

  async list({
    status,
    ...params
  }: ListParams): Promise<PaginatedResult<Mentorship>> {
    const { data } = await api.get<PaginatedResult<Mentorship>>("mentorships", {
      params: { ...params, ...(status?.length && { status: status.join(",") }) },
    });
    return data;
  },

  async pendingCount(): Promise<number> {
    const { data } = await api.get<{ count: number }>("mentorships/pending-count");
    return data.count;
  },

  async accept(id: string): Promise<Mentorship> {
    const { data } = await api.patch<Mentorship>(`mentorships/${id}/accept`);
    return data;
  },

  async decline(id: string, reason?: string): Promise<Mentorship> {
    const { data } = await api.patch<Mentorship>(`mentorships/${id}/decline`, {
      reason: reason || undefined,
    });
    return data;
  },

  async cancel(id: string): Promise<Mentorship> {
    const { data } = await api.patch<Mentorship>(`mentorships/${id}/cancel`);
    return data;
  },

  async complete(id: string): Promise<Mentorship> {
    const { data } = await api.patch<Mentorship>(`mentorships/${id}/complete`);
    return data;
  },
};

export default mentorshipService;
