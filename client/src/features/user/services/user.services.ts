import type { PublicUser, User } from "@/shared/types/auth.types";
import type { UpdateUserDto } from "../types/user.dto";
import api from "@/shared/api/axios.instance";

export class UserService {
  async updateUser(dto: UpdateUserDto): Promise<User> {
    const { data } = await api.patch<User>("/users/profile", dto);
    return data;
  }

  async getMyProfile(): Promise<User> {
    const { data } = await api.get<User>("/users/profile");
    return data;
  }

  /** BACKLOG.md G5 — the server signs out other sessions on success. */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post("/users/password", { currentPassword, newPassword });
  }

  async getUserProfile(id: string): Promise<PublicUser> {
    const { data } = await api.get<PublicUser>(`/users/profile/${id}`);
    return data;
  }
}

export const userService = new UserService();
