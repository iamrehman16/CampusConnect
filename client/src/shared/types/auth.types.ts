import type { UserRole } from './enums';

/**
 * User profile as returned by GET /api/users/profile.
 */
// shared/types/auth.types.ts
export interface User {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  isOnboarded: boolean;  // add this
  avatar?: string;
  department?: string;
  semester?: number;
  interests?: string[];
  expertise?: string[];
  isOpenToMentor?: boolean;
  contributionScore?: number;
  accountStatus?: string;
  createdAt:string;
  academicInfo?: string;
}

/**
 * Token pair response from /api/auth/login and /api/auth/refresh.
 */
export interface AuthTokens {
  id: string;
  accessToken: string;
  refreshToken: string;
  isOnboarded: boolean;  // add this
}

/**
 * Shape of the AuthContext state.
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
