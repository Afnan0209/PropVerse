import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { ROLES } from '../config/views.js';
import DataView from './DataView.jsx';
import LeaseForm from './LeaseForm.jsx';
import TenantMaintenance from './TenantMaintenance.jsx';

export default function ViewPage() {
  const { role, view: key } = useParams();
  const { user } = useAuth();
  const view = ROLES[role]?.views.find((v) => v.key === key);
  if (!view) return <Navigate to={`/${role}/dashboard`} replace />;
  if (!view.allowedRoles.includes(user?.role)) return <Navigate to={`/${user?.role}/dashboard`} replace />;
  if (view.kind === 'maintenance') return <TenantMaintenance view={view} />;
  return view.kind === 'lease' ? <LeaseForm /> : <DataView key={`${role}-${view.key}`} view={view} />;
}
