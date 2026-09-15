import api from "@/shared/api/axios.instance";
import type {
  UpdateUserRoleDto,
  UpdateUserStatusDto,
  UserFilterParams,
} from "../types/user.dto";
import type { User } from "@/shared/types/auth.types";
import type { PaginatedResult } from "@/shared/types/api.types";
import { UserService } from "./user.services";

export class AdminUserService extends UserService {
  async getUsers(params: UserFilterParams): Promise<PaginatedResult<User>> {
    const { data } = await api.get<PaginatedResult<User>>("/users", {
      params,
    });

    return data;
  }
  async updateUserRole(id: string, dto: UpdateUserRoleDto): Promise<User> {
    const { data } = await api.patch<User>(`admin/users/${id}/role`, dto);
    return data;
  }

  async updateUserStatus(id: string, dto: UpdateUserStatusDto): Promise<User> {
    const { data } = await api.patch<User>(`admin/users/${id}/status`, dto);
    return data;
  }
}

export const adminUserService = new AdminUserService();
