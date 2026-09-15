import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';
import { ROUTES } from '@/shared/constants/routes';
import LoadingScreen from '@/shared/components/feedback/LoadingScreen';

export default function OnboardingRoute() {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to={ROUTES.AUTH} replace />;
  if (user?.isOnboarded) return <Navigate to={ROUTES.HOME} replace />;

  return <Outlet />;
}