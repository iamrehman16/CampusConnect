import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';
import { ROUTES } from '@/shared/constants/routes';
import authService from '../services/auth.service';
import type { LoginRequest } from '../types/auth.dto';

/**
 * TanStack mutation hook for the login flow.
 * On success: stores tokens and navigates to home.
 */
export function useLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (tokens) => {
      login(tokens);
      navigate(ROUTES.HOME, { replace: true });
    },
  });
}
