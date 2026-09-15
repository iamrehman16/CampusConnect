import type { PaginatedResult } from "@/shared/types/api.types";
import api from "@/shared/api/axios.instance";
import type {
  AdminResourceFilterParams,
  RejectResourceDto,
  Resource,
} from "../types/resource.dto";
import { ResourceService } from "./resource.service";

export class AdminResourceService extends ResourceService {
  /**
   * GET /admin/resources/pending
   * Fetches the queue of resources awaiting moderation.
   */
  async getPendingResources(
    params: AdminResourceFilterParams,
  ): Promise<PaginatedResult<Resource>> {
    const { data } = await api.get<PaginatedResult<Resource>>(
      "/admin/resources/pending",
      { params },
    );
    return data;
  }

  /**
   * PATCH /admin/resources/:id/approve
   * Approves a pending resource.
   */
  async approveResource(id: string): Promise<Resource> {
    const { data } = await api.patch<Resource>(`/admin/resources/${id}/approve`);
    return data;
  }

  /**
   * PATCH /admin/resources/:id/reject
   * Rejects a pending resource with a reason.
   */
  async rejectResource(id: string, dto: RejectResourceDto): Promise<Resource> {
    const { data } = await api.patch<Resource>(
      `/admin/resources/${id}/reject`,
      dto,
    );
    return data;
  }
}

const adminResourceService = new AdminResourceService();
export default adminResourceService;