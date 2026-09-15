import api from '@/shared/api/axios.instance';
import type { AuthTokens } from '@/shared/types/auth.types';
import type { LoginRequest, RegisterRequest } from '../types/auth.dto';
import type { CompleteOnboardingRequest } from '../types/auth.dto';

const authService = {
  async login(data: LoginRequest): Promise<AuthTokens> {
    const response = await api.post<AuthTokens>('/auth/login', data);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<AuthTokens> {
    const response = await api.post<AuthTokens>('/auth/register', data);
    return response.data;
  },

  async completeOnboarding(data: CompleteOnboardingRequest): Promise<void> {
    await api.patch('/auth/onboarding', data);
  },

  async signout(): Promise<void> {
    await api.post('/auth/signout');
  },
};

export default authService;