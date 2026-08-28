import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import LoadingState from '../common/LoadingState';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-offwhite">
        <LoadingState label="Checking session..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.userType)) {
    const fallback =
      user.userType === 'admin' ? '/dashboard' : user.userType === 'gudoomiye' ? '/gudoomiye' : '/results/view';
    return <Navigate to={fallback} replace />;
  }

  return children;
}
