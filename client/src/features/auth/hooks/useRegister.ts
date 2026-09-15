import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';
import { ROUTES } from '@/shared/constants/routes';
import authService from '../services/auth.service';
import type { RegisterRequest } from '../types/auth.dto';

export function useRegister() {
  const { login } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: (tokens) => {
      login(tokens);
      navigate(ROUTES.ONBOARDING, { replace: true });
    },
  });
}