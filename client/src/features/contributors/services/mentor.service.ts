import api from "@/shared/api/axios.instance";
import type { PaginatedResult } from "@/shared/types/api.types";
import type { MentorFilters, MentorSummary, RecommendedMentors } from "../types/mentor.dto";

const mentorService = {
  async getMentors(
    filters: MentorFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<MentorSummary>> {
    const { data } = await api.get<PaginatedResult<MentorSummary>>(
      "users/mentors",
      { params: { ...filters, page, limit } },
    );
    return data;
  },

  async getRecommended(limit: number): Promise<RecommendedMentors> {
    const { data } = await api.get<RecommendedMentors>("mentorships/recommended-mentors", {
      params: { limit },
    });
    return data;
  },
};

export default mentorService;
