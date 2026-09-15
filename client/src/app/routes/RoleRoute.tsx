import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';
import { ROUTES } from '@/shared/constants/routes';
import type { UserRole } from '@/shared/types/enums';

interface RoleRouteProps {
  allowedRoles: UserRole[];
}

/**
 * Guards routes that require specific user roles.
 * Must be nested inside a ProtectedRoute.
 */
export default function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user } = useAuth();

  if (!user) return <Navigate to={ROUTES.AUTH} replace />;

  const hasAccess = allowedRoles.includes(user.role);

  return hasAccess ? <Outlet /> : <Navigate to={ROUTES.HOME} replace />;
}
