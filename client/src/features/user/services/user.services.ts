import type { User } from "@/shared/types/auth.types";
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

  async getUserProfile(id: string): Promise<User> {
    const { data } = await api.get<User>(`/users/profile/${id}`);
    return data;
  }
}

export const userService = new UserService();
