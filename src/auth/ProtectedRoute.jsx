import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { ROLES } from '../config/views.js';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const { role } = useParams();

  if (loading) return <p className="muted route-loading">Restoring your session...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (!ROLES[user.role]) return <Navigate to="/login" replace />;
  if (role !== user.role) return <Navigate to={`/${user.role}/dashboard`} replace />;
  return <Outlet />;
}
