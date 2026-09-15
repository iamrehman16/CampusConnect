import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';
import { ROUTES } from '@/shared/constants/routes';
import LoadingScreen from '@/shared/components/feedback/LoadingScreen';

/**
 * Guards public-only routes (e.g. login/register).
 * Redirects already-authenticated users to the home page.
 */
export default function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  return isAuthenticated ? <Navigate to={ROUTES.HOME} replace /> : <Outlet />;
}
