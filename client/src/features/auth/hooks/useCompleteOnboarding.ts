// features/auth/hooks/useCompleteOnboarding.ts
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';
import { ROUTES } from '@/shared/constants/routes';
import authService from '../services/auth.service';
import type { CompleteOnboardingRequest } from '../types/auth.dto';

export function useCompleteOnboarding() {
  const { setOnboarded } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: CompleteOnboardingRequest) =>
      authService.completeOnboarding(data),
    onSuccess: () => {
      setOnboarded();
      navigate(ROUTES.HOME, { replace: true });
    },
  });
}