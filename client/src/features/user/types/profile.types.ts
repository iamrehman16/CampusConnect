import type { User } from "@/shared/types/auth.types";
import type { UserRole } from "@/shared/types/enums";

export interface ProfileUserViewModel {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  academicInfo?: string;
  expertise?: string;
  expertiseTags?: string[];
  interests?: string[];
  semester?: number;
  role: UserRole;
  createdAt: string;
}

export interface ProfileStats {
  totalPosts: number;
  approvedResources: number;
  pendingResources: number;
  rejectedResources: number;
}

export const toProfileUserViewModel = (
  user: User | null | undefined,
): ProfileUserViewModel | null => {
  if (!user) {
    return null;
  }

  const fallbackName = user.email.split("@")[0] || "User";

  return {
    id: user._id,
    email: user.email,
    name: user.name?.trim() || fallbackName,
    avatar: user.avatar,
    academicInfo: user.academicInfo,
    expertise: Array.isArray(user.expertise)
      ? user.expertise.join(", ")
      : user.expertise,
    expertiseTags: Array.isArray(user.expertise)
      ? user.expertise
      : user.expertise
      ? [user.expertise]
      : [],
    interests: Array.isArray(user.interests)
      ? user.interests
      : user.interests
      ? [user.interests]
      : [],
    semester: user.semester,
    role: user.role,
    createdAt: user.createdAt,
  };
};
