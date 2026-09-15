/**
 * Auth feature DTOs — matching the server's RegisterDto and LoginDto.
 */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface CompleteOnboardingRequest {
  department: string;
  semester: number;
  interests: string[];
  expertise: string[];
  isOpenToMentor: boolean;
  avatar: string;
  name: string;
  academicInfo: string;
}
