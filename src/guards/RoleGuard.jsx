import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RoleGuard({ children, requiredRole }) {
  const { user, role } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is not registered in the database, strictly deny dashboard access and redirect to landing page
  if (role === 'guest' || !role) {
    return <Navigate to="/" replace state={{ accessDenied: true, requestedRole: requiredRole }} />;
  }

  if (role !== requiredRole) {
    return <Navigate to={`/${role}/dashboard`} replace />;
  }

  return children;
}

