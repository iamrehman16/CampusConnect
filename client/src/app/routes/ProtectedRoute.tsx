import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';
import { ROUTES } from '@/shared/constants/routes';
import LoadingScreen from '@/shared/components/feedback/LoadingScreen';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <LoadingScreen message="Checking authentication..." />;
  if (!isAuthenticated) return <Navigate to={ROUTES.AUTH} replace />;
  if (!user?.isOnboarded) return <Navigate to={ROUTES.ONBOARDING} replace />;

  return <Outlet />;
}