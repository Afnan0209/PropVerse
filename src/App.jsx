import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext.jsx';
import ProtectedRoute from './auth/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import DataView from './pages/DataView.jsx';
import Gateway from './pages/Gateway.jsx';
import LeaseForm from './pages/LeaseForm.jsx';
import TenantMaintenance from './pages/TenantMaintenance.jsx';
import ViewPage from './pages/ViewPage.jsx';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <p className="muted route-loading">Restoring your session...</p>;
  return <Navigate to={user ? `/${user.role}/dashboard` : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Gateway />} />
      <Route path="/:role" element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path=":view" element={<ViewPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
